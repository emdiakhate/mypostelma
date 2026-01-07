-- Ajouter la colonne file_path à la table compta_ocr_scans si elle n'existe pas
ALTER TABLE public.compta_ocr_scans 
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Mettre à jour file_path à partir de file_url pour les enregistrements existants
UPDATE public.compta_ocr_scans 
SET file_path = regexp_replace(file_url, '^.*/storage/v1/object/public/documents/', '')
WHERE file_path IS NULL AND file_url IS NOT NULL;