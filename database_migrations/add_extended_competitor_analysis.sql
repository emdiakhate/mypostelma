-- Migration: Add Extended Competitor Analysis Framework
-- Date: 2025-11-24
-- Description: Adds support for comprehensive competitor analysis framework and user business profile

-- =====================================================
-- 1. Create my_business table for user's own business profile
-- =====================================================

CREATE TABLE IF NOT EXISTS my_business (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    website_url TEXT,
    instagram_url TEXT,
    instagram_followers TEXT,
    facebook_url TEXT,
    facebook_likes TEXT,
    linkedin_url TEXT,
    linkedin_followers TEXT,
    twitter_url TEXT,
    tiktok_url TEXT,
    youtube_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_analyzed_at TIMESTAMPTZ,
    UNIQUE(user_id) -- One business profile per user
);

-- Enable RLS on my_business
ALTER TABLE my_business ENABLE ROW LEVEL SECURITY;

-- RLS Policies for my_business
CREATE POLICY "Users can view own business"
    ON my_business FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business"
    ON my_business FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
    ON my_business FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own business"
    ON my_business FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. Create my_business_analysis table
-- =====================================================

CREATE TABLE IF NOT EXISTS my_business_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES my_business(id) ON DELETE CASCADE,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    version INTEGER NOT NULL DEFAULT 1,

    -- Context and Objectives
    context_objectives JSONB,

    -- Brand Identity
    brand_identity JSONB,

    -- Offering and Positioning
    offering_positioning JSONB,

    -- Digital Presence
    digital_presence JSONB,

    -- SWOT Analysis
    swot JSONB,

    -- Competitive Analysis
    competitive_analysis JSONB,

    -- Insights and Recommendations
    insights_recommendations JSONB,

    -- Raw Data
    raw_data JSONB,

    -- Metadata
    metadata JSONB
);

-- Enable RLS on my_business_analysis
ALTER TABLE my_business_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for my_business_analysis
CREATE POLICY "Users can view own business analysis"
    ON my_business_analysis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM my_business
            WHERE my_business.id = my_business_analysis.business_id
            AND my_business.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own business analysis"
    ON my_business_analysis FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM my_business
            WHERE my_business.id = business_id
            AND my_business.user_id = auth.uid()
        )
    );

-- =====================================================
-- 3. Add new columns to competitor_analysis table
-- =====================================================

-- Add new JSONB columns for extended analysis
ALTER TABLE competitor_analysis
ADD COLUMN IF NOT EXISTS context_objectives JSONB,
ADD COLUMN IF NOT EXISTS brand_identity JSONB,
ADD COLUMN IF NOT EXISTS offering_positioning JSONB,
ADD COLUMN IF NOT EXISTS digital_presence JSONB,
ADD COLUMN IF NOT EXISTS swot JSONB,
ADD COLUMN IF NOT EXISTS competitive_analysis JSONB,
ADD COLUMN IF NOT EXISTS insights_recommendations JSONB,
ADD COLUMN IF NOT EXISTS raw_data JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- =====================================================
-- 4. Create comparative_analysis table
-- =====================================================

CREATE TABLE IF NOT EXISTS comparative_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    my_business_id UUID NOT NULL REFERENCES my_business(id) ON DELETE CASCADE,
    competitor_ids UUID[] NOT NULL, -- Array of competitor IDs
    analysis_date TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Overall Comparison
    overall_comparison JSONB,

    -- Domain Comparisons
    domain_comparisons JSONB,

    -- Personalized Recommendations
    personalized_recommendations JSONB,

    -- Data Insights
    data_insights JSONB
);

-- Enable RLS on comparative_analysis
ALTER TABLE comparative_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comparative_analysis
CREATE POLICY "Users can view own comparative analysis"
    ON comparative_analysis FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comparative analysis"
    ON comparative_analysis FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comparative analysis"
    ON comparative_analysis FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparative analysis"
    ON comparative_analysis FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_my_business_user_id ON my_business(user_id);
CREATE INDEX IF NOT EXISTS idx_my_business_analysis_business_id ON my_business_analysis(business_id);
CREATE INDEX IF NOT EXISTS idx_my_business_analysis_analyzed_at ON my_business_analysis(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_comparative_analysis_user_id ON comparative_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_comparative_analysis_business_id ON comparative_analysis(my_business_id);
CREATE INDEX IF NOT EXISTS idx_comparative_analysis_date ON comparative_analysis(analysis_date DESC);

-- =====================================================
-- 6. Create function to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for my_business
DROP TRIGGER IF EXISTS update_my_business_updated_at ON my_business;
CREATE TRIGGER update_my_business_updated_at
    BEFORE UPDATE ON my_business
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Create view for latest business analysis
-- =====================================================

CREATE OR REPLACE VIEW my_business_latest_analysis AS
SELECT DISTINCT ON (mb.id)
    mb.*,
    mba.id as analysis_id,
    mba.analyzed_at,
    mba.context_objectives,
    mba.brand_identity,
    mba.offering_positioning,
    mba.digital_presence,
    mba.swot,
    mba.competitive_analysis,
    mba.insights_recommendations,
    mba.metadata
FROM my_business mb
LEFT JOIN my_business_analysis mba ON mb.id = mba.business_id
ORDER BY mb.id, mba.analyzed_at DESC NULLS LAST;

-- =====================================================
-- 8. Grant permissions (if needed)
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON my_business TO authenticated;
GRANT SELECT, INSERT ON my_business_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comparative_analysis TO authenticated;
GRANT SELECT ON my_business_latest_analysis TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================

COMMENT ON TABLE my_business IS 'Stores user business profile for competitor comparison';
COMMENT ON TABLE my_business_analysis IS 'Stores extended analysis of user business using the same framework as competitors';
COMMENT ON TABLE comparative_analysis IS 'Stores comparative analysis between user business and competitors';
COMMENT ON VIEW my_business_latest_analysis IS 'Returns user business with their latest analysis data';
