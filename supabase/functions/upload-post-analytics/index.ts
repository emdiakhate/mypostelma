import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const UPLOAD_POST_API_KEY = Deno.env.get('UPLOAD_POST_API_KEY')!;
const UPLOAD_POST_API_URL = 'https://api.upload-post.com/api';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function logStep(step: string, data?: any) {
  console.log(`[upload-post-analytics] ${step}`, data ? JSON.stringify(data) : '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep('Starting analytics request');

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

    const { username, platforms } = await req.json();
    
    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!platforms || platforms.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one platform is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Fetching analytics', { username, platforms });

    // Construire l'URL avec les plateformes
    const platformsQuery = platforms.join(',');
    const analyticsUrl = `${UPLOAD_POST_API_URL}/analytics/${username}?platforms=${platformsQuery}`;

    const response = await fetch(analyticsUrl, {
      headers: {
        'Authorization': `Apikey ${UPLOAD_POST_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep('API error', { status: response.status, error: errorText });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API returned ${response.status}: ${errorText}` 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analyticsData = await response.json();
    logStep('Analytics fetched successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analytics: analyticsData 
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
