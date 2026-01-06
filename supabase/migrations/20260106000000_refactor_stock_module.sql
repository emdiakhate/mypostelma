-- ============================================================================
-- REFACTOR STOCK : Migration du stock depuis Vente vers module Stock indépendant
-- ============================================================================

-- Cette migration:
-- 1. Supprime les anciennes tables vente_stock_*
-- 2. Crée les nouvelles tables du module Stock indépendant
-- 3. Implémente la logique basée sur mouvements (best practice)
-- 4. Ajoute le support multi-boutique/entrepôt
-- 5. Gère produits physiques ET digitaux

-- ============================================================================
-- ÉTAPE 1 : SUPPRESSION DES ANCIENNES TABLES STOCK DE VENTE
-- ============================================================================

-- Supprimer les tables dans le bon ordre (dépendances)
DROP TABLE IF EXISTS public.vente_stock_movements CASCADE;
DROP TABLE IF EXISTS public.vente_stock_items CASCADE;

-- ============================================================================
-- ÉTAPE 2 : CRÉATION DES NOUVELLES TABLES MODULE STOCK
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table 1 : stock_products (Référentiel produits centralisé)
-- ----------------------------------------------------------------------------
CREATE TABLE public.stock_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('PHYSICAL', 'DIGITAL', 'SERVICE')),
  category TEXT,
  sku TEXT UNIQUE,
  barcode TEXT,
  -- Prix et coûts
  price DECIMAL(10, 2) CHECK (price >= 0),
  cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),
  tax_rate DECIMAL(5, 4) DEFAULT 0.20,
  -- Gestion stock
  is_stockable BOOLEAN DEFAULT true, -- false pour services
  track_serial BOOLEAN DEFAULT false, -- true pour numéros de série (Phase 2)
  -- Métadonnées
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index stock_products
CREATE INDEX idx_stock_products_user_id ON public.stock_products(user_id);
CREATE INDEX idx_stock_products_type ON public.stock_products(type);
CREATE INDEX idx_stock_products_sku ON public.stock_products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_stock_products_barcode ON public.stock_products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_stock_products_status ON public.stock_products(status);
CREATE INDEX idx_stock_products_is_stockable ON public.stock_products(is_stockable) WHERE is_stockable = true;

-- Trigger updated_at
CREATE TRIGGER update_stock_products_updated_at
  BEFORE UPDATE ON public.stock_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS stock_products
ALTER TABLE public.stock_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock products"
  ON public.stock_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock products"
  ON public.stock_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock products"
  ON public.stock_products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock products"
  ON public.stock_products FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Table 2 : stock_warehouses (Boutiques/Entrepôts/Mobile)
-- ----------------------------------------------------------------------------
CREATE TABLE public.stock_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('STORE', 'WAREHOUSE', 'MOBILE', 'OTHER')),
  -- Localisation
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Senegal',
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  -- Contact
  manager_name TEXT,
  phone TEXT,
  email TEXT,
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index stock_warehouses
CREATE INDEX idx_stock_warehouses_user_id ON public.stock_warehouses(user_id);
CREATE INDEX idx_stock_warehouses_type ON public.stock_warehouses(type);
CREATE INDEX idx_stock_warehouses_is_active ON public.stock_warehouses(is_active);
CREATE INDEX idx_stock_warehouses_city ON public.stock_warehouses(city) WHERE city IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER update_stock_warehouses_updated_at
  BEFORE UPDATE ON public.stock_warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS stock_warehouses
ALTER TABLE public.stock_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own warehouses"
  ON public.stock_warehouses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own warehouses"
  ON public.stock_warehouses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warehouses"
  ON public.stock_warehouses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warehouses"
  ON public.stock_warehouses FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Table 3 : stock_movements (💎 CŒUR DU SYSTÈME - Tous les mouvements)
-- ----------------------------------------------------------------------------
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.stock_products(id) ON DELETE RESTRICT,

  -- Type de mouvement
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),

  -- Quantité (toujours positive, le signe est dans movement_type)
  quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),

  -- Entrepôts
  warehouse_from_id UUID REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT, -- NULL pour IN
  warehouse_to_id UUID REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,   -- NULL pour OUT

  -- Raison et référence
  reason TEXT NOT NULL, -- "Vente", "Achat fournisseur", "Transfert", "Inventaire", "Casse", etc.
  reference_type TEXT, -- 'SALE', 'PURCHASE', 'RETURN', 'MANUAL', 'LOSS', 'PRODUCTION'
  reference_id UUID, -- ID de la vente, achat, etc.
  reference_number TEXT, -- Numéro de commande, facture, etc.

  -- Coût unitaire au moment du mouvement (pour valorisation stock)
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),

  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT -- Pour historique même si user supprimé
);

-- Index stock_movements (CRITIQUE pour performance)
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse_from ON public.stock_movements(warehouse_from_id) WHERE warehouse_from_id IS NOT NULL;
CREATE INDEX idx_stock_movements_warehouse_to ON public.stock_movements(warehouse_to_id) WHERE warehouse_to_id IS NOT NULL;
CREATE INDEX idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX idx_stock_movements_reference ON public.stock_movements(reference_type, reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

-- Index composé pour calcul stock par produit/entrepôt (TRÈS IMPORTANT)
CREATE INDEX idx_stock_movements_product_warehouse ON public.stock_movements(product_id, warehouse_to_id, warehouse_from_id);

-- RLS stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock movements"
  ON public.stock_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock movements"
  ON public.stock_movements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock movements"
  ON public.stock_movements FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Table 4 : stock_digital_assets (Licences, codes, clés - Produits digitaux)
-- ----------------------------------------------------------------------------
CREATE TABLE public.stock_digital_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.stock_products(id) ON DELETE CASCADE,

  -- Licence/Code
  code_or_license TEXT NOT NULL,
  activation_key TEXT,

  -- Statut
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'USED', 'EXPIRED', 'REVOKED')),

  -- Attribution
  assigned_to_customer TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  order_id UUID, -- Lien vers vente_orders si applicable

  -- Validité
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index stock_digital_assets
CREATE INDEX idx_stock_digital_assets_user_id ON public.stock_digital_assets(user_id);
CREATE INDEX idx_stock_digital_assets_product_id ON public.stock_digital_assets(product_id);
CREATE INDEX idx_stock_digital_assets_status ON public.stock_digital_assets(status);
CREATE INDEX idx_stock_digital_assets_order_id ON public.stock_digital_assets(order_id) WHERE order_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER update_stock_digital_assets_updated_at
  BEFORE UPDATE ON public.stock_digital_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS stock_digital_assets
ALTER TABLE public.stock_digital_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own digital assets"
  ON public.stock_digital_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own digital assets"
  ON public.stock_digital_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital assets"
  ON public.stock_digital_assets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own digital assets"
  ON public.stock_digital_assets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ÉTAPE 3 : VUES ET FONCTIONS POUR CALCUL STOCK
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Vue : stock_levels (Calcul stock actuel par produit et entrepôt)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.stock_levels AS
SELECT
  sm.user_id,
  sm.product_id,
  p.name as product_name,
  p.type as product_type,
  p.sku,
  COALESCE(sm.warehouse_id, 'ALL') as warehouse_id,
  COALESCE(w.name, 'Tous entrepôts') as warehouse_name,

  -- Calcul quantité (IN et TRANSFER_IN = +, OUT et TRANSFER_OUT = -)
  SUM(
    CASE
      WHEN sm.movement_type = 'IN' THEN sm.quantity
      WHEN sm.movement_type = 'ADJUSTMENT' THEN sm.quantity -- Peut être + ou -
      WHEN sm.movement_type = 'TRANSFER' AND sm.warehouse_to_id = sm.warehouse_id THEN sm.quantity
      WHEN sm.movement_type = 'TRANSFER' AND sm.warehouse_from_id = sm.warehouse_id THEN -sm.quantity
      WHEN sm.movement_type = 'OUT' THEN -sm.quantity
      ELSE 0
    END
  ) as current_quantity,

  -- Valeur du stock (quantité * coût moyen)
  AVG(sm.unit_cost) as average_cost,

  -- Dernière mise à jour
  MAX(sm.created_at) as last_movement_at

FROM (
  -- Sous-requête pour "dénormaliser" les transferts en 2 lignes
  SELECT
    user_id, product_id, movement_type, quantity, unit_cost, created_at,
    warehouse_to_id as warehouse_id
  FROM public.stock_movements
  WHERE movement_type IN ('IN', 'ADJUSTMENT') OR (movement_type = 'TRANSFER' AND warehouse_to_id IS NOT NULL)

  UNION ALL

  SELECT
    user_id, product_id, movement_type, quantity, unit_cost, created_at,
    warehouse_from_id as warehouse_id
  FROM public.stock_movements
  WHERE movement_type = 'OUT' OR (movement_type = 'TRANSFER' AND warehouse_from_id IS NOT NULL)
) sm
LEFT JOIN public.stock_products p ON p.id = sm.product_id
LEFT JOIN public.stock_warehouses w ON w.id = sm.warehouse_id
GROUP BY sm.user_id, sm.product_id, p.name, p.type, p.sku, sm.warehouse_id, w.name
HAVING SUM(
  CASE
    WHEN sm.movement_type = 'IN' THEN sm.quantity
    WHEN sm.movement_type = 'ADJUSTMENT' THEN sm.quantity
    WHEN sm.movement_type = 'TRANSFER' AND sm.warehouse_to_id = sm.warehouse_id THEN sm.quantity
    WHEN sm.movement_type = 'TRANSFER' AND sm.warehouse_from_id = sm.warehouse_id THEN -sm.quantity
    WHEN sm.movement_type = 'OUT' THEN -sm.quantity
    ELSE 0
  END
) != 0; -- Exclure les produits avec stock = 0

-- ----------------------------------------------------------------------------
-- Fonction : get_stock_quantity (Récupère le stock d'un produit dans un entrepôt)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_stock_quantity(
  p_product_id UUID,
  p_warehouse_id UUID DEFAULT NULL -- NULL = tous entrepôts
)
RETURNS DECIMAL AS $$
DECLARE
  v_quantity DECIMAL;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE
        WHEN movement_type = 'IN' THEN quantity
        WHEN movement_type = 'OUT' THEN -quantity
        WHEN movement_type = 'TRANSFER' AND warehouse_to_id = p_warehouse_id THEN quantity
        WHEN movement_type = 'TRANSFER' AND warehouse_from_id = p_warehouse_id THEN -quantity
        WHEN movement_type = 'ADJUSTMENT' THEN quantity
        ELSE 0
      END
    ), 0
  ) INTO v_quantity
  FROM public.stock_movements
  WHERE product_id = p_product_id
  AND (p_warehouse_id IS NULL OR warehouse_to_id = p_warehouse_id OR warehouse_from_id = p_warehouse_id);

  RETURN v_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- Fonction : check_stock_available (Vérifie si stock suffisant avant vente)
-- ----------------------------------------------------------------------------
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

-- ============================================================================
-- ÉTAPE 4 : TRIGGERS AUTOMATIQUES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger : Auto-assign digital asset lors vente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_assign_digital_asset()
RETURNS TRIGGER AS $$
DECLARE
  v_product_type TEXT;
  v_asset_id UUID;
BEGIN
  -- Vérifier si le produit est digital
  SELECT type INTO v_product_type
  FROM public.stock_products
  WHERE id = NEW.product_id;

  IF v_product_type = 'DIGITAL' THEN
    -- Chercher un asset disponible
    SELECT id INTO v_asset_id
    FROM public.stock_digital_assets
    WHERE product_id = NEW.product_id
    AND status = 'AVAILABLE'
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at
    LIMIT 1;

    IF v_asset_id IS NOT NULL THEN
      -- Marquer comme utilisé
      UPDATE public.stock_digital_assets
      SET status = 'USED',
          assigned_at = NOW(),
          order_id = NEW.reference_id
      WHERE id = v_asset_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_assign_digital_asset_on_sale
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  WHEN (NEW.movement_type = 'OUT' AND NEW.reference_type = 'SALE')
  EXECUTE FUNCTION public.auto_assign_digital_asset();

-- ============================================================================
-- ÉTAPE 5 : DONNÉES DE DÉMO (Optionnel)
-- ============================================================================

-- Créer un entrepôt central par défaut pour chaque utilisateur
-- (À exécuter manuellement ou via application lors premier login)
-- INSERT INTO public.stock_warehouses (user_id, name, type, city, country, is_active)
-- VALUES (auth.uid(), 'Entrepôt Principal', 'WAREHOUSE', 'Dakar', 'Senegal', true);
