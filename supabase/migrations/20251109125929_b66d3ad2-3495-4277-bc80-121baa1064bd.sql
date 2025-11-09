-- Corriger la fonction increment_ai_image_generation sans updated_at
CREATE OR REPLACE FUNCTION increment_ai_image_generation(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_profile RECORD;
  v_new_count INTEGER;
BEGIN
  SELECT 
    COALESCE(ai_image_generation_count, 0) as current_count,
    COALESCE(ai_image_generation_limit, 15) as limit,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corriger la fonction increment_ai_video_generation sans updated_at
CREATE OR REPLACE FUNCTION increment_ai_video_generation(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_profile RECORD;
  v_new_count INTEGER;
BEGIN
  SELECT 
    COALESCE(ai_video_generation_count, 0) as current_count,
    COALESCE(ai_video_generation_limit, 5) as limit,
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
  SET ai_video_generation_count = COALESCE(ai_video_generation_count, 0) + 1
  WHERE id = p_user_id
  RETURNING COALESCE(ai_video_generation_count, 0) INTO v_new_count;

  RETURN json_build_object(
    'success', true,
    'new_count', v_new_count,
    'remaining', GREATEST(0, v_profile.limit - v_new_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corriger la fonction reset_user_quotas sans updated_at
CREATE OR REPLACE FUNCTION reset_user_quotas(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  UPDATE profiles
  SET 
    ai_image_generation_count = 0,
    ai_video_generation_count = 0,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;