import { createClient } from 'npm:@supabase/supabase-js@2';

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

// Helper to check if URL is a valid public URL that Meta can access
function isValidPublicUrl(url: string): boolean {
  if (!url) return false;
  // Must be https and not a blob/data URL
  if (url.startsWith('blob:') || url.startsWith('data:')) return false;
  if (!url.startsWith('https://')) return false;
  return true;
}

// Create admin client for storage operations (bypasses RLS)
function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// Helper to upload base64 or blob to storage and get public URL
async function uploadMediaToStorage(
  mediaUrl: string,
  userId: string
): Promise<string> {
  console.log('[META-PUBLISH] Checking media URL type:', mediaUrl.substring(0, 50));
  
  // If already a valid public URL (e.g., from Supabase storage), return as-is
  if (isValidPublicUrl(mediaUrl)) {
    console.log('[META-PUBLISH] URL is already valid public URL');
    return mediaUrl;
  }
  
  // Handle base64 data URLs
  if (mediaUrl.startsWith('data:')) {
    console.log('[META-PUBLISH] Converting base64 to file');
    const matches = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 data URL format');
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const extension = mimeType.split('/')[1] || 'jpg';
    
    // Decode base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const fileName = `meta-posts/${userId}/${Date.now()}.${extension}`;
    
    // Use admin client for storage upload (bypasses RLS)
    const adminClient = createAdminClient();
    
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('posts-media')
      .upload(fileName, bytes, {
        contentType: mimeType,
        upsert: true
      });
    
    if (uploadError) {
      console.error('[META-PUBLISH] Upload error:', uploadError);
      throw new Error('Erreur lors de l\'upload du média: ' + uploadError.message);
    }
    
    const { data: publicUrlData } = adminClient.storage
      .from('posts-media')
      .getPublicUrl(fileName);
    
    console.log('[META-PUBLISH] Uploaded and got public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  }
  
  // For blob URLs or other non-accessible URLs, we can't process them server-side
  throw new Error('URL du média non accessible. Veuillez utiliser une image publique ou réessayer.');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    console.log('[META-PUBLISH] Starting publish request');

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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('[META-PUBLISH] Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    console.log('[META-PUBLISH] User authenticated:', user.id);

    const body: PublishRequest = await req.json();
    const { platform, account_id, message, media_urls, media_type } = body;

    console.log(`[META-PUBLISH] Publishing to ${platform} for user ${user.id}`);
    console.log('[META-PUBLISH] Account ID:', account_id);
    console.log('[META-PUBLISH] Media type:', media_type);
    console.log('[META-PUBLISH] Message length:', message?.length || 0);

    // Get the connected account with access token
    const { data: account, error: accountError } = await supabaseClient
      .from('connected_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      console.error('[META-PUBLISH] Account not found:', accountError);
      return new Response(JSON.stringify({
        error: 'Compte non trouvé',
        details: accountError?.message,
        account_id
      }), {
        status: 404,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    console.log('[META-PUBLISH] Account found:', {
      platform: account.platform,
      account_name: account.account_name,
      has_token: !!account.access_token,
      platform_account_id: account.platform_account_id
    });

    if (!account.access_token) {
      console.error('[META-PUBLISH] Missing access token for account:', account_id);
      return new Response(JSON.stringify({
        error: 'Token d\'accès manquant. Veuillez reconnecter votre compte.',
        account_name: account.account_name
      }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    if (!account.platform_account_id) {
      console.error('[META-PUBLISH] Missing platform_account_id for account:', account_id);
      return new Response(JSON.stringify({
        error: 'ID de page Facebook manquant. Veuillez reconnecter votre compte.',
        account_name: account.account_name
      }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const accessToken = account.access_token;
    const pageId = account.platform_account_id;

    console.log('[META-PUBLISH] Using page ID:', pageId);

    let result;

    if (platform === 'facebook') {
      result = await publishToFacebook(pageId, accessToken, message, user.id, media_urls, media_type);
    } else if (platform === 'instagram') {
      // For Instagram, we need the Instagram Business Account ID from config
      const instagramAccountId = account.config?.instagram_business_account_id || account.platform_account_id;
      result = await publishToInstagram(instagramAccountId, accessToken, message, user.id, media_urls, media_type);
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
    console.error('[META-PUBLISH] Unhandled error:', error);
    console.error('[META-PUBLISH] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : { error: String(error) };

    return new Response(JSON.stringify({
      error: errorMessage,
      details: errorDetails,
      hint: 'Vérifiez les logs de la fonction pour plus de détails'
    }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});

async function publishToFacebook(
  pageId: string, 
  accessToken: string, 
  message: string, 
  userId: string,
  mediaUrls?: string[],
  mediaType?: string
): Promise<{ id: string }> {
  const graphApiVersion = 'v18.0';
  
  // If we have media, publish with photo/video
  if (mediaUrls && mediaUrls.length > 0 && mediaType === 'photo') {
    // Upload to storage if needed and get public URL
    const photoUrl = await uploadMediaToStorage(mediaUrls[0], userId);
    
    console.log('[META-PUBLISH] Publishing photo to Facebook with URL:', photoUrl);
    
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
  console.log('[META-PUBLISH] Publishing text post to Facebook page:', pageId);

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

  console.log('[META-PUBLISH] Facebook API response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[META-PUBLISH] Facebook post error:', errorData);
    console.error('[META-PUBLISH] Error code:', errorData.error?.code);
    console.error('[META-PUBLISH] Error type:', errorData.error?.type);

    // Provide more helpful error messages
    let userMessage = errorData.error?.message || 'Erreur lors de la publication';

    if (errorData.error?.code === 190) {
      userMessage = 'Token d\'accès expiré. Veuillez reconnecter votre compte Facebook.';
    } else if (errorData.error?.code === 200) {
      userMessage = 'Permissions insuffisantes. Vérifiez que vous avez autorisé la publication sur cette page.';
    } else if (errorData.error?.code === 100) {
      userMessage = 'Paramètre invalide. ' + (errorData.error?.message || '');
    }

    throw new Error(userMessage);
  }

  const result = await response.json();
  console.log('[META-PUBLISH] Facebook post created successfully:', result.id);

  return result;
}

async function publishToInstagram(
  instagramAccountId: string,
  accessToken: string,
  message: string,
  userId: string,
  mediaUrls?: string[],
  mediaType?: string
): Promise<{ id: string }> {
  const graphApiVersion = 'v18.0';
  
  // Instagram requires media for posts (no text-only posts allowed)
  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('Instagram nécessite au moins une image ou vidéo pour publier');
  }

  // Upload to storage if needed and get public URL
  const mediaUrl = await uploadMediaToStorage(mediaUrls[0], userId);
  
  console.log('[META-PUBLISH] Publishing to Instagram with URL:', mediaUrl);

  // Step 1: Create media container
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
