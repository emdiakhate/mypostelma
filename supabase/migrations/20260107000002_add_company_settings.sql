-- Migration: Ajout des paramètres entreprise pour templates et logo
-- Créé le: 2026-01-07

-- Table des paramètres d'entreprise (1 par utilisateur)
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  logo_url TEXT, -- URL du logo dans Supabase Storage
  default_invoice_template TEXT DEFAULT 'classic' CHECK (default_invoice_template IN ('classic', 'minimal', 'modern')),
  default_quote_template TEXT DEFAULT 'classic' CHECK (default_quote_template IN ('classic', 'minimal', 'modern')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un seul settings par user
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_company_settings_user_id ON company_settings(user_id);

-- RLS: Activer
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Un utilisateur ne peut voir que ses propres settings
CREATE POLICY "Users can view their own company settings"
  ON company_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Un utilisateur peut insérer ses settings
CREATE POLICY "Users can insert their own company settings"
  ON company_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Un utilisateur peut mettre à jour ses settings
CREATE POLICY "Users can update their own company settings"
  ON company_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Un utilisateur peut supprimer ses settings
CREATE POLICY "Users can delete their own company settings"
  ON company_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

-- Commentaires
COMMENT ON TABLE company_settings IS 'Paramètres entreprise: logo, coordonnées, templates par défaut';
COMMENT ON COLUMN company_settings.logo_url IS 'URL du logo dans Supabase Storage (bucket: logos)';
COMMENT ON COLUMN company_settings.default_invoice_template IS 'Template par défaut pour les factures (classic, minimal, modern)';
COMMENT ON COLUMN company_settings.default_quote_template IS 'Template par défaut pour les devis (classic, minimal, modern)';
