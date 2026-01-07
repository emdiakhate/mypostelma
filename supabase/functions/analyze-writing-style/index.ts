import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { examples, name } = await req.json();

    if (!examples || !Array.isArray(examples) || examples.join('').length < 200) {
      throw new Error('Veuillez fournir au moins 200 caractères d\'exemples');
    }

    if (!name || name.length > 50) {
      throw new Error('Le nom doit contenir entre 1 et 50 caractères');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user already has 3 custom tones
    const { count } = await supabaseClient
      .from('user_writing_styles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (count && count >= 3) {
      throw new Error('Maximum 3 tons personnels autorisés en version bêta');
    }

    // Check if name already exists for this user
    const { data: existing } = await supabaseClient
      .from('user_writing_styles')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .single();

    if (existing) {
      throw new Error('Ce nom est déjà utilisé');
    }

    console.log('Analyzing writing style with OpenAI...');

    // Call OpenAI to analyze writing style
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de style d'écriture. Analyse les textes fournis et génère des instructions précises pour reproduire ce style. Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte:
{
  "description": "Description courte du style en 2-3 phrases",
  "instructions": "Instructions détaillées pour reproduire ce style (vocabulaire, ton, structure, emojis, longueur phrases, etc.)",
  "characteristics": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"]
}`
          },
          {
            role: 'user',
            content: `Analyse le style d'écriture des textes suivants :\n\n${examples.join('\n\n---\n\n')}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI response:', content);

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Failed to parse AI response');
    }

    // Save to database
    const { data: savedStyle, error: saveError } = await supabaseClient
      .from('user_writing_styles')
      .insert({
        user_id: user.id,
        name,
        style_description: analysisResult.description,
        style_instructions: analysisResult.instructions,
        examples,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving style:', saveError);
      throw new Error('Failed to save writing style');
    }

    console.log('Writing style saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        style: savedStyle,
        analysis: analysisResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-writing-style:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
