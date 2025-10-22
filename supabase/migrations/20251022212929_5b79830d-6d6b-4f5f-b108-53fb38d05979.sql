-- Mettre à jour toutes les lignes qui ont 'owner', 'creator' ou 'viewer' vers 'manager'
UPDATE public.user_roles
SET role = 'manager'
WHERE role::text IN ('owner', 'creator', 'viewer');

-- Maintenant on peut modifier l'enum
-- Convertir temporairement en text
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;

-- Supprimer l'ancien enum
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Créer le nouvel enum avec seulement 'manager'
CREATE TYPE public.app_role AS ENUM ('manager');

-- Remettre le type sur la colonne
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role USING role::app_role;

-- Recréer la fonction has_role avec le bon type
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Mettre à jour la fonction handle_new_user pour assigner seulement 'manager'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Créer le profil
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Assigner le rôle manager par défaut
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  RETURN NEW;
END;
$$;