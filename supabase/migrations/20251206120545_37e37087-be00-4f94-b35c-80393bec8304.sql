-- Fix 1: Restrict profiles table access to own profile only
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix 2: Create a secure view for connected_accounts that excludes sensitive tokens
CREATE OR REPLACE VIEW public.connected_accounts_safe AS
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

-- Ensure the view uses SECURITY INVOKER (default in PostgreSQL)
COMMENT ON VIEW public.connected_accounts_safe IS 'Secure view excluding access_token, refresh_token, and token_expires_at';