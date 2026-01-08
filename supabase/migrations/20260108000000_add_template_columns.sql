-- Ajouter les colonnes pour les templates par défaut

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS default_invoice_template TEXT DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS default_quote_template TEXT DEFAULT 'classic';

-- Mettre à jour les settings existants avec les valeurs par défaut
UPDATE public.company_settings
SET
  default_invoice_template = COALESCE(default_invoice_template, 'classic'),
  default_quote_template = COALESCE(default_quote_template, 'classic')
WHERE default_invoice_template IS NULL OR default_quote_template IS NULL;
