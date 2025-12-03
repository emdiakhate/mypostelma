import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const UPLOAD_POST_API_KEY = Deno.env.get('UPLOAD_POST_API_KEY')!;

function logStep(step: string, data?: any) {
  console.log(`[upload-post-webhook] ${step}`, data ? JSON.stringify(data) : '');
}

interface WebhookPayload {
  event: string;
  user_email: string;
  profile_username: string;
  platform: string;
  media_type: string;
  title: string;
  caption: string;
  result: {
    success: boolean;
    url?: string;
    publish_id?: string;
    post_id?: string;
    error?: string;
  };
  created_at: string;
}

serve(async (req) => {
  // Les webhooks Upload Post n'ont pas besoin de CORS
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    logStep('Received webhook');

    const payload: WebhookPayload = await req.json();
    logStep('Webhook payload', payload);

    // Validation du payload
    if (payload.event !== 'upload_completed') {
      logStep('Unknown event type', { event: payload.event });
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown event type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Créer un client Supabase avec la clé de service pour contourner RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Trouver l'utilisateur par email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, upload_post_username')
      .eq('email', payload.user_email)
      .single();

    if (profileError || !profile) {
      logStep('User profile not found', { email: payload.user_email, error: profileError });
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logStep('Found user profile', { userId: profile.id });

    // Trouver le post correspondant
    // On cherche les posts récents (dernières 48h) qui correspondent au username et au contenu
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: posts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('author_id', profile.id)
      .gte('created_at', twoDaysAgo)
      .or(`upload_post_status.eq.pending,upload_post_status.eq.in_progress,upload_post_status.eq.scheduled`)
      .order('created_at', { ascending: false });

    if (postsError) {
      logStep('Error fetching posts', { error: postsError });
      return new Response(
        JSON.stringify({ success: false, error: 'Error fetching posts' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!posts || posts.length === 0) {
      logStep('No matching posts found');
      return new Response(
        JSON.stringify({ success: false, error: 'No matching posts found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Trouver le post qui correspond le mieux
    // On cherche par similarité de contenu ou par plateforme
    const matchingPost = posts.find(post => {
      const hasMatchingPlatform = post.platforms?.includes(payload.platform);
      const hasMatchingContent = post.content?.toLowerCase().includes(payload.title.toLowerCase().slice(0, 50));
      return hasMatchingPlatform || hasMatchingContent;
    }) || posts[0]; // Par défaut, prendre le plus récent

    logStep('Found matching post', { postId: matchingPost.id });

    // Préparer les résultats mis à jour
    const currentResults = matchingPost.upload_post_results || {};
    const updatedResults = {
      ...currentResults,
      [payload.platform]: {
        success: payload.result.success,
        url: payload.result.url,
        publish_id: payload.result.publish_id,
        post_id: payload.result.post_id,
        error: payload.result.error,
        completed_at: payload.created_at
      }
    };

    // Déterminer le nouveau statut global
    const allPlatforms = matchingPost.platforms || [];
    const completedPlatforms = Object.keys(updatedResults);
    const allCompleted = allPlatforms.every((p: string) => completedPlatforms.includes(p));
    const hasFailure = Object.values(updatedResults).some((r: any) => !r.success);

    let newStatus = 'in_progress';
    if (allCompleted) {
      newStatus = hasFailure ? 'failed' : 'published';
    }

    // Si la publication a réussi, mettre à jour published_at
    const updates: any = {
      upload_post_status: newStatus,
      upload_post_results: updatedResults,
      status: newStatus,
    };

    if (newStatus === 'published' && !matchingPost.published_at) {
      updates.published_at = new Date().toISOString();
    }

    logStep('Updating post', { postId: matchingPost.id, newStatus, updates });

    // Mettre à jour le post
    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update(updates)
      .eq('id', matchingPost.id);

    if (updateError) {
      logStep('Error updating post', { error: updateError });
      return new Response(
        JSON.stringify({ success: false, error: 'Error updating post' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logStep('Post updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        post_id: matchingPost.id,
        status: newStatus
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Error processing webhook', { error: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
