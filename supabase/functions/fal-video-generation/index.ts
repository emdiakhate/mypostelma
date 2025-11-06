import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FAL_AI_API_KEY = Deno.env.get('FAL_AI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
      endpoint = 'https://queue.fal.run/fal-ai/bytedance/seedance/v1/pro/fast/image-to-video';
      payload = {
        prompt,
        image_url,
      };
    } else if (mode === 'text-to-video') {
      endpoint = 'https://queue.fal.run/fal-ai/bytedance/seedance/v1/pro/fast/text-to-video';
      payload = {
        prompt,
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

    // fal.ai returns status_url for checking progress
    const statusUrl = result.status_url;
    const requestId = result.request_id;

    if (!statusUrl || !requestId) {
      throw new Error('No status_url or request_id received from fal.ai');
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes max (5s * 24 = 120s)
    let videoUrl = null;

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      console.log(`Checking status (attempt ${attempts + 1}/${maxAttempts})...`);
      
      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Key ${FAL_AI_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        console.log(`Status check attempt ${attempts + 1}:`, statusResult);

        if (statusResult.status === 'COMPLETED') {
          // Fetch the final result from response_url
          const resultResponse = await fetch(statusResult.response_url, {
            headers: {
              'Authorization': `Key ${FAL_AI_API_KEY}`,
            },
          });

          if (resultResponse.ok) {
            const finalResult = await resultResponse.json();
            console.log('Final result from fal.ai:', finalResult);
            videoUrl = finalResult.data?.video?.url || finalResult.video?.url || finalResult.output?.video?.url;
          } else {
            console.error('Failed to fetch final result:', await resultResponse.text());
          }
          break;
        } else if (statusResult.status === 'FAILED' || statusResult.status === 'failed') {
          throw new Error('Video generation failed');
        }
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timeout');
    }

    console.log('Video generated successfully:', videoUrl);

    // Return the fal.ai URL directly (no storage upload to avoid size limits)
    return new Response(
      JSON.stringify({ 
        success: true,
        videoUrl: videoUrl,
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
