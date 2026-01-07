-- Add file_path column to compta_ocr_scans table
-- This stores the relative path in the storage bucket for easy download

ALTER TABLE public.compta_ocr_scans
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Backfill existing records by extracting filename from file_url
UPDATE public.compta_ocr_scans
SET file_path = SUBSTRING(file_url FROM '[^/]+$')
WHERE file_path IS NULL AND file_url IS NOT NULL;
