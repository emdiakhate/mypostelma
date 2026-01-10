-- ============================================================================
-- Migration: Ajouter les foreign keys manquantes pour stock_warehouses
-- Date: 2026-01-10
-- Description: Ajoute les relations manquantes entre purchase_orders,
--              stock_inventories et stock_warehouses
-- ============================================================================

-- ============================================================================
-- 1. PURCHASE_ORDERS - Ajouter foreign key vers stock_warehouses
-- ============================================================================

-- Vérifier si la colonne warehouse_id existe dans purchase_orders
DO $$
BEGIN
  -- Ajouter la colonne si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders'
    AND column_name = 'warehouse_id'
  ) THEN
    ALTER TABLE public.purchase_orders
    ADD COLUMN warehouse_id UUID;
  END IF;
END $$;

-- Ajouter la foreign key vers stock_warehouses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'purchase_orders_warehouse_id_fkey'
  ) THEN
    ALTER TABLE public.purchase_orders
    ADD CONSTRAINT purchase_orders_warehouse_id_fkey
    FOREIGN KEY (warehouse_id)
    REFERENCES public.stock_warehouses(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Créer un index pour améliorer les performances des joins
CREATE INDEX IF NOT EXISTS idx_purchase_orders_warehouse_id
ON public.purchase_orders(warehouse_id);

-- ============================================================================
-- 2. STOCK_INVENTORIES - Ajouter foreign key vers stock_warehouses
-- ============================================================================

-- Vérifier si la colonne warehouse_id existe dans stock_inventories
DO $$
BEGIN
  -- Ajouter la colonne si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_inventories'
    AND column_name = 'warehouse_id'
  ) THEN
    ALTER TABLE public.stock_inventories
    ADD COLUMN warehouse_id UUID;
  END IF;
END $$;

-- Ajouter la foreign key vers stock_warehouses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_inventories_warehouse_id_fkey'
  ) THEN
    ALTER TABLE public.stock_inventories
    ADD CONSTRAINT stock_inventories_warehouse_id_fkey
    FOREIGN KEY (warehouse_id)
    REFERENCES public.stock_warehouses(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Créer un index pour améliorer les performances des joins
CREATE INDEX IF NOT EXISTS idx_stock_inventories_warehouse_id
ON public.stock_inventories(warehouse_id);

-- ============================================================================
-- 3. COMMENTAIRES
-- ============================================================================

COMMENT ON COLUMN public.purchase_orders.warehouse_id IS
'Entrepôt de destination pour la commande d''achat (optionnel)';

COMMENT ON COLUMN public.stock_inventories.warehouse_id IS
'Entrepôt concerné par l''inventaire';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
