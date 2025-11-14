-- Create post_comments table for storing comments with sentiment analysis
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.competitor_posts(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  author_username TEXT,
  author_is_verified BOOLEAN DEFAULT false,
  comment_likes INTEGER DEFAULT 0,
  comment_url TEXT,
  posted_at TIMESTAMPTZ,
  sentiment_score FLOAT,
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  sentiment_explanation TEXT,
  keywords TEXT[],
  is_competitor_reply BOOLEAN DEFAULT false,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sentiment_statistics table for aggregate statistics
CREATE TABLE IF NOT EXISTS public.sentiment_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.competitor_analysis(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  total_posts INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  avg_sentiment_score FLOAT,
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  positive_percentage FLOAT,
  neutral_percentage FLOAT,
  negative_percentage FLOAT,
  top_keywords JSONB DEFAULT '{}',
  response_rate FLOAT DEFAULT 0,
  avg_engagement_rate FLOAT DEFAULT 0,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_sentiment_label ON public.post_comments(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_sentiment_statistics_analysis_id ON public.sentiment_statistics(analysis_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_statistics_competitor_id ON public.sentiment_statistics(competitor_id);

-- Enable RLS on tables
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_comments
CREATE POLICY "Users can view comments of their competitor posts"
  ON public.post_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.competitor_posts cp
      JOIN public.competitors c ON c.id = cp.competitor_id
      WHERE cp.id = post_comments.post_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for sentiment_statistics
CREATE POLICY "Users can view statistics of their competitors"
  ON public.sentiment_statistics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.competitors
      WHERE competitors.id = sentiment_statistics.competitor_id
      AND competitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert statistics"
  ON public.sentiment_statistics
  FOR INSERT
  WITH CHECK (true);