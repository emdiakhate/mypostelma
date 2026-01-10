-- Migration: Ajouter signature aux paramètres d'entreprise

-- Ajouter colonne signature_url
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Commentaire
COMMENT ON COLUMN public.company_settings.signature_url IS 'URL de l''image de signature pour les documents (factures, devis)';
