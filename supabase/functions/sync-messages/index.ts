import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = [
  'https://preview--mypostelma.lovable.app',
  'https://postelma.com',
  'http://localhost:5173'
];

const getCorsHeaders = (origin: string | null) => {
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

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

    // Create Supabase client
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
// GMAIL SYNC
// =====================================================

async function syncGmailMessages(supabase: any, account: any): Promise<number> {
  try {
    const accountEmail = account.config?.email || account.platform_account_id;
    console.log('Starting Gmail sync for account:', account.id, accountEmail);

    // Get messages from Gmail API - both INBOX and SENT
    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=in:inbox OR in:sent`,
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      console.error('Gmail API error:', error);
      throw new Error(`Gmail API error: ${error}`);
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.messages || [];
    console.log(`Found ${messages.length} messages to sync`);

    let synced = 0;

    // Fetch full message details for each message
    for (const msg of messages) {
      try {
        console.log('Processing message:', msg.id);

        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          }
        );

        if (!messageResponse.ok) {
          console.error('Failed to fetch message:', msg.id);
          continue;
        }

        const messageData = await messageResponse.json();

        // Parse message headers
        const headers = messageData.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

        const from = getHeader('From') || '';
        const to = getHeader('To') || '';
        const subject = getHeader('Subject') || '(no subject)';
        const date = getHeader('Date') || new Date().toISOString();

        console.log('Message from:', from, 'to:', to);

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

        // Insert message
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
                // Call AI routing function asynchronously (don't await to avoid blocking)
                supabase.functions.invoke('analyze-message-routing', {
                  body: {
                    conversation_id: conversationId,
                    message_id: insertedMessage.id,
                  },
                }).then((response) => {
                  if (response.error) {
                    console.error('AI routing error:', response.error);
                  } else {
                    console.log('AI routing completed:', response.data);
                  }
                }).catch((error) => {
                  console.error('AI routing failed:', error);
                });
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
  } catch (error) {
    console.error('Error syncing Gmail messages:', error);
    throw error;
  }
}

// =====================================================
// OUTLOOK SYNC
// =====================================================

async function syncOutlookMessages(supabase: any, account: any): Promise<number> {
  try {
    console.log('Starting Outlook sync for account:', account.id, account.email_address);

    // Get messages from Microsoft Graph API
    const messagesResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=10&$orderby=receivedDateTime desc`,
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      throw new Error(`Outlook API error: ${error}`);
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.value || [];

    let synced = 0;

    for (const msg of messages) {
      try {
        const accountEmail = (account.config?.email || account.platform_account_id).toLowerCase();
        // Determine direction
        const fromEmail = msg.from?.emailAddress?.address?.toLowerCase() || '';
        const direction = fromEmail === accountEmail ? 'sent' : 'received';

        // Get or create conversation
        const contactEmail = direction === 'received'
          ? fromEmail
          : msg.toRecipients?.[0]?.emailAddress?.address?.toLowerCase() || '';
        const contactName = direction === 'received'
          ? msg.from?.emailAddress?.name || ''
          : msg.toRecipients?.[0]?.emailAddress?.name || '';

        let conversationId = await getOrCreateConversation(
          supabase,
          account.user_id,
          account.id,
          'outlook',
          contactEmail,
          contactName
        );

        if (!conversationId) continue;

        // Check if message already exists
        const { data: existing } = await supabase
          .from('messages')
          .select('id')
          .eq('platform_message_id', msg.id)
          .eq('conversation_id', conversationId)
          .single();

        if (existing) continue;

        // Insert message
        const { error: insertError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          platform_message_id: msg.id,
          direction,
          message_type: 'text',
          text_content: msg.bodyPreview || msg.body?.content || '',
          sender_id: fromEmail,
          sender_name: msg.from?.emailAddress?.name || fromEmail,
          sender_username: fromEmail,
          is_read: msg.isRead || false,
          sent_at: msg.receivedDateTime,
        });

        if (!insertError) {
          synced++;

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
                console.log('Triggering AI routing for Outlook message:', insertedMessage.id);
                // Call AI routing function asynchronously (don't await to avoid blocking)
                supabase.functions.invoke('analyze-message-routing', {
                  body: {
                    conversation_id: conversationId,
                    message_id: insertedMessage.id,
                  },
                }).then((response) => {
                  if (response.error) {
                    console.error('AI routing error:', response.error);
                  } else {
                    console.log('AI routing completed:', response.data);
                  }
                }).catch((error) => {
                  console.error('AI routing failed:', error);
                });
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

    return synced;
  } catch (error) {
    console.error('Error syncing Outlook messages:', error);
    throw error;
  }
}

// =====================================================
// CONVERSATION MANAGEMENT
// =====================================================

async function getOrCreateConversation(
  supabase: any,
  userId: string,
  accountId: string,
  platform: string,
  contactEmail: string,
  contactName: string
): Promise<string | null> {
  try {
    // Try to find existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('connected_account_id', accountId)
      .eq('platform', platform)
      .eq('participant_identifier', contactEmail)
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
        platform_conversation_id: `email_${contactEmail}_${Date.now()}`,
        participant_identifier: contactEmail,
        participant_name: contactName || contactEmail,
        participant_username: contactEmail,
        status: 'active',
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return newConv.id;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return null;
  }
}

// =====================================================
// HELPERS
// =====================================================

function decodeBase64Url(data: string): string {
  try {
    // Gmail uses base64url encoding
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return decoded;
  } catch {
    return '';
  }
}

function extractEmail(emailString: string): string {
  const match = emailString.match(/<(.+?)>/);
  return match ? match[1] : emailString.trim();
}

function extractName(emailString: string): string {
  const match = emailString.match(/^(.+?)\s*</);
  return match ? match[1].trim().replace(/['"]/g, '') : '';
}
