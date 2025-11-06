-- Migration: Système de quotas pour beta-testeurs
-- Date: 2025-11-06
-- Description: Ajoute les compteurs pour images IA, vidéos IA et ajuste les limites de recherche leads

-- =============================================================================
-- 1. AJOUT DES COLONNES DE QUOTAS DANS LA TABLE PROFILES
-- =============================================================================

-- Quotas pour génération d'images IA
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_image_generation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_image_generation_limit INTEGER DEFAULT 15;

-- Quotas pour génération de vidéos IA
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_video_generation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_video_generation_limit INTEGER DEFAULT 5;

-- Ajout d'une colonne pour tracker la date de reset (pour reset mensuel si nécessaire)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS quota_reset_date TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- 2. COMMENTAIRES POUR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.profiles.ai_image_generation_count IS 'Nombre d''images IA générées par l''utilisateur beta';
COMMENT ON COLUMN public.profiles.ai_image_generation_limit IS 'Limite de génération d''images IA (15 pour les beta-testeurs)';
COMMENT ON COLUMN public.profiles.ai_video_generation_count IS 'Nombre de vidéos IA générées par l''utilisateur beta';
COMMENT ON COLUMN public.profiles.ai_video_generation_limit IS 'Limite de génération de vidéos IA (5 pour les beta-testeurs)';
COMMENT ON COLUMN public.profiles.quota_reset_date IS 'Date du dernier reset des quotas (pour reset mensuel futur)';

-- =============================================================================
-- 3. FONCTION: Incrémenter le compteur d'images IA
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_ai_image_generation(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_beta_user BOOLEAN;
BEGIN
  -- Récupérer les informations actuelles
  SELECT
    ai_image_generation_count,
    ai_image_generation_limit,
    beta_user
  INTO
    v_current_count,
    v_limit,
    v_beta_user
  FROM public.profiles
  WHERE id = p_user_id;

  -- Si l'utilisateur n'existe pas
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found',
      'count', 0,
      'limit', 0
    );
  END IF;

  -- Si l'utilisateur est beta et a atteint sa limite
  IF v_beta_user AND v_current_count >= v_limit THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quota exceeded',
      'message', 'Vous avez atteint votre limite de génération d''images IA. Limite: ' || v_limit,
      'count', v_current_count,
      'limit', v_limit
    );
  END IF;

  -- Incrémenter le compteur
  UPDATE public.profiles
  SET
    ai_image_generation_count = ai_image_generation_count + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Retourner le nouveau compteur
  RETURN json_build_object(
    'success', true,
    'count', v_current_count + 1,
    'limit', v_limit,
    'remaining', v_limit - (v_current_count + 1)
  );
END;
$$;

-- =============================================================================
-- 4. FONCTION: Incrémenter le compteur de vidéos IA
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_ai_video_generation(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_beta_user BOOLEAN;
BEGIN
  -- Récupérer les informations actuelles
  SELECT
    ai_video_generation_count,
    ai_video_generation_limit,
    beta_user
  INTO
    v_current_count,
    v_limit,
    v_beta_user
  FROM public.profiles
  WHERE id = p_user_id;

  -- Si l'utilisateur n'existe pas
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found',
      'count', 0,
      'limit', 0
    );
  END IF;

  -- Si l'utilisateur est beta et a atteint sa limite
  IF v_beta_user AND v_current_count >= v_limit THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quota exceeded',
      'message', 'Vous avez atteint votre limite de génération de vidéos IA. Limite: ' || v_limit,
      'count', v_current_count,
      'limit', v_limit
    );
  END IF;

  -- Incrémenter le compteur
  UPDATE public.profiles
  SET
    ai_video_generation_count = ai_video_generation_count + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Retourner le nouveau compteur
  RETURN json_build_object(
    'success', true,
    'count', v_current_count + 1,
    'limit', v_limit,
    'remaining', v_limit - (v_current_count + 1)
  );
END;
$$;

-- =============================================================================
-- 5. FONCTION: Récupérer tous les quotas d'un utilisateur
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_quotas(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'ai_images', json_build_object(
      'count', COALESCE(ai_image_generation_count, 0),
      'limit', COALESCE(ai_image_generation_limit, 15),
      'remaining', COALESCE(ai_image_generation_limit, 15) - COALESCE(ai_image_generation_count, 0)
    ),
    'ai_videos', json_build_object(
      'count', COALESCE(ai_video_generation_count, 0),
      'limit', COALESCE(ai_video_generation_limit, 5),
      'remaining', COALESCE(ai_video_generation_limit, 5) - COALESCE(ai_video_generation_count, 0)
    ),
    'lead_searches', json_build_object(
      'count', COALESCE(lead_generation_count, 0),
      'limit', COALESCE(lead_generation_limit, 5),
      'remaining', COALESCE(lead_generation_limit, 5) - COALESCE(lead_generation_count, 0)
    ),
    'beta_user', COALESCE(beta_user, false),
    'quota_reset_date', quota_reset_date
  )
  INTO v_result
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- 6. FONCTION: Reset des quotas (pour administration)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.reset_user_quotas(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET
    ai_image_generation_count = 0,
    ai_video_generation_count = 0,
    lead_generation_count = 0,
    quota_reset_date = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Quotas reset successfully',
      'reset_date', NOW()
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
END;
$$;

-- =============================================================================
-- 7. INITIALISATION DES QUOTAS POUR LES UTILISATEURS EXISTANTS
-- =============================================================================

-- Mettre à jour tous les utilisateurs beta existants avec les nouvelles limites
UPDATE public.profiles
SET
  ai_image_generation_count = 0,
  ai_image_generation_limit = 15,
  ai_video_generation_count = 0,
  ai_video_generation_limit = 5,
  quota_reset_date = NOW()
WHERE beta_user = true
  AND (ai_image_generation_limit IS NULL OR ai_video_generation_limit IS NULL);

-- =============================================================================
-- 8. TRIGGER: Initialiser les quotas pour les nouveaux utilisateurs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.initialize_beta_quotas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si l'utilisateur est marqué comme beta, initialiser les quotas
  IF NEW.beta_user = true THEN
    NEW.ai_image_generation_count := 0;
    NEW.ai_image_generation_limit := 15;
    NEW.ai_video_generation_count := 0;
    NEW.ai_video_generation_limit := 5;
    NEW.lead_generation_count := 0;
    NEW.lead_generation_limit := 5;
    NEW.quota_reset_date := NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger si nécessaire
DROP TRIGGER IF EXISTS trigger_initialize_beta_quotas ON public.profiles;
CREATE TRIGGER trigger_initialize_beta_quotas
  BEFORE INSERT OR UPDATE OF beta_user ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_beta_quotas();

-- =============================================================================
-- 9. COMMENTAIRES SUR LES FONCTIONS
-- =============================================================================

COMMENT ON FUNCTION public.increment_ai_image_generation IS 'Incrémente le compteur de génération d''images IA avec vérification de quota';
COMMENT ON FUNCTION public.increment_ai_video_generation IS 'Incrémente le compteur de génération de vidéos IA avec vérification de quota';
COMMENT ON FUNCTION public.get_user_quotas IS 'Récupère tous les quotas d''un utilisateur (images, vidéos, leads)';
COMMENT ON FUNCTION public.reset_user_quotas IS 'Reset tous les compteurs de quotas pour un utilisateur (admin only)';
COMMENT ON FUNCTION public.initialize_beta_quotas IS 'Initialise automatiquement les quotas pour les nouveaux utilisateurs beta';

-- =============================================================================
-- 10. GRANTS (Permissions)
-- =============================================================================

-- Permettre aux utilisateurs authentifiés d'appeler les fonctions de quotas
GRANT EXECUTE ON FUNCTION public.increment_ai_image_generation TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_video_generation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_quotas TO authenticated;

-- La fonction reset est réservée aux admins (via service_role_key)
REVOKE EXECUTE ON FUNCTION public.reset_user_quotas FROM authenticated;

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================
