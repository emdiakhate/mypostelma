-- Fix RLS policy on posts table to only show user's own posts
DROP POLICY IF EXISTS "Users can view published posts and own posts" ON public.posts;

CREATE POLICY "Users can only view their own posts" 
ON public.posts 
FOR SELECT 
TO authenticated
USING (auth.uid() = author_id);