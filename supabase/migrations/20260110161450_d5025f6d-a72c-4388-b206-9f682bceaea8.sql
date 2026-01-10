-- Migration: Système de gestion de caisse et boutiques
-- Créé le 2026-01-10
-- Description: Tables pour gérer les boutiques physiques, le stock par boutique, et les caisses journalières

-- =====================================================
-- 1. TABLE BOUTIQUES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  telephone TEXT,
  email TEXT,
  responsable_nom TEXT,
  responsable_telephone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'inactive', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.boutiques IS 'Boutiques physiques de l''entreprise';
COMMENT ON COLUMN public.boutiques.statut IS 'Statut de la boutique: active, inactive, closed';

-- Index
CREATE INDEX IF NOT EXISTS idx_boutiques_user_id ON public.boutiques(user_id);
CREATE INDEX IF NOT EXISTS idx_boutiques_statut ON public.boutiques(statut);

-- =====================================================
-- 2. TABLE CAISSES JOURNALIÈRES (créée avant stock_movements pour éviter les dépendances)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.caisses_journalieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Ouverture
  solde_ouverture DECIMAL(15, 2) DEFAULT 0,
  heure_ouverture TIMESTAMPTZ,
  ouvert_par UUID REFERENCES auth.users(id),

  -- Clôture
  solde_cloture DECIMAL(15, 2),
  ecart DECIMAL(15, 2),
  heure_cloture TIMESTAMPTZ,
  cloture_par UUID REFERENCES auth.users(id),

  -- Statut
  statut TEXT DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'fermee')),

  -- Notes
  notes_ouverture TEXT,
  notes_cloture TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte: une seule caisse par boutique/jour
  UNIQUE(boutique_id, date)
);

COMMENT ON TABLE public.caisses_journalieres IS 'Caisses journalières par boutique';
COMMENT ON COLUMN public.caisses_journalieres.ecart IS 'Différence entre théorique et clôture réel';

-- Index
CREATE INDEX IF NOT EXISTS idx_caisses_boutique ON public.caisses_journalieres(boutique_id);
CREATE INDEX IF NOT EXISTS idx_caisses_date ON public.caisses_journalieres(date);
CREATE INDEX IF NOT EXISTS idx_caisses_statut ON public.caisses_journalieres(statut);

-- =====================================================
-- 3. TABLE MOUVEMENTS CAISSE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mouvements_caisse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caisse_id UUID NOT NULL REFERENCES public.caisses_journalieres(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('vente', 'entree', 'sortie')),
  montant DECIMAL(15, 2) NOT NULL,
  moyen_paiement TEXT NOT NULL CHECK (moyen_paiement IN ('cash', 'mobile_money', 'carte', 'cheque', 'virement')),
  reference_type TEXT CHECK (reference_type IN ('vente', 'depense', 'ajustement', 'depot', 'retrait')),
  reference_id UUID,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.mouvements_caisse IS 'Tous les mouvements de caisse (ventes, entrées, sorties)';
COMMENT ON COLUMN public.mouvements_caisse.type IS 'Type: vente, entree (dépôt/ajustement+), sortie (dépense/ajustement-)';
COMMENT ON COLUMN public.mouvements_caisse.moyen_paiement IS 'Moyen de paiement utilisé';

-- Index
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_caisse_id ON public.mouvements_caisse(caisse_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_type ON public.mouvements_caisse(type);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_moyen ON public.mouvements_caisse(moyen_paiement);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_reference ON public.mouvements_caisse(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_created_at ON public.mouvements_caisse(created_at);

-- =====================================================
-- 4. MODIFICATION TABLE VENTE_ORDERS (ajouter colonnes boutique et caisse)
-- =====================================================
ALTER TABLE public.vente_orders
ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES public.boutiques(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS caisse_id UUID REFERENCES public.caisses_journalieres(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS moyen_paiement TEXT DEFAULT 'cash';

-- Add constraint separately to avoid error if column exists with different constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vente_orders_moyen_paiement_check'
  ) THEN
    ALTER TABLE public.vente_orders 
    ADD CONSTRAINT vente_orders_moyen_paiement_check 
    CHECK (moyen_paiement IN ('cash', 'mobile_money', 'carte', 'cheque', 'virement'));
  END IF;
END $$;

COMMENT ON COLUMN public.vente_orders.boutique_id IS 'Boutique où la vente a été effectuée';
COMMENT ON COLUMN public.vente_orders.caisse_id IS 'Caisse journalière associée';
COMMENT ON COLUMN public.vente_orders.moyen_paiement IS 'Moyen de paiement utilisé pour cette vente';

-- Index
CREATE INDEX IF NOT EXISTS idx_orders_boutique ON public.vente_orders(boutique_id);
CREATE INDEX IF NOT EXISTS idx_orders_caisse ON public.vente_orders(caisse_id);

-- =====================================================
-- 5. FONCTION: CALCULER SOLDE THÉORIQUE CAISSE
-- =====================================================
CREATE OR REPLACE FUNCTION calculer_solde_theorique_caisse(p_caisse_id UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_solde_ouverture DECIMAL(15, 2);
  v_total_mouvements DECIMAL(15, 2);
BEGIN
  -- Récupérer solde ouverture
  SELECT solde_ouverture INTO v_solde_ouverture
  FROM public.caisses_journalieres
  WHERE id = p_caisse_id;

  -- Calculer total des mouvements
  SELECT COALESCE(SUM(
    CASE
      WHEN type IN ('vente', 'entree') THEN montant
      WHEN type = 'sortie' THEN -montant
      ELSE 0
    END
  ), 0) INTO v_total_mouvements
  FROM public.mouvements_caisse
  WHERE caisse_id = p_caisse_id;

  RETURN COALESCE(v_solde_ouverture, 0) + COALESCE(v_total_mouvements, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION calculer_solde_theorique_caisse IS 'Calcule le solde théorique d''une caisse';

-- =====================================================
-- 6. TRIGGER: AUTO-UPDATE TIMESTAMPS pour boutiques
-- =====================================================
DROP TRIGGER IF EXISTS update_boutiques_updated_at ON public.boutiques;
CREATE TRIGGER update_boutiques_updated_at
  BEFORE UPDATE ON public.boutiques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_caisses_updated_at ON public.caisses_journalieres;
CREATE TRIGGER update_caisses_updated_at
  BEFORE UPDATE ON public.caisses_journalieres
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caisses_journalieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_caisse ENABLE ROW LEVEL SECURITY;

-- Policies pour boutiques
DROP POLICY IF EXISTS "Users can view their own boutiques" ON public.boutiques;
CREATE POLICY "Users can view their own boutiques"
  ON public.boutiques FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own boutiques" ON public.boutiques;
CREATE POLICY "Users can create their own boutiques"
  ON public.boutiques FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own boutiques" ON public.boutiques;
CREATE POLICY "Users can update their own boutiques"
  ON public.boutiques FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own boutiques" ON public.boutiques;
CREATE POLICY "Users can delete their own boutiques"
  ON public.boutiques FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour caisses_journalieres
DROP POLICY IF EXISTS "Users can view their boutiques caisses" ON public.caisses_journalieres;
CREATE POLICY "Users can view their boutiques caisses"
  ON public.caisses_journalieres FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boutiques
      WHERE id = caisses_journalieres.boutique_id
        AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create caisses for their boutiques" ON public.caisses_journalieres;
CREATE POLICY "Users can create caisses for their boutiques"
  ON public.caisses_journalieres FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.boutiques
      WHERE id = boutique_id
        AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their boutiques caisses" ON public.caisses_journalieres;
CREATE POLICY "Users can update their boutiques caisses"
  ON public.caisses_journalieres FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boutiques
      WHERE id = caisses_journalieres.boutique_id
        AND user_id = auth.uid()
    )
  );

-- Policies pour mouvements_caisse
DROP POLICY IF EXISTS "Users can view mouvements of their caisses" ON public.mouvements_caisse;
CREATE POLICY "Users can view mouvements of their caisses"
  ON public.mouvements_caisse FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caisses_journalieres c
      JOIN public.boutiques b ON b.id = c.boutique_id
      WHERE c.id = mouvements_caisse.caisse_id
        AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create mouvements for their caisses" ON public.mouvements_caisse;
CREATE POLICY "Users can create mouvements for their caisses"
  ON public.mouvements_caisse FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.caisses_journalieres c
      JOIN public.boutiques b ON b.id = c.boutique_id
      WHERE c.id = caisse_id
        AND b.user_id = auth.uid()
    )
  );