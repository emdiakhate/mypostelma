-- Migration: Ajout gestion d'inventaire pour le module Stock

-- Table inventaires (comptages/prises d'inventaire)
CREATE TABLE IF NOT EXISTS public.stock_inventories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warehouse_id TEXT NOT NULL REFERENCES stock_warehouses(id),
  inventory_number TEXT NOT NULL UNIQUE,
  inventory_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
  counted_by TEXT, -- Nom de la personne qui fait le comptage
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table lignes d'inventaire
CREATE TABLE IF NOT EXISTS public.stock_inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES stock_inventories(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES vente_products(id),
  expected_quantity INTEGER NOT NULL DEFAULT 0, -- Quantité attendue d'après le système
  counted_quantity INTEGER, -- Quantité réellement comptée
  difference INTEGER, -- Différence (counted - expected)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(inventory_id, product_id)
);

-- Table ajustements manuels (corrections ponctuelles)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warehouse_id TEXT NOT NULL REFERENCES stock_warehouses(id),
  product_id TEXT NOT NULL REFERENCES vente_products(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'correction')),
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL, -- Positif ou négatif
  quantity_after INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'damaged', -- Produit endommagé
    'lost', -- Produit perdu
    'found', -- Produit retrouvé
    'error', -- Erreur de saisie
    'theft', -- Vol
    'expired', -- Périmé
    'return_supplier', -- Retour fournisseur
    'other' -- Autre raison
  )),
  cost_impact DECIMAL(12, 2), -- Impact financier de l'ajustement
  notes TEXT,
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_stock_inventories_user_id ON public.stock_inventories(user_id);
CREATE INDEX idx_stock_inventories_warehouse_id ON public.stock_inventories(warehouse_id);
CREATE INDEX idx_stock_inventories_status ON public.stock_inventories(status);
CREATE INDEX idx_stock_inventory_items_inventory_id ON public.stock_inventory_items(inventory_id);
CREATE INDEX idx_stock_inventory_items_product_id ON public.stock_inventory_items(product_id);
CREATE INDEX idx_stock_adjustments_user_id ON public.stock_adjustments(user_id);
CREATE INDEX idx_stock_adjustments_warehouse_id ON public.stock_adjustments(warehouse_id);
CREATE INDEX idx_stock_adjustments_product_id ON public.stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_performed_at ON public.stock_adjustments(performed_at);

-- RLS
ALTER TABLE public.stock_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Policies stock_inventories
CREATE POLICY "Users can view their own inventories"
  ON public.stock_inventories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventories"
  ON public.stock_inventories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventories"
  ON public.stock_inventories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventories"
  ON public.stock_inventories FOR DELETE
  USING (auth.uid() = user_id);

-- Policies stock_inventory_items
CREATE POLICY "Users can view their own inventory items"
  ON public.stock_inventory_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM stock_inventories
    WHERE stock_inventories.id = stock_inventory_items.inventory_id
    AND stock_inventories.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own inventory items"
  ON public.stock_inventory_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM stock_inventories
    WHERE stock_inventories.id = stock_inventory_items.inventory_id
    AND stock_inventories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own inventory items"
  ON public.stock_inventory_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM stock_inventories
    WHERE stock_inventories.id = stock_inventory_items.inventory_id
    AND stock_inventories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own inventory items"
  ON public.stock_inventory_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM stock_inventories
    WHERE stock_inventories.id = stock_inventory_items.inventory_id
    AND stock_inventories.user_id = auth.uid()
  ));

-- Policies stock_adjustments
CREATE POLICY "Users can view their own adjustments"
  ON public.stock_adjustments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adjustments"
  ON public.stock_adjustments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adjustments"
  ON public.stock_adjustments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adjustments"
  ON public.stock_adjustments FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers updated_at
CREATE TRIGGER update_stock_inventories_updated_at
  BEFORE UPDATE ON public.stock_inventories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_inventory_items_updated_at
  BEFORE UPDATE ON public.stock_inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour compléter un inventaire et créer les mouvements
CREATE OR REPLACE FUNCTION complete_inventory(p_inventory_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inventory RECORD;
  v_item RECORD;
  v_user_email TEXT;
BEGIN
  -- Récupérer l'inventaire
  SELECT * INTO v_inventory
  FROM stock_inventories
  WHERE id = p_inventory_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory not found';
  END IF;

  IF v_inventory.status != 'in_progress' THEN
    RAISE EXCEPTION 'Inventory must be in progress to be completed';
  END IF;

  -- Récupérer l'email de l'utilisateur
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_inventory.user_id;

  -- Pour chaque ligne d'inventaire avec une différence, créer un mouvement
  FOR v_item IN
    SELECT *
    FROM stock_inventory_items
    WHERE inventory_id = p_inventory_id
    AND counted_quantity IS NOT NULL
    AND (counted_quantity - expected_quantity) != 0
  LOOP
    -- Créer un mouvement d'ajustement
    INSERT INTO stock_movements (
      user_id,
      product_id,
      warehouse_id,
      movement_type,
      quantity,
      reason,
      reference_type,
      reference_id,
      notes,
      performed_by
    ) VALUES (
      v_inventory.user_id,
      v_item.product_id,
      v_inventory.warehouse_id,
      CASE
        WHEN v_item.difference > 0 THEN 'ADJUSTMENT_IN'
        ELSE 'ADJUSTMENT_OUT'
      END,
      ABS(v_item.difference),
      CASE
        WHEN v_item.difference > 0 THEN 'Ajustement inventaire - Surplus'
        ELSE 'Ajustement inventaire - Manquant'
      END,
      'inventory',
      p_inventory_id::TEXT,
      v_item.notes,
      v_user_email
    );

    -- Créer un ajustement manuel pour traçabilité
    INSERT INTO stock_adjustments (
      user_id,
      warehouse_id,
      product_id,
      adjustment_type,
      quantity_before,
      quantity_change,
      quantity_after,
      reason,
      notes,
      performed_by
    ) VALUES (
      v_inventory.user_id,
      v_inventory.warehouse_id,
      v_item.product_id,
      CASE
        WHEN v_item.difference > 0 THEN 'increase'
        ELSE 'decrease'
      END,
      v_item.expected_quantity,
      v_item.difference,
      v_item.counted_quantity,
      'error', -- Classé comme erreur de comptage
      FORMAT('Inventaire %s - %s', v_inventory.inventory_number, v_item.notes),
      v_user_email
    );
  END LOOP;

  -- Marquer l'inventaire comme complété
  UPDATE stock_inventories
  SET
    status = 'completed',
    completed_at = now()
  WHERE id = p_inventory_id;
END;
$$;

-- Commentaires
COMMENT ON TABLE public.stock_inventories IS 'Prises d''inventaire complètes';
COMMENT ON TABLE public.stock_inventory_items IS 'Lignes de comptage d''inventaire';
COMMENT ON TABLE public.stock_adjustments IS 'Ajustements manuels ponctuels de stock';
COMMENT ON FUNCTION complete_inventory(UUID) IS 'Finalise un inventaire et crée les mouvements d''ajustement';
