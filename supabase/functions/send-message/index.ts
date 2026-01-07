/**
 * Send Message Edge Function
 *
 * Sends messages to all platforms: Gmail, Outlook, Telegram, WhatsApp
 * Includes input validation with Zod for security
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Input validation schemas
const sendMessageSchema = z.object({
  conversation_id: z.string().uuid('conversation_id must be a valid UUID'),
  text_content: z.string().min(1, 'text_content is required').max(10000, 'text_content must be less than 10000 characters').optional(),
  media_url: z.string().url('media_url must be a valid URL').optional(),
  media_type: z.enum(['image', 'video', 'audio', 'document']).optional(),
  // Email specific
  subject: z.string().max(500, 'subject must be less than 500 characters').optional(),
  to: z.string().email('to must be a valid email').optional(),
  // Telegram specific
  chat_id: z.string().optional(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = sendMessageSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      conversation_id,
      text_content,
      media_url,
      media_type,
      subject,
      to,
      chat_id,
    } = validationResult.data;

    // Require either text_content or media_url
    if (!text_content && !media_url) {
      return new Response(
        JSON.stringify({ error: 'Either text_content or media_url is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get conversation to determine platform
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, connected_accounts(*)')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation lookup error:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const connectedAccount = conversation.connected_accounts;
    const platform = conversation.platform;

    let platformMessageId: string;
    let result: any;

    // Route to appropriate platform
    switch (platform) {
      case 'gmail':
        result = await sendGmail(connectedAccount, conversation, {
          to: to || conversation.participant_id,
          subject: subject || 'Re: Conversation',
          body: text_content || '',
        });
        platformMessageId = result.id;
        break;

      case 'outlook':
        result = await sendOutlook(connectedAccount, conversation, {
          to: to || conversation.participant_id,
          subject: subject || 'Re: Conversation',
          body: text_content || '',
        });
        platformMessageId = result.id;
        break;

      case 'telegram':
        result = await sendTelegram(connectedAccount, conversation, {
          chat_id: chat_id || conversation.participant_id,
          text: text_content || '',
          photo_url: media_url,
        });
        platformMessageId = result.message_id.toString();
        break;

      case 'whatsapp_twilio':
        result = await sendWhatsAppTwilio(connectedAccount, conversation, {
          to: `whatsapp:${conversation.participant_id}`,
          body: text_content || '',
          media_url,
        });
        platformMessageId = result.sid;
        break;

      case 'facebook':
        result = await sendFacebookMessage(connectedAccount, conversation, {
          recipient_id: conversation.participant_id,
          text: text_content || '',
          media_url,
        });
        platformMessageId = result.message_id;
        break;

      case 'instagram':
        result = await sendInstagramMessage(connectedAccount, conversation, {
          recipient_id: conversation.participant_id,
          text: text_content || '',
          media_url,
        });
        platformMessageId = result.message_id;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported platform: ${platform}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    // Store message in database
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        platform_message_id: platformMessageId,
        direction: 'outgoing',
        message_type: media_url ? 'image' : 'text',
        text_content: text_content || null,
        media_url: media_url || null,
        media_type: media_type || null,
        sender_id: connectedAccount.user_id,
        is_read: true,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error storing message:', msgError);
    }

    // Update conversation status
    await supabase
      .from('conversations')
      .update({
        status: 'replied',
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation_id);

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// =====================================================
// PLATFORM SEND FUNCTIONS
// =====================================================

async function sendGmail(account: any, conversation: any, payload: any) {
  const { to, subject, body } = payload;

  const emailContent = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\n');

  const encodedEmail = btoa(emailContent)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!response.ok) {
    throw new Error(`Gmail API error: ${await response.text()}`);
  }

  return await response.json();
}

async function sendOutlook(account: any, conversation: any, payload: any) {
  const { to, subject, body } = payload;

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject,
        body: {
          contentType: 'Text',
          content: body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Outlook API error: ${await response.text()}`);
  }

  // SendMail doesn't return message ID, generate a temporary one
  return { id: `outlook_${Date.now()}` };
}

async function sendTelegram(account: any, conversation: any, payload: any) {
  const { chat_id, text, photo_url } = payload;
  const botToken = account.config?.bot_token;

  if (!botToken) {
    throw new Error('Telegram bot token not configured');
  }

  let url: string;
  let body: any;

  if (photo_url) {
    url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    body = {
      chat_id,
      photo: photo_url,
      caption: text,
    };
  } else {
    url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    body = {
      chat_id,
      text,
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${await response.text()}`);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }

  return data.result;
}

async function sendWhatsAppTwilio(account: any, conversation: any, payload: any) {
  const { to, body: messageBody, media_url } = payload;
  const account_sid = account.config?.account_sid;
  const auth_token = account.config?.auth_token;
  const whatsapp_number = account.config?.whatsapp_number;

  if (!account_sid || !auth_token || !whatsapp_number) {
    throw new Error('Twilio WhatsApp configuration is incomplete');
  }

  const formData = new URLSearchParams({
    To: to,
    From: whatsapp_number,
    Body: messageBody || '',
  });

  if (media_url) {
    formData.append('MediaUrl', media_url);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${account_sid}:${auth_token}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Twilio API error: ${await response.text()}`);
  }

  return await response.json();
}

// =====================================================
// META (FACEBOOK/INSTAGRAM) SEND FUNCTIONS
// =====================================================

async function sendFacebookMessage(account: any, conversation: any, payload: any) {
  const { recipient_id, text, media_url } = payload;
  const accessToken = account.access_token;
  const pageId = account.platform_account_id;

  if (!accessToken || !pageId) {
    throw new Error('Facebook page access token or page ID not configured');
  }

  console.log('[Facebook] Sending message to:', recipient_id);
  console.log('[Facebook] Using page ID:', pageId);

  // Build message payload
  const messagePayload: any = {
    recipient: { id: recipient_id },
    message: {},
  };

  if (text) {
    messagePayload.message.text = text;
  }

  if (media_url) {
    messagePayload.message.attachment = {
      type: 'image',
      payload: { url: media_url, is_reusable: true },
    };
  }

  // Use Conversations API (Pages Messaging)
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/messages?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[Facebook] API error:', errorData);
    throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  console.log('[Facebook] Message sent successfully:', result);
  
  return { message_id: result.message_id || `fb_${Date.now()}` };
}

async function sendInstagramMessage(account: any, conversation: any, payload: any) {
  const { recipient_id, text, media_url } = payload;
  const accessToken = account.access_token;
  
  // Instagram uses the Facebook Page ID or Instagram Business Account ID
  const igAccountId = account.config?.instagram_account_id || account.platform_account_id;

  if (!accessToken || !igAccountId) {
    throw new Error('Instagram access token or account ID not configured');
  }

  console.log('[Instagram] Sending message to:', recipient_id);
  console.log('[Instagram] Using account ID:', igAccountId);

  // Build message payload for Instagram Messaging API
  const messagePayload: any = {
    recipient: { id: recipient_id },
    message: {},
  };

  if (text) {
    messagePayload.message.text = text;
  }

  if (media_url) {
    messagePayload.message.attachment = {
      type: 'image',
      payload: { url: media_url },
    };
  }

  // Instagram Messaging API uses the same format as Facebook
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}/messages?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[Instagram] API error:', errorData);
    throw new Error(`Instagram API error: ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  console.log('[Instagram] Message sent successfully:', result);
  
  return { message_id: result.message_id || `ig_${Date.now()}` };
}
