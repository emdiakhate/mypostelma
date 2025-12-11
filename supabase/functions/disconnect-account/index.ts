import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://preview--mypostelma.lovable.app',
  'https://postelma.com',
];

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
});

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const { account_id, platform } = await req.json();

    if (!account_id || !platform) {
      return new Response(JSON.stringify({ error: 'Missing account_id or platform' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    console.log(`Disconnecting account ${account_id} for platform ${platform}`);

    // Get account details
    const { data: account, error: fetchError } = await supabaseClient
      .from('connected_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) {
      return new Response(JSON.stringify({ error: 'Account not found' }), {
        status: 404,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Handle platform-specific disconnection
    try {
      switch (platform) {
        case 'gmail':
          // Revoke Google OAuth token
          if (account.access_token) {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${account.access_token}`, {
              method: 'POST',
            });
          }
          break;

        case 'outlook':
          // Revoke Microsoft OAuth token
          if (account.access_token) {
            await fetch(
              `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
                'https://preview--mypostelma.lovable.app'
              )}`,
              {
                method: 'GET',
              }
            );
          }
          break;

        case 'telegram':
          // For Telegram, we just delete the webhook
          // Telegram bots don't need explicit token revocation
          console.log('Telegram bot disconnected (webhook will be removed on deletion)');
          break;

        case 'whatsapp_twilio':
          // For Twilio WhatsApp, we just stop using the credentials
          // Twilio accounts remain active but won't receive our webhooks
          console.log('WhatsApp Twilio account disconnected');
          break;

        default:
          console.log(`Unknown platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error during platform-specific disconnection: ${error}`);
      // Continue anyway - we still want to delete the account from our database
    }

    // Delete the account from connected_accounts table
    const { error: deleteError } = await supabaseClient
      .from('connected_accounts')
      .delete()
      .eq('id', account_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting account:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    console.log(`Account ${account_id} deleted successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account disconnected successfully',
      }),
      {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error disconnecting account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
