-- Ajouter une colonne pour stocker le username Upload-Post
ALTER TABLE public.profiles
ADD COLUMN upload_post_username TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX idx_profiles_upload_post_username ON public.profiles(upload_post_username);