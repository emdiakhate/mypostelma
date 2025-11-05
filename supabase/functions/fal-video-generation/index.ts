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
    const maxAttempts = 30; // 2.5 minutes max to avoid timeout
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

        if (statusResult.status === 'COMPLETED') {
          videoUrl = statusResult.data?.video?.url || statusResult.video?.url || statusResult.output?.video?.url;
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

    // Download the video and upload to Supabase Storage
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download generated video');
    }

    const videoBlob = await videoResponse.blob();
    const videoFileName = `generated-video-${Date.now()}.mp4`;

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let userId = 'anonymous';
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // Upload to Supabase Storage
    const storagePath = `${userId}/${videoFileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-archives')
      .upload(storagePath, videoBlob, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload video to storage: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-archives')
      .getPublicUrl(storagePath);

    console.log('Video uploaded to storage:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        videoUrl: publicUrl,
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
