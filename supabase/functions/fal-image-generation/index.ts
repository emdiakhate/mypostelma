import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FAL_AI_API_KEY = Deno.env.get('FAL_AI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
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

    const { prompt, image_urls, type = 'simple' } = await req.json();

    console.log('🎨 Image generation request:', { type, prompt, hasImages: !!image_urls, userId: user.id });

    // ÉTAPE 1: Essayer d'abord avec Gemini (gratuit)
    if (GEMINI_API_KEY && type === 'simple') {
      try {
        console.log('🤖 Tentative avec Gemini Nano Banana...');
        
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Generate a high-quality image: ${prompt}` }]
              }],
              generationConfig: {
                responseMimeType: "image/png"
              }
            })
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          
          // Gemini renvoie l'image en base64 dans le contenu
          const imageData = geminiData.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          
          if (imageData && imageData.data) {
            const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
            console.log('✅ Image générée avec Gemini (gratuit)');
            
            return new Response(
              JSON.stringify({ 
                success: true,
                imageUrl,
                provider: 'gemini'
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              }
            );
          }
        } else {
          const errorText = await geminiResponse.text();
          console.log('⚠️ Gemini quota épuisé ou erreur, fallback vers Fal.ai:', errorText);
        }
      } catch (geminiError) {
        console.log('⚠️ Erreur Gemini, fallback vers Fal.ai:', geminiError);
      }
    }

    // ÉTAPE 2: Fallback sur Fal.ai (payant)
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
        num_images: 1,
      };
    } else if (type === 'edit' && image_urls && image_urls.length > 0) {
      endpoint = 'https://queue.fal.run/fal-ai/nano-banana/edit';
      payload = {
        prompt,
        image_urls: image_urls,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
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
    let imageUrl = null;

    while (attempts < maxAttempts && !imageUrl) {
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
              imageUrl = finalResult.images[0].url;
              console.log('Image générée avec succès:', imageUrl);
            } else if (finalResult.image?.url) {
              imageUrl = finalResult.image.url;
              console.log('Image générée avec succès:', imageUrl);
            }
          }
          break;
        } else if (statusResult.status === 'FAILED') {
          throw new Error('Image generation failed');
        }
      }

      attempts++;
    }

    if (!imageUrl) {
      throw new Error('Image generation timeout');
    }

    console.log('✅ Image générée avec Fal.ai (payant)');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        requestId,
        provider: 'fal_ai'
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
