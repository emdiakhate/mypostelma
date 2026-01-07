-- Ajouter les colonnes de stock à vente_products
ALTER TABLE vente_products 
ADD COLUMN IF NOT EXISTS is_stockable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_stock_quantity INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;