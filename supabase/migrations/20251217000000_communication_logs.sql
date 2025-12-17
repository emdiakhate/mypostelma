-- Create communication_logs table for tracking email and WhatsApp communications
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'sms')),
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  provider_response JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_communication_logs_lead_id ON communication_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_user_id ON communication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON communication_logs(type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_status ON communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_communication_logs_sent_at ON communication_logs(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own communication logs
CREATE POLICY "Users can view their own communication logs"
  ON communication_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own communication logs"
  ON communication_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own communication logs"
  ON communication_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_communication_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_communication_logs_updated_at
  BEFORE UPDATE ON communication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_logs_updated_at();
