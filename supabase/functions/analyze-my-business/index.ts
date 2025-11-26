import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apifyToken = Deno.env.get('APIFY_TOKEN');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!apifyToken || !lovableApiKey) {
      throw new Error('Missing required API keys');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      business_id,
      business_name,
      industry,
      instagram_url,
      facebook_url,
      linkedin_url,
      twitter_url,
      tiktok_url,
      website_url,
    } = await req.json();

    console.log('Starting analysis for business:', business_name);

    // 1. Scrape data from social media platforms
    const rawData: any = {};

    // Instagram scraping
    if (instagram_url) {
      try {
        console.log('Scraping Instagram:', instagram_url);
        const instagramRun = await fetch('https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apifyToken}`,
          },
          body: JSON.stringify({
            directUrls: [instagram_url],
            resultsLimit: 10,
          }),
        });

        if (instagramRun.ok) {
          const runData = await instagramRun.json();
          const runId = runData.data.id;

          // Wait for run to complete
          let status = 'RUNNING';
          let attempts = 0;
          while (status === 'RUNNING' && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs/${runId}`, {
              headers: { 'Authorization': `Bearer ${apifyToken}` },
            });
            const statusData = await statusResponse.json();
            status = statusData.data.status;
            attempts++;
          }

          if (status === 'SUCCEEDED') {
            const resultsResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs/${runId}/dataset/items`, {
              headers: { 'Authorization': `Bearer ${apifyToken}` },
            });
            rawData.instagram_data = await resultsResponse.json();
          }
        }
      } catch (error) {
        console.error('Instagram scraping error:', error);
      }
    }

    // 2. Build comprehensive prompt for Lovable AI
    const systemPrompt = `You are a business analysis expert. Analyze the provided data and return a comprehensive analysis in the following JSON structure:

{
  "context_objectives": {
    "brand_presentation": "Brief brand presentation",
    "target_audience": "Main target audience",
    "main_offering": "Primary offering/products",
    "analysis_objectives": ["Objective 1", "Objective 2"]
  },
  "brand_identity": {
    "visual_universe": {
      "logo_style": "Description",
      "primary_colors": ["#color1", "#color2"],
      "typography": "Description",
      "image_style": "Description",
      "visual_consistency": "Assessment"
    },
    "tone_and_messages": {
      "communication_tone": "formal/fun/expert",
      "main_promise": "Main brand promise",
      "core_values": ["Value 1", "Value 2"],
      "storytelling": "Brand story"
    }
  },
  "offering_positioning": {
    "products_services": {
      "product_range": ["Product 1", "Product 2"],
      "price_levels": "entry/premium/luxury",
      "differentiators": ["Differentiator 1"],
      "business_model": "subscription/one-time/freemium"
    },
    "positioning": {
      "segment": "market segment",
      "target_personas": ["Persona 1"],
      "value_proposition": "Value prop",
      "vs_competitors": "Competitive positioning"
    }
  },
  "digital_presence": {
    "website": {
      "ux_quality": 8,
      "user_journey_clarity": "Assessment",
      "content_quality": "Assessment",
      "loading_speed": "fast/medium/slow",
      "seo_basics": {
        "structure": "Assessment",
        "keywords": ["keyword1"],
        "has_blog": true
      }
    },
    "social_media": {
      "platforms_used": ["instagram", "facebook"],
      "posting_frequency": {
        "instagram": "2-3/day"
      },
      "engagement_metrics": {
        "instagram": {
          "likes_avg": 500,
          "comments_avg": 50,
          "engagement_rate": 3.2
        }
      },
      "content_types": ["photos", "videos"],
      "brand_consistency": "Assessment"
    }
  },
  "swot": {
    "strengths": ["Strength 1"],
    "weaknesses": ["Weakness 1"],
    "opportunities": ["Opportunity 1"],
    "threats": ["Threat 1"]
  },
  "competitive_analysis": {
    "advantages": ["Advantage 1"],
    "disadvantages": ["Disadvantage 1"],
    "market_position": "leader/challenger/niche",
    "market_share_estimate": "Estimate"
  },
  "insights_recommendations": {
    "key_insights": ["Insight 1"],
    "actionable_recommendations": {
      "short_term": ["Action 1"],
      "medium_term": ["Action 1"],
      "long_term": ["Action 1"]
    },
    "priority_actions": ["Priority 1"]
  }
}`;

    const userPrompt = `Analyze this business:
Name: ${business_name}
Industry: ${industry || 'Not specified'}

Data collected:
${JSON.stringify(rawData, null, 2)}

Provide a comprehensive analysis following the JSON structure specified.`;

    // 3. Call Lovable AI for analysis
    console.log('Calling Lovable AI for analysis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.statusText}`);
    }

    const aiResult = await aiResponse.json();
    const analysisText = aiResult.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    // 4. Save analysis to database
    const { data: analysisRecord, error: analysisError } = await supabase
      .from('my_business_analysis')
      .insert({
        business_id,
        analyzed_at: new Date().toISOString(),
        version: 1,
        context_objectives: analysis.context_objectives,
        brand_identity: analysis.brand_identity,
        offering_positioning: analysis.offering_positioning,
        digital_presence: analysis.digital_presence,
        swot: analysis.swot,
        competitive_analysis: analysis.competitive_analysis,
        insights_recommendations: analysis.insights_recommendations,
        raw_data: rawData,
        metadata: {
          tokens_used: aiResult.usage?.total_tokens || 0,
          analysis_cost: (aiResult.usage?.total_tokens || 0) * 0.000001,
          data_sources: Object.keys(rawData),
          confidence_score: 85
        }
      })
      .select()
      .single();

    if (analysisError) {
      throw analysisError;
    }

    // 5. Update my_business last_analyzed_at
    await supabase
      .from('my_business')
      .update({ last_analyzed_at: new Date().toISOString() })
      .eq('id', business_id);

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ success: true, analysis: analysisRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-my-business:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
