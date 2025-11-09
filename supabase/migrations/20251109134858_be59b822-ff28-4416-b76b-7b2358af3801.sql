-- Add INSERT and DELETE policies to profiles table for defense-in-depth security

-- Prevent direct profile insertion (only trigger should create profiles)
CREATE POLICY "profiles_insert_system_only" ON public.profiles
FOR INSERT
WITH CHECK (false);

-- Prevent profile deletion to maintain data integrity
CREATE POLICY "profiles_no_delete" ON public.profiles
FOR DELETE
USING (false);