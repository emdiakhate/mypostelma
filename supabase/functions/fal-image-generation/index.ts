import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FAL_AI_API_KEY = Deno.env.get('FAL_AI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, image_url, type = 'simple' } = await req.json();

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
    } else if (type === 'edit' && image_url) {
      endpoint = 'https://queue.fal.run/fal-ai/nano-banana/edit';
      payload = {
        prompt,
        image_url,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      };
    } else if (type === 'combine' && image_url) {
      // For combining images, use image_url as array
      endpoint = 'https://queue.fal.run/fal-ai/nano-banana/edit';
      payload = {
        prompt,
        image_url: Array.isArray(image_url) ? image_url[0] : image_url,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      };
    } else if (type === 'ugc' && image_url) {
      endpoint = 'https://queue.fal.run/fal-ai/nano-banana/edit';
      payload = {
        prompt: prompt || "Transform this image",
        image_url,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      };
    } else {
      throw new Error('Invalid generation type or missing image_url for edit/combine/ugc');
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

    // fal.ai returns a request_id for async processing
    const requestId = result.request_id;

    if (!requestId) {
      throw new Error('No request_id received from fal.ai');
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 40; // 40 seconds max
    let imageUrl = null;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(`${endpoint}/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${FAL_AI_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        console.log(`Status check attempt ${attempts + 1}:`, statusResult);

        // Si on a des images dans la réponse, c'est terminé
        if (statusResult.images && statusResult.images.length > 0) {
          imageUrl = statusResult.images[0].url;
          console.log('Image générée avec succès:', imageUrl);
          break;
        } 
        
        // Vérifier aussi le format avec status
        if (statusResult.status === 'COMPLETED') {
          imageUrl = statusResult.images?.[0]?.url || statusResult.image?.url;
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

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        requestId 
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
