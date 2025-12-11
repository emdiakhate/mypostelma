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

interface PublishRequest {
  platform: 'facebook' | 'instagram';
  account_id: string;
  message: string;
  media_urls?: string[];
  media_type?: 'photo' | 'video' | 'text';
}

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

    const body: PublishRequest = await req.json();
    const { platform, account_id, message, media_urls, media_type } = body;

    console.log(`[META-PUBLISH] Publishing to ${platform} for user ${user.id}`);

    // Get the connected account with access token
    const { data: account, error: accountError } = await supabaseClient
      .from('connected_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      console.error('[META-PUBLISH] Account not found:', accountError);
      return new Response(JSON.stringify({ error: 'Compte non trouvé' }), {
        status: 404,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    if (!account.access_token) {
      return new Response(JSON.stringify({ error: 'Token d\'accès manquant. Veuillez reconnecter votre compte.' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const accessToken = account.access_token;
    const pageId = account.platform_account_id;

    let result;

    if (platform === 'facebook') {
      result = await publishToFacebook(pageId, accessToken, message, media_urls, media_type);
    } else if (platform === 'instagram') {
      // For Instagram, we need the Instagram Business Account ID from config
      const instagramAccountId = account.config?.instagram_business_account_id || account.platform_account_id;
      result = await publishToInstagram(instagramAccountId, accessToken, message, media_urls, media_type);
    } else {
      return new Response(JSON.stringify({ error: 'Plateforme non supportée' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    console.log(`[META-PUBLISH] Publication result:`, result);

    return new Response(JSON.stringify({ 
      success: true, 
      post_id: result.id,
      platform 
    }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[META-PUBLISH] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});

async function publishToFacebook(
  pageId: string, 
  accessToken: string, 
  message: string, 
  mediaUrls?: string[],
  mediaType?: string
): Promise<{ id: string }> {
  const graphApiVersion = 'v18.0';
  
  // If we have media, publish with photo/video
  if (mediaUrls && mediaUrls.length > 0 && mediaType === 'photo') {
    // Single photo post
    const photoUrl = mediaUrls[0];
    const response = await fetch(
      `https://graph.facebook.com/${graphApiVersion}/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: photoUrl,
          caption: message,
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[META-PUBLISH] Facebook photo error:', errorData);
      throw new Error(errorData.error?.message || 'Erreur lors de la publication de la photo');
    }

    return await response.json();
  }

  // Text-only post
  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[META-PUBLISH] Facebook post error:', errorData);
    throw new Error(errorData.error?.message || 'Erreur lors de la publication');
  }

  return await response.json();
}

async function publishToInstagram(
  instagramAccountId: string,
  accessToken: string,
  message: string,
  mediaUrls?: string[],
  mediaType?: string
): Promise<{ id: string }> {
  const graphApiVersion = 'v18.0';
  
  // Instagram requires media for posts (no text-only posts allowed)
  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('Instagram nécessite au moins une image ou vidéo pour publier');
  }

  // Step 1: Create media container
  const mediaUrl = mediaUrls[0];
  
  const containerResponse = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${instagramAccountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: mediaUrl,
        caption: message,
        access_token: accessToken,
      }),
    }
  );

  if (!containerResponse.ok) {
    const errorData = await containerResponse.json();
    console.error('[META-PUBLISH] Instagram container error:', errorData);
    throw new Error(errorData.error?.message || 'Erreur lors de la création du média Instagram');
  }

  const containerData = await containerResponse.json();
  const containerId = containerData.id;

  console.log('[META-PUBLISH] Instagram container created:', containerId);

  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 2: Publish the container
  const publishResponse = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${instagramAccountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (!publishResponse.ok) {
    const errorData = await publishResponse.json();
    console.error('[META-PUBLISH] Instagram publish error:', errorData);
    throw new Error(errorData.error?.message || 'Erreur lors de la publication Instagram');
  }

  return await publishResponse.json();
}
