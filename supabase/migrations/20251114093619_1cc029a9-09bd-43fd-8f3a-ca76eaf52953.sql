-- Ajouter les colonnes twitter_data et tiktok_data à la table competitor_analysis
ALTER TABLE competitor_analysis
ADD COLUMN IF NOT EXISTS twitter_data jsonb,
ADD COLUMN IF NOT EXISTS tiktok_data jsonb;