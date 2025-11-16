import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = [
  'https://postelma.com',
  'https://www.postelma.com',
  'https://8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovableproject.com',
  'https://id-preview--8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovable.app',
  'https://preview--mypostelma.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

const FAL_AI_API_KEY = Deno.env.get('FAL_AI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ÉTAPE 0: Authentification et vérification des quotas
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔐 User authenticated:', user.id);

    // Vérifier et incrémenter le quota
    const { data: quotaResult, error: quotaError } = await supabaseClient.rpc(
      'increment_ai_image_generation',
      { p_user_id: user.id }
    );

    if (quotaError || !quotaResult?.success) {
      console.log('❌ Quota check failed:', quotaResult);
      return new Response(
        JSON.stringify({
          error: quotaResult?.message || 'Quota exceeded',
          success: false,
          quota: quotaResult
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Quota checked:', quotaResult);

    const { prompt, image_urls, type = 'simple', num_images = 1, template_id } = await req.json();

    console.log('🎨 Image generation request:', { type, prompt, hasImages: !!image_urls, userId: user.id, num_images, template_id });

    // Utiliser fal.ai pour la génération
    console.log('💰 Utilisation de Fal.ai...');
    
    if (!FAL_AI_API_KEY) {
      throw new Error('FAL_AI_API_KEY not configured');
    }

    let endpoint = '';
    let payload: any = {};

    // Configure endpoint and payload based on generation type
    if (type === 'simple') {
      endpoint = 'https://queue.fal.run/fal-ai/nano-banana';
      payload = {
        prompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: num_images,
      };
    } else if (type === 'edit' && image_urls && image_urls.length > 0) {
      endpoint = 'https://queue.fal.run/fal-ai/nano-banana/edit';
      payload = {
        prompt,
        image_urls: image_urls,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: num_images,
      };
    } else {
      throw new Error('Invalid generation type or missing image_urls for edit');
    }

    console.log('Calling fal.ai with payload:', payload);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('fal.ai error:', errorText);
      throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('fal.ai response:', result);

    // fal.ai returns a request_id and response_url for async processing
    const requestId = result.request_id;
    const statusUrl = result.status_url;
    const responseUrl = result.response_url;

    if (!requestId || !statusUrl || !responseUrl) {
      throw new Error('No request_id, status_url or response_url received from fal.ai');
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max for image editing
    let imageUrls: string[] = [];

    while (attempts < maxAttempts && imageUrls.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Key ${FAL_AI_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        console.log(`Status check attempt ${attempts + 1}:`, statusResult);

        // Quand le statut est COMPLETED, récupérer le résultat via response_url
        if (statusResult.status === 'COMPLETED') {
          const resultResponse = await fetch(responseUrl, {
            headers: {
              'Authorization': `Key ${FAL_AI_API_KEY}`,
            },
          });

          if (resultResponse.ok) {
            const finalResult = await resultResponse.json();
            console.log('Final result:', finalResult);
            
            if (finalResult.images && finalResult.images.length > 0) {
              imageUrls = finalResult.images.map((img: any) => img.url);
              console.log('Images générées avec succès:', imageUrls);
            } else if (finalResult.image?.url) {
              imageUrls = [finalResult.image.url];
              console.log('Image générée avec succès:', imageUrls);
            }
          }
          break;
        } else if (statusResult.status === 'FAILED') {
          throw new Error('Image generation failed');
        }
      }

      attempts++;
    }

    if (imageUrls.length === 0) {
      throw new Error('Image generation timeout');
    }

    console.log('✅ Images générées avec Fal.ai (payant)');

    // Sauvegarder les images dans media_archives
    const savedImages = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      
      try {
        const { data: mediaData, error: mediaError } = await supabaseClient
          .from('media_archives')
          .insert({
            user_id: user.id,
            title: `${template_id || 'Generated'} - Image ${i + 1}`,
            file_path: imageUrl,
            file_type: 'image/png',
            source: 'fal_ai_generation',
          })
          .select()
          .single();

        if (mediaError) {
          console.error('Error saving to media_archives:', mediaError);
        } else {
          savedImages.push(mediaData);
          console.log('Image saved to media_archives:', mediaData.id);
        }
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrls: imageUrls,
        imageUrl: imageUrls[0], // Backward compatibility
        requestId,
        provider: 'fal_ai',
        savedImages
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fal-image-generation:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
