-- Migration: CRM IA System
-- Description: Création des tables pour le système CRM complet avec secteurs, segments, tags, campagnes et tâches
-- Date: 2025-11-26

-- ==============================================
-- 1. Table: crm_sectors (Secteurs d'activité)
-- ==============================================
CREATE TABLE IF NOT EXISTS crm_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Nom de l'icône Lucide (ex: 'Building', 'Utensils')
  color VARCHAR(20), -- Couleur hex (ex: '#3B82F6')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_sector_per_user UNIQUE(user_id, name)
);

-- Index pour améliorer les performances
CREATE INDEX idx_crm_sectors_user_id ON crm_sectors(user_id);

-- RLS Policies
ALTER TABLE crm_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sectors"
  ON crm_sectors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sectors"
  ON crm_sectors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sectors"
  ON crm_sectors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sectors"
  ON crm_sectors FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- 2. Table: crm_segments (Segments par secteur)
-- ==============================================
CREATE TABLE IF NOT EXISTS crm_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES crm_sectors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_segment_per_sector UNIQUE(sector_id, name)
);

-- Index
CREATE INDEX idx_crm_segments_sector_id ON crm_segments(sector_id);

-- RLS Policies
ALTER TABLE crm_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view segments of their sectors"
  ON crm_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
        AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert segments to their sectors"
  ON crm_segments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
        AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update segments of their sectors"
  ON crm_segments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
        AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete segments of their sectors"
  ON crm_segments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
        AND crm_sectors.user_id = auth.uid()
    )
  );

-- ==============================================
-- 3. Table: crm_tags (Tags pré-enregistrés)
-- ==============================================
CREATE TABLE IF NOT EXISTS crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES crm_sectors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  category VARCHAR(50), -- 'amenity', 'feature', 'service', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_tag_per_sector UNIQUE(sector_id, name)
);

-- Index
CREATE INDEX idx_crm_tags_sector_id ON crm_tags(sector_id);
CREATE INDEX idx_crm_tags_user_id ON crm_tags(user_id);

-- RLS Policies
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tags"
  ON crm_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their tags"
  ON crm_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their tags"
  ON crm_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their tags"
  ON crm_tags FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- 4. Modifier la table leads existante
-- ==============================================

-- Ajouter les nouvelles colonnes pour le CRM IA
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES crm_sectors(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES crm_segments(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER CHECK (score >= 1 AND score <= 5);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_hours JSONB;

-- Index
CREATE INDEX IF NOT EXISTS idx_leads_sector_id ON leads(sector_id);
CREATE INDEX IF NOT EXISTS idx_leads_segment_id ON leads(segment_id);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ==============================================
-- 5. Table: crm_campaigns (Campagnes marketing)
-- ==============================================
CREATE TABLE IF NOT EXISTS crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp', 'both')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'cancelled')),

  -- Ciblage
  target_sector_ids UUID[],
  target_segment_ids UUID[],
  target_cities TEXT[],
  target_tags TEXT[],
  target_status TEXT[], -- 'new', 'contacted', etc.

  -- Message
  subject TEXT,
  message TEXT NOT NULL,

  -- Programmation
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Statistiques
  total_leads INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_campaigns_user_id ON crm_campaigns(user_id);
CREATE INDEX idx_crm_campaigns_status ON crm_campaigns(status);
CREATE INDEX idx_crm_campaigns_scheduled_at ON crm_campaigns(scheduled_at);

-- RLS Policies
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their campaigns"
  ON crm_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their campaigns"
  ON crm_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their campaigns"
  ON crm_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their campaigns"
  ON crm_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- 6. Table: crm_lead_interactions (Historique)
-- ==============================================
CREATE TABLE IF NOT EXISTS crm_lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'whatsapp', 'call', 'meeting', 'note', 'status_change')),
  channel VARCHAR(20),
  status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'read', 'replied', 'failed')),

  subject TEXT,
  content TEXT,
  metadata JSONB, -- Données supplémentaires (ex: réponse, erreur, etc.)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_interactions_lead_id ON crm_lead_interactions(lead_id);
CREATE INDEX idx_crm_interactions_campaign_id ON crm_lead_interactions(campaign_id);
CREATE INDEX idx_crm_interactions_user_id ON crm_lead_interactions(user_id);
CREATE INDEX idx_crm_interactions_created_at ON crm_lead_interactions(created_at DESC);

-- RLS Policies
ALTER TABLE crm_lead_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions of their leads"
  ON crm_lead_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert interactions for their leads"
  ON crm_lead_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their interactions"
  ON crm_lead_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their interactions"
  ON crm_lead_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- 7. Table: crm_tasks (Tâches CRM)
-- ==============================================
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'followup', 'other')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_tasks_user_id ON crm_tasks(user_id);
CREATE INDEX idx_crm_tasks_lead_id ON crm_tasks(lead_id);
CREATE INDEX idx_crm_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX idx_crm_tasks_due_date ON crm_tasks(due_date);

-- RLS Policies
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tasks"
  ON crm_tasks FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can insert their tasks"
  ON crm_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their tasks"
  ON crm_tasks FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their tasks"
  ON crm_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- 8. Fonctions utilitaires
-- ==============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_crm_sectors_updated_at
  BEFORE UPDATE ON crm_sectors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_segments_updated_at
  BEFORE UPDATE ON crm_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_campaigns_updated_at
  BEFORE UPDATE ON crm_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON crm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. Données de démonstration (secteurs par défaut)
-- ==============================================

-- Cette partie sera exécutée côté application pour éviter les problèmes avec auth.uid()
-- Les secteurs par défaut seront créés lors du premier accès à la page Config CRM

-- ==============================================
-- 10. Vues utiles
-- ==============================================

-- Vue pour les statistiques de leads par secteur
CREATE OR REPLACE VIEW crm_leads_by_sector AS
SELECT
  s.id AS sector_id,
  s.name AS sector_name,
  s.user_id,
  COUNT(l.id) AS total_leads,
  COUNT(CASE WHEN l.status = 'new' THEN 1 END) AS new_leads,
  COUNT(CASE WHEN l.status = 'contacted' THEN 1 END) AS contacted_leads,
  COUNT(CASE WHEN l.status = 'interested' THEN 1 END) AS interested_leads,
  COUNT(CASE WHEN l.status = 'client' THEN 1 END) AS client_leads,
  ROUND(AVG(l.score), 2) AS avg_score
FROM crm_sectors s
LEFT JOIN leads l ON l.sector_id = s.id
GROUP BY s.id, s.name, s.user_id;

-- Vue pour les tâches en retard
CREATE OR REPLACE VIEW crm_overdue_tasks AS
SELECT *
FROM crm_tasks
WHERE status != 'completed'
  AND status != 'cancelled'
  AND due_date < NOW()
ORDER BY due_date ASC;

-- ==============================================
-- Fin de la migration
-- ==============================================

COMMENT ON TABLE crm_sectors IS 'Secteurs d''activité pour la catégorisation des leads (ex: Hôtellerie, Restauration)';
COMMENT ON TABLE crm_segments IS 'Segments au sein de chaque secteur (ex: 5 étoiles, Budget)';
COMMENT ON TABLE crm_tags IS 'Tags pré-enregistrés par secteur pour caractériser les leads';
COMMENT ON TABLE crm_campaigns IS 'Campagnes marketing par email ou WhatsApp';
COMMENT ON TABLE crm_lead_interactions IS 'Historique de toutes les interactions avec les leads';
COMMENT ON TABLE crm_tasks IS 'Tâches CRM (appels, emails, RDV à faire)';
