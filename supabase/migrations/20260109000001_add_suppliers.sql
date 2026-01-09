-- Migration: Ajout gestion fournisseurs pour le module Stock

-- Table fournisseurs
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Sénégal',
  tax_number TEXT,
  payment_terms TEXT, -- Ex: "Net 30", "Net 60", "Paiement à la livraison"
  bank_account TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table produits_fournisseurs (relation many-to-many)
CREATE TABLE IF NOT EXISTS public.product_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES vente_products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku TEXT, -- SKU chez le fournisseur
  purchase_price DECIMAL(12, 2), -- Prix d'achat chez ce fournisseur
  lead_time_days INTEGER, -- Délai de livraison en jours
  min_order_quantity INTEGER DEFAULT 1,
  is_preferred BOOLEAN DEFAULT false, -- Fournisseur préféré pour ce produit
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, supplier_id)
);

-- Table commandes fournisseurs
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  order_number TEXT NOT NULL UNIQUE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  warehouse_id TEXT REFERENCES stock_warehouses(id), -- Entrepôt de réception
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
  subtotal DECIMAL(12, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  shipping_cost DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table lignes commandes fournisseurs
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES vente_products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX idx_suppliers_is_active ON public.suppliers(is_active);
CREATE INDEX idx_product_suppliers_product_id ON public.product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier_id ON public.product_suppliers(supplier_id);
CREATE INDEX idx_purchase_orders_user_id ON public.purchase_orders(user_id);
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);

-- RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Policies suppliers
CREATE POLICY "Users can view their own suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers"
  ON public.suppliers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers"
  ON public.suppliers FOR DELETE
  USING (auth.uid() = user_id);

-- Policies product_suppliers
CREATE POLICY "Users can view their own product suppliers"
  ON public.product_suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product suppliers"
  ON public.product_suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product suppliers"
  ON public.product_suppliers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product suppliers"
  ON public.product_suppliers FOR DELETE
  USING (auth.uid() = user_id);

-- Policies purchase_orders
CREATE POLICY "Users can view their own purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders"
  ON public.purchase_orders FOR DELETE
  USING (auth.uid() = user_id);

-- Policies purchase_order_items
CREATE POLICY "Users can view their own purchase order items"
  ON public.purchase_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own purchase order items"
  ON public.purchase_order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own purchase order items"
  ON public.purchase_order_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own purchase order items"
  ON public.purchase_order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.user_id = auth.uid()
  ));

-- Trigger updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_suppliers_updated_at
  BEFORE UPDATE ON public.product_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.suppliers IS 'Fournisseurs de produits pour le module Stock';
COMMENT ON TABLE public.product_suppliers IS 'Relation many-to-many entre produits et fournisseurs';
COMMENT ON TABLE public.purchase_orders IS 'Commandes d''achat passées aux fournisseurs';
COMMENT ON TABLE public.purchase_order_items IS 'Lignes des commandes d''achat';
