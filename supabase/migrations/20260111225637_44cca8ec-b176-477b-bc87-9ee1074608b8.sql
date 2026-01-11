-- Migration: Fix warehouse_id column types and add foreign keys

-- 1. First, alter purchase_orders.warehouse_id from TEXT to UUID
ALTER TABLE public.purchase_orders 
ALTER COLUMN warehouse_id TYPE uuid USING warehouse_id::uuid;

-- 2. Add foreign key constraint for purchase_orders.warehouse_id
ALTER TABLE public.purchase_orders
ADD CONSTRAINT purchase_orders_warehouse_id_fkey
FOREIGN KEY (warehouse_id) REFERENCES public.stock_warehouses(id);

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vente_orders_warehouse_id ON public.vente_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_warehouse_id ON public.purchase_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_caisses_journalieres_warehouse_id ON public.caisses_journalieres(warehouse_id);