-- =====================================================
-- TEAMS & TEAM ROUTING
-- =====================================================
-- This migration adds support for teams and AI-powered message routing

-- =====================================================
-- 1. TEAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Team info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL, -- Hex color #FF5733

    -- Stats
    member_count INTEGER DEFAULT 0,
    conversation_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);

-- =====================================================
-- 2. TEAM MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Member info
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL si pas encore accepté
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member'

    -- Invitation
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(team_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- =====================================================
-- 3. CONVERSATION TEAMS (routing)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Routing info
    auto_assigned BOOLEAN DEFAULT true, -- Assigné par IA ou manuellement
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    ai_reasoning TEXT, -- Pourquoi l'IA a choisi cette équipe

    -- Assigned by
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(conversation_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_teams_conversation ON conversation_teams(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_teams_team ON conversation_teams(team_id);

-- =====================================================
-- 4. AI ANALYSIS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS message_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- AI Analysis
    analyzed_content TEXT, -- Le contenu analysé
    detected_intent VARCHAR(100), -- L'intention détectée
    detected_language VARCHAR(10), -- Langue détectée
    suggested_team_ids UUID[], -- IDs des équipes suggérées
    confidence_scores JSONB, -- Scores de confiance par équipe

    -- OpenAI metadata
    model_used VARCHAR(50),
    tokens_used INTEGER,
    processing_time_ms INTEGER,

    -- Timestamps
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_ai_analysis_message ON message_ai_analysis(message_id);
CREATE INDEX IF NOT EXISTS idx_message_ai_analysis_conversation ON message_ai_analysis(conversation_id);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own teams" ON teams;
CREATE POLICY "Users can view their own teams"
    ON teams FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own teams" ON teams;
CREATE POLICY "Users can create their own teams"
    ON teams FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own teams" ON teams;
CREATE POLICY "Users can update their own teams"
    ON teams FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own teams" ON teams;
CREATE POLICY "Users can delete their own teams"
    ON teams FOR DELETE
    USING (auth.uid() = user_id);

-- Team Members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their teams" ON team_members;
CREATE POLICY "Users can view members of their teams"
    ON team_members FOR SELECT
    USING (
        team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
        OR user_id = auth.uid()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Team owners can manage members" ON team_members;
CREATE POLICY "Team owners can manage members"
    ON team_members FOR ALL
    USING (
        team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
    );

-- Conversation Teams
ALTER TABLE conversation_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view conversation teams" ON conversation_teams;
CREATE POLICY "Users can view conversation teams"
    ON conversation_teams FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage conversation teams" ON conversation_teams;
CREATE POLICY "Users can manage conversation teams"
    ON conversation_teams FOR ALL
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- AI Analysis Log
ALTER TABLE message_ai_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view AI analysis of their messages" ON message_ai_analysis;
CREATE POLICY "Users can view AI analysis of their messages"
    ON message_ai_analysis FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Update team member count
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE teams
        SET member_count = member_count + 1
        WHERE id = NEW.team_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE teams
        SET member_count = member_count - 1
        WHERE id = OLD.team_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_team_member_count ON team_members;
CREATE TRIGGER trigger_update_team_member_count
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_member_count();

-- Update team conversation count
CREATE OR REPLACE FUNCTION update_team_conversation_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE teams
        SET conversation_count = conversation_count + 1
        WHERE id = NEW.team_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE teams
        SET conversation_count = conversation_count - 1
        WHERE id = OLD.team_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_team_conversation_count ON conversation_teams;
CREATE TRIGGER trigger_update_team_conversation_count
    AFTER INSERT OR DELETE ON conversation_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_team_conversation_count();

-- Update team timestamp
CREATE OR REPLACE FUNCTION update_team_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_team_timestamp ON teams;
CREATE TRIGGER trigger_update_team_timestamp
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_team_timestamp();

-- =====================================================
-- 7. VIEWS
-- =====================================================

-- Teams with stats
CREATE OR REPLACE VIEW teams_with_stats AS
SELECT
    t.*,
    COUNT(DISTINCT tm.id) as active_members,
    COUNT(DISTINCT ct.conversation_id) as assigned_conversations
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.status = 'accepted'
LEFT JOIN conversation_teams ct ON ct.team_id = t.id
GROUP BY t.id;

GRANT SELECT ON teams_with_stats TO authenticated;

-- Conversations with teams
CREATE OR REPLACE VIEW conversations_with_teams AS
SELECT
    c.*,
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'team_id', t.id,
            'team_name', t.name,
            'team_color', t.color,
            'auto_assigned', ct.auto_assigned,
            'confidence_score', ct.confidence_score
        )
    ) FILTER (WHERE t.id IS NOT NULL) as teams
FROM conversations c
LEFT JOIN conversation_teams ct ON ct.conversation_id = c.id
LEFT JOIN teams t ON t.id = ct.team_id
GROUP BY c.id;

GRANT SELECT ON conversations_with_teams TO authenticated;