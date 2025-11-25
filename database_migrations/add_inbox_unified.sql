-- Migration: Inbox Unifié
-- Description: Tables pour gérer tous les messages/commentaires dans un seul inbox

-- =====================================================
-- 1. Table conversations (threads de discussion)
-- =====================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Identifiants externes
    platform VARCHAR(50) NOT NULL, -- 'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'
    platform_conversation_id TEXT NOT NULL, -- ID unique de la conversation sur la plateforme

    -- Participant
    participant_id TEXT NOT NULL, -- ID de l'utilisateur sur la plateforme
    participant_username TEXT, -- @username
    participant_name TEXT, -- Nom affiché
    participant_avatar_url TEXT, -- Photo de profil

    -- Contexte
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- Si lié à un post Postelma
    platform_post_id TEXT, -- ID du post sur la plateforme

    -- État
    status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived', 'snoozed'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative' (analyse IA)

    -- Assignment
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- Tags
    tags TEXT[], -- ['support', 'vente', 'réclamation']

    -- Métriques
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ NOT NULL,
    last_customer_message_at TIMESTAMPTZ,
    last_brand_reply_at TIMESTAMPTZ,
    first_response_time_minutes INTEGER, -- Temps de première réponse en minutes

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Indexes
    CONSTRAINT unique_platform_conversation UNIQUE(platform, platform_conversation_id, user_id)
);

-- =====================================================
-- 2. Table messages (messages individuels)
-- =====================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Identifiants externes
    platform_message_id TEXT NOT NULL, -- ID du message sur la plateforme

    -- Direction
    direction VARCHAR(10) NOT NULL, -- 'inbound' (client → marque) ou 'outbound' (marque → client)

    -- Contenu
    message_type VARCHAR(20) NOT NULL, -- 'text', 'image', 'video', 'audio', 'story_reply', 'story_mention'
    text_content TEXT,
    media_url TEXT,
    media_type VARCHAR(20), -- 'image', 'video', 'gif'

    -- Métadonnées
    sender_id TEXT NOT NULL, -- ID de l'expéditeur sur la plateforme
    sender_username TEXT,
    sender_name TEXT,

    -- Si c'est une réponse envoyée depuis Postelma
    sent_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- État
    is_read BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false, -- Pour filtrer spam

    -- Timestamps
    sent_at TIMESTAMPTZ NOT NULL, -- Heure d'envoi sur la plateforme
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Index pour performance
    CONSTRAINT unique_platform_message UNIQUE(platform_message_id, conversation_id)
);

-- =====================================================
-- 3. Table quick_replies (templates de réponse rapide)
-- =====================================================

CREATE TABLE quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    title VARCHAR(100) NOT NULL, -- "Merci pour ton message"
    content TEXT NOT NULL, -- Le texte de la réponse
    shortcut VARCHAR(20), -- Raccourci clavier, ex: "/merci"

    -- Catégorie
    category VARCHAR(50), -- 'support', 'vente', 'général'

    -- Plateformes
    platforms TEXT[], -- Si spécifique à certaines plateformes

    -- Métriques
    usage_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 4. Table conversation_notes (notes internes)
-- =====================================================

CREATE TABLE conversation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    note_text TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. Indexes pour performance
-- =====================================================

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_conversations_tags ON conversations USING GIN(tags);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_direction ON messages(direction);

CREATE INDEX idx_quick_replies_user_id ON quick_replies(user_id);
CREATE INDEX idx_quick_replies_shortcut ON quick_replies(shortcut);

-- =====================================================
-- 6. RLS Policies
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;

-- Conversations
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can insert own conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = assigned_to)
    WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to);

-- Messages
CREATE POLICY "Users can view messages from their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.user_id = auth.uid() OR conversations.assigned_to = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_id
            AND (conversations.user_id = auth.uid() OR conversations.assigned_to = auth.uid())
        )
    );

-- Quick Replies
CREATE POLICY "Users can manage own quick replies"
    ON quick_replies FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notes
CREATE POLICY "Users can manage conversation notes"
    ON conversation_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_id
            AND (conversations.user_id = auth.uid() OR conversations.assigned_to = auth.uid())
        )
    );

-- =====================================================
-- 7. Triggers
-- =====================================================

-- Update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Update message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        message_count = message_count + 1,
        last_message_at = NEW.sent_at,
        last_customer_message_at = CASE WHEN NEW.direction = 'inbound' THEN NEW.sent_at ELSE last_customer_message_at END,
        last_brand_reply_at = CASE WHEN NEW.direction = 'outbound' THEN NEW.sent_at ELSE last_brand_reply_at END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_count_on_insert
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- =====================================================
-- 8. Functions utiles
-- =====================================================

-- Fonction pour calculer le temps de première réponse
CREATE OR REPLACE FUNCTION calculate_first_response_time()
RETURNS TRIGGER AS $$
DECLARE
    first_inbound TIMESTAMPTZ;
    first_outbound TIMESTAMPTZ;
    response_time_minutes INTEGER;
BEGIN
    IF NEW.direction = 'outbound' AND OLD.first_response_time_minutes IS NULL THEN
        -- Trouver le premier message inbound
        SELECT sent_at INTO first_inbound
        FROM messages
        WHERE conversation_id = NEW.conversation_id
        AND direction = 'inbound'
        ORDER BY sent_at ASC
        LIMIT 1;

        -- Calculer le temps de réponse
        IF first_inbound IS NOT NULL THEN
            response_time_minutes := EXTRACT(EPOCH FROM (NEW.sent_at - first_inbound)) / 60;

            UPDATE conversations
            SET first_response_time_minutes = response_time_minutes
            WHERE id = NEW.conversation_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_response_time
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION calculate_first_response_time();

-- =====================================================
-- 9. Vues utiles
-- =====================================================

-- Vue pour les conversations avec le dernier message
CREATE OR REPLACE VIEW conversations_with_last_message AS
SELECT
    c.*,
    m.text_content as last_message_text,
    m.sender_username as last_message_sender,
    m.direction as last_message_direction
FROM conversations c
LEFT JOIN LATERAL (
    SELECT *
    FROM messages
    WHERE conversation_id = c.id
    ORDER BY sent_at DESC
    LIMIT 1
) m ON true;

-- Vue pour les stats inbox par utilisateur
CREATE OR REPLACE VIEW inbox_stats AS
SELECT
    user_id,
    COUNT(*) FILTER (WHERE status = 'unread') as unread_count,
    COUNT(*) FILTER (WHERE status = 'read') as read_count,
    COUNT(*) FILTER (WHERE assigned_to IS NULL) as unassigned_count,
    AVG(first_response_time_minutes) FILTER (WHERE first_response_time_minutes IS NOT NULL) as avg_response_time_minutes,
    COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_sentiment_count
FROM conversations
GROUP BY user_id;

COMMENT ON TABLE conversations IS 'Unified inbox - all social conversations in one place';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE quick_replies IS 'Templates for quick responses';
