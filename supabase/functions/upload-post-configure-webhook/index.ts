import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const UPLOAD_POST_API_KEY = Deno.env.get('UPLOAD_POST_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

const allowedOrigins = [
  'https://postelma.com',
  'https://www.postelma.com',
  'https://preview--mypostelma.lovable.app',
  'https://8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovableproject.com',
  'https://id-preview--8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

function logStep(step: string, data?: any) {
  console.log(`[upload-post-configure-webhook] ${step}`, data ? JSON.stringify(data) : '');
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep('Starting webhook configuration');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      logStep('No authenticated user');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('User authenticated', { userId: user.id });

    // Construire l'URL du webhook
    const webhookUrl = `${SUPABASE_URL}/functions/v1/upload-post-webhook`;

    logStep('Configuring webhook URL', { webhookUrl });

    // Configurer les notifications sur Upload Post
    const response = await fetch('https://app.upload-post.com/api/uploadposts/users/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Apikey ${UPLOAD_POST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channels: {
          webhook: true,
          telegram: false
        },
        webhook_url: webhookUrl
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep('API error', { status: response.status, error: errorText });
      return new Response(
        JSON.stringify({
          success: false,
          error: `Upload Post API returned ${response.status}: ${errorText}`
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    logStep('Webhook configuration successful', { result });

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        webhook_url: webhookUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Error', { error: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
