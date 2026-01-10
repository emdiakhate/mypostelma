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
CREATE INDEX idx_boutiques_user_id ON public.boutiques(user_id);
CREATE INDEX idx_boutiques_statut ON public.boutiques(statut);

-- =====================================================
-- 2. TABLE STOCK MOVEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE RESTRICT,
  produit_id UUID NOT NULL REFERENCES public.vente_products(id) ON DELETE RESTRICT,
  quantite INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entree', 'sortie', 'ajustement', 'transfert_out', 'transfert_in')),
  reference_type TEXT CHECK (reference_type IN ('vente', 'achat', 'ajustement', 'transfert', 'inventaire')),
  reference_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  notes TEXT,
  statut TEXT DEFAULT 'completed' CHECK (statut IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.stock_movements IS 'Tous les mouvements de stock par boutique - source unique de vérité';
COMMENT ON COLUMN public.stock_movements.quantite IS 'Quantité (positive pour entrée, négative pour sortie)';
COMMENT ON COLUMN public.stock_movements.type IS 'Type de mouvement: entree, sortie, ajustement, transfert_out, transfert_in';
COMMENT ON COLUMN public.stock_movements.reference_type IS 'Type de document référencé';
COMMENT ON COLUMN public.stock_movements.statut IS 'Statut du mouvement (pour transferts notamment)';

-- Index
CREATE INDEX idx_stock_movements_boutique ON public.stock_movements(boutique_id);
CREATE INDEX idx_stock_movements_produit ON public.stock_movements(produit_id);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(type);
CREATE INDEX idx_stock_movements_statut ON public.stock_movements(statut);
CREATE INDEX idx_stock_movements_reference ON public.stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);

-- =====================================================
-- 3. VUE MATÉRIALISÉE - STOCK ACTUEL PAR BOUTIQUE
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.stock_actuel AS
SELECT
  boutique_id,
  produit_id,
  SUM(quantite) as quantite_disponible,
  MAX(created_at) as derniere_mise_a_jour
FROM public.stock_movements
WHERE statut = 'completed'
GROUP BY boutique_id, produit_id
HAVING SUM(quantite) > 0;

COMMENT ON MATERIALIZED VIEW public.stock_actuel IS 'Vue matérialisée du stock actuel par boutique/produit';

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX idx_stock_actuel_boutique_produit ON public.stock_actuel(boutique_id, produit_id);
CREATE INDEX idx_stock_actuel_quantite ON public.stock_actuel(quantite_disponible);

-- =====================================================
-- 4. TABLE CAISSES JOURNALIÈRES
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
  solde_theorique DECIMAL(15, 2) GENERATED ALWAYS AS (
    solde_ouverture
  ) STORED,
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
COMMENT ON COLUMN public.caisses_journalieres.solde_theorique IS 'Solde calculé automatiquement (ouverture + mouvements)';
COMMENT ON COLUMN public.caisses_journalieres.ecart IS 'Différence entre théorique et clôture réel';

-- Index
CREATE INDEX idx_caisses_boutique ON public.caisses_journalieres(boutique_id);
CREATE INDEX idx_caisses_date ON public.caisses_journalieres(date);
CREATE INDEX idx_caisses_statut ON public.caisses_journalieres(statut);
CREATE UNIQUE INDEX idx_caisses_boutique_date ON public.caisses_journalieres(boutique_id, date);

-- =====================================================
-- 5. TABLE MOUVEMENTS CAISSE
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
CREATE INDEX idx_mouvements_caisse_caisse_id ON public.mouvements_caisse(caisse_id);
CREATE INDEX idx_mouvements_caisse_type ON public.mouvements_caisse(type);
CREATE INDEX idx_mouvements_caisse_moyen ON public.mouvements_caisse(moyen_paiement);
CREATE INDEX idx_mouvements_caisse_reference ON public.mouvements_caisse(reference_type, reference_id);
CREATE INDEX idx_mouvements_caisse_created_at ON public.mouvements_caisse(created_at);

-- =====================================================
-- 6. MODIFICATION TABLE VENTE_ORDERS
-- =====================================================
-- Ajouter colonnes boutique_id et caisse_id
ALTER TABLE public.vente_orders
ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES public.boutiques(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS caisse_id UUID REFERENCES public.caisses_journalieres(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS moyen_paiement TEXT DEFAULT 'cash' CHECK (moyen_paiement IN ('cash', 'mobile_money', 'carte', 'cheque', 'virement'));

COMMENT ON COLUMN public.vente_orders.boutique_id IS 'Boutique où la vente a été effectuée';
COMMENT ON COLUMN public.vente_orders.caisse_id IS 'Caisse journalière associée';
COMMENT ON COLUMN public.vente_orders.moyen_paiement IS 'Moyen de paiement utilisé pour cette vente';

-- Index
CREATE INDEX IF NOT EXISTS idx_orders_boutique ON public.vente_orders(boutique_id);
CREATE INDEX IF NOT EXISTS idx_orders_caisse ON public.vente_orders(caisse_id);

-- =====================================================
-- 7. FONCTION: RAFRAÎCHIR STOCK ACTUEL
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_stock_actuel()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.stock_actuel;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_stock_actuel IS 'Rafraîchit la vue matérialisée du stock actuel';

-- =====================================================
-- 8. FONCTION: CALCULER SOLDE THÉORIQUE CAISSE
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculer_solde_theorique_caisse IS 'Calcule le solde théorique d''une caisse';

-- =====================================================
-- 9. TRIGGER: AUTO-UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boutiques_updated_at
  BEFORE UPDATE ON public.boutiques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_caisses_updated_at
  BEFORE UPDATE ON public.caisses_journalieres
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. TRIGGER: EMPÊCHER STOCK NÉGATIF
-- =====================================================
CREATE OR REPLACE FUNCTION check_stock_negatif()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_actuel INTEGER;
BEGIN
  -- Calculer le stock actuel
  SELECT COALESCE(SUM(quantite), 0) INTO v_stock_actuel
  FROM public.stock_movements
  WHERE boutique_id = NEW.boutique_id
    AND produit_id = NEW.produit_id
    AND statut = 'completed';

  -- Vérifier si le nouveau mouvement rendrait le stock négatif
  IF (v_stock_actuel + NEW.quantite) < 0 THEN
    RAISE EXCEPTION 'Stock insuffisant: stock actuel = %, mouvement = %', v_stock_actuel, NEW.quantite;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_negative_stock
  BEFORE INSERT OR UPDATE ON public.stock_movements
  FOR EACH ROW
  WHEN (NEW.type IN ('sortie', 'transfert_out'))
  EXECUTE FUNCTION check_stock_negatif();

-- =====================================================
-- 11. TRIGGER: AUTO-RAFRAÎCHIR STOCK APRÈS MOUVEMENT
-- =====================================================
CREATE OR REPLACE FUNCTION auto_refresh_stock()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_stock_actuel();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_stock
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_refresh_stock();

-- =====================================================
-- 12. TRIGGER: EMPÊCHER DEUX CAISSES OUVERTES
-- =====================================================
CREATE OR REPLACE FUNCTION check_caisse_unique()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.caisses_journalieres
  WHERE boutique_id = NEW.boutique_id
    AND date = NEW.date
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Une caisse existe déjà pour cette boutique à cette date';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_caisse
  BEFORE INSERT OR UPDATE ON public.caisses_journalieres
  FOR EACH ROW
  EXECUTE FUNCTION check_caisse_unique();

-- =====================================================
-- 13. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caisses_journalieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_caisse ENABLE ROW LEVEL SECURITY;

-- Policies pour boutiques
CREATE POLICY "Users can view their own boutiques"
  ON public.boutiques FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boutiques"
  ON public.boutiques FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boutiques"
  ON public.boutiques FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour stock_movements
CREATE POLICY "Users can view stock movements of their boutiques"
  ON public.stock_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boutiques
      WHERE id = stock_movements.boutique_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stock movements for their boutiques"
  ON public.stock_movements FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.boutiques
      WHERE id = boutique_id
        AND user_id = auth.uid()
    )
  );

-- Policies pour caisses_journalieres
CREATE POLICY "Users can view their boutiques caisses"
  ON public.caisses_journalieres FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boutiques
      WHERE id = caisses_journalieres.boutique_id
        AND user_id = auth.uid()
    )
  );

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

-- =====================================================
-- 14. DONNÉES DE TEST (OPTIONNEL)
-- =====================================================
-- Décommenter pour insérer des données de test
/*
INSERT INTO public.boutiques (user_id, nom, adresse, ville, telephone, responsable_nom)
SELECT
  auth.uid(),
  'Boutique Principale',
  '123 Avenue de la République',
  'Dakar',
  '+221 77 123 45 67',
  'Mamadou Diop'
WHERE auth.uid() IS NOT NULL;
*/
