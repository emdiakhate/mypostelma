import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function logStep(step: string, data?: any) {
  console.log(`[analyze-competitor-apify] ${step}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper: Extract Instagram username from URL
function extractInstagramUsername(url: string): string | null {
  try {
    const match = url.match(/instagram\.com\/([^\/\?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Helper: Extract Twitter username from URL
function extractTwitterUsername(url: string): string | null {
  try {
    const match = url.match(/twitter\.com\/([^\/\?]+)|x\.com\/([^\/\?]+)/);
    return match ? (match[1] || match[2]) : null;
  } catch {
    return null;
  }
}

// Helper: Extract Facebook page from URL
function extractFacebookPage(url: string): string | null {
  try {
    const match = url.match(/facebook\.com\/([^\/\?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Helper: Extract TikTok username from URL
function extractTikTokUsername(url: string): string | null {
  try {
    const match = url.match(/tiktok\.com\/@([^\/\?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Apify Integration - Run actor and poll for results
async function runApifyActor(
  actorId: string,
  input: any,
  apifyToken: string,
  maxWaitMs: number = 300000 // 5 minutes
): Promise<any> {
  try {
    logStep(`Starting Apify actor: ${actorId}`, { input });

    // 1. Start actor run
    const startResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Apify actor start failed: ${startResponse.status} - ${errorText}`);
    }

    const { data: runData } = await startResponse.json();
    const runId = runData.id;
    logStep(`Actor run started: ${runId}`);

    // 2. Poll for completion (every 5s, max 5 min)
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`);
      }

      const { data: statusData } = await statusResponse.json();
      const status = statusData.status;

      logStep(`Actor run status: ${status}`);

      if (status === 'SUCCEEDED') {
        // 3. Fetch results
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/datasets/${statusData.defaultDatasetId}/items?token=${apifyToken}`
        );

        if (!resultsResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
        }

        const results = await resultsResponse.json();
        logStep(`Actor completed successfully - ${results.length} items`);
        return results;
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Actor run ${status.toLowerCase()}`);
      }

      // Still running, continue polling
    }

    throw new Error('Actor run timeout after 5 minutes');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep(`Error running Apify actor ${actorId}`, { error: errorMessage });
    throw error;
  }
}

// Scrape Instagram with Apify
async function scrapeInstagram(url: string, apifyToken: string): Promise<any> {
  const username = extractInstagramUsername(url);
  if (!username) {
    return { error: 'Invalid Instagram URL' };
  }

  try {
    // Use Instagram Profile Scraper
    const results = await runApifyActor(
      'apify/instagram-profile-scraper',
      {
        usernames: [username],
        resultsLimit: 100, // Max 100 posts
      },
      apifyToken
    );

    if (!results || results.length === 0) {
      return { error: 'No data returned from Instagram' };
    }

    const profile = results[0];

    // Extract key metrics
    return {
      username: profile.username,
      fullName: profile.fullName,
      biography: profile.biography,
      followers: profile.followersCount,
      following: profile.followsCount,
      posts: profile.postsCount,
      verified: profile.verified,
      isPrivate: profile.private,
      engagement_rate: profile.engagementRate || 0,
      avg_likes: profile.avgLikes || 0,
      avg_comments: profile.avgComments || 0,
      recent_posts: profile.latestPosts?.slice(0, 10).map((post: any) => ({
        caption: post.caption?.substring(0, 200),
        likes: post.likesCount,
        comments: post.commentsCount,
        timestamp: post.timestamp,
        type: post.type,
      })) || [],
      raw: profile, // Full data for audit
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Error scraping Instagram', { error: errorMessage });
    return { error: errorMessage };
  }
}

// Scrape Twitter with Apify (fallback if no Twitter API)
async function scrapeTwitter(url: string, apifyToken: string, twitterBearerToken?: string): Promise<any> {
  const username = extractTwitterUsername(url);
  if (!username) {
    return { error: 'Invalid Twitter URL' };
  }

  try {
    // Try Twitter API v2 first if token available
    if (twitterBearerToken) {
      logStep('Using Twitter API v2');
      const userResponse = await fetch(
        `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,description,verified`,
        {
          headers: { 'Authorization': `Bearer ${twitterBearerToken}` },
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const user = userData.data;

        // Fetch recent tweets
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${user.id}/tweets?max_results=10&tweet.fields=public_metrics,created_at`,
          {
            headers: { 'Authorization': `Bearer ${twitterBearerToken}` },
          }
        );

        const tweetsData = tweetsResponse.ok ? await tweetsResponse.json() : { data: [] };

        return {
          username: user.username,
          name: user.name,
          description: user.description,
          followers: user.public_metrics.followers_count,
          following: user.public_metrics.following_count,
          tweets: user.public_metrics.tweet_count,
          verified: user.verified,
          recent_tweets: tweetsData.data?.slice(0, 10).map((tweet: any) => ({
            text: tweet.text?.substring(0, 200),
            likes: tweet.public_metrics.like_count,
            retweets: tweet.public_metrics.retweet_count,
            replies: tweet.public_metrics.reply_count,
            created_at: tweet.created_at,
          })) || [],
          source: 'twitter_api_v2',
        };
      }
    }

    // Fallback to Apify
    logStep('Using Apify Twitter scraper as fallback');
    const results = await runApifyActor(
      'apify/twitter-scraper',
      {
        handles: [username],
        maxTweets: 100,
      },
      apifyToken
    );

    if (!results || results.length === 0) {
      return { error: 'No data returned from Twitter' };
    }

    const profile = results[0];

    return {
      username: profile.username,
      name: profile.name,
      description: profile.description,
      followers: profile.followers,
      following: profile.following,
      tweets: profile.tweets,
      verified: profile.verified,
      recent_tweets: profile.latestTweets?.slice(0, 10).map((tweet: any) => ({
        text: tweet.text?.substring(0, 200),
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        created_at: tweet.createdAt,
      })) || [],
      source: 'apify',
      raw: profile,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Error scraping Twitter', { error: errorMessage });
    return { error: errorMessage };
  }
}

// Scrape Facebook with Apify
async function scrapeFacebook(url: string, apifyToken: string): Promise<any> {
  const pageName = extractFacebookPage(url);
  if (!pageName) {
    return { error: 'Invalid Facebook URL' };
  }

  try {
    const results = await runApifyActor(
      'apify/facebook-pages-scraper',
      {
        startUrls: [{ url }],
        maxPosts: 100,
      },
      apifyToken
    );

    if (!results || results.length === 0) {
      return { error: 'No data returned from Facebook' };
    }

    const page = results[0];

    return {
      name: page.name,
      likes: page.likes,
      followers: page.followers,
      about: page.about?.substring(0, 500),
      verified: page.verified,
      recent_posts: page.posts?.slice(0, 10).map((post: any) => ({
        text: post.text?.substring(0, 200),
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        timestamp: post.timestamp,
      })) || [],
      raw: page,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Error scraping Facebook', { error: errorMessage });
    return { error: errorMessage };
  }
}

// Scrape TikTok with Apify (using apidojo/tiktok-scraper)
async function scrapeTikTok(url: string, apifyToken: string): Promise<any> {
  try {
    const results = await runApifyActor(
      'apidojo/tiktok-scraper',
      {
        startUrls: [{ url: url }],
        maxItems: 100,
      },
      apifyToken
    );

    if (!results || results.length === 0) {
      return { error: 'No data returned from TikTok' };
    }

    // Aggregate profile data from posts
    const firstPost = results[0];
    const channel = firstPost.channel;

    return {
      username: channel?.username,
      followers: channel?.followers,
      following: channel?.following,
      hearts: null,
      videos: channel?.videos,
      verified: channel?.verified,
      recent_videos: results.slice(0, 10).map((post: any) => ({
        description: post.title?.substring(0, 200),
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        views: post.views,
        created_at: post.uploadedAt,
      })),
      raw: { channel, posts: results },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Error scraping TikTok', { error: errorMessage });
    return { error: errorMessage };
  }
}

// Scrape Website with Jina.ai (keep existing)
async function scrapeWebsite(url: string): Promise<string> {
  try {
    logStep(`Scraping website with Jina.ai: ${url}`);
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
    logStep(`Scraped website ${url} - ${text.length} characters`);
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep(`Error scraping website ${url}`, { error: errorMessage });
    return `Error scraping ${url}: ${errorMessage}`;
  }
}

// Analyze with Lovable AI (updated to use extended framework)
async function analyzeWithLovableAI(competitorName: string, scrapedData: any, lovableApiKey: string): Promise<any> {
  logStep('Starting Lovable AI analysis with extended framework');

  // Build enriched context
  let context = `CONCURRENT: ${competitorName}\n\nDONNÉES COLLECTÉES:\n`;

  if (scrapedData.instagram && !scrapedData.instagram.error) {
    const ig = scrapedData.instagram;
    context += `\nINSTAGRAM (@${ig.username}):\n`;
    context += `- Followers: ${ig.followers?.toLocaleString() || 'N/A'}\n`;
    context += `- Posts: ${ig.posts || 'N/A'}\n`;
    context += `- Engagement Rate: ${(ig.engagement_rate * 100).toFixed(2)}%\n`;
    context += `- Bio: ${ig.biography || 'N/A'}\n`;
    context += `- Avg Likes: ${ig.avg_likes || 0}, Avg Comments: ${ig.avg_comments || 0}\n`;
    if (ig.recent_posts?.length > 0) {
      context += `- Top Posts: ${ig.recent_posts.slice(0, 3).map((p: any) =>
        `"${p.caption?.substring(0, 100)}" (${p.likes} likes, ${p.comments} comments)`
      ).join('; ')}\n`;
    }
  }

  if (scrapedData.twitter && !scrapedData.twitter.error) {
    const tw = scrapedData.twitter;
    context += `\nTWITTER (@${tw.username}):\n`;
    context += `- Followers: ${tw.followers?.toLocaleString() || 'N/A'}\n`;
    context += `- Tweets: ${tw.tweets || 'N/A'}\n`;
    context += `- Bio: ${tw.description || 'N/A'}\n`;
  }

  if (scrapedData.facebook && !scrapedData.facebook.error) {
    const fb = scrapedData.facebook;
    context += `\nFACEBOOK (${fb.name}):\n`;
    context += `- Likes: ${fb.likes?.toLocaleString() || 'N/A'}\n`;
    context += `- Followers: ${fb.followers?.toLocaleString() || 'N/A'}\n`;
  }

  if (scrapedData.tiktok && !scrapedData.tiktok.error) {
    const tt = scrapedData.tiktok;
    context += `\nTIKTOK (@${tt.username}):\n`;
    context += `- Followers: ${tt.followers?.toLocaleString() || 'N/A'}\n`;
  }

  if (scrapedData.website) {
    context += `\nWEBSITE:\n${scrapedData.website.substring(0, 3000)}\n`;
  }

  const systemPrompt = `You are a business analysis expert. Analyze the provided competitor data and return a comprehensive analysis in JSON format following this structure:

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
      "primary_colors": ["#color1"],
      "typography": "Description",
      "image_style": "Description",
      "visual_consistency": "Assessment"
    },
    "tone_and_messages": {
      "communication_tone": "formal/fun/expert",
      "main_promise": "Main brand promise",
      "core_values": ["Value 1"],
      "storytelling": "Brand story"
    }
  },
  "offering_positioning": {
    "products_services": {
      "product_range": ["Product 1"],
      "price_levels": "entry/premium/luxury",
      "differentiators": ["Differentiator 1"],
      "business_model": "subscription/one-time"
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
      "platforms_used": ["instagram"],
      "posting_frequency": {"instagram": "2-3/day"},
      "engagement_metrics": {
        "instagram": {
          "likes_avg": 500,
          "comments_avg": 50,
          "engagement_rate": 3.2
        }
      },
      "content_types": ["photos"],
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
    "market_position": "leader/challenger",
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

  const userPrompt = `Analyze this competitor:\n\n${context}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    logStep('Lovable AI analysis complete');

    const analysis = JSON.parse(content);

    return {
      ...analysis,
      tokens_used: data.usage?.total_tokens || 0,
      analysis_cost: (data.usage?.total_tokens || 0) * 0.000001,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('Error in Lovable AI analysis', { error: errorMessage });
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep('Starting competitor analysis with Apify');

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
    const { competitor_id, name, instagram_url, facebook_url, linkedin_url, website_url, twitter_url, tiktok_url } = body;

    if (!competitor_id || !name) {
      return new Response(
        JSON.stringify({ success: false, error: 'competitor_id and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!instagram_url && !facebook_url && !linkedin_url && !website_url && !twitter_url && !tiktok_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API keys from Supabase secrets
    const apifyToken = Deno.env.get('APIFY_TOKEN');
    const twitterBearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');

    // Scrape all platforms (in parallel)
    const scrapedData: any = {};

    const scrapePromises = [];

    // Instagram - Priority #1 (requires Apify)
    if (instagram_url && apifyToken) {
      scrapePromises.push(
        scrapeInstagram(instagram_url, apifyToken).then(data => { scrapedData.instagram = data; })
      );
    }

    // Twitter/X (try API first, fallback to Apify)
    if (twitter_url && apifyToken) {
      scrapePromises.push(
        scrapeTwitter(twitter_url, apifyToken, twitterBearerToken).then(data => { scrapedData.twitter = data; })
      );
    }

    // Facebook (requires Apify)
    if (facebook_url && apifyToken) {
      scrapePromises.push(
        scrapeFacebook(facebook_url, apifyToken).then(data => { scrapedData.facebook = data; })
      );
    }

    // TikTok (requires Apify)
    if (tiktok_url && apifyToken) {
      scrapePromises.push(
        scrapeTikTok(tiktok_url, apifyToken).then(data => { scrapedData.tiktok = data; })
      );
    }

    // Website - Use Jina.ai (free, no token needed)
    if (website_url) {
      scrapePromises.push(
        scrapeWebsite(website_url).then(data => { scrapedData.website = data; })
      );
    }

    await Promise.all(scrapePromises);
    logStep('All scraping complete');

    // Get Lovable API key
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze with Lovable AI
    const analysis = await analyzeWithLovableAI(name, scrapedData, lovableApiKey);

    // Save to Supabase - competitor_analysis table with new extended columns
    const { data: savedAnalysis, error: analysisError } = await supabaseClient
      .from('competitor_analysis')
      .insert({
        competitor_id,
        // New JSONB columns
        context_objectives: analysis.context_objectives,
        brand_identity: analysis.brand_identity,
        offering_positioning: analysis.offering_positioning,
        digital_presence: analysis.digital_presence,
        swot: analysis.swot,
        competitive_analysis: analysis.competitive_analysis,
        insights_recommendations: analysis.insights_recommendations,
        raw_data: scrapedData,
        metadata: {
          tokens_used: analysis.tokens_used,
          analysis_cost: analysis.analysis_cost,
          data_sources: Object.keys(scrapedData).filter(k => scrapedData[k] && !scrapedData[k].error),
          confidence_score: 85
        },
        // Keep old columns for backward compatibility
        positioning: analysis.offering_positioning?.positioning?.segment || '',
        content_strategy: JSON.stringify(analysis.digital_presence?.social_media || {}),
        tone: analysis.brand_identity?.tone_and_messages?.communication_tone || '',
        target_audience: analysis.context_objectives?.target_audience || '',
        strengths: analysis.swot?.strengths || [],
        weaknesses: analysis.swot?.weaknesses || [],
        opportunities_for_us: analysis.swot?.opportunities || [],
        social_media_presence: JSON.stringify(analysis.digital_presence?.social_media || {}),
        estimated_budget: 'medium',
        key_differentiators: analysis.offering_positioning?.products_services?.differentiators || [],
        recommendations: JSON.stringify(analysis.insights_recommendations || {}),
        summary: analysis.insights_recommendations?.key_insights?.join('. ') || '',
        tokens_used: analysis.tokens_used,
        analysis_cost: analysis.analysis_cost,
      })
      .select()
      .single();

    if (analysisError) {
      logStep('Error saving analysis', { error: analysisError });
      throw analysisError;
    }

    // Save metrics to history
    const { error: metricsError } = await supabaseClient
      .from('competitor_metrics_history')
      .insert({
        competitor_id,
        instagram_followers: scrapedData.instagram?.followers || null,
        instagram_following: scrapedData.instagram?.following || null,
        instagram_posts_count: scrapedData.instagram?.posts_count || null,
        facebook_likes: scrapedData.facebook?.likes || null,
        linkedin_followers: scrapedData.linkedin?.followers || null,
        avg_likes: scrapedData.instagram?.avg_likes || null,
        avg_comments: scrapedData.instagram?.avg_comments || null,
        avg_engagement_rate: scrapedData.instagram?.engagement_rate || null,
      });

    if (metricsError) {
      logStep('Error saving metrics history', { error: metricsError });
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
