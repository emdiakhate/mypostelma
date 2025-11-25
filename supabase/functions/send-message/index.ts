/**
 * Send Message Edge Function
 *
 * Sends messages to all platforms: Gmail, Outlook, Telegram, WhatsApp
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const {
      conversation_id,
      text_content,
      media_url,
      media_type,
      // Email specific
      subject,
      to,
      // Telegram specific
      chat_id,
    } = await req.json();

    // Get conversation to determine platform
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, connected_accounts(*)')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
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
          body: text_content,
        });
        platformMessageId = result.id;
        break;

      case 'outlook':
        result = await sendOutlook(connectedAccount, conversation, {
          to: to || conversation.participant_id,
          subject: subject || 'Re: Conversation',
          body: text_content,
        });
        platformMessageId = result.id;
        break;

      case 'telegram':
        result = await sendTelegram(connectedAccount, conversation, {
          chat_id: chat_id || conversation.participant_id,
          text: text_content,
          photo_url: media_url,
        });
        platformMessageId = result.message_id.toString();
        break;

      case 'whatsapp_twilio':
        result = await sendWhatsAppTwilio(connectedAccount, conversation, {
          to: `whatsapp:${conversation.participant_id}`,
          body: text_content,
          media_url,
        });
        platformMessageId = result.sid;
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Store message in database
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        platform_message_id: platformMessageId,
        direction: 'outgoing',
        message_type: media_url ? 'image' : 'text',
        text_content,
        media_url,
        media_type,
        sender_id: connectedAccount.user_id,
        sent_by_user_id: connectedAccount.user_id,
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
        last_brand_reply_at: new Date().toISOString(),
      })
      .eq('id', conversation_id);

    return new Response(JSON.stringify({ success: true, message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

// =====================================================
// PLATFORM SEND FUNCTIONS
// =====================================================

async function sendGmail(account: any, conversation: any, payload: any) {
  const { to, subject, body } = payload;

  // TODO: Refresh token if expired

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

  // TODO: Refresh token if expired

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
  const botToken = account.config.bot_token;

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
  const { account_sid, auth_token, whatsapp_number } = account.config;

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
