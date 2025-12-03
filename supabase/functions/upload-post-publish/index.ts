import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const UPLOAD_POST_API_KEY = Deno.env.get('UPLOAD_POST_API_KEY')!;
const UPLOAD_POST_API_URL = 'https://api.upload-post.com/api';

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
  console.log(`[upload-post-publish] ${step}`, data ? JSON.stringify(data) : '');
}

interface PublishRequest {
  profile_username: string;
  platforms: string[];
  title: string;
  description?: string;
  media_type: 'text' | 'photo' | 'video';
  photos?: string[];
  video?: string;
  scheduled_date?: string; // ISO-8601 format
  platform_specific_params?: Record<string, any>;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep('Starting publish request');

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

    const body: PublishRequest = await req.json();

    // Validation
    if (!body.profile_username) {
      return new Response(
        JSON.stringify({ success: false, error: 'profile_username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.platforms || body.platforms.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one platform is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.title) {
      return new Response(
        JSON.stringify({ success: false, error: 'title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Publishing post', {
      username: body.profile_username,
      platforms: body.platforms,
      media_type: body.media_type,
      scheduled: !!body.scheduled_date
    });

    // Préparer le FormData pour Upload Post
    const formData = new FormData();
    formData.append('user', body.profile_username);
    formData.append('title', body.title);

    if (body.description) {
      formData.append('description', body.description);
    }

    // Ajouter les plateformes
    body.platforms.forEach(platform => {
      formData.append('platform[]', platform);
    });

    // Ajouter la date programmée si présente
    if (body.scheduled_date) {
      formData.append('scheduled_date', body.scheduled_date);
    }

    // Mode async pour toutes les publications
    formData.append('async_upload', 'true');

    // Ajouter les paramètres spécifiques à la plateforme si présents
    if (body.platform_specific_params) {
      for (const [key, value] of Object.entries(body.platform_specific_params)) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(`${key}[]`, v));
        } else {
          formData.append(key, String(value));
        }
      }
    }

    // Déterminer l'endpoint en fonction du type de média
    let endpoint: string;

    if (body.media_type === 'text') {
      endpoint = `${UPLOAD_POST_API_URL}/upload_text`;
    } else if (body.media_type === 'photo' && body.photos) {
      endpoint = `${UPLOAD_POST_API_URL}/upload_photos`;
      // Pour les photos, nous devons les télécharger et les ajouter au FormData
      // Note: Upload Post API attend des fichiers ou des URLs
      // Si ce sont des URLs, on peut les passer directement
      for (const photoUrl of body.photos) {
        // Si c'est une URL, télécharger et ajouter au FormData
        const photoResponse = await fetch(photoUrl);
        const photoBlob = await photoResponse.blob();
        formData.append('photos[]', photoBlob);
      }
    } else if (body.media_type === 'video' && body.video) {
      endpoint = `${UPLOAD_POST_API_URL}/upload`;
      // Pour la vidéo, télécharger et ajouter au FormData
      const videoResponse = await fetch(body.video);
      const videoBlob = await videoResponse.blob();
      formData.append('video', videoBlob);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid media_type or missing media' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Calling Upload Post API', { endpoint });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Apikey ${UPLOAD_POST_API_KEY}`,
      },
      body: formData,
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
    logStep('Publish successful', { result });

    // Le résultat peut contenir:
    // - Pour publication immédiate: { success: true, request_id: "...", ... }
    // - Pour publication programmée: { success: true, job_id: "...", scheduled_date: "..." }

    return new Response(
      JSON.stringify({
        success: true,
        data: result
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
