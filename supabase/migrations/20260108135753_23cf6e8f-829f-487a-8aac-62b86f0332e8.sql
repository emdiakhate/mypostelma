-- Ajouter les colonnes de templates par défaut à la table company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS default_invoice_template TEXT DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS default_quote_template TEXT DEFAULT 'classic';

-- Mettre à jour les enregistrements existants
UPDATE public.company_settings 
SET default_invoice_template = 'classic' 
WHERE default_invoice_template IS NULL;

UPDATE public.company_settings 
SET default_quote_template = 'classic' 
WHERE default_quote_template IS NULL;