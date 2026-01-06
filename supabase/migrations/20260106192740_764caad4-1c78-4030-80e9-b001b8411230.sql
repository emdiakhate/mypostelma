-- ============================================================================
-- Migration: Unifier les produits - Stock utilise vente_products
-- ============================================================================

-- 1. Supprimer les contraintes FK existantes sur stock_movements et stock_digital_assets
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;

ALTER TABLE stock_digital_assets 
DROP CONSTRAINT IF EXISTS stock_digital_assets_product_id_fkey;

-- 2. Ajouter les nouvelles contraintes FK vers vente_products
ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES vente_products(id) ON DELETE CASCADE;

ALTER TABLE stock_digital_assets
ADD CONSTRAINT stock_digital_assets_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES vente_products(id) ON DELETE CASCADE;

-- 3. Supprimer la table stock_products (maintenant obsolète)
DROP TABLE IF EXISTS stock_products CASCADE;

-- 4. Recréer la vue stock_levels avec JOIN sur vente_products
DROP VIEW IF EXISTS stock_levels;

CREATE OR REPLACE VIEW stock_levels AS
SELECT 
    sm.user_id,
    sm.product_id,
    vp.name AS product_name,
    vp.type AS product_type,
    vp.category,
    vp.sku,
    sm.warehouse_id,
    sw.name AS warehouse_name,
    sw.city AS warehouse_city,
    SUM(
        CASE 
            WHEN sm.movement_type = 'IN' THEN sm.quantity
            WHEN sm.movement_type = 'OUT' THEN -sm.quantity
            WHEN sm.movement_type = 'ADJUSTMENT' THEN sm.quantity
            WHEN sm.movement_type = 'TRANSFER' AND sm.destination_warehouse_id = sm.warehouse_id THEN sm.quantity
            WHEN sm.movement_type = 'TRANSFER' AND sm.warehouse_id = sm.warehouse_id THEN -sm.quantity
            ELSE 0
        END
    ) AS current_quantity,
    AVG(sm.unit_cost) FILTER (WHERE sm.unit_cost IS NOT NULL) AS average_cost,
    MAX(sm.created_at) AS last_movement_at
FROM stock_movements sm
JOIN vente_products vp ON vp.id = sm.product_id
JOIN stock_warehouses sw ON sw.id = sm.warehouse_id
GROUP BY sm.user_id, sm.product_id, vp.name, vp.type, vp.category, vp.sku, sm.warehouse_id, sw.name, sw.city;

-- 5. Créer/remplacer la fonction RPC get_stock_quantity
CREATE OR REPLACE FUNCTION get_stock_quantity(p_product_id UUID, p_warehouse_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quantity INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN movement_type = 'IN' THEN quantity
            WHEN movement_type = 'OUT' THEN -quantity
            WHEN movement_type = 'ADJUSTMENT' THEN quantity
            WHEN movement_type = 'TRANSFER' AND destination_warehouse_id = warehouse_id THEN quantity
            ELSE 0
        END
    ), 0)
    INTO v_quantity
    FROM stock_movements
    WHERE product_id = p_product_id
    AND (p_warehouse_id IS NULL OR warehouse_id = p_warehouse_id);
    
    RETURN v_quantity;
END;
$$;

-- 6. Créer/remplacer la fonction RPC check_stock_available
CREATE OR REPLACE FUNCTION check_stock_available(p_product_id UUID, p_warehouse_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    v_current_stock := get_stock_quantity(p_product_id, p_warehouse_id);
    RETURN v_current_stock >= p_quantity;
END;
$$;

-- 7. Accorder les permissions sur les fonctions
GRANT EXECUTE ON FUNCTION get_stock_quantity(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_stock_available(UUID, UUID, INTEGER) TO authenticated;