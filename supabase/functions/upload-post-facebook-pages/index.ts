import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const UPLOAD_POST_API_KEY = Deno.env.get('UPLOAD_POST_API_KEY')!;
const UPLOAD_POST_BASE_URL = 'https://api.upload-post.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPLOAD-POST-FACEBOOK-PAGES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const url = new URL(req.url);
    const profile = url.searchParams.get('profile') || user.id;
    logStep('Fetching Facebook pages', { profile });

    const response = await fetch(
      `${UPLOAD_POST_BASE_URL}/api/uploadposts/facebook-pages?profile=${profile}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `ApiKey ${UPLOAD_POST_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    logStep('Upload-Post API response', { status: response.status, ok: response.ok });

    if (!response.ok) {
      logStep('Upload-Post API error', { data });
      throw new Error(data.detail || data.message || 'Failed to get Facebook pages');
    }

    logStep('Facebook pages retrieved successfully', { count: data.length || 0 });

    return new Response(JSON.stringify({ 
      success: true, 
      pages: data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
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
