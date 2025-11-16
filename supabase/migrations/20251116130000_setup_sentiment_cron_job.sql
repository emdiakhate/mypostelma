-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create a function to trigger sentiment analysis for all users
CREATE OR REPLACE FUNCTION public.trigger_weekly_sentiment_analysis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
  response TEXT;
BEGIN
  -- Get Supabase project URL and service role key from environment
  -- Note: These need to be set in Supabase Dashboard -> Project Settings -> API
  edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/analyze-user-sentiment';
  service_role_key := current_setting('app.settings.supabase_service_role_key', true);

  -- Call the edge function via HTTP POST
  -- The edge function will process all users automatically
  SELECT content::text INTO response
  FROM http((
    'POST',
    edge_function_url,
    ARRAY[http_header('Authorization', 'Bearer ' || service_role_key)],
    'application/json',
    '{}'
  )::http_request);

  -- Log the execution
  RAISE NOTICE 'Weekly sentiment analysis triggered at %', NOW();

EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail
    RAISE WARNING 'Error triggering sentiment analysis: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (though it will be called by cron)
GRANT EXECUTE ON FUNCTION public.trigger_weekly_sentiment_analysis() TO service_role;

-- Schedule the cron job to run every Monday at 6:00 AM UTC
-- Format: minute hour day month weekday
-- '0 6 * * 1' means: at 6:00 AM on Mondays
SELECT cron.schedule(
  'weekly-user-sentiment-analysis',  -- job name
  '0 6 * * 1',                        -- cron expression (every Monday at 6 AM UTC)
  $$SELECT public.trigger_weekly_sentiment_analysis();$$
);

-- To verify the cron job was created, you can run:
-- SELECT * FROM cron.job;

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('weekly-user-sentiment-analysis');

-- IMPORTANT SETUP INSTRUCTIONS:
-- ============================
-- After running this migration, you need to configure the Supabase settings:
--
-- Option 1: Using Supabase Dashboard (Recommended)
-- -------------------------------------------------
-- 1. Go to Supabase Dashboard -> Database -> Cron Jobs
-- 2. Create a new cron job with:
--    - Name: weekly-user-sentiment-analysis
--    - Schedule: 0 6 * * 1 (Every Monday at 6 AM)
--    - Command: SELECT net.http_post(
--                 url := '[YOUR_PROJECT_URL]/functions/v1/analyze-user-sentiment',
--                 headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
--                 body := '{}'::jsonb
--               );
--
-- Option 2: Set environment variables (Advanced)
-- -----------------------------------------------
-- 1. In Supabase Dashboard -> Project Settings -> API, note your:
--    - Project URL (e.g., https://xxx.supabase.co)
--    - Service Role Key (secret key)
-- 2. In SQL Editor, run:
--    ALTER DATABASE postgres SET app.settings.supabase_url = 'https://xxx.supabase.co';
--    ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'eyJhb...';
--
-- Option 3: Alternative using net.http_post (Simpler)
-- ----------------------------------------------------
-- Drop the scheduled job created above and create a simpler one:
--
-- SELECT cron.unschedule('weekly-user-sentiment-analysis');
--
-- SELECT cron.schedule(
--   'weekly-user-sentiment-analysis',
--   '0 6 * * 1',
--   $$
--   SELECT net.http_post(
--     url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/analyze-user-sentiment',
--     headers := jsonb_build_object('Authorization', 'Bearer [YOUR_SERVICE_ROLE_KEY]'),
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );

COMMENT ON FUNCTION public.trigger_weekly_sentiment_analysis IS
'Triggers weekly sentiment analysis for all users. Called by cron job every Monday at 6 AM UTC.';
