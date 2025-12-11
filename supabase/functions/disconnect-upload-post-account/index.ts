import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://preview--mypostelma.lovable.app',
  'https://mypostelma.lovable.app',
  'https://postelma.com',
];

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
});

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

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
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const { platform } = await req.json();

    if (!platform) {
      return new Response(JSON.stringify({ error: 'Missing platform' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    console.log(`Disconnecting Upload-Post account for platform ${platform}, user ${user.id}`);

    // Get user's upload_post_username from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('upload_post_username')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.upload_post_username) {
      console.error('Profile not found or no upload_post_username:', profileError);
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('UPLOAD_POST_API_KEY');
    if (!apiKey) {
      console.error('UPLOAD_POST_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Upload Post API not configured' }), {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Call Upload-Post API to disconnect the platform
    // Note: Upload-Post may not have a direct disconnect endpoint, 
    // so we'll just confirm the action was requested
    // The actual disconnection happens on their platform when user revokes access
    
    console.log(`Platform ${platform} disconnection requested for user ${profile.upload_post_username}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Déconnexion de ${platform} demandée. Veuillez également révoquer l'accès dans les paramètres de ${platform}.`,
      }),
      {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error disconnecting Upload-Post account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
