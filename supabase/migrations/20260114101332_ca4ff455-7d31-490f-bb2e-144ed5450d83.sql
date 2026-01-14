-- Supprimer les anciennes politiques "Service role" trop permissives
-- et les recréer avec des restrictions appropriées

-- competitor_analysis
DROP POLICY IF EXISTS "Service role can insert analysis" ON public.competitor_analysis;

-- competitor_metrics_history
DROP POLICY IF EXISTS "Service role can insert metrics" ON public.competitor_metrics_history;

-- competitor_posts
DROP POLICY IF EXISTS "Service role can insert posts" ON public.competitor_posts;

-- post_analytics
DROP POLICY IF EXISTS "System can create analytics" ON public.post_analytics;

-- post_comments
DROP POLICY IF EXISTS "Service role can insert comments" ON public.post_comments;

-- sentiment_statistics
DROP POLICY IF EXISTS "Service role can insert statistics" ON public.sentiment_statistics;

-- user_post_comments
DROP POLICY IF EXISTS "Service role can insert post comments" ON public.user_post_comments;
DROP POLICY IF EXISTS "Service role can update post comments" ON public.user_post_comments;

-- user_sentiment_statistics
DROP POLICY IF EXISTS "Service role can insert sentiment stats" ON public.user_sentiment_statistics;
DROP POLICY IF EXISTS "Service role can update sentiment stats" ON public.user_sentiment_statistics;