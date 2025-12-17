-- Add invitation token fields to team_members table
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_team_members_invitation_token ON team_members(invitation_token);

-- Create function to auto-accept invitations when user signs up
CREATE OR REPLACE FUNCTION auto_accept_team_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user is created, accept all pending invitations for their email
  UPDATE team_members
  SET
    user_id = NEW.id,
    status = 'accepted',
    accepted_at = NOW()
  WHERE
    email = NEW.email
    AND status = 'pending'
    AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS trigger_auto_accept_team_invitations ON auth.users;
CREATE TRIGGER trigger_auto_accept_team_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_accept_team_invitations();

-- Function to cleanup expired invitation tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitation_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM team_members
  WHERE
    status = 'pending'
    AND token_expires_at < NOW()
    AND invited_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_invitation_tokens IS 'Deletes pending invitations that are expired and older than 30 days';
