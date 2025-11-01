import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const bananaKey = Deno.env.get('BANANA_API_KEY');
    const bananaModelKey = Deno.env.get('BANANA_MODEL_KEY');

    if (!geminiKey || !bananaKey || !bananaModelKey) {
      throw new Error('API keys not configured');
    }

    console.log('🎨 Starting image generation for prompt:', prompt);

    // Étape 1: Améliorer le prompt avec Gemini
    console.log('📝 Step 1: Enhancing prompt with Gemini...');
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert at creating detailed Stable Diffusion prompts. Transform this user request into a highly detailed, artistic prompt optimized for image generation. Include art style, lighting, composition, colors, and technical details. Keep it under 200 words.

User request: ${prompt}

Enhanced prompt:`
            }]
          }]
        })
      }
    );

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('Gemini API error:', error);
      throw new Error('Failed to enhance prompt with Gemini');
    }

    const geminiData = await geminiResponse.json();
    const enhancedPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
    console.log('✨ Enhanced prompt:', enhancedPrompt);

    // Étape 2: Générer l'image avec Banana.dev
    console.log('🖼️  Step 2: Generating image with Banana.dev...');
    const bananaResponse = await fetch('https://api.banana.dev/start/v4/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: bananaKey,
        modelKey: bananaModelKey,
        modelInputs: {
          prompt: enhancedPrompt,
          num_inference_steps: 50,
          guidance_scale: 7.5,
          width: 1024,
          height: 1024,
        }
      })
    });

    if (!bananaResponse.ok) {
      const error = await bananaResponse.text();
      console.error('Banana API error:', error);
      throw new Error('Failed to generate image with Banana');
    }

    const bananaData = await bananaResponse.json();
    console.log('📦 Banana response received');

    // Récupérer l'image générée (base64 ou URL)
    const imageData = bananaData.modelOutputs?.[0]?.image_base64 || bananaData.modelOutputs?.[0]?.url;
    
    if (!imageData) {
      console.error('No image data in response:', bananaData);
      throw new Error('No image data received from Banana');
    }

    console.log('✅ Image generation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        imageData,
        enhancedPrompt,
        message: 'Image generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-image-gemini:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
