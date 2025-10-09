-- Modifier le trigger handle_new_user pour assigner automatiquement le rôle 'owner' au premier utilisateur
-- et le rôle 'viewer' aux utilisateurs suivants

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
BEGIN
  -- Créer le profil
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Compter le nombre d'utilisateurs existants
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- Assigner le rôle : 'owner' pour le premier utilisateur, 'viewer' pour les autres
  IF user_count = 0 THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'viewer';
  END IF;
  
  -- Créer le rôle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;