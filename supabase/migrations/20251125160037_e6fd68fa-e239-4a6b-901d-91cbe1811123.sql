-- =====================================================
-- UNIFIED INBOX: COMPLETE SETUP
-- =====================================================

-- =====================================================
-- 1. CONNECTED ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_account_id TEXT NOT NULL,
    account_name TEXT,
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    error_message TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}',
    messages_received INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    last_sync_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform, platform_account_id)
);

CREATE INDEX idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX idx_connected_accounts_platform ON connected_accounts(platform);
CREATE INDEX idx_connected_accounts_status ON connected_accounts(status);

-- =====================================================
-- 2. CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL,
    platform_conversation_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    participant_name TEXT,
    participant_username TEXT,
    participant_avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'unread',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    sentiment VARCHAR(20),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform, platform_conversation_id)
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_connected_account ON conversations(connected_account_id);

-- =====================================================
-- 3. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    platform_message_id TEXT,
    direction VARCHAR(10) NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    text_content TEXT,
    media_url TEXT,
    media_type TEXT,
    sender_id TEXT,
    sender_name TEXT,
    sender_username TEXT,
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, platform_message_id)
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- =====================================================
-- 4. QUICK REPLIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quick_replies_user_id ON quick_replies(user_id);
CREATE INDEX idx_quick_replies_usage_count ON quick_replies(usage_count DESC);

-- =====================================================
-- 5. WEBHOOK LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    method VARCHAR(10),
    headers JSONB,
    body JSONB,
    query_params JSONB,
    status_code INTEGER,
    response_body JSONB,
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_logs_platform ON webhook_logs(platform, received_at DESC);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Connected accounts policies
CREATE POLICY "Users can view their own connected accounts"
    ON connected_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own connected accounts"
    ON connected_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own connected accounts"
    ON connected_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own connected accounts"
    ON connected_accounts FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations"
    ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations"
    ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations"
    ON conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages from their conversations"
    ON messages FOR SELECT USING (
        conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert messages to their conversations"
    ON messages FOR INSERT WITH CHECK (
        conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can update messages in their conversations"
    ON messages FOR UPDATE USING (
        conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can delete messages from their conversations"
    ON messages FOR DELETE USING (
        conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
    );

-- Quick replies policies
CREATE POLICY "Users can view their own quick replies"
    ON quick_replies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quick replies"
    ON quick_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quick replies"
    ON quick_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quick replies"
    ON quick_replies FOR DELETE USING (auth.uid() = user_id);

-- Webhook logs policies
CREATE POLICY "Users can view webhook logs for their accounts"
    ON webhook_logs FOR SELECT USING (
        connected_account_id IN (SELECT id FROM connected_accounts WHERE user_id = auth.uid())
    );

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

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

CREATE OR REPLACE FUNCTION increment_quick_reply_usage(reply_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE quick_replies
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = reply_id;
END;
$$ LANGUAGE plpgsql;

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
-- 8. VIEWS
-- =====================================================

CREATE OR REPLACE VIEW conversations_with_last_message AS
SELECT
    c.*,
    m.text_content as last_message_text,
    m.sent_at as last_message_sent_at,
    m.direction as last_message_direction,
    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = false AND direction = 'incoming') as unread_count
FROM conversations c
LEFT JOIN LATERAL (
    SELECT text_content, sent_at, direction
    FROM messages
    WHERE conversation_id = c.id
    ORDER BY sent_at DESC
    LIMIT 1
) m ON true;

CREATE OR REPLACE VIEW inbox_stats AS
SELECT
    user_id,
    COUNT(*) FILTER (WHERE status = 'unread') as unread_count,
    COUNT(*) FILTER (WHERE status = 'read') as read_count,
    COUNT(*) FILTER (WHERE assigned_to IS NULL) as unassigned_count,
    AVG(EXTRACT(EPOCH FROM (
        SELECT MIN(m.sent_at)
        FROM messages m
        WHERE m.conversation_id = c.id AND m.direction = 'outgoing'
    ) - last_message_at) / 60)::integer as avg_response_time_minutes,
    COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_sentiment_count
FROM conversations c
GROUP BY user_id;

CREATE OR REPLACE VIEW connected_accounts_with_stats AS
SELECT
    ca.*,
    COUNT(DISTINCT c.id) as active_conversations,
    COUNT(DISTINCT CASE WHEN c.status = 'unread' THEN c.id END) as unread_conversations
FROM connected_accounts ca
LEFT JOIN conversations c ON c.connected_account_id = ca.id
GROUP BY ca.id;

-- Grant access
GRANT SELECT ON conversations_with_last_message TO authenticated;
GRANT SELECT ON inbox_stats TO authenticated;
GRANT SELECT ON connected_accounts_with_stats TO authenticated;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;