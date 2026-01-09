-- ================================================================
-- PHASE 1-3-5 : Consolidation des tables manquantes
-- ================================================================

-- ============================================
-- 1. Table invoice_reminders (suivi relances)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'whatsapp', 'both')),
  days_overdue INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice_id ON public.invoice_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_user_id ON public.invoice_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_sent_at ON public.invoice_reminders(sent_at);

ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reminders" ON public.invoice_reminders;
CREATE POLICY "Users can view their own reminders"
  ON public.invoice_reminders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.invoice_reminders;
CREATE POLICY "Users can insert their own reminders"
  ON public.invoice_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. Table suppliers (fournisseurs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Sénégal',
  tax_number TEXT,
  payment_terms TEXT,
  bank_account TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON public.suppliers(is_active);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
CREATE POLICY "Users can view their own suppliers"
  ON public.suppliers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own suppliers" ON public.suppliers;
CREATE POLICY "Users can insert their own suppliers"
  ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
CREATE POLICY "Users can update their own suppliers"
  ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;
CREATE POLICY "Users can delete their own suppliers"
  ON public.suppliers FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. Table product_suppliers (relation produits-fournisseurs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  purchase_price DECIMAL(12, 2),
  lead_time_days INTEGER,
  min_order_quantity INTEGER DEFAULT 1,
  is_preferred BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_product_suppliers_product_id ON public.product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier_id ON public.product_suppliers(supplier_id);

ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own product suppliers" ON public.product_suppliers;
CREATE POLICY "Users can view their own product suppliers"
  ON public.product_suppliers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own product suppliers" ON public.product_suppliers;
CREATE POLICY "Users can insert their own product suppliers"
  ON public.product_suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own product suppliers" ON public.product_suppliers;
CREATE POLICY "Users can update their own product suppliers"
  ON public.product_suppliers FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own product suppliers" ON public.product_suppliers;
CREATE POLICY "Users can delete their own product suppliers"
  ON public.product_suppliers FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. Table purchase_orders (commandes fournisseurs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  order_number TEXT NOT NULL UNIQUE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  warehouse_id TEXT,
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

CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON public.purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can view their own purchase orders"
  ON public.purchase_orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can insert their own purchase orders"
  ON public.purchase_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can update their own purchase orders"
  ON public.purchase_orders FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can delete their own purchase orders"
  ON public.purchase_orders FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. Table purchase_order_items (lignes commandes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchase order items" ON public.purchase_order_items;
CREATE POLICY "Users can view their own purchase order items"
  ON public.purchase_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert their own purchase order items" ON public.purchase_order_items;
CREATE POLICY "Users can insert their own purchase order items"
  ON public.purchase_order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own purchase order items" ON public.purchase_order_items;
CREATE POLICY "Users can update their own purchase order items"
  ON public.purchase_order_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own purchase order items" ON public.purchase_order_items;
CREATE POLICY "Users can delete their own purchase order items"
  ON public.purchase_order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.user_id = auth.uid()
  ));

-- ============================================
-- 6. Table stock_inventories (inventaires)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warehouse_id TEXT NOT NULL,
  inventory_number TEXT NOT NULL UNIQUE,
  inventory_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
  counted_by TEXT,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_inventories_user_id ON public.stock_inventories(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventories_warehouse_id ON public.stock_inventories(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventories_status ON public.stock_inventories(status);

ALTER TABLE public.stock_inventories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inventories" ON public.stock_inventories;
CREATE POLICY "Users can view their own inventories"
  ON public.stock_inventories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own inventories" ON public.stock_inventories;
CREATE POLICY "Users can insert their own inventories"
  ON public.stock_inventories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own inventories" ON public.stock_inventories;
CREATE POLICY "Users can update their own inventories"
  ON public.stock_inventories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own inventories" ON public.stock_inventories;
CREATE POLICY "Users can delete their own inventories"
  ON public.stock_inventories FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 7. Table stock_inventory_items (lignes inventaire)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES stock_inventories(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  expected_quantity INTEGER NOT NULL DEFAULT 0,
  counted_quantity INTEGER,
  difference INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(inventory_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_inventory_items_inventory_id ON public.stock_inventory_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventory_items_product_id ON public.stock_inventory_items(product_id);

ALTER TABLE public.stock_inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inventory items" ON public.stock_inventory_items;
CREATE POLICY "Users can view their own inventory items"
  ON public.stock_inventory_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM stock_inventories
    WHERE stock_inventories.id = stock_inventory_items.inventory_id
    AND stock_inventories.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert their own inventory items" ON public.stock_inventory_items;
CREATE POLICY "Users can insert their own inventory items"
  ON public.stock_inventory_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM stock_inventories
    WHERE stock_inventories.id = stock_inventory_items.inventory_id
    AND stock_inventories.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own inventory items" ON public.stock_inventory_items;
CREATE POLICY "Users can update their own inventory items"
  ON public.stock_inventory_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM stock_inventories
    WHERE stock_inventories.id = stock_inventory_items.inventory_id
    AND stock_inventories.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own inventory items" ON public.stock_inventory_items;
CREATE POLICY "Users can delete their own inventory items"
  ON public.stock_inventory_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM stock_inventories
    WHERE stock_inventories.id = stock_inventory_items.inventory_id
    AND stock_inventories.user_id = auth.uid()
  ));

-- ============================================
-- 8. Table stock_adjustments (ajustements)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warehouse_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'correction')),
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('damaged', 'lost', 'found', 'error', 'theft', 'expired', 'return_supplier', 'other')),
  cost_impact DECIMAL(12, 2),
  notes TEXT,
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_user_id ON public.stock_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_warehouse_id ON public.stock_adjustments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON public.stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_performed_at ON public.stock_adjustments(performed_at);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own adjustments" ON public.stock_adjustments;
CREATE POLICY "Users can view their own adjustments"
  ON public.stock_adjustments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own adjustments" ON public.stock_adjustments;
CREATE POLICY "Users can insert their own adjustments"
  ON public.stock_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own adjustments" ON public.stock_adjustments;
CREATE POLICY "Users can update their own adjustments"
  ON public.stock_adjustments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own adjustments" ON public.stock_adjustments;
CREATE POLICY "Users can delete their own adjustments"
  ON public.stock_adjustments FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Triggers pour updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_suppliers_updated_at ON public.product_suppliers;
CREATE TRIGGER update_product_suppliers_updated_at
  BEFORE UPDATE ON public.product_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_inventories_updated_at ON public.stock_inventories;
CREATE TRIGGER update_stock_inventories_updated_at
  BEFORE UPDATE ON public.stock_inventories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_inventory_items_updated_at ON public.stock_inventory_items;
CREATE TRIGGER update_stock_inventory_items_updated_at
  BEFORE UPDATE ON public.stock_inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();