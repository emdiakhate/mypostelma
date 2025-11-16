/**
 * Analyze User Sentiment Edge Function
 *
 * Analyzes sentiment of comments on user's posts from the past week
 * - Scrapes comments from Instagram & Facebook
 * - Analyzes sentiment with OpenAI
 * - Updates post statistics
 * - Stores weekly sentiment statistics
 *
 * Triggered: Weekly cron job (Mondays at 6am) or manual trigger
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const CONFIG = {
  MAX_POSTS_PER_RUN: 100, // All posts from the week
  MAX_COMMENTS_PER_POST: 50,
  MIN_COMMENTS_FOR_ANALYSIS: 5,
  SENTIMENT_BATCH_SIZE: 10, // Analyze 10 comments per API call
  PLATFORMS: ['instagram', 'facebook'], // Only functional platforms
};

interface Post {
  id: string;
  user_id: string;
  platform: string;
  post_url: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  published_at: string;
  last_sentiment_analysis_at: string | null;
}

interface Comment {
  author_username: string;
  author_is_verified: boolean;
  comment_text: string;
  comment_url?: string;
  comment_likes: number;
  posted_at: string;
}

interface SentimentResult {
  sentiment_score: number;
  sentiment_label: 'positive' | 'neutral' | 'negative';
  sentiment_explanation: string;
  keywords: string[];
}

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { user_id, week_offset = 0 } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting sentiment analysis for user ${user_id}`);

    // Calculate week range
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - 7 - (week_offset * 7)); // Last Monday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`Analyzing posts from ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

    // Get posts from last week
    const { data: posts, error: postsError } = await supabaseClient
      .from('posts')
      .select('*')
      .eq('user_id', user_id)
      .gte('published_at', weekStart.toISOString())
      .lte('published_at', weekEnd.toISOString())
      .in('platform', CONFIG.PLATFORMS)
      .limit(CONFIG.MAX_POSTS_PER_RUN);

    if (postsError) {
      throw new Error(`Error fetching posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No posts found for this week',
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${posts.length} posts to analyze`);

    let totalComments = 0;
    let allComments: Array<Comment & { post_id: string; sentiment: SentimentResult }> = [];
    let postsAnalyzed = 0;
    let updatedPostStats: any[] = [];

    // Process each post
    for (const post of posts) {
      try {
        console.log(`Processing post ${post.id} from ${post.platform}`);

        // Scrape comments based on platform
        let comments: Comment[] = [];
        let updatedStats = null;

        if (post.platform === 'instagram' && post.post_url) {
          const result = await scrapeInstagramComments(post.post_url);
          comments = result.comments;
          updatedStats = result.stats;
        } else if (post.platform === 'facebook' && post.post_url) {
          const result = await scrapeFacebookComments(post.post_url);
          comments = result.comments;
          updatedStats = result.stats;
        }

        // Skip if not enough comments
        if (comments.length < CONFIG.MIN_COMMENTS_FOR_ANALYSIS) {
          console.log(`Skipping post ${post.id} - only ${comments.length} comments (minimum ${CONFIG.MIN_COMMENTS_FOR_ANALYSIS})`);
          continue;
        }

        // Limit comments
        const limitedComments = comments.slice(0, CONFIG.MAX_COMMENTS_PER_POST);
        totalComments += limitedComments.length;

        // Analyze sentiment in batches
        const commentsWithSentiment: Array<Comment & { sentiment: SentimentResult }> = [];

        for (let i = 0; i < limitedComments.length; i += CONFIG.SENTIMENT_BATCH_SIZE) {
          const batch = limitedComments.slice(i, i + CONFIG.SENTIMENT_BATCH_SIZE);
          const sentiments = await analyzeSentimentBatch(batch.map(c => c.comment_text));

          batch.forEach((comment, index) => {
            commentsWithSentiment.push({
              ...comment,
              sentiment: sentiments[index],
            });
          });
        }

        // Calculate post sentiment
        const postSentimentScore = commentsWithSentiment.reduce((sum, c) => sum + c.sentiment.sentiment_score, 0) / commentsWithSentiment.length;
        const postSentimentLabel = postSentimentScore > 0.2 ? 'positive' : postSentimentScore < -0.2 ? 'negative' : 'neutral';

        // Store comments in database
        const commentsToInsert = commentsWithSentiment.map(c => ({
          post_id: post.id,
          author_username: c.author_username,
          author_is_verified: c.author_is_verified,
          comment_text: c.comment_text,
          comment_url: c.comment_url,
          comment_likes: c.comment_likes,
          posted_at: c.posted_at,
          sentiment_score: c.sentiment.sentiment_score,
          sentiment_label: c.sentiment.sentiment_label,
          sentiment_explanation: c.sentiment.sentiment_explanation,
          keywords: c.sentiment.keywords,
        }));

        await supabaseClient.from('user_post_comments').insert(commentsToInsert);

        // Update post with sentiment and stats
        const updateData: any = {
          last_sentiment_analysis_at: new Date().toISOString(),
          sentiment_score: postSentimentScore,
          sentiment_label: postSentimentLabel,
          comments_sentiment_count: commentsWithSentiment.length,
        };

        if (updatedStats) {
          updateData.likes = updatedStats.likes || post.likes;
          updateData.comments = updatedStats.comments || post.comments;
          updateData.shares = updatedStats.shares || post.shares;
        }

        await supabaseClient
          .from('posts')
          .update(updateData)
          .eq('id', post.id);

        updatedPostStats.push({ post_id: post.id, ...updateData });
        postsAnalyzed++;

        // Add to global list
        commentsWithSentiment.forEach(c => {
          allComments.push({ ...c, post_id: post.id });
        });

        console.log(`Post ${post.id} analyzed: ${commentsWithSentiment.length} comments, sentiment: ${postSentimentLabel} (${postSentimentScore.toFixed(2)})`);
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        // Continue with next post
      }
    }

    // Calculate global statistics
    if (allComments.length > 0) {
      const stats = calculateStatistics(allComments, postsAnalyzed);

      // Insert or update weekly statistics
      await supabaseClient
        .from('user_sentiment_statistics')
        .upsert({
          user_id,
          week_start_date: weekStart.toISOString().split('T')[0],
          week_end_date: weekEnd.toISOString().split('T')[0],
          ...stats,
          analyzed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,week_start_date',
        });

      console.log(`Analysis complete: ${postsAnalyzed} posts, ${totalComments} comments`);

      return new Response(
        JSON.stringify({
          success: true,
          posts_analyzed: postsAnalyzed,
          total_comments: totalComments,
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
          statistics: stats,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No comments to analyze (all posts had <5 comments)',
          posts_checked: posts.length,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in analyze-user-sentiment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Scrape Instagram comments
 */
async function scrapeInstagramComments(postUrl: string): Promise<{ comments: Comment[]; stats: any }> {
  try {
    const response = await fetch(`https://api.apify.com/v2/acts/apify~instagram-comment-scraper/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify({
        directUrls: [postUrl],
        resultsLimit: CONFIG.MAX_COMMENTS_PER_POST,
      }),
    });

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.statusText}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;

    // Poll for completion
    let results = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s

      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
        {
          headers: { Authorization: `Bearer ${APIFY_TOKEN}` },
        }
      );

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        if (data.length > 0) {
          results = data;
          break;
        }
      }
    }

    if (!results || results.length === 0) {
      return { comments: [], stats: null };
    }

    const post = results[0];
    const comments: Comment[] = (post.comments || []).map((c: any) => ({
      author_username: c.ownerUsername || 'unknown',
      author_is_verified: c.ownerIsVerified || false,
      comment_text: c.text || '',
      comment_url: c.url,
      comment_likes: c.likesCount || 0,
      posted_at: c.timestamp || new Date().toISOString(),
    }));

    const stats = {
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: 0,
    };

    return { comments, stats };
  } catch (error) {
    console.error('Error scraping Instagram:', error);
    return { comments: [], stats: null };
  }
}

/**
 * Scrape Facebook comments
 */
async function scrapeFacebookComments(postUrl: string): Promise<{ comments: Comment[]; stats: any }> {
  try {
    const response = await fetch(`https://api.apify.com/v2/acts/apify/facebook-posts-scraper/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify({
        startUrls: [{ url: postUrl }],
        maxComments: CONFIG.MAX_COMMENTS_PER_POST,
      }),
    });

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.statusText}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;

    // Poll for completion
    let results = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
        {
          headers: { Authorization: `Bearer ${APIFY_TOKEN}` },
        }
      );

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        if (data.length > 0) {
          results = data;
          break;
        }
      }
    }

    if (!results || results.length === 0) {
      return { comments: [], stats: null };
    }

    const post = results[0];
    const comments: Comment[] = (post.comments || []).map((c: any) => ({
      author_username: c.authorName || 'unknown',
      author_is_verified: false,
      comment_text: c.text || '',
      comment_url: c.url,
      comment_likes: c.likes || 0,
      posted_at: c.createdTime || new Date().toISOString(),
    }));

    const stats = {
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
    };

    return { comments, stats };
  } catch (error) {
    console.error('Error scraping Facebook:', error);
    return { comments: [], stats: null };
  }
}

/**
 * Analyze sentiment of comments batch with OpenAI
 */
async function analyzeSentimentBatch(comments: string[]): Promise<SentimentResult[]> {
  const prompt = `Analyze the sentiment of these social media comments. For each comment, provide:
- sentiment_score: number between -1 (very negative) and 1 (very positive)
- sentiment_label: "positive", "neutral", or "negative"
- sentiment_explanation: brief explanation (max 100 chars)
- keywords: array of 2-3 important keywords from the comment

Comments:
${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return a JSON array with exactly ${comments.length} objects, one for each comment in order.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze social media comments and return structured JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Handle both array and object with results key
    const results = Array.isArray(parsed) ? parsed : parsed.results || [];

    return results.map((r: any) => ({
      sentiment_score: r.sentiment_score || 0,
      sentiment_label: r.sentiment_label || 'neutral',
      sentiment_explanation: r.sentiment_explanation || '',
      keywords: r.keywords || [],
    }));
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    // Return neutral sentiment as fallback
    return comments.map(() => ({
      sentiment_score: 0,
      sentiment_label: 'neutral' as const,
      sentiment_explanation: 'Analysis failed',
      keywords: [],
    }));
  }
}

/**
 * Calculate global statistics
 */
function calculateStatistics(
  comments: Array<Comment & { sentiment: SentimentResult }>,
  totalPosts: number
): any {
  const positiveCount = comments.filter(c => c.sentiment.sentiment_label === 'positive').length;
  const neutralCount = comments.filter(c => c.sentiment.sentiment_label === 'neutral').length;
  const negativeCount = comments.filter(c => c.sentiment.sentiment_label === 'negative').length;
  const total = comments.length;

  const avgSentimentScore = comments.reduce((sum, c) => sum + c.sentiment.sentiment_score, 0) / total;

  // Extract all keywords
  const keywordCounts: Record<string, number> = {};
  comments.forEach(c => {
    c.sentiment.keywords.forEach(kw => {
      const normalized = kw.toLowerCase().trim();
      keywordCounts[normalized] = (keywordCounts[normalized] || 0) + 1;
    });
  });

  return {
    total_posts: totalPosts,
    total_comments: total,
    avg_sentiment_score: avgSentimentScore,
    positive_count: positiveCount,
    neutral_count: neutralCount,
    negative_count: negativeCount,
    positive_percentage: (positiveCount / total) * 100,
    neutral_percentage: (neutralCount / total) * 100,
    negative_percentage: (negativeCount / total) * 100,
    top_keywords: keywordCounts,
    response_rate: 0, // TODO: Calculate based on user replies
    avg_engagement_rate: 0, // TODO: Calculate from post stats
  };
}
