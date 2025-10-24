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
    const { prompt, image_url, mode = 'text-to-video', duration = 5 } = await req.json();

    if (!FAL_AI_API_KEY) {
      throw new Error('FAL_AI_API_KEY not configured');
    }

    let endpoint = '';
    let payload: any = {};

    // Configure endpoint based on mode
    if (mode === 'image-to-video' && image_url) {
      endpoint = 'https://queue.fal.run/fal-ai/luma-dream-machine/image-to-video';
      payload = {
        prompt,
        image_url,
        duration,
      };
    } else if (mode === 'text-to-video') {
      endpoint = 'https://queue.fal.run/fal-ai/luma-dream-machine';
      payload = {
        prompt,
        duration,
      };
    } else {
      throw new Error('Invalid mode or missing image_url for image-to-video');
    }

    console.log('Calling fal.ai video generation with payload:', payload);

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
      console.error('fal.ai video error:', errorText);
      throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('fal.ai video response:', result);

    // fal.ai returns a request_id for async processing
    const requestId = result.request_id;

    if (!requestId) {
      throw new Error('No request_id received from fal.ai');
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    let videoUrl = null;

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`${endpoint}/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${FAL_AI_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        console.log(`Status check attempt ${attempts + 1}:`, statusResult);

        if (statusResult.status === 'completed') {
          videoUrl = statusResult.video?.url || statusResult.output?.video?.url;
          break;
        } else if (statusResult.status === 'failed') {
          throw new Error('Video generation failed');
        }
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timeout');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        videoUrl,
        requestId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fal-video-generation:', error);
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
