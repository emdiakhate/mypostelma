-- Mettre à jour la limite d'images IA de 15 à 5
UPDATE profiles 
SET ai_image_generation_limit = 5 
WHERE ai_image_generation_limit = 15;

-- Mettre à jour la fonction initialize_beta_quotas pour utiliser la nouvelle limite
CREATE OR REPLACE FUNCTION public.initialize_beta_quotas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Si l'utilisateur est marqué comme beta, initialiser les quotas
  IF NEW.beta_user = true THEN
    NEW.ai_image_generation_count := 0;
    NEW.ai_image_generation_limit := 5;
    NEW.ai_video_generation_count := 0;
    NEW.ai_video_generation_limit := 5;
    NEW.lead_generation_count := 0;
    NEW.lead_generation_limit := 5;
    NEW.quota_reset_date := NOW();
  END IF;

  RETURN NEW;
END;
$function$;

-- Mettre à jour la fonction get_user_quotas pour utiliser la nouvelle limite par défaut
CREATE OR REPLACE FUNCTION public.get_user_quotas(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile RECORD;
  v_result JSON;
BEGIN
  SELECT 
    COALESCE(ai_image_generation_count, 0) as ai_image_count,
    COALESCE(ai_image_generation_limit, 5) as ai_image_limit,
    COALESCE(ai_video_generation_count, 0) as ai_video_count,
    COALESCE(ai_video_generation_limit, 5) as ai_video_limit,
    COALESCE(lead_generation_count, 0) as lead_generation_count,
    COALESCE(lead_generation_limit, 5) as lead_generation_limit,
    COALESCE(beta_user, false) as beta_user,
    COALESCE(quota_reset_date, NOW()) as quota_reset_date
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  v_result := json_build_object(
    'ai_images', json_build_object(
      'count', v_profile.ai_image_count,
      'limit', v_profile.ai_image_limit,
      'remaining', GREATEST(0, v_profile.ai_image_limit - v_profile.ai_image_count)
    ),
    'ai_videos', json_build_object(
      'count', v_profile.ai_video_count,
      'limit', v_profile.ai_video_limit,
      'remaining', GREATEST(0, v_profile.ai_video_limit - v_profile.ai_video_count)
    ),
    'lead_searches', json_build_object(
      'count', v_profile.lead_generation_count,
      'limit', v_profile.lead_generation_limit,
      'remaining', GREATEST(0, v_profile.lead_generation_limit - v_profile.lead_generation_count)
    ),
    'beta_user', v_profile.beta_user,
    'quota_reset_date', v_profile.quota_reset_date
  );

  RETURN v_result;
END;
$function$;

-- Mettre à jour la fonction increment_ai_image_generation pour utiliser la nouvelle limite par défaut
CREATE OR REPLACE FUNCTION public.increment_ai_image_generation(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile RECORD;
  v_new_count INTEGER;
BEGIN
  SELECT 
    COALESCE(ai_image_generation_count, 0) as current_count,
    COALESCE(ai_image_generation_limit, 5) as limit,
    COALESCE(beta_user, false) as is_beta
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  -- Si l'utilisateur est beta et a atteint sa limite
  IF v_profile.is_beta AND v_profile.current_count >= v_profile.limit THEN
    RETURN json_build_object(
      'success', false,
      'message', format('Quota exceeded: %s/%s images generated', v_profile.current_count, v_profile.limit)
    );
  END IF;

  -- Incrémenter le compteur
  UPDATE profiles
  SET ai_image_generation_count = COALESCE(ai_image_generation_count, 0) + 1
  WHERE id = p_user_id
  RETURNING COALESCE(ai_image_generation_count, 0) INTO v_new_count;

  RETURN json_build_object(
    'success', true,
    'new_count', v_new_count,
    'remaining', GREATEST(0, v_profile.limit - v_new_count)
  );
END;
$function$;

-- Mettre à jour la fonction handle_new_user pour utiliser la nouvelle limite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    5,     -- Images IA limit (modifié de 15 à 5)
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
$function$;