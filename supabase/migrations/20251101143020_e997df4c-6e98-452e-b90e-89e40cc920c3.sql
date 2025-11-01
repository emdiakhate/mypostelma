-- Créer la table subscriptions pour gérer les abonnements bêta
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  beta_user BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter colonnes à la table profiles pour les utilisateurs bêta
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS beta_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lead_generation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_generation_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS posts_unlimited BOOLEAN DEFAULT TRUE;

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour incrémenter le compteur de lead generation
CREATE OR REPLACE FUNCTION public.increment_lead_generation(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Récupérer le compteur actuel et la limite
  SELECT lead_generation_count, lead_generation_limit
  INTO v_current_count, v_limit
  FROM public.profiles
  WHERE id = p_user_id;

  -- Vérifier si la limite est atteinte
  IF v_current_count >= v_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Limite de génération de leads atteinte',
      'count', v_current_count,
      'limit', v_limit
    );
  END IF;

  -- Incrémenter le compteur
  UPDATE public.profiles
  SET lead_generation_count = lead_generation_count + 1,
      updated_at = now()
  WHERE id = p_user_id;

  -- Retourner le résultat
  RETURN jsonb_build_object(
    'success', true,
    'count', v_current_count + 1,
    'limit', v_limit,
    'remaining', v_limit - (v_current_count + 1)
  );
END;
$$;

-- Trigger pour mettre à jour updated_at dans subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_beta_user ON public.profiles(beta_user);

-- Commentaires
COMMENT ON TABLE public.subscriptions IS 'Gère les abonnements des utilisateurs incluant les utilisateurs bêta';
COMMENT ON COLUMN public.profiles.beta_user IS 'Indique si l''utilisateur est un utilisateur bêta';
COMMENT ON COLUMN public.profiles.lead_generation_count IS 'Nombre de leads générés par l''utilisateur';
COMMENT ON COLUMN public.profiles.lead_generation_limit IS 'Limite de génération de leads (5 pour les bêta users)';
COMMENT ON FUNCTION public.increment_lead_generation IS 'Incrémente le compteur de génération de leads avec vérification de limite';