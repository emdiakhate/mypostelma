-- Add User Sentiment Analysis Tables
-- Allows tracking of sentiment analysis for user's own posts

-- Table: user_sentiment_statistics
-- Stores weekly sentiment statistics for user's posts
CREATE TABLE IF NOT EXISTS public.user_sentiment_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_posts INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  avg_sentiment_score DOUBLE PRECISION,
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  positive_percentage DOUBLE PRECISION,
  neutral_percentage DOUBLE PRECISION,
  negative_percentage DOUBLE PRECISION,
  top_keywords JSONB,
  response_rate DOUBLE PRECISION DEFAULT 0,
  avg_engagement_rate DOUBLE PRECISION DEFAULT 0,
  analyzed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- Table: user_post_comments
-- Stores comments on user's posts with sentiment analysis
CREATE TABLE IF NOT EXISTS public.user_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_username TEXT,
  author_is_verified BOOLEAN DEFAULT FALSE,
  comment_text TEXT NOT NULL,
  comment_url TEXT,
  comment_likes INTEGER DEFAULT 0,
  posted_at TIMESTAMP,
  sentiment_score DOUBLE PRECISION,
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  sentiment_explanation TEXT,
  keywords TEXT[],
  is_user_reply BOOLEAN DEFAULT FALSE,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add sentiment tracking columns to posts table
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS last_sentiment_analysis_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sentiment_score DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  ADD COLUMN IF NOT EXISTS comments_sentiment_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sentiment_stats_user_date
  ON public.user_sentiment_statistics(user_id, week_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_post_comments_post
  ON public.user_post_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_user_post_comments_sentiment
  ON public.user_post_comments(sentiment_label);

CREATE INDEX IF NOT EXISTS idx_posts_sentiment_analysis
  ON public.posts(last_sentiment_analysis_at DESC)
  WHERE last_sentiment_analysis_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_sentiment_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sentiment_statistics
CREATE POLICY "Users can view their own sentiment stats"
  ON public.user_sentiment_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert sentiment stats"
  ON public.user_sentiment_statistics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update sentiment stats"
  ON public.user_sentiment_statistics FOR UPDATE
  USING (true);

-- RLS Policies for user_post_comments
CREATE POLICY "Users can view comments on their posts"
  ON public.user_post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = user_post_comments.post_id
      AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert post comments"
  ON public.user_post_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update post comments"
  ON public.user_post_comments FOR UPDATE
  USING (true);

-- Comment on tables
COMMENT ON TABLE public.user_sentiment_statistics IS 'Weekly sentiment analysis statistics for user posts';
COMMENT ON TABLE public.user_post_comments IS 'Comments on user posts with sentiment analysis';