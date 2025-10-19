-- Allow users to read their own role
-- This is required so users can load their role from the database
-- instead of relying on insecure localStorage
CREATE POLICY "users_can_read_own_role" ON public.user_roles
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);