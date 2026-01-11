
-- Fix column types and add missing foreign keys

-- 1. Fix purchase_order_items.product_id (TEXT -> UUID) and add FK
ALTER TABLE public.purchase_order_items 
ALTER COLUMN product_id TYPE uuid USING product_id::uuid;

ALTER TABLE public.purchase_order_items
ADD CONSTRAINT purchase_order_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.vente_products(id);

-- 2. Fix stock_inventories.warehouse_id (TEXT -> UUID) and add FK
ALTER TABLE public.stock_inventories 
ALTER COLUMN warehouse_id TYPE uuid USING warehouse_id::uuid;

ALTER TABLE public.stock_inventories
ADD CONSTRAINT stock_inventories_warehouse_id_fkey
FOREIGN KEY (warehouse_id) REFERENCES public.stock_warehouses(id);

-- 3. Fix stock_inventory_items.product_id (TEXT -> UUID) and add FK
ALTER TABLE public.stock_inventory_items 
ALTER COLUMN product_id TYPE uuid USING product_id::uuid;

ALTER TABLE public.stock_inventory_items
ADD CONSTRAINT stock_inventory_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.vente_products(id);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventories_warehouse_id ON public.stock_inventories(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventory_items_product_id ON public.stock_inventory_items(product_id);
