-- Add analysis_id column to competitor_posts table
ALTER TABLE public.competitor_posts
ADD COLUMN analysis_id UUID REFERENCES public.competitor_analysis(id) ON DELETE CASCADE;

-- Add index for better performance when querying posts by analysis
CREATE INDEX idx_competitor_posts_analysis_id ON public.competitor_posts(analysis_id);

-- Add column to track raw data from scraping
ALTER TABLE public.competitor_posts
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Rename post_text to caption for consistency with the edge function
ALTER TABLE public.competitor_posts
RENAME COLUMN post_text TO caption;

-- Add comments_count column if it doesn't exist
ALTER TABLE public.competitor_posts
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Add sentiment columns to competitor_posts
ALTER TABLE public.competitor_posts
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL,
ADD COLUMN IF NOT EXISTS sentiment_label TEXT;