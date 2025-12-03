import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const UPLOAD_POST_API_KEY = Deno.env.get('UPLOAD_POST_API_KEY')!;
const UPLOAD_POST_BASE_URL = 'https://api.upload-post.com';

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

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPLOAD-POST-CREATE-PROFILE] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    if (!UPLOAD_POST_API_KEY) {
      throw new Error('UPLOAD_POST_API_KEY is not set');
    }
    logStep('API key verified');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    logStep('Authorization header found');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logStep('Authentication failed', { error: authError?.message });
      throw new Error('User not authenticated or unauthorized');
    }
    logStep('User authenticated', { userId: user.id, email: user.email });

    const { username } = await req.json();
    const profileUsername = username || user.id;
    logStep('Creating profile', { username: profileUsername });

    const response = await fetch(`${UPLOAD_POST_BASE_URL}/api/uploadposts/users`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${UPLOAD_POST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: profileUsername })
    });

    const data = await response.json();
    logStep('Upload-Post API response', { status: response.status, ok: response.ok });

    if (!response.ok) {
      logStep('Upload-Post API error', { data });
      const errorMessage = data.detail || data.message || 'Failed to create profile';
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMessage,
        statusCode: response.status
      }), {
        status: response.status, // Preserve original status code
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Profile created successfully', { username: profileUsername });

    return new Response(JSON.stringify({ 
      success: true, 
      profile: data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
