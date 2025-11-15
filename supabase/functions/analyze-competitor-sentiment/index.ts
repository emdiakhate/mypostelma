/**
 * Edge Function: analyze-competitor-sentiment
 *
 * Scrapes competitor posts with comments and performs sentiment analysis.
 *
 * Configuration: 10 posts × 50 comments = 500 comments
 * Cost estimate: ~€0.08 per analysis
 * Time: 2-3 minutes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const CONFIG = {
  posts_limit: 10, // 10 derniers posts (user specified)
  comments_per_post: 50, // Top 50 commentaires par post
  min_comment_length: 10, // Ignorer les commentaires trop courts
  include_replies: true, // Inclure les réponses du concurrent
  platforms: ['instagram', 'facebook', 'twitter'],
};

interface Comment {
  author_username: string;
  text: string;
  likes: number;
  posted_at: string;
  is_response_from_brand?: boolean;
}

interface Post {
  platform: string;
  post_url: string;
  caption: string;
  likes: number;
  comments_count: number;
  posted_at: string;
  comments: Comment[];
}

interface SentimentResult {
  sentiment_score: number; // -1 to 1
  sentiment_label: 'positive' | 'neutral' | 'negative';
  explanation: string;
  keywords: string[];
}

/**
 * Scrape Instagram posts with comments using Apify
 */
async function scrapeInstagramPostsApify(
  username: string,
  apifyToken: string
): Promise<Post[]> {
  console.log(`[Instagram] Scraping posts for @${username}...`);

  try {
    // Utiliser l'actor Instagram Scraper
    const actorUrl = 'https://api.apify.com/v2/acts/apify~instagram-scraper/runs';

    const requestBody = {
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: 'posts',
      resultsLimit: CONFIG.posts_limit,
      searchLimit: 1,
      // Pour chaque post on va récupérer les commentaires séparément
    };

    console.log('[Instagram] Apify request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(actorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apifyToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Apify Instagram scraper failed: ${response.status}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;
    console.log(`[Instagram] Run started: ${runId}`);

    // Wait for run to complete
    let finished = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (!finished && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}`,
        {
          headers: { Authorization: `Bearer ${apifyToken}` },
        }
      );

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      console.log(`[Instagram] Run status: ${status}`);

      if (status === 'SUCCEEDED') {
        finished = true;
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Apify run ${status}`);
      }

      attempts++;
    }

    if (!finished) {
      throw new Error('Apify run timed out');
    }

    // Get results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
      {
        headers: { Authorization: `Bearer ${apifyToken}` },
      }
    );

    const results = await resultsResponse.json();
    console.log(`[Instagram] Raw results count: ${results.length}`);
    
    if (results.length > 0) {
      console.log(`[Instagram] First item structure:`, JSON.stringify(results[0], null, 2).substring(0, 500));
    }

    // Transform to our Post format
    const posts: Post[] = results
      .slice(0, CONFIG.posts_limit)
      .map((item: any, idx: number) => {
        console.log(`[Instagram] Processing post ${idx + 1}/${results.length}`);
        
        const post: Post = {
          platform: 'instagram',
          post_url: item.url || `https://www.instagram.com/p/${item.shortCode}/`,
          caption: item.caption || '',
          likes: item.likesCount || 0,
          comments_count: item.commentsCount || 0,
          posted_at: item.timestamp || new Date().toISOString(),
          comments: (item.latestComments || [])
            .filter((c: any) => {
              const hasText = c.text && c.text.length >= CONFIG.min_comment_length;
              if (!hasText) {
                console.log(`[Instagram] Skipping short comment: ${c.text?.substring(0, 30)}...`);
              }
              return hasText;
            })
            .slice(0, CONFIG.comments_per_post)
            .map((c: any) => ({
              author_username: c.ownerUsername || 'unknown',
              text: c.text,
              likes: parseInt(String(c.likesCount || 0)),
              posted_at: c.timestamp || item.timestamp,
              is_response_from_brand: c.ownerUsername === username,
            })),
        };

        console.log(`[Instagram] Post ${idx + 1}: ${post.comments.length} comments extracted`);
        return post;
      });

    console.log(`[Instagram] Extracted ${posts.length} posts with comments`);
    const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0);
    console.log(`[Instagram] Total comments: ${totalComments}`);

    return posts;
  } catch (error) {
    console.error('[Instagram] Scraping error:', error);
    return [];
  }
}

/**
 * Scrape Facebook posts with comments using Apify
 */
async function scrapeFacebookPostsApify(
  pageUrl: string,
  apifyToken: string
): Promise<Post[]> {
  console.log(`[Facebook] Scraping posts for ${pageUrl}...`);

  try {
    // Utiliser l'actor facebook-comments-scraper pour récupérer les commentaires
    const actorUrl = 'https://api.apify.com/v2/acts/apify~facebook-comments-scraper/runs';
    
    const requestBody = {
      startUrls: [{ url: pageUrl }],
      maxPosts: CONFIG.posts_limit,
      maxComments: CONFIG.comments_per_post,
      commentsMode: 'RANKED_THREADED',
    };
    
    console.log('[Facebook] Apify request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(actorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apifyToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Apify Facebook scraper failed: ${response.status}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;

    // Wait for completion (same pattern as Instagram)
    let finished = false;
    let attempts = 0;
    const maxAttempts = 60;

    while (!finished && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/apify~facebook-posts-scraper/runs/${runId}`,
        { headers: { Authorization: `Bearer ${apifyToken}` } }
      );

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      if (status === 'SUCCEEDED') {
        finished = true;
      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        throw new Error(`Apify run ${status}`);
      }

      attempts++;
    }

    if (!finished) throw new Error('Apify run timed out');

    // Get results
    console.log(`[Facebook] Fetching results from run ${runId}...`);
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
      { headers: { Authorization: `Bearer ${apifyToken}` } }
    );

    console.log(`[Facebook] Results response status:`, resultsResponse.status);
    const resultsData = await resultsResponse.json();
    console.log(`[Facebook] Raw response from Apify:`, JSON.stringify(resultsData, null, 2));
    
    // Apify can return results directly as an array or wrapped in an object
    const results = Array.isArray(resultsData) ? resultsData : (resultsData.data || []);
    
    console.log(`[Facebook] Parsed results count: ${results.length}`);
    console.log(`[Facebook] Results type: ${typeof results}, isArray: ${Array.isArray(results)}`);

    if (!Array.isArray(results) || results.length === 0) {
      console.log('[Facebook] No posts found or invalid response format');
      console.log('[Facebook] ResultsData structure:', Object.keys(resultsData || {}));
      return [];
    }
    
    console.log('[Facebook] Sample post data:', JSON.stringify(results[0], null, 2));
    console.log('[Facebook] Sample comment data:', JSON.stringify(results[0], null, 2));
    
    // facebook-comments-scraper retourne des commentaires individuels
    // Il faut les regrouper par post (facebookId)
    const postMap = new Map<string, Post>();
    
    console.log(`[Facebook] 🔍 Processing ${results.length} comment items...`);
    
    let processedComments = 0;
    let skippedComments = 0;
    
    results.forEach((item: any, index: number) => {
      const postId = item.facebookId || item.postId || 'unknown';
      
      // Log détaillé du premier commentaire pour debug
      if (index === 0) {
        console.log(`[Facebook] 📝 First comment structure:`, {
          facebookId: item.facebookId,
          postTitle: item.postTitle,
          text: item.text?.substring(0, 100),
          profileName: item.profileName,
          likesCount: item.likesCount,
          date: item.date,
          threadingDepth: item.threadingDepth,
          inputUrl: item.inputUrl,
          facebookUrl: item.facebookUrl,
        });
      }
      
      if (!postMap.has(postId)) {
        // Créer un nouveau post
        const newPost = {
          platform: 'facebook',
          post_url: item.inputUrl || item.facebookUrl || item.commentUrl || '',
          caption: item.postTitle || '',
          likes: 0, // Les likes du post ne sont pas fournis par le comment scraper
          comments_count: 0,
          posted_at: item.date || new Date().toISOString(),
          comments: [],
        };
        postMap.set(postId, newPost);
        console.log(`[Facebook] ➕ Created new post with ID: ${postId}`);
      }
      
      const post = postMap.get(postId)!;
      
      // Ajouter TOUS les commentaires de niveau 0 (top-level), même courts
      if (item.threadingDepth === 0 && item.text) {
        const commentText = item.text.trim();
        if (commentText.length >= CONFIG.min_comment_length) {
          post.comments.push({
            author_username: item.profileName || 'Unknown',
            text: commentText,
            likes: parseInt(item.likesCount || '0', 10),
            posted_at: item.date || new Date().toISOString(),
          });
          post.comments_count = post.comments.length;
          processedComments++;
        } else {
          skippedComments++;
          if (skippedComments <= 3) {
            console.log(`[Facebook] ⏭️ Skipped short comment (${commentText.length} chars): "${commentText.substring(0, 50)}..."`);
          }
        }
      }
    });
    
    const posts: Post[] = Array.from(postMap.values()).slice(0, CONFIG.posts_limit);
    
    console.log(`[Facebook] ✅ Transformation complete:`);
    console.log(`[Facebook]   - Total posts created: ${posts.length}`);
    console.log(`[Facebook]   - Processed comments: ${processedComments}`);
    console.log(`[Facebook]   - Skipped comments (too short): ${skippedComments}`);
    
    posts.forEach((post, index) => {
      console.log(`[Facebook]   - Post ${index + 1}: ${post.comments_count} comments, URL: ${post.post_url}`);
    });
    
    if (posts.length > 0) {
      console.log('[Facebook] 📊 Sample transformed post:', JSON.stringify(posts[0], null, 2));
    }

    return posts;
  } catch (error) {
    console.error('[Facebook] Scraping error:', error);
    console.error('[Facebook] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return [];
  }
}

/**
 * Scrape TikTok posts and comments using Apify (apidojo/tiktok-comments-scraper)
 */
async function scrapeTikTokPostsApify(
  tiktokUrl: string,
  apifyToken: string
): Promise<Post[]> {
  try {
    console.log(`[TikTok] Starting scrape for URL: ${tiktokUrl} using Apify apidojo/tiktok-comments-scraper...`);

    // Construire les startUrls - peut être un profil ou des vidéos
    const startUrls = [{ url: tiktokUrl }];

    const requestBody = {
      startUrls,
      includeReplies: false,
      maxItems: CONFIG.posts_limit * CONFIG.comments_per_post,
    };

    console.log('[TikTok] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      'https://api.apify.com/v2/acts/apidojo~tiktok-comments-scraper/runs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apifyToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('[TikTok] Apify response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TikTok] Apify error response:', errorText);
      throw new Error(`Apify TikTok scraper failed: ${response.status}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;
    console.log(`[TikTok] Run started with ID: ${runId}`);

    // Wait for completion
    let finished = false;
    let attempts = 0;
    const maxAttempts = 60;

    while (!finished && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/apidojo~tiktok-comments-scraper/runs/${runId}`,
        { headers: { Authorization: `Bearer ${apifyToken}` } }
      );

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      console.log(`[TikTok] Run status (attempt ${attempts + 1}): ${status}`);

      if (status === 'SUCCEEDED') {
        finished = true;
      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        throw new Error(`Apify run ${status}`);
      }

      attempts++;
    }

    if (!finished) throw new Error('Apify run timed out');

    // Get results
    console.log(`[TikTok] Fetching results from run ${runId}...`);
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
      { headers: { Authorization: `Bearer ${apifyToken}` } }
    );

    console.log('[TikTok] Results response status:', resultsResponse.status);

    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
    }

    const results = await resultsResponse.json();
    console.log('[TikTok] Parsed results count:', results?.length || 0);

    if (!results || results.length === 0) {
      console.log('[TikTok] ⚠️ No data returned from Apify');
      return [];
    }

    console.log('[TikTok] 🔍 Processing comment items...');
    if (results.length > 0) {
      console.log('[TikTok] Sample comment data:', JSON.stringify(results[0], null, 2));
    }

    // Regrouper les commentaires par post (awemeId)
    const postMap = new Map<string, Post>();
    let processedComments = 0;
    let skippedComments = 0;

    results.forEach((item: any) => {
      const postId = item.awemeId || item.parentId || 'unknown';
      
      // Créer le post s'il n'existe pas encore
      if (!postMap.has(postId)) {
        const newPost: Post = {
          platform: 'tiktok',
          post_url: item.post?.url || `https://www.tiktok.com/video/${postId}`,
          caption: '',
          likes: 0,
          comments_count: 0,
          posted_at: item.createdAt || new Date().toISOString(),
          comments: [],
        };
        postMap.set(postId, newPost);
        console.log(`[TikTok] ➕ Created new post with ID: ${postId}`);
      }
      
      const post = postMap.get(postId)!;
      
      // Ajouter le commentaire
      if (item.text && item.text.trim()) {
        const commentText = item.text.trim();
        if (commentText.length >= CONFIG.min_comment_length) {
          post.comments.push({
            author_username: item.user?.username || 'unknown',
            text: commentText,
            likes: item.likeCount || 0,
            posted_at: item.createdAt || new Date().toISOString(),
          });
          post.comments_count = post.comments.length;
          processedComments++;
        } else {
          skippedComments++;
          if (skippedComments <= 3) {
            console.log(`[TikTok] ⏭️ Skipped short comment (${commentText.length} chars): "${commentText.substring(0, 50)}..."`);
          }
        }
      }
    });
    
    const posts: Post[] = Array.from(postMap.values())
      .filter(p => p.comments.length >= 10) // Au moins 10 commentaires par post
      .slice(0, CONFIG.posts_limit);
    
    console.log(`[TikTok] ✅ Successfully processed ${posts.length} posts with ${processedComments} comments (${skippedComments} skipped)`);
    posts.forEach((post, i) => {
      console.log(`[TikTok]   Post ${i + 1}: ${post.comments_count} comments, ${post.likes} likes`);
    });

    return posts;
  } catch (error) {
    console.error('[TikTok] Scraping error:', error);
    return [];
  }
}

/**
 * Scrape Twitter posts (tweets) with replies using Apify
 */
async function scrapeTwitterPostsApify(
  username: string,
  apifyToken: string
): Promise<Post[]> {
  console.log(`[Twitter] Scraping posts for @${username}...`);

  try {
    const actorUrl = 'https://api.apify.com/v2/acts/apify~twitter-scraper/runs';

    const response = await fetch(actorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apifyToken}`,
      },
      body: JSON.stringify({
        handles: [username],
        tweetsDesired: CONFIG.posts_limit,
        includeReplies: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Apify Twitter scraper failed: ${response.status}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;

    // Wait for completion
    let finished = false;
    let attempts = 0;
    const maxAttempts = 60;

    while (!finished && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/apify~twitter-scraper/runs/${runId}`,
        { headers: { Authorization: `Bearer ${apifyToken}` } }
      );

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      if (status === 'SUCCEEDED') {
        finished = true;
      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        throw new Error(`Apify run ${status}`);
      }

      attempts++;
    }

    if (!finished) throw new Error('Apify run timed out');

    // Get results
    console.log(`[Twitter] Fetching results from run ${runId}...`);
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
      { headers: { Authorization: `Bearer ${apifyToken}` } }
    );

    const results = await resultsResponse.json();
    console.log(`[Twitter] Scraped ${results.length} tweets`);

    // For Twitter, we need to fetch replies separately
    const posts: Post[] = results.slice(0, CONFIG.posts_limit).map((item: any) => ({
      platform: 'twitter',
      post_url: item.url || '',
      caption: item.text || '',
      likes: item.likes || 0,
      comments_count: item.replies || 0,
      posted_at: item.createdAt || new Date().toISOString(),
      comments: (item.replyTweets || [])
        .filter((c: any) => c.text && c.text.length >= CONFIG.min_comment_length)
        .slice(0, CONFIG.comments_per_post)
        .map((c: any) => ({
          author_username: c.author?.userName || 'unknown',
          text: c.text,
          likes: c.likes || 0,
          posted_at: c.createdAt || item.createdAt,
        })),
    }));

    return posts;
  } catch (error) {
    console.error('[Twitter] Scraping error:', error);
    return [];
  }
}

/**
 * Analyze sentiment of comments in batch using OpenAI
 */
async function analyzeSentimentBatch(
  comments: Comment[],
  openaiApiKey: string
): Promise<SentimentResult[]> {
  if (comments.length === 0) return [];

  console.log(`[OpenAI] Analyzing sentiment for ${comments.length} comments...`);

  try {
    const prompt = `Tu es un expert en analyse de sentiment. Analyse les commentaires suivants et retourne un JSON avec l'analyse de chaque commentaire.

Pour chaque commentaire, détermine:
1. sentiment_score: Score de -1 (très négatif) à 1 (très positif)
2. sentiment_label: "positive", "neutral", ou "negative"
3. explanation: Brève explication (1 phrase)
4. keywords: 2-3 mots-clés principaux du commentaire

Commentaires à analyser:
${comments.map((c, i) => `[${i}] ${c.text}`).join('\n\n')}

Retourne un JSON avec ce format exact:
{
  "results": [
    {
      "index": 0,
      "sentiment_score": 0.8,
      "sentiment_label": "positive",
      "explanation": "Exprime de l'enthousiasme et de la satisfaction",
      "keywords": ["super", "content", "qualité"]
    },
    ...
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en analyse de sentiment. Tu réponds toujours en JSON valide.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    console.log(`[OpenAI] Successfully analyzed ${parsed.results.length} comments`);

    return parsed.results.map((r: any) => ({
      sentiment_score: r.sentiment_score || 0,
      sentiment_label: r.sentiment_label || 'neutral',
      explanation: r.explanation || '',
      keywords: r.keywords || [],
    }));
  } catch (error) {
    console.error('[OpenAI] Sentiment analysis error:', error);
    // Return neutral sentiment for all comments on error
    return comments.map(() => ({
      sentiment_score: 0,
      sentiment_label: 'neutral' as const,
      explanation: 'Error during analysis',
      keywords: [],
    }));
  }
}

/**
 * Calculate global sentiment statistics
 */
function calculateStatistics(posts: any[], comments: any[]) {
  const totalPosts = posts.length;
  const totalComments = comments.length;

  if (totalComments === 0) {
    return {
      total_posts: totalPosts,
      total_comments: 0,
      avg_sentiment_score: 0,
      positive_percentage: 0,
      neutral_percentage: 0,
      negative_percentage: 0,
      top_keywords: {},
      response_rate: 0,
      avg_engagement_rate: 0,
    };
  }

  const avgSentiment = comments.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / totalComments;

  const positive = comments.filter(c => c.sentiment_label === 'positive').length;
  const neutral = comments.filter(c => c.sentiment_label === 'neutral').length;
  const negative = comments.filter(c => c.sentiment_label === 'negative').length;

  const positivePercentage = (positive / totalComments) * 100;
  const neutralPercentage = (neutral / totalComments) * 100;
  const negativePercentage = (negative / totalComments) * 100;

  // Count keywords
  const keywordCounts: Record<string, number> = {};
  comments.forEach(c => {
    (c.keywords || []).forEach((kw: string) => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });
  });

  // Top 10 keywords
  const topKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

  // Response rate (comments from brand)
  const brandResponses = comments.filter(c => c.is_response_from_brand).length;
  const responseRate = (brandResponses / totalComments) * 100;

  // Average engagement rate
  const avgEngagementRate = posts.reduce((sum, p) => {
    const followers = 1000; // We don't have follower count here, would need to get from competitor table
    const engagement = ((p.likes + p.comments_count) / followers) * 100;
    return sum + engagement;
  }, 0) / totalPosts;

  return {
    total_posts: totalPosts,
    total_comments: totalComments,
    avg_sentiment_score: avgSentiment,
    positive_percentage: positivePercentage,
    neutral_percentage: neutralPercentage,
    negative_percentage: negativePercentage,
    top_keywords: topKeywords,
    response_rate: responseRate,
    avg_engagement_rate: avgEngagementRate,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apifyToken = Deno.env.get('APIFY_TOKEN');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apifyToken) {
      throw new Error('APIFY_TOKEN not configured');
    }

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { competitor_id, analysis_id } = await req.json();

    if (!competitor_id || !analysis_id) {
      throw new Error('Missing competitor_id or analysis_id');
    }

    console.log(`[Sentiment Analysis] Starting for competitor ${competitor_id}...`);

    // Get competitor info
    const { data: competitor, error: competitorError } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitor_id)
      .single();

    if (competitorError || !competitor) {
      throw new Error('Competitor not found');
    }

    // Check if competitor has any social media URLs
    const hasUrls = competitor.instagram_url || competitor.facebook_url || competitor.twitter_url || competitor.tiktok_url;
    if (!hasUrls) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ce concurrent n\'a aucun compte de réseau social configuré. Veuillez ajouter au moins une URL (Instagram, Facebook, Twitter ou TikTok) pour pouvoir analyser le sentiment.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Scrape posts with comments from all platforms
    const allPosts: Post[] = [];
    const platformResults = {
      instagram: { attempted: false, posts: 0, error: null as string | null },
      facebook: { attempted: false, posts: 0, error: null as string | null },
      twitter: { attempted: false, posts: 0, error: null as string | null },
      tiktok: { attempted: false, posts: 0, error: null as string | null },
    };

    // Instagram
    if (competitor.instagram_url) {
      platformResults.instagram.attempted = true;
      const username = competitor.instagram_url.split('/').filter(Boolean).pop();
      if (username) {
        try {
          const instagramPosts = await scrapeInstagramPostsApify(username, apifyToken);
          platformResults.instagram.posts = instagramPosts.length;
          allPosts.push(...instagramPosts);
        } catch (error) {
          platformResults.instagram.error = error instanceof Error ? error.message : 'Erreur inconnue';
          console.error(`[Instagram] Failed to scrape posts for @${username}:`, error);
        }
      }
    }

    // Facebook
    if (competitor.facebook_url) {
      platformResults.facebook.attempted = true;
      try {
        const facebookPosts = await scrapeFacebookPostsApify(competitor.facebook_url, apifyToken);
        platformResults.facebook.posts = facebookPosts.length;
        allPosts.push(...facebookPosts);
      } catch (error) {
        platformResults.facebook.error = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(`[Facebook] Failed to scrape posts:`, error);
      }
    }

    // Twitter
    if (competitor.twitter_url) {
      platformResults.twitter.attempted = true;
      const username = competitor.twitter_url.split('/').filter(Boolean).pop();
      if (username) {
        try {
          const twitterPosts = await scrapeTwitterPostsApify(username, apifyToken);
          platformResults.twitter.posts = twitterPosts.length;
          allPosts.push(...twitterPosts);
        } catch (error) {
          platformResults.twitter.error = error instanceof Error ? error.message : 'Erreur inconnue';
          console.error(`[Twitter] Failed to scrape posts for @${username}:`, error);
        }
      }
    }

    // TikTok
    if (competitor.tiktok_url) {
      platformResults.tiktok.attempted = true;
      try {
        const tiktokPosts = await scrapeTikTokPostsApify(competitor.tiktok_url, apifyToken);
        platformResults.tiktok.posts = tiktokPosts.length;
        allPosts.push(...tiktokPosts);
      } catch (error) {
        platformResults.tiktok.error = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(`[TikTok] Failed to scrape posts for ${competitor.tiktok_url}:`, error);
      }
    }

    console.log(`[Scraping] Collected ${allPosts.length} posts total`);
    console.log(`[Scraping] Platform results:`, JSON.stringify(platformResults, null, 2));

    if (allPosts.length === 0) {
      // Provide detailed error message about which platforms failed
      const platformErrors: string[] = [];
      
      if (platformResults.instagram.attempted && platformResults.instagram.posts === 0) {
        platformErrors.push(`❌ Instagram: ${platformResults.instagram.error || 'Aucun post trouvé ou compte privé'}`);
      }
      if (platformResults.facebook.attempted && platformResults.facebook.posts === 0) {
        platformErrors.push(`❌ Facebook: ${platformResults.facebook.error || 'Aucun post trouvé - vérifiez que l\'URL est complète et que la page est publique'}`);
      }
      if (platformResults.twitter.attempted && platformResults.twitter.posts === 0) {
        platformErrors.push(`❌ Twitter: ${platformResults.twitter.error || 'Aucun post trouvé ou compte privé'}`);
      }
      if (platformResults.tiktok.attempted && platformResults.tiktok.posts === 0) {
        platformErrors.push(`❌ TikTok: ${platformResults.tiktok.error || 'Aucun post trouvé ou compte privé'}`);
      }

      const errorDetails = platformErrors.length > 0 
        ? `\n\nDétails:\n${platformErrors.join('\n')}` 
        : '';

      const suggestions = `\n\n💡 Suggestions:\n` +
        `- Vérifiez que les URLs sont correctes et complètes\n` +
        `- Assurez-vous que les comptes sont publics\n` +
        `- Pour Facebook: utilisez l'URL complète (ex: facebook.com/nomdelepage)\n` +
        `- Essayez d'ajouter d'autres réseaux sociaux (Instagram recommandé)`;

      const errorMessage = `Aucun post n'a pu être récupéré pour ce concurrent.${errorDetails}${suggestions}`;
      
      console.error('[Error] No posts scraped:', errorMessage);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert posts and analyze comments
    const insertedPostIds: string[] = [];
    const allComments: any[] = [];

    for (const post of allPosts) {
      // Calculate engagement rate
      const engagementRate = post.likes + post.comments_count > 0
        ? ((post.likes + post.comments_count) / 1000) * 100 // Simplified, would need follower count
        : 0;

      // Analyze post sentiment (from caption)
      let postSentiment: SentimentResult = { 
        sentiment_score: 0, 
        sentiment_label: 'neutral',
        explanation: '',
        keywords: []
      };
      if (post.caption && post.caption.length >= CONFIG.min_comment_length) {
        const captionSentiments = await analyzeSentimentBatch(
          [{ author_username: '', text: post.caption, likes: 0, posted_at: post.posted_at }],
          openaiApiKey
        );
        if (captionSentiments.length > 0) {
          postSentiment = captionSentiments[0];
        }
      }

      // Try to insert post or get existing one
      let postId: string | null = null;
      const { data: insertedPost, error: postError } = await supabase
        .from('competitor_posts')
        .insert({
          competitor_id,
          analysis_id,
          platform: post.platform,
          post_url: post.post_url,
          caption: post.caption,
          likes: post.likes,
          comments_count: post.comments_count,
          engagement_rate: engagementRate,
          posted_at: post.posted_at,
          sentiment_score: postSentiment.sentiment_score,
          sentiment_label: postSentiment.sentiment_label,
          raw_data: post,
        })
        .select()
        .single();

      if (postError) {
        // If post already exists (unique constraint violation), get its ID
        if (postError.code === '23505') {
          console.log('[DB] Post already exists, fetching existing post:', post.post_url);
          const { data: existingPost } = await supabase
            .from('competitor_posts')
            .select('id')
            .eq('post_url', post.post_url)
            .single();
          
          if (existingPost) {
            postId = existingPost.id;
            console.log('[DB] Using existing post ID:', postId);
            
            // Delete existing comments for this post to avoid duplicates
            await supabase
              .from('post_comments')
              .delete()
              .eq('post_id', postId);
          } else {
            console.error('[DB] Could not find existing post');
            continue;
          }
        } else {
          console.error('[DB] ❌ Error inserting post:', postError);
          console.error('[DB] Post data that failed:', {
            platform: post.platform,
            url: post.post_url?.substring(0, 60),
            caption: post.caption?.substring(0, 60),
          });
          continue;
        }
      } else {
        postId = insertedPost.id;
        console.log('[DB] ✅ Inserted new post:', postId);
      }

      if (postId) {
        insertedPostIds.push(postId);
        console.log(`[DB] 📝 Processing ${post.comments.length} comments for post ${postId}...`);

        // Analyze comments in batches of 20 (to avoid token limits)
        if (post.comments.length > 0) {
          const batchSize = 20;
          for (let i = 0; i < post.comments.length; i += batchSize) {
            const batch = post.comments.slice(i, i + batchSize);
            const sentiments = await analyzeSentimentBatch(batch, openaiApiKey);

            // Insert comments with sentiment
            for (let j = 0; j < batch.length; j++) {
              const comment = batch[j];
              const sentiment = sentiments[j] || {
                sentiment_score: 0,
                sentiment_label: 'neutral',
                explanation: '',
                keywords: [],
              };

              const { data: insertedComment, error: commentError } = await supabase
                .from('post_comments')
                .insert({
                  post_id: postId,
                  comment_text: comment.text,
                  author_username: comment.author_username,
                  comment_likes: comment.likes,
                  posted_at: comment.posted_at,
                  sentiment_score: sentiment.sentiment_score,
                  sentiment_label: sentiment.sentiment_label,
                  sentiment_explanation: sentiment.explanation,
                  keywords: sentiment.keywords,
                })
                .select()
                .single();

              if (!commentError && insertedComment) {
                allComments.push(insertedComment);
              } else if (commentError) {
                console.error('[DB] Error inserting comment:', commentError);
              }
            }
          }
        }
      }
    }

    console.log(`[DB] Inserted ${insertedPostIds.length} posts and ${allComments.length} comments`);

    // Calculate and insert global statistics
    const statistics = calculateStatistics(allPosts, allComments);

    const { error: statsError } = await supabase
      .from('sentiment_statistics')
      .insert({
        competitor_id,
        analysis_id,
        ...statistics,
      });

    if (statsError) {
      console.error('[DB] Error inserting statistics:', statsError);
    }

    console.log('[Sentiment Analysis] Completed successfully! ✅');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sentiment analysis completed',
        statistics: {
          total_posts: statistics.total_posts,
          total_comments: statistics.total_comments,
          avg_sentiment_score: statistics.avg_sentiment_score,
          positive_percentage: statistics.positive_percentage,
          neutral_percentage: statistics.neutral_percentage,
          negative_percentage: statistics.negative_percentage,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Error]', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
