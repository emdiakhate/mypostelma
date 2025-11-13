-- ============================================
-- POSTELMA - COMPETITOR ANALYSIS SCHEMA
-- Drop existing competitors table first
-- ============================================

DROP TABLE IF EXISTS competitors CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: competitors
-- Stores basic competitor information
-- ============================================
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  industry TEXT,
  description TEXT,

  -- Social Media Links
  instagram_url TEXT,
  facebook_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  website_url TEXT,

  -- Quick Stats (cached from last analysis)
  instagram_followers TEXT,
  facebook_likes TEXT,
  linkedin_followers TEXT,

  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ,
  analysis_count INT DEFAULT 0,

  -- Constraints
  CONSTRAINT competitors_name_user_unique UNIQUE (name, user_id)
);

-- ============================================
-- Table: competitor_analysis
-- Stores AI-generated analysis results
-- ============================================
CREATE TABLE competitor_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,

  -- AI Analysis Results
  positioning TEXT,
  content_strategy TEXT,
  tone TEXT,
  target_audience TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities_for_us TEXT[],
  social_media_presence TEXT,
  estimated_budget TEXT,
  key_differentiators TEXT[],
  recommendations TEXT,
  summary TEXT,

  -- Raw Scraped Data (JSONB for flexibility)
  instagram_data JSONB,
  facebook_data JSONB,
  linkedin_data JSONB,
  website_data JSONB,

  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  tokens_used INT,
  analysis_cost FLOAT,

  -- For versioning (track changes over time)
  version INT DEFAULT 1
);

-- ============================================
-- Table: competitor_posts
-- Tracks individual competitor posts
-- ============================================
CREATE TABLE competitor_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,

  -- Post Details
  platform TEXT NOT NULL,
  post_url TEXT,
  post_text TEXT,
  media_urls TEXT[],
  hashtags TEXT[],

  -- Engagement Metrics
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  views INT DEFAULT 0,
  engagement_rate FLOAT,

  -- Post Classification
  content_type TEXT,
  detected_tone TEXT,

  -- Timestamps
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT competitor_posts_url_unique UNIQUE (post_url)
);

-- ============================================
-- Table: competitor_metrics_history
-- Tracks metrics over time for trending
-- ============================================
CREATE TABLE competitor_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,

  -- Metrics Snapshot
  instagram_followers INT,
  instagram_following INT,
  instagram_posts_count INT,
  facebook_likes INT,
  linkedin_followers INT,
  linkedin_employees INT,

  -- Engagement Averages (from recent posts)
  avg_likes FLOAT,
  avg_comments FLOAT,
  avg_engagement_rate FLOAT,

  -- Frequency
  posts_last_7_days INT,
  posts_last_30_days INT,

  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Competitors
CREATE INDEX idx_competitors_user_id ON competitors(user_id);
CREATE INDEX idx_competitors_last_analyzed ON competitors(last_analyzed_at DESC);

-- Competitor Analysis
CREATE INDEX idx_competitor_analysis_competitor_id ON competitor_analysis(competitor_id);
CREATE INDEX idx_competitor_analysis_analyzed_at ON competitor_analysis(analyzed_at DESC);

-- Competitor Posts
CREATE INDEX idx_competitor_posts_competitor_id ON competitor_posts(competitor_id);
CREATE INDEX idx_competitor_posts_platform ON competitor_posts(platform);
CREATE INDEX idx_competitor_posts_posted_at ON competitor_posts(posted_at DESC);
CREATE INDEX idx_competitor_posts_engagement ON competitor_posts(engagement_rate DESC);

-- Metrics History
CREATE INDEX idx_competitor_metrics_competitor_id ON competitor_metrics_history(competitor_id);
CREATE INDEX idx_competitor_metrics_recorded_at ON competitor_metrics_history(recorded_at DESC);

-- ============================================
-- VIEWS for Easy Querying
-- ============================================

-- View: Latest analysis for each competitor
CREATE OR REPLACE VIEW competitor_latest_analysis AS
SELECT DISTINCT ON (c.id)
  c.id AS competitor_id,
  c.name,
  c.industry,
  c.instagram_url,
  c.facebook_url,
  c.linkedin_url,
  c.website_url,
  c.last_analyzed_at,
  ca.positioning,
  ca.content_strategy,
  ca.tone,
  ca.strengths,
  ca.weaknesses,
  ca.opportunities_for_us,
  ca.social_media_presence,
  ca.summary,
  ca.analysis_cost
FROM competitors c
LEFT JOIN competitor_analysis ca ON c.id = ca.competitor_id
ORDER BY c.id, ca.analyzed_at DESC;

-- View: Competitor comparison metrics
CREATE OR REPLACE VIEW competitor_comparison AS
SELECT
  c.id,
  c.name,
  c.industry,
  COALESCE(c.instagram_followers::INT, 0) AS instagram_followers,
  COALESCE(c.facebook_likes::INT, 0) AS facebook_likes,
  COALESCE(c.linkedin_followers::INT, 0) AS linkedin_followers,
  COUNT(DISTINCT cp.id) AS total_posts_tracked,
  ROUND(AVG(cp.engagement_rate)::numeric, 2) AS avg_engagement_rate,
  c.last_analyzed_at
FROM competitors c
LEFT JOIN competitor_posts cp ON c.id = cp.competitor_id
GROUP BY c.id, c.name, c.industry, c.instagram_followers, c.facebook_likes, c.linkedin_followers, c.last_analyzed_at;

-- View: Recent competitor activity
CREATE OR REPLACE VIEW competitor_recent_activity AS
SELECT
  c.name AS competitor_name,
  cp.platform,
  cp.post_text,
  cp.likes,
  cp.comments,
  cp.engagement_rate,
  cp.posted_at,
  cp.post_url
FROM competitor_posts cp
JOIN competitors c ON cp.competitor_id = c.id
WHERE cp.posted_at >= NOW() - INTERVAL '30 days'
ORDER BY cp.posted_at DESC;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_metrics_history ENABLE ROW LEVEL SECURITY;

-- Policies for competitors table
CREATE POLICY "Users can view their own competitors"
  ON competitors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitors"
  ON competitors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitors"
  ON competitors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitors"
  ON competitors FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for competitor_analysis table
CREATE POLICY "Users can view analysis of their competitors"
  ON competitor_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitors
      WHERE competitors.id = competitor_analysis.competitor_id
      AND competitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert analysis"
  ON competitor_analysis FOR INSERT
  WITH CHECK (true);

-- Policies for competitor_posts table
CREATE POLICY "Users can view posts of their competitors"
  ON competitor_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitors
      WHERE competitors.id = competitor_posts.competitor_id
      AND competitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert posts"
  ON competitor_posts FOR INSERT
  WITH CHECK (true);

-- Policies for competitor_metrics_history
CREATE POLICY "Users can view metrics of their competitors"
  ON competitor_metrics_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitors
      WHERE competitors.id = competitor_metrics_history.competitor_id
      AND competitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert metrics"
  ON competitor_metrics_history FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update analysis count when new analysis is created
CREATE OR REPLACE FUNCTION update_competitor_analysis_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE competitors
  SET
    analysis_count = analysis_count + 1,
    last_analyzed_at = NEW.analyzed_at
  WHERE id = NEW.competitor_id;
  RETURN NEW;
END;
$$;

-- Trigger: Auto-update analysis count
CREATE TRIGGER trigger_update_analysis_count
  AFTER INSERT ON competitor_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_analysis_count();

-- Function: Calculate engagement rate for posts
CREATE OR REPLACE FUNCTION calculate_engagement_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  followers INT;
BEGIN
  -- Try to get follower count from competitor
  SELECT
    CASE
      WHEN NEW.platform = 'instagram' THEN COALESCE(instagram_followers::INT, 1)
      WHEN NEW.platform = 'facebook' THEN COALESCE(facebook_likes::INT, 1)
      WHEN NEW.platform = 'linkedin' THEN COALESCE(linkedin_followers::INT, 1)
      ELSE 1
    END INTO followers
  FROM competitors
  WHERE id = NEW.competitor_id;

  -- Calculate engagement rate
  IF followers > 0 THEN
    NEW.engagement_rate = ((NEW.likes + NEW.comments + COALESCE(NEW.shares, 0))::FLOAT / followers) * 100;
  ELSE
    NEW.engagement_rate = 0;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Auto-calculate engagement rate
CREATE TRIGGER trigger_calculate_engagement_rate
  BEFORE INSERT OR UPDATE ON competitor_posts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_engagement_rate();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE competitors IS 'Stores competitor information';
COMMENT ON TABLE competitor_analysis IS 'Stores AI-generated competitor analysis';
COMMENT ON TABLE competitor_posts IS 'Tracks individual competitor social media posts';
COMMENT ON TABLE competitor_metrics_history IS 'Historical metrics for trend analysis';