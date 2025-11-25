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
    const { account_sid, auth_token, phone_number } = await req.json();

    if (!account_sid || !auth_token || !phone_number) {
      return new Response(
        JSON.stringify({ error: 'Missing account_sid, auth_token, or phone_number' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate Twilio credentials by trying to get account info
    const accountResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account_sid}.json`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${account_sid}:${auth_token}`)}`,
        },
      }
    );

    if (!accountResponse.ok) {
      throw new Error('Invalid Twilio credentials');
    }

    // Webhook URL
    const webhook_url = `${SUPABASE_URL}/functions/v1/twilio-whatsapp-webhook`;

    // Note: In production, you should configure the webhook URL in Twilio Console manually
    // or use Twilio API to set it programmatically for your phone number

    console.log('Twilio credentials validated successfully');
    console.log('Configure this webhook URL in Twilio Console:', webhook_url);

    return new Response(
      JSON.stringify({
        webhook_url,
        message:
          'Credentials validated. Please configure the webhook URL in Twilio Console for your WhatsApp number.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in connect-whatsapp-twilio:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
