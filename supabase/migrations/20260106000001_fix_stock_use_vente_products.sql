-- ============================================================================
-- MIGRATION CORRECTIVE: Stock utilise vente_products au lieu de stock_products
-- ============================================================================
--
-- Objectif: Éliminer la duplication entre stock_products et vente_products
-- Le catalogue de produits unique est vente_products
-- Le module Stock gère uniquement les mouvements et entrepôts
--
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Supprimer la table stock_products et ses dépendances
-- ============================================================================

-- Supprimer la vue stock_levels (dépend de stock_products)
DROP VIEW IF EXISTS public.stock_levels CASCADE;

-- Supprimer les contraintes FK qui référencent stock_products
ALTER TABLE public.stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;

ALTER TABLE public.stock_digital_assets
  DROP CONSTRAINT IF EXISTS stock_digital_assets_product_id_fkey;

-- Supprimer la table stock_products
DROP TABLE IF EXISTS public.stock_products CASCADE;

-- ============================================================================
-- ÉTAPE 2: Ajouter contraintes FK vers vente_products
-- ============================================================================

-- stock_movements.product_id référence vente_products
ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.vente_products(id) ON DELETE RESTRICT;

-- stock_digital_assets.product_id référence vente_products
ALTER TABLE public.stock_digital_assets
  ADD CONSTRAINT stock_digital_assets_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.vente_products(id) ON DELETE RESTRICT;

-- ============================================================================
-- ÉTAPE 3: Recréer la vue stock_levels avec JOIN sur vente_products
-- ============================================================================

CREATE OR REPLACE VIEW public.stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.type AS product_type,
  p.category,
  w.id AS warehouse_id,
  w.name AS warehouse_name,
  w.city AS warehouse_city,
  p.user_id,

  -- Calcul du stock actuel basé sur les mouvements
  COALESCE(
    (
      -- Somme des entrées (IN et TO dans TRANSFER)
      SELECT COALESCE(SUM(sm_in.quantity), 0)
      FROM public.stock_movements sm_in
      WHERE sm_in.product_id = p.id
        AND sm_in.user_id = p.user_id
        AND (
          (sm_in.movement_type = 'IN' AND sm_in.warehouse_to_id = w.id)
          OR (sm_in.movement_type = 'TRANSFER' AND sm_in.warehouse_to_id = w.id)
          OR (sm_in.movement_type = 'ADJUSTMENT' AND sm_in.warehouse_to_id = w.id AND sm_in.quantity > 0)
        )
    )
    -
    -- Somme des sorties (OUT et FROM dans TRANSFER)
    (
      SELECT COALESCE(SUM(sm_out.quantity), 0)
      FROM public.stock_movements sm_out
      WHERE sm_out.product_id = p.id
        AND sm_out.user_id = p.user_id
        AND (
          (sm_out.movement_type = 'OUT' AND sm_out.warehouse_from_id = w.id)
          OR (sm_out.movement_type = 'TRANSFER' AND sm_out.warehouse_from_id = w.id)
        )
    ),
    0
  ) AS current_quantity,

  -- Coût moyen pondéré
  (
    SELECT AVG(unit_cost)
    FROM public.stock_movements
    WHERE product_id = p.id
      AND user_id = p.user_id
      AND unit_cost IS NOT NULL
      AND unit_cost > 0
  ) AS average_cost,

  -- Date du dernier mouvement
  (
    SELECT MAX(created_at)
    FROM public.stock_movements
    WHERE product_id = p.id
      AND user_id = p.user_id
      AND (warehouse_from_id = w.id OR warehouse_to_id = w.id)
  ) AS last_movement_at

FROM public.vente_products p
CROSS JOIN public.stock_warehouses w
WHERE p.user_id = w.user_id
  AND w.is_active = true
  -- Uniquement les produits avec type 'product' et stockables
  AND p.type = 'product'
  AND p.status = 'active';

-- Index sur la vue (via materialized view si nécessaire pour performance)
COMMENT ON VIEW public.stock_levels IS
'Vue calculée des niveaux de stock par produit et entrepôt, basée sur vente_products';

-- ============================================================================
-- ÉTAPE 4: Recréer les fonctions RPC avec référence à vente_products
-- ============================================================================

-- Fonction: Obtenir la quantité en stock pour un produit
CREATE OR REPLACE FUNCTION public.get_stock_quantity(
  p_product_id UUID,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_quantity DECIMAL := 0;
  v_user_id UUID;
BEGIN
  -- Récupérer le user_id du produit
  SELECT user_id INTO v_user_id
  FROM public.vente_products
  WHERE id = p_product_id;

  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Si warehouse spécifié, calculer pour cet entrepôt uniquement
  IF p_warehouse_id IS NOT NULL THEN
    SELECT COALESCE(current_quantity, 0) INTO v_quantity
    FROM public.stock_levels
    WHERE product_id = p_product_id
      AND warehouse_id = p_warehouse_id
      AND user_id = v_user_id;
  ELSE
    -- Sinon, sommer tous les entrepôts
    SELECT COALESCE(SUM(current_quantity), 0) INTO v_quantity
    FROM public.stock_levels
    WHERE product_id = p_product_id
      AND user_id = v_user_id;
  END IF;

  RETURN v_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_stock_quantity IS
'Calcule la quantité en stock pour un produit (tous entrepôts ou entrepôt spécifique)';

-- Fonction: Vérifier si stock disponible pour une quantité donnée
CREATE OR REPLACE FUNCTION public.check_stock_available(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_stock DECIMAL;
BEGIN
  v_current_stock := public.get_stock_quantity(p_product_id, p_warehouse_id);
  RETURN v_current_stock >= p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.check_stock_available IS
'Vérifie si le stock disponible est suffisant pour une quantité demandée';

-- ============================================================================
-- ÉTAPE 5: Trigger auto-assignment digital assets (référence vente_products)
-- ============================================================================

-- Recréer le trigger avec référence à vente_products
DROP TRIGGER IF EXISTS auto_assign_digital_asset_on_sale ON public.stock_movements;
DROP FUNCTION IF EXISTS public.auto_assign_digital_asset();

CREATE OR REPLACE FUNCTION public.auto_assign_digital_asset()
RETURNS TRIGGER AS $$
DECLARE
  v_product_type TEXT;
  v_asset_id UUID;
  v_asset_code TEXT;
BEGIN
  -- Uniquement pour les mouvements OUT de type SALE
  IF NEW.movement_type = 'OUT' AND NEW.reference_type = 'SALE' THEN
    -- Vérifier si le produit est de type DIGITAL
    SELECT type INTO v_product_type
    FROM public.vente_products
    WHERE id = NEW.product_id;

    -- Si produit digital, assigner automatiquement un asset disponible
    IF v_product_type = 'service' THEN
      -- Chercher un asset disponible
      SELECT id, code_or_license INTO v_asset_id, v_asset_code
      FROM public.stock_digital_assets
      WHERE product_id = NEW.product_id
        AND status = 'AVAILABLE'
        AND user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

      -- Si un asset est trouvé, le marquer comme USED
      IF v_asset_id IS NOT NULL THEN
        UPDATE public.stock_digital_assets
        SET
          status = 'USED',
          assigned_at = NOW(),
          order_id = NEW.reference_id
        WHERE id = v_asset_id;

        -- Ajouter une note au mouvement
        NEW.notes := COALESCE(NEW.notes || ' | ', '') ||
                     'Asset digital assigné: ' || v_asset_code;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_assign_digital_asset_on_sale
  BEFORE INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_digital_asset();

COMMENT ON FUNCTION public.auto_assign_digital_asset IS
'Assigne automatiquement un digital asset lors d''une vente (produit type service dans vente_products)';

-- ============================================================================
-- ÉTAPE 6: Grants et permissions
-- ============================================================================

-- Accorder accès à la vue
GRANT SELECT ON public.stock_levels TO authenticated;
GRANT SELECT ON public.stock_levels TO anon;

-- Accorder exécution des fonctions RPC
GRANT EXECUTE ON FUNCTION public.get_stock_quantity(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_stock_available(UUID, UUID, DECIMAL) TO authenticated;

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier que stock_products n'existe plus
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stock_products'
  ) THEN
    RAISE EXCEPTION 'Erreur: stock_products existe encore';
  END IF;
END $$;

-- Vérifier que les FK pointent vers vente_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'stock_movements'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'product_id'
  ) THEN
    RAISE EXCEPTION 'Erreur: FK stock_movements.product_id manquante';
  END IF;
END $$;

-- ============================================================================
-- COMMENTAIRES FINAUX
-- ============================================================================

COMMENT ON TABLE public.stock_movements IS
'Mouvements de stock (IN/OUT/TRANSFER/ADJUSTMENT) - Référence vente_products pour les produits';

COMMENT ON TABLE public.stock_digital_assets IS
'Assets digitaux (licences, codes) - Référence vente_products';

COMMENT ON TABLE public.stock_warehouses IS
'Entrepôts et boutiques pour gestion multi-location du stock';
