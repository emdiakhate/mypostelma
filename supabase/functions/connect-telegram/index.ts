import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

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
    const { bot_token } = await req.json();

    if (!bot_token) {
      return new Response(JSON.stringify({ error: 'Missing bot_token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate bot token by calling getMe
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);

    if (!botInfoResponse.ok) {
      throw new Error('Invalid bot token');
    }

    const botInfo = await botInfoResponse.json();

    if (!botInfo.ok) {
      throw new Error(botInfo.description || 'Failed to get bot info');
    }

    const { id: bot_id, username: bot_username } = botInfo.result;

    // Set webhook URL to our Edge Function
    const webhook_url = `${SUPABASE_URL}/functions/v1/telegram-webhook`;

    const setWebhookResponse = await fetch(
      `https://api.telegram.org/bot${bot_token}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhook_url,
          allowed_updates: ['message', 'edited_message'],
        }),
      }
    );

    if (!setWebhookResponse.ok) {
      throw new Error('Failed to set webhook');
    }

    const webhookResult = await setWebhookResponse.json();

    if (!webhookResult.ok) {
      throw new Error(webhookResult.description || 'Failed to set webhook');
    }

    return new Response(
      JSON.stringify({
        bot_id,
        bot_username,
        webhook_url,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in connect-telegram:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
