-- Fix: Recreate connected_accounts_safe view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.connected_accounts_safe;

CREATE VIEW public.connected_accounts_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  platform,
  platform_account_id,
  account_name,
  avatar_url,
  status,
  error_message,
  last_sync_at,
  messages_received,
  messages_sent,
  connected_at,
  updated_at,
  config
FROM public.connected_accounts
WHERE user_id = auth.uid();

COMMENT ON VIEW public.connected_accounts_safe IS 'Secure view excluding access_token, refresh_token, and token_expires_at';