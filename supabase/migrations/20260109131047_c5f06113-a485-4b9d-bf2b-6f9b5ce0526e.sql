-- Add signature_url column to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.company_settings.signature_url IS 'URL of the company signature image for documents';