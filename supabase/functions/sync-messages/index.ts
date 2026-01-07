import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { account_id } = await req.json();

    if (!account_id) {
      return new Response(JSON.stringify({ error: 'Missing account_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get connected account
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', account_id)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found');
    }

    // Check platform and sync accordingly
    let synced = 0;

    if (account.platform === 'gmail') {
      synced = await syncGmailMessages(supabase, account);
    } else if (account.platform === 'outlook') {
      synced = await syncOutlookMessages(supabase, account);
    } else {
      throw new Error(`Unsupported platform: ${account.platform}`);
    }

    // Update last sync time
    await supabase
      .from('connected_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', account_id);

    return new Response(
      JSON.stringify({ synced }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in sync-messages:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

// =====================================================
// TOKEN REFRESH
// =====================================================

async function refreshGmailToken(supabase: any, account: any): Promise<string> {
  console.log('Refreshing Gmail token for account:', account.id);
  
  const clientId = Deno.env.get('VITE_GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('VITE_GOOGLE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }
  
  if (!account.refresh_token) {
    throw new Error('No refresh token available. Please reconnect your Gmail account.');
  }
  
  console.log('Using client_id:', clientId?.substring(0, 20) + '...');
  console.log('Refresh token available:', !!account.refresh_token);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  
  const responseText = await response.text();
  console.log('Token refresh response status:', response.status);
  console.log('Token refresh response:', responseText);
  
  if (!response.ok) {
    console.error('Token refresh failed with status:', response.status);
    
    // Parse error for more details
    let errorDetails = responseText;
    try {
      const errorJson = JSON.parse(responseText);
      errorDetails = errorJson.error_description || errorJson.error || responseText;
    } catch (e) {
      // Keep original text
    }
    
    // Mark account as needing reconnection
    await supabase
      .from('connected_accounts')
      .update({ 
        status: 'expired',
        error_message: `Token expiré: ${errorDetails}. Veuillez reconnecter votre compte Gmail.`
      })
      .eq('id', account.id);
    
    throw new Error(`Token refresh failed: ${errorDetails}. Please reconnect your Gmail account.`);
  }
  
  // Parse response after checking status
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error('Invalid response from Google OAuth');
  }
  
  const newAccessToken = data.access_token;
  
  // Update token in database
  await supabase
    .from('connected_accounts')
    .update({ 
      access_token: newAccessToken,
      token_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      status: 'active',
      error_message: null
    })
    .eq('id', account.id);
  
  console.log('Token refreshed successfully');
  return newAccessToken;
}

// =====================================================
// GMAIL SYNC
// =====================================================

async function syncGmailMessages(supabase: any, account: any): Promise<number> {
  try {
    const accountEmail = account.config?.email || account.platform_account_id;
    console.log('Starting Gmail sync for account:', account.id, accountEmail);

    let accessToken = account.access_token;
    
    // Check if token might be expired
    const tokenExpiry = account.token_expires_at ? new Date(account.token_expires_at) : null;
    if (tokenExpiry && tokenExpiry <= new Date()) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshGmailToken(supabase, account);
    }

    // Fetch recent messages from Gmail API
    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=in:inbox OR in:sent`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Handle 401 - token might be expired
    if (messagesResponse.status === 401) {
      console.log('Got 401, refreshing token...');
      accessToken = await refreshGmailToken(supabase, account);
      
      // Retry with new token
      const retryResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=in:inbox OR in:sent`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!retryResponse.ok) {
        throw new Error(`Gmail API error after token refresh: ${retryResponse.statusText}`);
      }
      
      const retryData = await retryResponse.json();
      return await processGmailMessages(supabase, account, accountEmail, accessToken, retryData.messages || []);
    }

    if (!messagesResponse.ok) {
      throw new Error(`Gmail API error: ${messagesResponse.statusText}`);
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.messages || [];

    return await processGmailMessages(supabase, account, accountEmail, accessToken, messages);
  } catch (error) {
    console.error('Error syncing Gmail messages:', error);
    throw error;
  }
}

async function processGmailMessages(
  supabase: any, 
  account: any, 
  accountEmail: string, 
  accessToken: string, 
  messages: any[]
): Promise<number> {
  let synced = 0;
  console.log(`Found ${messages.length} messages to sync`);

  for (const msg of messages) {
    try {
      // Get full message details
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!messageResponse.ok) continue;

      const messageData = await messageResponse.json();

      // Extract headers
      const headers = messageData.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      const cc = getHeader('Cc');
      const date = getHeader('Date');

      console.log('Message from:', from, 'to:', to);
      console.log('Subject:', subject);

      // Extract body
      let body = '';
      if (messageData.payload?.body?.data) {
        body = decodeBase64Url(messageData.payload.body.data);
      } else if (messageData.payload?.parts) {
        const textPart = messageData.payload.parts.find(
          (p: any) => p.mimeType === 'text/plain' || p.mimeType === 'text/html'
        );
        if (textPart?.body?.data) {
          body = decodeBase64Url(textPart.body.data);
        }
      }

      // Determine direction
      const fromEmail = extractEmail(from).toLowerCase();
      const direction = fromEmail === accountEmail.toLowerCase() ? 'sent' : 'received';

      console.log('Direction:', direction);

      // Get or create conversation
      const contactEmail = direction === 'received' ? fromEmail : extractEmail(to).toLowerCase();
      const contactName = direction === 'received' ? extractName(from) : extractName(to);

      console.log('Contact:', contactEmail, contactName);

      let conversationId = await getOrCreateConversation(
        supabase,
        account.user_id,
        account.id,
        'gmail',
        contactEmail,
        contactName
      );

      if (!conversationId) {
        console.error('Failed to create conversation for:', contactEmail);
        continue;
      }

      console.log('Conversation ID:', conversationId);

      // Check if message already exists
      const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .eq('platform_message_id', msg.id)
        .eq('conversation_id', conversationId)
        .single();

      if (existing) {
        console.log('Message already synced:', msg.id);
        continue; // Skip if already synced
      }

      // Insert message with email metadata
      const { error: insertError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        platform_message_id: msg.id,
        direction,
        message_type: 'text',
        text_content: body || subject,
        sender_id: fromEmail,
        sender_name: extractName(from) || fromEmail,
        sender_username: fromEmail,
        is_read: messageData.labelIds && !messageData.labelIds.includes('UNREAD'),
        sent_at: new Date(date).toISOString(),
        // Email-specific metadata
        email_subject: subject,
        email_from: from,
        email_to: to,
        email_cc: cc || null,
      });

      if (insertError) {
        console.error('Error inserting message:', insertError);
      } else {
        synced++;
        console.log('Message synced successfully:', msg.id);

        // Trigger AI routing for incoming messages
        if (direction === 'received') {
          try {
            // Get the message ID
            const { data: insertedMessage } = await supabase
              .from('messages')
              .select('id')
              .eq('platform_message_id', msg.id)
              .eq('conversation_id', conversationId)
              .single();

            if (insertedMessage) {
              console.log('Triggering AI routing for message:', insertedMessage.id);
              // Call AI routing function with internal flag (no auth needed for internal calls)
              triggerAIRouting(supabase, conversationId, insertedMessage.id, account.user_id);
            }
          } catch (routingError) {
            console.error('Error triggering AI routing:', routingError);
            // Don't throw - we don't want to block sync if AI routing fails
          }
        }
      }
    } catch (msgError) {
      console.error('Error syncing message:', msg.id, msgError);
    }
  }

  console.log(`Sync completed: ${synced} messages synced`);
  return synced;
}

// Trigger AI routing asynchronously (internal call)
async function triggerAIRouting(supabase: any, conversationId: string, messageId: string, userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  // Call with service role and internal flag
  fetch(`${supabaseUrl}/functions/v1/analyze-message-routing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'x-internal-call': 'true',
      'x-user-id': userId,
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      message_id: messageId,
    }),
  }).then(async (response) => {
    if (response.ok) {
      const data = await response.json();
      console.log('AI routing completed:', data);
    } else {
      const error = await response.text();
      console.error('AI routing error:', error);
    }
  }).catch((error) => {
    console.error('AI routing failed:', error);
  });
}

// =====================================================
// OUTLOOK SYNC
// =====================================================

async function syncOutlookMessages(supabase: any, account: any): Promise<number> {
  try {
    const accountEmail = account.config?.email || account.platform_account_id;
    console.log('Starting Outlook sync for account:', account.id, accountEmail);

    const accessToken = account.access_token;

    // Fetch recent messages from Microsoft Graph API
    const messagesResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=10&$orderby=receivedDateTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(`Outlook API error: ${messagesResponse.statusText}`);
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.value || [];

    let synced = 0;
    console.log(`Found ${messages.length} Outlook messages to sync`);

    for (const msg of messages) {
      try {
        const fromEmail = msg.from?.emailAddress?.address?.toLowerCase() || '';
        const fromName = msg.from?.emailAddress?.name || fromEmail;
        const toRecipients = msg.toRecipients || [];
        const ccRecipients = msg.ccRecipients || [];
        const toEmail = toRecipients[0]?.emailAddress?.address?.toLowerCase() || '';
        const toEmails = toRecipients.map((r: any) => `${r.emailAddress?.name || ''} <${r.emailAddress?.address}>`).join(', ');
        const ccEmails = ccRecipients.map((r: any) => `${r.emailAddress?.name || ''} <${r.emailAddress?.address}>`).join(', ');

        // Determine direction
        const direction = fromEmail === accountEmail.toLowerCase() ? 'sent' : 'received';

        console.log('Outlook message from:', fromEmail, 'direction:', direction);

        // Get or create conversation
        const contactEmail = direction === 'received' ? fromEmail : toEmail;
        const contactName = direction === 'received' ? fromName : (toRecipients[0]?.emailAddress?.name || toEmail);

        let conversationId = await getOrCreateConversation(
          supabase,
          account.user_id,
          account.id,
          'outlook',
          contactEmail,
          contactName
        );

        if (!conversationId) {
          console.error('Failed to create conversation for:', contactEmail);
          continue;
        }

        // Check if message already exists
        const { data: existing } = await supabase
          .from('messages')
          .select('id')
          .eq('platform_message_id', msg.id)
          .eq('conversation_id', conversationId)
          .single();

        if (existing) {
          console.log('Outlook message already synced:', msg.id);
          continue;
        }

        // Insert message with email metadata
        const { error: insertError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          platform_message_id: msg.id,
          direction,
          message_type: 'text',
          text_content: msg.body?.content || msg.subject || '',
          sender_id: fromEmail,
          sender_name: fromName,
          sender_username: fromEmail,
          is_read: msg.isRead || false,
          sent_at: msg.receivedDateTime || new Date().toISOString(),
          // Email-specific metadata
          email_subject: msg.subject || '',
          email_from: `${fromName} <${fromEmail}>`,
          email_to: toEmails,
          email_cc: ccEmails || null,
        });

        if (insertError) {
          console.error('Error inserting Outlook message:', insertError);
        } else {
          synced++;
          console.log('Outlook message synced:', msg.id);

          // Trigger AI routing for incoming messages
          if (direction === 'received') {
            try {
              const { data: insertedMessage } = await supabase
                .from('messages')
                .select('id')
                .eq('platform_message_id', msg.id)
                .eq('conversation_id', conversationId)
                .single();

              if (insertedMessage) {
                triggerAIRouting(supabase, conversationId, insertedMessage.id, account.user_id);
              }
            } catch (routingError) {
              console.error('Error triggering AI routing for Outlook:', routingError);
            }
          }
        }
      } catch (msgError) {
        console.error('Error syncing Outlook message:', msg.id, msgError);
      }
    }

    console.log(`Outlook sync completed: ${synced} messages synced`);
    return synced;
  } catch (error) {
    console.error('Error syncing Outlook messages:', error);
    throw error;
  }
}

// =====================================================
// HELPERS
// =====================================================

async function getOrCreateConversation(
  supabase: any,
  userId: string,
  accountId: string,
  platform: string,
  contactEmail: string,
  contactName: string
): Promise<string | null> {
  // Check if conversation exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('connected_account_id', accountId)
    .eq('platform', platform)
    .eq('participant_id', contactEmail)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      connected_account_id: accountId,
      platform,
      platform_conversation_id: `${platform}_${contactEmail}_${Date.now()}`,
      participant_id: contactEmail,
      participant_name: contactName,
      participant_username: contactEmail,
      status: 'unread',
      tags: [],
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return newConv?.id || null;
}

function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    // Handle UTF-8 encoding
    return decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    // Fallback for non-UTF-8 content
    try {
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return atob(base64);
    } catch (e2) {
      return data;
    }
  }
}

function extractEmail(emailString: string): string {
  const match = emailString.match(/<([^>]+)>/);
  return match ? match[1] : emailString.trim();
}

function extractName(emailString: string): string {
  const match = emailString.match(/^([^<]+)</);
  if (match) {
    return match[1].trim().replace(/"/g, '');
  }
  return emailString.split('@')[0] || emailString;
}
