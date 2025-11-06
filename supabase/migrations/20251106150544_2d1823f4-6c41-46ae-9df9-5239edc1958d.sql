-- Modifier le trigger handle_new_user pour marquer automatiquement les nouveaux utilisateurs comme beta testeurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer le profil en tant que beta testeur avec quotas initialisés
  INSERT INTO public.profiles (
    id, 
    email, 
    name,
    beta_user,
    ai_image_generation_count,
    ai_image_generation_limit,
    ai_video_generation_count,
    ai_video_generation_limit,
    lead_generation_count,
    lead_generation_limit,
    quota_reset_date
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    true,  -- Marquer comme beta testeur
    0,     -- Images IA count
    15,    -- Images IA limit
    0,     -- Vidéos IA count
    5,     -- Vidéos IA limit
    0,     -- Leads count
    5,     -- Leads limit
    NOW()  -- Date de reset des quotas
  );
  
  -- Assigner le rôle manager par défaut
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  RETURN NEW;
END;
$$;