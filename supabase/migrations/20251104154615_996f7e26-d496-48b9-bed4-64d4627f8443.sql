-- Fonction pour générer automatiquement l'upload_post_username
CREATE OR REPLACE FUNCTION generate_upload_post_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Si upload_post_username n'est pas déjà défini et qu'on a un nom
  IF NEW.upload_post_username IS NULL AND NEW.name IS NOT NULL THEN
    -- Générer le username: nom en minuscules, espaces -> underscores, + 8 premiers chars de l'UUID
    NEW.upload_post_username := LOWER(
      REGEXP_REPLACE(
        TRIM(NEW.name),
        '[^a-zA-Z0-9_@-]',
        '_',
        'g'
      )
    ) || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour les nouveaux profils et mises à jour
DROP TRIGGER IF EXISTS set_upload_post_username ON public.profiles;
CREATE TRIGGER set_upload_post_username
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_upload_post_username();

-- Mettre à jour les profils existants qui n'ont pas d'upload_post_username
UPDATE public.profiles
SET upload_post_username = LOWER(
  REGEXP_REPLACE(
    TRIM(name),
    '[^a-zA-Z0-9_@-]',
    '_',
    'g'
  )
) || '_' || SUBSTRING(id::text, 1, 8)
WHERE upload_post_username IS NULL AND name IS NOT NULL;