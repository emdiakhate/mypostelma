-- =====================================================
-- CRM IA System - Complete Database Schema
-- Sprint 1: Secteurs, Segments, Tags, Leads enrichis
-- =====================================================

-- ==============================================
-- TABLE: crm_sectors (Secteurs d'activité)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.crm_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Nom de l'icône Lucide (ex: 'Store', 'Utensils', 'Building')
  color TEXT, -- Code couleur hex (ex: '#3B82F6')
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_crm_sectors_user_id ON public.crm_sectors(user_id);

-- RLS Policies
ALTER TABLE public.crm_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sectors"
  ON public.crm_sectors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sectors"
  ON public.crm_sectors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sectors"
  ON public.crm_sectors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sectors"
  ON public.crm_sectors FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_crm_sectors_updated_at
  BEFORE UPDATE ON public.crm_sectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- TABLE: crm_segments (Segments par secteur)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.crm_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES public.crm_sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_crm_segments_sector_id ON public.crm_segments(sector_id);

-- RLS Policies
ALTER TABLE public.crm_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view segments of their sectors"
  ON public.crm_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
      AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create segments in their sectors"
  ON public.crm_segments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
      AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update segments in their sectors"
  ON public.crm_segments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
      AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete segments in their sectors"
  ON public.crm_segments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
      AND crm_sectors.user_id = auth.uid()
    )
  );

-- Trigger pour updated_at
CREATE TRIGGER update_crm_segments_updated_at
  BEFORE UPDATE ON public.crm_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- TABLE: crm_tags (Tags réutilisables)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES public.crm_sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- 'amenity', 'feature', 'service', 'other'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_crm_tags_user_id ON public.crm_tags(user_id);
CREATE INDEX idx_crm_tags_sector_id ON public.crm_tags(sector_id);

-- RLS Policies
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags"
  ON public.crm_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON public.crm_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.crm_tags FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- EXTENSION: leads table (ajouter colonnes CRM)
-- ==============================================

-- Ajouter colonnes secteur/segment à la table leads existante
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.crm_sectors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES public.crm_segments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS score INTEGER CHECK (score >= 1 AND score <= 5),
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2,1) CHECK (google_rating >= 0 AND google_rating <= 5),
  ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_leads_sector_id ON public.leads(sector_id);
CREATE INDEX IF NOT EXISTS idx_leads_segment_id ON public.leads(segment_id);
CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- ==============================================
-- TABLE: crm_campaigns (Campagnes marketing)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'both')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'cancelled')),
  
  -- Ciblage
  target_sector_ids UUID[],
  target_segment_ids UUID[],
  target_cities TEXT[],
  target_tags TEXT[],
  target_status TEXT[],
  
  -- Message
  subject TEXT,
  message TEXT NOT NULL,
  
  -- Programmation
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Statistiques
  total_leads INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  replied_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_crm_campaigns_user_id ON public.crm_campaigns(user_id);
CREATE INDEX idx_crm_campaigns_status ON public.crm_campaigns(status);

-- RLS Policies
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns"
  ON public.crm_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON public.crm_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.crm_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON public.crm_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_crm_campaigns_updated_at
  BEFORE UPDATE ON public.crm_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- TABLE: crm_lead_interactions (Historique)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.crm_lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.crm_campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'call', 'meeting', 'note', 'status_change')),
  channel TEXT,
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'replied', 'failed')),
  
  subject TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_crm_lead_interactions_lead_id ON public.crm_lead_interactions(lead_id);
CREATE INDEX idx_crm_lead_interactions_campaign_id ON public.crm_lead_interactions(campaign_id);
CREATE INDEX idx_crm_lead_interactions_user_id ON public.crm_lead_interactions(user_id);
CREATE INDEX idx_crm_lead_interactions_created_at ON public.crm_lead_interactions(created_at DESC);

-- RLS Policies
ALTER TABLE public.crm_lead_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions for their leads"
  ON public.crm_lead_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = crm_lead_interactions.lead_id
      AND leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create interactions for their leads"
  ON public.crm_lead_interactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = crm_lead_interactions.lead_id
      AND leads.user_id = auth.uid()
    )
  );

-- ==============================================
-- TABLE: crm_tasks (Tâches CRM)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'followup', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_crm_tasks_user_id ON public.crm_tasks(user_id);
CREATE INDEX idx_crm_tasks_lead_id ON public.crm_tasks(lead_id);
CREATE INDEX idx_crm_tasks_assigned_to ON public.crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_status ON public.crm_tasks(status);
CREATE INDEX idx_crm_tasks_due_date ON public.crm_tasks(due_date);

-- RLS Policies
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks or assigned tasks"
  ON public.crm_tasks FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can create their own tasks"
  ON public.crm_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks or assigned tasks"
  ON public.crm_tasks FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their own tasks"
  ON public.crm_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- VIEW: crm_leads_by_sector (Stats par secteur)
-- ==============================================
CREATE OR REPLACE VIEW public.crm_leads_by_sector AS
SELECT 
  s.id AS sector_id,
  s.user_id,
  s.name AS sector_name,
  COUNT(l.id) AS total_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'new') AS new_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'contacted') AS contacted_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'interested') AS interested_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'client') AS client_leads,
  AVG(l.score) AS avg_score
FROM public.crm_sectors s
LEFT JOIN public.leads l ON l.sector_id = s.id
GROUP BY s.id, s.user_id, s.name;

-- ==============================================
-- COMMENTS (Documentation)
-- ==============================================
COMMENT ON TABLE public.crm_sectors IS 'Secteurs d''activité pour le CRM (ex: Restaurants, Boutiques, Services)';
COMMENT ON TABLE public.crm_segments IS 'Segments dans chaque secteur (ex: Fast-food, Gastronomique pour Restaurants)';
COMMENT ON TABLE public.crm_tags IS 'Tags réutilisables pour qualifier les leads (ex: Terrasse, Parking, Wifi)';
COMMENT ON TABLE public.crm_campaigns IS 'Campagnes marketing multi-canal (email, WhatsApp)';
COMMENT ON TABLE public.crm_lead_interactions IS 'Historique de toutes les interactions avec les leads';
COMMENT ON TABLE public.crm_tasks IS 'Tâches CRM assignables avec rappels';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'CRM IA System created successfully!';
  RAISE NOTICE 'Tables created: crm_sectors, crm_segments, crm_tags, crm_campaigns, crm_lead_interactions, crm_tasks';
  RAISE NOTICE 'Leads table extended with sector_id, segment_id, score, and additional fields';
  RAISE NOTICE 'All RLS policies configured';
END $$;