-- Drop problematic RLS policies on team_members that reference auth.users
DROP POLICY IF EXISTS "Users can view members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can delete members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can insert members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON public.team_members;

-- Create clean RLS policies without auth.users reference
-- SELECT: Team owners can view their team members, or members can see their own membership
CREATE POLICY "Team owners can view members" 
ON public.team_members 
FOR SELECT 
USING (
  team_id IN (
    SELECT id FROM teams WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- INSERT: Only team owners can invite members (service role also can via Edge Function)
CREATE POLICY "Team owners can insert members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE user_id = auth.uid()
  )
);

-- UPDATE: Team owners can update, or members can accept their own invitation
CREATE POLICY "Team owners can update members" 
ON public.team_members 
FOR UPDATE 
USING (
  team_id IN (
    SELECT id FROM teams WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- DELETE: Only team owners can remove members
CREATE POLICY "Team owners can delete members" 
ON public.team_members 
FOR DELETE 
USING (
  team_id IN (
    SELECT id FROM teams WHERE user_id = auth.uid()
  )
);