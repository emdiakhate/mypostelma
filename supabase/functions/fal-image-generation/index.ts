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
      endpoint = 'https://queue.fal.run/fal-ai/fast-nano-banana';
      payload = {
        prompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      };
    } else if (type === 'edit' && image_url) {
      endpoint = 'https://queue.fal.run/fal-ai/fast-nano-banana';
      payload = {
        prompt,
        image_url,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      };
    } else if (type === 'combine' && image_url) {
      // For combining images, use image_url as array
      endpoint = 'https://queue.fal.run/fal-ai/fast-nano-banana';
      payload = {
        prompt,
        image_url: Array.isArray(image_url) ? image_url[0] : image_url,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      };
    } else {
      throw new Error('Invalid generation type or missing image_url for edit/combine');
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

    // Extract image URL from response
    const imageUrl = result.images?.[0]?.url || result.image?.url;

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        result 
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
