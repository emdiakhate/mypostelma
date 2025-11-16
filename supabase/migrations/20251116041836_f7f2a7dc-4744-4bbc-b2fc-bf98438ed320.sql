-- Drop existing views with SECURITY DEFINER
DROP VIEW IF EXISTS public.competitor_latest_analysis;
DROP VIEW IF EXISTS public.competitor_comparison;
DROP VIEW IF EXISTS public.competitor_recent_activity;

-- Recreate competitor_latest_analysis view with SECURITY INVOKER (default)
CREATE VIEW public.competitor_latest_analysis
WITH (security_invoker=true)
AS
SELECT 
  c.id as competitor_id,
  c.last_analyzed_at,
  ca.analysis_cost,
  c.name,
  c.industry,
  c.instagram_url,
  c.facebook_url,
  c.linkedin_url,
  c.website_url,
  ca.positioning,
  ca.content_strategy,
  ca.tone,
  ca.strengths,
  ca.weaknesses,
  ca.opportunities_for_us,
  ca.social_media_presence,
  ca.summary
FROM competitors c
LEFT JOIN LATERAL (
  SELECT *
  FROM competitor_analysis
  WHERE competitor_id = c.id
  ORDER BY analyzed_at DESC
  LIMIT 1
) ca ON true;

-- Recreate competitor_comparison view with SECURITY INVOKER
CREATE VIEW public.competitor_comparison
WITH (security_invoker=true)
AS
SELECT 
  c.id,
  c.name,
  c.industry,
  CAST(c.instagram_followers AS INTEGER) as instagram_followers,
  CAST(c.facebook_likes AS INTEGER) as facebook_likes,
  CAST(c.linkedin_followers AS INTEGER) as linkedin_followers,
  COUNT(DISTINCT cp.id) as total_posts_tracked,
  AVG(cp.engagement_rate) as avg_engagement_rate,
  c.last_analyzed_at
FROM competitors c
LEFT JOIN competitor_posts cp ON c.id = cp.competitor_id
GROUP BY c.id, c.name, c.industry, c.instagram_followers, c.facebook_likes, c.linkedin_followers, c.last_analyzed_at;

-- Recreate competitor_recent_activity view with SECURITY INVOKER
CREATE VIEW public.competitor_recent_activity
WITH (security_invoker=true)
AS
SELECT 
  c.name as competitor_name,
  cp.platform,
  cp.caption as post_text,
  cp.post_url,
  cp.likes,
  cp.comments,
  cp.engagement_rate,
  cp.posted_at
FROM competitor_posts cp
JOIN competitors c ON cp.competitor_id = c.id
WHERE cp.posted_at >= NOW() - INTERVAL '30 days'
ORDER BY cp.posted_at DESC;