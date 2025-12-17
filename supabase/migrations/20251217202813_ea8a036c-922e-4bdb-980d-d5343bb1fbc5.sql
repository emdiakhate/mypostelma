-- Add invitation token columns to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_team_members_invitation_token 
ON public.team_members(invitation_token) 
WHERE invitation_token IS NOT NULL;