import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metaAppId = Deno.env.get('META_APP_ID');

    if (!metaAppId) {
      console.error('META_APP_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Meta App ID not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body to get platform
    const body = await req.json().catch(() => ({}));
    const platform = body.platform || 'facebook';

    console.log('Building Meta OAuth URL for platform:', platform);
    
    // Determine the redirect URI based on request origin
    const origin = req.headers.get('origin') || '';
    let redirectUri: string;
    
    if (origin.includes('preview--mypostelma.lovable.app')) {
      redirectUri = 'https://preview--mypostelma.lovable.app/oauth/callback';
    } else if (origin.includes('postelma.com')) {
      redirectUri = 'https://postelma.com/oauth/callback';
    } else if (origin.includes('mypostelma.lovable.app')) {
      redirectUri = 'https://mypostelma.lovable.app/oauth/callback';
    } else {
      // Default for local dev or other environments
      redirectUri = 'https://mypostelma.lovable.app/oauth/callback';
    }

    console.log('Using redirect URI:', redirectUri);

    // Build state parameter with platform and return URL
    const state = {
      platform,
      returnUrl: '/social-accounts?connected=true',
      originalOrigin: origin
    };
    const stateEncoded = btoa(JSON.stringify(state));

    // Facebook OAuth scopes - IMPORTANT: pages_manage_posts est requis pour publier
    const scopes = [
      'public_profile',
      'email',
      'pages_show_list',          // Voir les pages
      'pages_read_engagement',    // Lire l'engagement
      'pages_manage_posts',       // CRITIQUE: Publier sur les pages
      'pages_manage_metadata',    // Gérer les métadonnées
      'pages_read_user_content',  // Lire le contenu utilisateur
      'pages_messaging',          // INBOX: Recevoir et envoyer des messages
    ];

    // Add Instagram scopes if Instagram platform
    if (platform === 'instagram') {
      scopes.push(
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
        'instagram_manage_messages'  // INBOX: Messages Instagram
      );
    }

    // Build OAuth URL
    // auth_type=rerequest : force Meta to re-demander les permissions (utile si l’utilisateur a refusé ou si les scopes ont changé)
    // return_scopes=true : permet de diagnostiquer les scopes retournés par Meta
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${metaAppId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes.join(','))}` +
      `&state=${encodeURIComponent(stateEncoded)}` +
      `&response_type=code` +
      `&auth_type=rerequest` +
      `&return_scopes=true` +
      `&display=popup`;

    console.log('Built auth URL for platform:', platform);
    
    return new Response(
      JSON.stringify({ 
        appId: metaAppId,
        authUrl,
        redirectUri,
        platform
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: unknown) {
    console.error('Error getting Meta OAuth config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
