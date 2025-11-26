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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { my_business_id, competitor_ids } = await req.json();

    console.log('Generating comparative analysis:', { my_business_id, competitor_ids });

    // 1. Get my business data with latest analysis
    const { data: myBusiness, error: businessError } = await supabase
      .from('my_business_latest_analysis' as any)
      .select('*')
      .eq('id', my_business_id)
      .single();

    if (businessError || !myBusiness) {
      throw new Error('Business not found or not analyzed yet');
    }

    // 2. Get competitors with their latest analyses
    const { data: competitors, error: competitorsError } = await supabase
      .from('competitor_latest_analysis' as any)
      .select('*')
      .in('competitor_id', competitor_ids);

    if (competitorsError || !competitors || competitors.length === 0) {
      throw new Error('Competitors not found or not analyzed yet');
    }

    // 3. Build comparison prompt for Lovable AI
    const systemPrompt = `You are a business strategy expert. Compare the user's business with their competitors and provide actionable insights.

Return a comprehensive comparative analysis in JSON format:

{
  "overall_comparison": {
    "market_position": "Your market position description",
    "strengths_vs_competitors": ["Strength 1", "Strength 2"],
    "weaknesses_vs_competitors": ["Weakness 1"],
    "opportunities_identified": ["Opportunity 1"],
    "threats_identified": ["Threat 1"]
  },
  "domain_comparisons": {
    "brand_identity": {
      "score": 85,
      "comparison": "Detailed comparison"
    },
    "digital_presence": {
      "score": 70,
      "comparison": "Detailed comparison"
    },
    "content_strategy": {
      "score": 75,
      "comparison": "Detailed comparison"
    },
    "engagement": {
      "score": 80,
      "comparison": "Detailed comparison"
    },
    "seo_performance": {
      "score": 65,
      "comparison": "Detailed comparison"
    }
  },
  "personalized_recommendations": {
    "quick_wins": ["Quick win 1", "Quick win 2"],
    "strategic_moves": ["Strategic move 1"],
    "areas_to_improve": ["Area 1"],
    "competitive_advantages": ["Advantage 1"]
  },
  "data_insights": {
    "vs_market_leader": "Comparison with market leader",
    "vs_average_competitor": "Comparison with average",
    "growth_potential": "Growth potential assessment",
    "differentiation_opportunities": ["Opportunity 1"]
  }
}`;

    const userPrompt = `Compare this business with its competitors:

MY BUSINESS: ${myBusiness.business_name}
Industry: ${myBusiness.industry || 'Not specified'}
Analysis: ${JSON.stringify(myBusiness, null, 2)}

COMPETITORS:
${competitors.map((c: any, i: number) => `
${i + 1}. ${c.name}
Industry: ${c.industry || 'Not specified'}
Analysis: ${JSON.stringify(c, null, 2)}
`).join('\n')}

Provide a detailed comparative analysis focusing on actionable insights.`;

    // 4. Call Lovable AI
    console.log('Calling Lovable AI for comparative analysis...');
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

    // 5. Save comparative analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('comparative_analysis' as any)
      .insert({
        user_id: myBusiness.user_id,
        my_business_id,
        competitor_ids,
        analysis_date: new Date().toISOString(),
        overall_comparison: analysis.overall_comparison,
        domain_comparisons: analysis.domain_comparisons,
        personalized_recommendations: analysis.personalized_recommendations,
        data_insights: analysis.data_insights,
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    console.log('Comparative analysis saved successfully');

    return new Response(
      JSON.stringify({ success: true, analysis: savedAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-comparative-analysis:', error);
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
