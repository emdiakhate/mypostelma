-- =============================================
-- Module Stock - Migration complète
-- =============================================

-- Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS public.stock_digital_assets CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.stock_products CASCADE;
DROP TABLE IF EXISTS public.stock_warehouses CASCADE;
DROP VIEW IF EXISTS public.stock_levels CASCADE;

-- =============================================
-- Table: stock_products
-- =============================================
CREATE TABLE public.stock_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  type TEXT NOT NULL DEFAULT 'PHYSICAL' CHECK (type IN ('PHYSICAL', 'DIGITAL', 'SERVICE', 'BUNDLE')),
  category TEXT,
  description TEXT,
  price NUMERIC(12, 2) DEFAULT 0,
  cost_price NUMERIC(12, 2) DEFAULT 0,
  tax_rate NUMERIC(5, 2) DEFAULT 18,
  unit TEXT DEFAULT 'unité',
  min_stock_quantity INTEGER DEFAULT 0,
  max_stock_quantity INTEGER,
  is_stockable BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour stock_products
CREATE INDEX idx_stock_products_user_id ON public.stock_products(user_id);
CREATE INDEX idx_stock_products_sku ON public.stock_products(sku);
CREATE INDEX idx_stock_products_status ON public.stock_products(status);
CREATE INDEX idx_stock_products_type ON public.stock_products(type);
CREATE INDEX idx_stock_products_category ON public.stock_products(category);

-- RLS pour stock_products
ALTER TABLE public.stock_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
  ON public.stock_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
  ON public.stock_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.stock_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.stock_products FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Table: stock_warehouses
-- =============================================
CREATE TABLE public.stock_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'WAREHOUSE' CHECK (type IN ('WAREHOUSE', 'STORE', 'SUPPLIER', 'CUSTOMER', 'VIRTUAL')),
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Senegal',
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour stock_warehouses
CREATE INDEX idx_stock_warehouses_user_id ON public.stock_warehouses(user_id);
CREATE INDEX idx_stock_warehouses_type ON public.stock_warehouses(type);
CREATE INDEX idx_stock_warehouses_is_active ON public.stock_warehouses(is_active);

-- RLS pour stock_warehouses
ALTER TABLE public.stock_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own warehouses"
  ON public.stock_warehouses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own warehouses"
  ON public.stock_warehouses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warehouses"
  ON public.stock_warehouses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warehouses"
  ON public.stock_warehouses FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Table: stock_movements
-- =============================================
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.stock_products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.stock_warehouses(id) ON DELETE CASCADE,
  destination_warehouse_id UUID REFERENCES public.stock_warehouses(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'LOSS', 'PRODUCTION')),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(12, 2) DEFAULT 0,
  total_cost NUMERIC(12, 2) DEFAULT 0,
  reference_type TEXT CHECK (reference_type IN ('PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'PRODUCTION', 'RETURN', 'OTHER')),
  reference_id TEXT,
  reason TEXT,
  notes TEXT,
  performed_by TEXT,
  movement_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour stock_movements
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse_id ON public.stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_movement_type ON public.stock_movements(movement_type);
CREATE INDEX idx_stock_movements_movement_date ON public.stock_movements(movement_date);
CREATE INDEX idx_stock_movements_reference ON public.stock_movements(reference_type, reference_id);

-- RLS pour stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own movements"
  ON public.stock_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movements"
  ON public.stock_movements FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Table: stock_digital_assets
-- =============================================
CREATE TABLE public.stock_digital_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.stock_products(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  serial_number TEXT,
  license_key TEXT,
  download_url TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'expired', 'revoked')),
  assigned_to TEXT,
  assigned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour stock_digital_assets
CREATE INDEX idx_stock_digital_assets_user_id ON public.stock_digital_assets(user_id);
CREATE INDEX idx_stock_digital_assets_product_id ON public.stock_digital_assets(product_id);
CREATE INDEX idx_stock_digital_assets_status ON public.stock_digital_assets(status);
CREATE INDEX idx_stock_digital_assets_code ON public.stock_digital_assets(code);

-- RLS pour stock_digital_assets
ALTER TABLE public.stock_digital_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own digital assets"
  ON public.stock_digital_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own digital assets"
  ON public.stock_digital_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital assets"
  ON public.stock_digital_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own digital assets"
  ON public.stock_digital_assets FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Vue: stock_levels (calcul du stock en temps réel)
-- =============================================
CREATE OR REPLACE VIEW public.stock_levels AS
SELECT 
  p.id AS product_id,
  p.user_id,
  p.name AS product_name,
  p.sku,
  p.type AS product_type,
  w.id AS warehouse_id,
  w.name AS warehouse_name,
  w.type AS warehouse_type,
  COALESCE(
    SUM(
      CASE 
        WHEN m.movement_type IN ('IN', 'RETURN', 'PRODUCTION') THEN m.quantity
        WHEN m.movement_type IN ('OUT', 'LOSS') THEN -m.quantity
        WHEN m.movement_type = 'TRANSFER' AND m.warehouse_id = w.id THEN -m.quantity
        WHEN m.movement_type = 'TRANSFER' AND m.destination_warehouse_id = w.id THEN m.quantity
        WHEN m.movement_type = 'ADJUSTMENT' THEN m.quantity
        ELSE 0
      END
    ), 0
  )::INTEGER AS current_quantity,
  p.min_stock_quantity,
  p.max_stock_quantity,
  p.cost_price AS average_cost,
  p.is_stockable
FROM public.stock_products p
CROSS JOIN public.stock_warehouses w
LEFT JOIN public.stock_movements m ON (
  m.product_id = p.id 
  AND (m.warehouse_id = w.id OR m.destination_warehouse_id = w.id)
  AND m.user_id = p.user_id
)
WHERE p.user_id = w.user_id
  AND p.is_stockable = true
  AND p.status = 'active'
  AND w.is_active = true
GROUP BY p.id, p.user_id, p.name, p.sku, p.type, p.min_stock_quantity, p.max_stock_quantity, p.cost_price, p.is_stockable, w.id, w.name, w.type;

-- =============================================
-- Triggers pour updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_stock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_products_updated_at
  BEFORE UPDATE ON public.stock_products
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_updated_at();

CREATE TRIGGER trigger_stock_warehouses_updated_at
  BEFORE UPDATE ON public.stock_warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_updated_at();

CREATE TRIGGER trigger_stock_digital_assets_updated_at
  BEFORE UPDATE ON public.stock_digital_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_updated_at();