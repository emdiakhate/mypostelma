-- Fonction pour obtenir les quotas d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_quotas(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_profile RECORD;
  v_result JSON;
BEGIN
  SELECT 
    COALESCE(ai_image_count, 0) as ai_image_count,
    COALESCE(ai_image_limit, 15) as ai_image_limit,
    COALESCE(ai_video_count, 0) as ai_video_count,
    COALESCE(ai_video_limit, 5) as ai_video_limit,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de génération d'images IA
CREATE OR REPLACE FUNCTION increment_ai_image_generation(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_profile RECORD;
  v_new_count INTEGER;
BEGIN
  SELECT 
    COALESCE(ai_image_count, 0) as current_count,
    COALESCE(ai_image_limit, 15) as limit,
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
  SET ai_image_count = COALESCE(ai_image_count, 0) + 1
  WHERE id = p_user_id
  RETURNING COALESCE(ai_image_count, 0) INTO v_new_count;

  RETURN json_build_object(
    'success', true,
    'new_count', v_new_count,
    'remaining', GREATEST(0, v_profile.limit - v_new_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de génération de vidéos IA
CREATE OR REPLACE FUNCTION increment_ai_video_generation(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_profile RECORD;
  v_new_count INTEGER;
BEGIN
  SELECT 
    COALESCE(ai_video_count, 0) as current_count,
    COALESCE(ai_video_limit, 5) as limit,
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
      'message', format('Quota exceeded: %s/%s videos generated', v_profile.current_count, v_profile.limit)
    );
  END IF;

  -- Incrémenter le compteur
  UPDATE profiles
  SET ai_video_count = COALESCE(ai_video_count, 0) + 1
  WHERE id = p_user_id
  RETURNING COALESCE(ai_video_count, 0) INTO v_new_count;

  RETURN json_build_object(
    'success', true,
    'new_count', v_new_count,
    'remaining', GREATEST(0, v_profile.limit - v_new_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour réinitialiser les quotas d'un utilisateur
CREATE OR REPLACE FUNCTION reset_user_quotas(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  UPDATE profiles
  SET 
    ai_image_count = 0,
    ai_video_count = 0,
    lead_generation_count = 0,
    quota_reset_date = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Quotas reset successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;