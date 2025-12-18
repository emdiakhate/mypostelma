-- =====================================================
-- SECURITY MIGRATION: Partie 2 - My Business et Vues
-- =====================================================

-- 1. Supprimer d'abord la policy existante
DROP POLICY IF EXISTS "Users can view own business" ON public.my_business;
DROP POLICY IF EXISTS "Users can insert own business" ON public.my_business;
DROP POLICY IF EXISTS "Users can update own business" ON public.my_business;
DROP POLICY IF EXISTS "Users can delete own business" ON public.my_business;

-- Recréer les policies pour my_business
CREATE POLICY "Users can view own business"
ON public.my_business
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business"
ON public.my_business
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
ON public.my_business
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business"
ON public.my_business
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. Créer une vue sécurisée pour les connected_accounts sans tokens (avec SECURITY INVOKER)
DROP VIEW IF EXISTS public.connected_accounts_safe;
CREATE VIEW public.connected_accounts_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  platform,
  account_name,
  platform_account_id,
  avatar_url,
  status,
  error_message,
  connected_at,
  last_sync_at,
  messages_sent,
  messages_received,
  updated_at
FROM public.connected_accounts;

-- 3. Supprimer et recréer les vues avec SECURITY INVOKER pour hériter RLS
DROP VIEW IF EXISTS public.competitor_latest_analysis;
CREATE VIEW public.competitor_latest_analysis 
WITH (security_invoker = true) AS
SELECT DISTINCT ON (c.id)
  c.id as competitor_id,
  c.name,
  c.industry,
  c.instagram_url,
  c.facebook_url,
  c.linkedin_url,
  c.website_url,
  ca.analyzed_at as last_analyzed_at,
  ca.analysis_cost,
  ca.positioning,
  ca.content_strategy,
  ca.tone,
  ca.strengths,
  ca.weaknesses,
  ca.opportunities_for_us,
  ca.social_media_presence,
  ca.summary
FROM competitors c
LEFT JOIN competitor_analysis ca ON c.id = ca.competitor_id
ORDER BY c.id, ca.analyzed_at DESC NULLS LAST;

DROP VIEW IF EXISTS public.my_business_latest_analysis;
CREATE VIEW public.my_business_latest_analysis 
WITH (security_invoker = true) AS
SELECT 
  mb.id,
  mb.user_id,
  mb.business_name,
  mb.description,
  mb.industry,
  mb.website_url,
  mb.instagram_url,
  mb.instagram_followers,
  mb.facebook_url,
  mb.facebook_likes,
  mb.linkedin_url,
  mb.linkedin_followers,
  mb.twitter_url,
  mb.tiktok_url,
  mb.youtube_url,
  mb.created_at,
  mb.updated_at,
  mb.last_analyzed_at,
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

DROP VIEW IF EXISTS public.competitor_comparison;
CREATE VIEW public.competitor_comparison 
WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.name,
  c.industry,
  CAST(c.instagram_followers AS INTEGER) as instagram_followers,
  CAST(c.facebook_likes AS INTEGER) as facebook_likes,
  CAST(c.linkedin_followers AS INTEGER) as linkedin_followers,
  (SELECT COUNT(*) FROM competitor_posts WHERE competitor_id = c.id) as total_posts_tracked,
  (SELECT AVG(engagement_rate) FROM competitor_posts WHERE competitor_id = c.id) as avg_engagement_rate,
  c.last_analyzed_at
FROM competitors c;

-- 4. Recréer les vues teams avec SECURITY INVOKER
DROP VIEW IF EXISTS public.teams_with_stats;
CREATE VIEW public.teams_with_stats 
WITH (security_invoker = true) AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.color,
  t.user_id,
  t.member_count,
  t.conversation_count,
  t.created_at,
  t.updated_at,
  (SELECT COUNT(*) FROM team_members WHERE team_id = t.id AND status = 'accepted') as active_members,
  (SELECT COUNT(*) FROM conversation_teams WHERE team_id = t.id) as assigned_conversations
FROM teams t;

DROP VIEW IF EXISTS public.conversations_with_teams;
CREATE VIEW public.conversations_with_teams 
WITH (security_invoker = true) AS
SELECT 
  c.*,
  ARRAY_AGG(ct.team_id) FILTER (WHERE ct.team_id IS NOT NULL) as teams
FROM conversations c
LEFT JOIN conversation_teams ct ON c.id = ct.conversation_id
GROUP BY c.id;

-- 5. Recréer connected_accounts_with_stats SANS les tokens sensibles et avec SECURITY INVOKER
DROP VIEW IF EXISTS public.connected_accounts_with_stats;
CREATE VIEW public.connected_accounts_with_stats 
WITH (security_invoker = true) AS
SELECT 
  ca.id,
  ca.user_id,
  ca.platform,
  ca.platform_account_id,
  ca.account_name,
  ca.avatar_url,
  ca.status,
  ca.error_message,
  ca.token_expires_at,
  ca.config,
  ca.messages_received,
  ca.messages_sent,
  ca.last_sync_at,
  ca.connected_at,
  ca.updated_at,
  -- Exclure access_token et refresh_token pour sécurité
  (SELECT COUNT(*) FROM conversations WHERE connected_account_id = ca.id AND status = 'active') as active_conversations,
  (SELECT COUNT(*) FROM conversations WHERE connected_account_id = ca.id AND id IN (SELECT conversation_id FROM messages WHERE is_read = false)) as unread_conversations
FROM connected_accounts ca;