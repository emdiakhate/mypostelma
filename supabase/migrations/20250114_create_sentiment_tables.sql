-- Migration: Create tables for sentiment analysis of competitor posts
-- Description: Modifies competitor_posts and adds 2 new tables

-- The competitor_posts table already exists, we just need to modify it
-- This is now handled by migration 20251114184525_e9199420-9ac9-4597-8d79-aac37f04f60c.sql

-- Table pour les commentaires analysés
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES competitor_posts(id) ON DELETE CASCADE,
  author_username TEXT,
  text TEXT,
  likes INTEGER DEFAULT 0,
  posted_at TIMESTAMP,
  sentiment_score DECIMAL, -- -1 à 1
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  sentiment_explanation TEXT, -- Pourquoi ce sentiment
  keywords TEXT[], -- Mots-clés extraits
  is_response_from_brand BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les statistiques globales
CREATE TABLE IF NOT EXISTS sentiment_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES competitor_analysis(id) ON DELETE CASCADE,
  total_posts INTEGER,
  total_comments INTEGER,
  avg_sentiment_score DECIMAL,
  positive_percentage DECIMAL,
  neutral_percentage DECIMAL,
  negative_percentage DECIMAL,
  top_keywords JSONB, -- {keyword: count}
  response_rate DECIMAL, -- % de commentaires avec réponse
  avg_engagement_rate DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_sentiment_label ON post_comments(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_post_comments_posted_at ON post_comments(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON post_comments(author_username);

CREATE INDEX IF NOT EXISTS idx_sentiment_statistics_analysis_id ON sentiment_statistics(analysis_id);

-- RLS (Row Level Security) Policies
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_statistics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on their competitor posts
CREATE POLICY "Users can view comments on their competitor posts"
ON post_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM competitor_posts cp
    JOIN competitors c ON c.id = cp.competitor_id
    WHERE cp.id = post_comments.post_id
    AND c.user_id = auth.uid()
  )
);

-- Policy: Service role can insert comments (Edge Functions)
CREATE POLICY "Service role can insert comments"
ON post_comments
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Users can view their own sentiment statistics
CREATE POLICY "Users can view their own sentiment statistics"
ON sentiment_statistics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM competitor_analysis ca
    JOIN competitors c ON c.id = ca.competitor_id
    WHERE ca.id = sentiment_statistics.analysis_id
    AND c.user_id = auth.uid()
  )
);

-- Policy: Service role can insert sentiment statistics (Edge Functions)
CREATE POLICY "Service role can insert sentiment statistics"
ON sentiment_statistics
FOR INSERT
TO service_role
WITH CHECK (true);

-- Comments pour documentation
COMMENT ON TABLE post_comments IS 'Stores comments on competitor posts with individual sentiment scores';
COMMENT ON TABLE sentiment_statistics IS 'Aggregated sentiment statistics for each analysis';
COMMENT ON COLUMN post_comments.sentiment_score IS 'Sentiment score from -1 (negative) to 1 (positive)';
COMMENT ON COLUMN post_comments.keywords IS 'Extracted keywords from the comment text';
COMMENT ON COLUMN sentiment_statistics.top_keywords IS 'JSON object with keyword frequencies {keyword: count}';
