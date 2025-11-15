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

// Analyze with OpenAI (updated prompt for richer data)
async function analyzeWithOpenAI(competitorName: string, scrapedData: any, openaiKey: string): Promise<any> {
  logStep('Starting OpenAI analysis with enriched data');

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
  } else {
    context += '\nINSTAGRAM: Non disponible\n';
  }

  if (scrapedData.twitter && !scrapedData.twitter.error) {
    const tw = scrapedData.twitter;
    context += `\nTWITTER (@${tw.username}):\n`;
    context += `- Followers: ${tw.followers?.toLocaleString() || 'N/A'}\n`;
    context += `- Tweets: ${tw.tweets || 'N/A'}\n`;
    context += `- Bio: ${tw.description || 'N/A'}\n`;
    if (tw.recent_tweets?.length > 0) {
      context += `- Recent Tweets: ${tw.recent_tweets.slice(0, 3).map((t: any) =>
        `"${t.text?.substring(0, 100)}" (${t.likes} likes, ${t.retweets} RT)`
      ).join('; ')}\n`;
    }
  } else {
    context += '\nTWITTER: Non disponible\n';
  }

  if (scrapedData.facebook && !scrapedData.facebook.error) {
    const fb = scrapedData.facebook;
    context += `\nFACEBOOK (${fb.name}):\n`;
    context += `- Likes: ${fb.likes?.toLocaleString() || 'N/A'}\n`;
    context += `- Followers: ${fb.followers?.toLocaleString() || 'N/A'}\n`;
    context += `- About: ${fb.about || 'N/A'}\n`;
  } else {
    context += '\nFACEBOOK: Non disponible\n';
  }

  if (scrapedData.tiktok && !scrapedData.tiktok.error) {
    const tt = scrapedData.tiktok;
    context += `\nTIKTOK (@${tt.username}):\n`;
    context += `- Followers: ${tt.followers?.toLocaleString() || 'N/A'}\n`;
    context += `- Hearts: ${tt.hearts?.toLocaleString() || 'N/A'}\n`;
    context += `- Videos: ${tt.videos || 'N/A'}\n`;
  } else {
    context += '\nTIKTOK: Non disponible\n';
  }

  if (scrapedData.website) {
    context += `\nWEBSITE:\n${scrapedData.website.substring(0, 3000)}\n`;
  } else {
    context += '\nWEBSITE: Non disponible\n';
  }

  const prompt = `Tu es un expert en analyse concurrentielle et stratégie digitale. Analyse ces données d'un concurrent et fournis un rapport structuré.

${context}

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
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const apifyToken = Deno.env.get('APIFY_TOKEN');
    const twitterBearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        instagram_data: scrapedData.instagram || null,
        facebook_data: scrapedData.facebook || null,
        linkedin_data: scrapedData.linkedin || null,
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
