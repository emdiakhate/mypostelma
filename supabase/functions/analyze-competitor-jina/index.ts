import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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
  console.log(`[analyze-competitor-jina] ${step}`, data ? JSON.stringify(data, null, 2) : '');
}

// Scrape URL using Jina.ai
async function scrapeWithJina(url: string): Promise<string> {
  try {
    logStep(`Scraping with Jina.ai: ${url}`);
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'markdown',
      },
    });

    if (!response.ok) {
      throw new Error(`Jina.ai returned ${response.status}`);
    }

    const text = await response.text();
    logStep(`Scraped ${url} - ${text.length} characters`);
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep(`Error scraping ${url}`, { error: errorMessage });
    return `Error scraping ${url}: ${errorMessage}`;
  }
}

// Analyze with OpenAI
async function analyzeWithOpenAI(competitorName: string, scrapedData: any, openaiKey: string): Promise<any> {
  logStep('Starting OpenAI analysis');

  const prompt = `Tu es un expert en analyse concurrentielle et stratégie digitale. Analyse ces données d'un concurrent et fournis un rapport structuré.

CONCURRENT: ${competitorName}

DONNÉES COLLECTÉES:
${scrapedData.instagram ? `\nINSTAGRAM:\n${scrapedData.instagram.substring(0, 2000)}` : 'Instagram: Non disponible'}
${scrapedData.facebook ? `\nFACEBOOK:\n${scrapedData.facebook.substring(0, 2000)}` : 'Facebook: Non disponible'}
${scrapedData.linkedin ? `\nLINKEDIN:\n${scrapedData.linkedin.substring(0, 2000)}` : 'LinkedIn: Non disponible'}
${scrapedData.website ? `\nWEBSITE:\n${scrapedData.website.substring(0, 3000)}` : 'Website: Non disponible'}

Fournis ton analyse sous forme d'un objet JSON avec cette structure exacte:
{
  "positioning": "En 1-2 phrases, décris leur positionnement marketing",
  "content_strategy": "Décris leur stratégie de contenu (fréquence, formats, thèmes)",
  "tone": "Qualifie leur ton de communication (ex: professionnel, casual, inspirant, éducatif)",
  "target_audience": "Identifie leur audience cible",
  "strengths": ["Force 1", "Force 2", "Force 3"],
  "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
  "opportunities_for_us": ["Opportunité 1 pour nous différencier", "Opportunité 2", "Opportunité 3"],
  "social_media_presence": "Évalue leur présence sociale (forte/moyenne/faible) et pourquoi",
  "estimated_budget": "Estime leur budget marketing approximatif (petit/moyen/important) selon la qualité du contenu",
  "key_differentiators": ["Ce qui les rend uniques 1", "Ce qui les rend uniques 2"],
  "recommendations": "3 recommandations stratégiques pour les concurrencer",
  "summary": "Résumé exécutif en 3-4 phrases"
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    logStep('OpenAI analysis complete');

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from OpenAI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      ...analysis,
      tokens_used: data.usage.total_tokens,
      analysis_cost: (data.usage.total_tokens / 1000000) * 0.15, // GPT-4o-mini pricing
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Error in OpenAI analysis', { error: errorMessage });
    throw error;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep('Starting competitor analysis with Jina.ai');

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

    const body = await req.json();
    const { competitor_id, name, instagram_url, facebook_url, linkedin_url, website_url } = body;

    if (!competitor_id || !name) {
      return new Response(
        JSON.stringify({ success: false, error: 'competitor_id and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!instagram_url && !facebook_url && !linkedin_url && !website_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key from Supabase secrets
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape all URLs with Jina.ai (in parallel)
    const scrapedData: any = {};

    const scrapePromises = [];
    if (instagram_url) {
      scrapePromises.push(
        scrapeWithJina(instagram_url).then(data => { scrapedData.instagram = data; })
      );
    }
    if (facebook_url) {
      scrapePromises.push(
        scrapeWithJina(facebook_url).then(data => { scrapedData.facebook = data; })
      );
    }
    if (linkedin_url) {
      scrapePromises.push(
        scrapeWithJina(linkedin_url).then(data => { scrapedData.linkedin = data; })
      );
    }
    if (website_url) {
      scrapePromises.push(
        scrapeWithJina(website_url).then(data => { scrapedData.website = data; })
      );
    }

    await Promise.all(scrapePromises);
    logStep('All scraping complete');

    // Analyze with OpenAI
    const analysis = await analyzeWithOpenAI(name, scrapedData, openaiKey);

    // Save to Supabase - competitor_analysis table
    const { data: savedAnalysis, error: analysisError } = await supabaseClient
      .from('competitor_analysis')
      .insert({
        competitor_id,
        positioning: analysis.positioning,
        content_strategy: analysis.content_strategy,
        tone: analysis.tone,
        target_audience: analysis.target_audience,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        opportunities_for_us: analysis.opportunities_for_us,
        social_media_presence: analysis.social_media_presence,
        estimated_budget: analysis.estimated_budget,
        key_differentiators: analysis.key_differentiators,
        recommendations: analysis.recommendations,
        summary: analysis.summary,
        instagram_data: scrapedData.instagram ? { raw: scrapedData.instagram.substring(0, 1000) } : null,
        facebook_data: scrapedData.facebook ? { raw: scrapedData.facebook.substring(0, 1000) } : null,
        linkedin_data: scrapedData.linkedin ? { raw: scrapedData.linkedin.substring(0, 1000) } : null,
        website_data: scrapedData.website ? { raw: scrapedData.website.substring(0, 1000) } : null,
        tokens_used: analysis.tokens_used,
        analysis_cost: analysis.analysis_cost,
      })
      .select()
      .single();

    if (analysisError) {
      logStep('Error saving analysis', { error: analysisError });
      throw analysisError;
    }

    // Update competitor last_analyzed_at
    const { error: competitorUpdateError } = await supabaseClient
      .from('competitors')
      .update({ last_analyzed_at: new Date().toISOString() })
      .eq('id', competitor_id);

    if (competitorUpdateError) {
      logStep('Error updating competitor', { error: competitorUpdateError });
    }

    logStep('Analysis complete and saved');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
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
