-- =====================================================
-- UNIFIED INBOX: CONNECTED ACCOUNTS & CREDENTIALS
-- =====================================================
-- This migration adds support for connecting multiple channels:
-- - Email (Gmail, Outlook)
-- - Telegram
-- - WhatsApp (Twilio)
-- Future: Meta platforms (Instagram, Facebook), TikTok, Twitter/X

-- =====================================================
-- 1. CONNECTED ACCOUNTS TABLE
-- =====================================================
-- Stores all connected accounts for each user
CREATE TABLE IF NOT EXISTS connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Platform info
    platform VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'telegram', 'whatsapp_twilio', 'instagram', 'facebook', etc.
    platform_account_id TEXT NOT NULL, -- Email address, Telegram bot token, phone number, etc.
    account_name TEXT, -- Display name: "john@gmail.com", "Support Bot", "+221771234567"
    avatar_url TEXT,

    -- Connection status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error', 'pending'
    error_message TEXT,

    -- OAuth tokens (encrypted in production)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Platform-specific config (JSONB for flexibility)
    config JSONB DEFAULT '{}', -- { api_key, webhook_url, bot_username, etc. }

    -- Metrics
    messages_received INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    last_sync_at TIMESTAMPTZ,

    -- Timestamps
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one account per platform per user
    UNIQUE(user_id, platform, platform_account_id)
);

-- Index for quick lookups
CREATE INDEX idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX idx_connected_accounts_platform ON connected_accounts(platform);
CREATE INDEX idx_connected_accounts_status ON connected_accounts(status);

-- =====================================================
-- 2. UPDATE CONVERSATIONS TABLE
-- =====================================================
-- Add reference to connected account
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_connected_account ON conversations(connected_account_id);

-- =====================================================
-- 3. WEBHOOK LOGS TABLE
-- =====================================================
-- For debugging webhook issues
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,

    -- Request details
    method VARCHAR(10),
    headers JSONB,
    body JSONB,
    query_params JSONB,

    -- Response
    status_code INTEGER,
    response_body JSONB,

    -- Processing
    processed BOOLEAN DEFAULT false,
    error_message TEXT,

    -- Timestamps
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_logs_platform ON webhook_logs(platform, received_at DESC);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Connected accounts policies
CREATE POLICY "Users can view their own connected accounts"
    ON connected_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts"
    ON connected_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts"
    ON connected_accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts"
    ON connected_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Webhook logs policies (admin only for now)
CREATE POLICY "Users can view webhook logs for their accounts"
    ON webhook_logs FOR SELECT
    USING (
        connected_account_id IN (
            SELECT id FROM connected_accounts WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_connected_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_connected_account_timestamp
    BEFORE UPDATE ON connected_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_connected_account_timestamp();

-- Update message counts when messages are sent/received
CREATE OR REPLACE FUNCTION update_connected_account_message_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.direction = 'incoming' THEN
        UPDATE connected_accounts
        SET messages_received = messages_received + 1,
            last_sync_at = NOW()
        WHERE id = (
            SELECT connected_account_id
            FROM conversations
            WHERE id = NEW.conversation_id
        );
    ELSIF NEW.direction = 'outgoing' THEN
        UPDATE connected_accounts
        SET messages_sent = messages_sent + 1
        WHERE id = (
            SELECT connected_account_id
            FROM conversations
            WHERE id = NEW.conversation_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_message_counts
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_connected_account_message_counts();

-- =====================================================
-- 6. VIEWS
-- =====================================================

-- View: Connected accounts with stats
CREATE OR REPLACE VIEW connected_accounts_with_stats AS
SELECT
    ca.*,
    COUNT(DISTINCT c.id) as active_conversations,
    COUNT(DISTINCT CASE WHEN c.status = 'unread' THEN c.id END) as unread_conversations
FROM connected_accounts ca
LEFT JOIN conversations c ON c.connected_account_id = ca.id
GROUP BY ca.id;

-- Grant access to authenticated users
GRANT SELECT ON connected_accounts_with_stats TO authenticated;

-- =====================================================
-- 7. SAMPLE DATA (for testing)
-- =====================================================

-- Note: In production, accounts are connected via OAuth flows
-- This is just for reference
COMMENT ON TABLE connected_accounts IS 'Stores connected third-party accounts (Gmail, Outlook, Telegram, WhatsApp, etc.)';
COMMENT ON COLUMN connected_accounts.platform IS 'Platform identifier: gmail, outlook, telegram, whatsapp_twilio, instagram, facebook, tiktok, twitter';
COMMENT ON COLUMN connected_accounts.config IS 'Platform-specific configuration (bot token, webhook URL, API keys, etc.)';
