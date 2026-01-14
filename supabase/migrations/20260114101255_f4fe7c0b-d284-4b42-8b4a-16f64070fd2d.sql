-- Recréer la vue stock_levels avec SECURITY INVOKER
DROP VIEW IF EXISTS public.stock_levels;
CREATE VIEW public.stock_levels
WITH (security_invoker=on) AS
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
    sum(
        CASE
            WHEN sm.movement_type = 'IN' THEN sm.quantity
            WHEN sm.movement_type = 'OUT' THEN -sm.quantity
            WHEN sm.movement_type = 'ADJUSTMENT' THEN sm.quantity
            WHEN sm.movement_type = 'TRANSFER' AND sm.destination_warehouse_id = sm.warehouse_id THEN sm.quantity
            ELSE 0
        END
    ) AS current_quantity,
    vp.min_stock_quantity,
    CASE
        WHEN sum(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity WHEN sm.movement_type = 'OUT' THEN -sm.quantity WHEN sm.movement_type = 'ADJUSTMENT' THEN sm.quantity ELSE 0 END) <= 0 THEN 'out_of_stock'
        WHEN sum(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity WHEN sm.movement_type = 'OUT' THEN -sm.quantity WHEN sm.movement_type = 'ADJUSTMENT' THEN sm.quantity ELSE 0 END) <= COALESCE(vp.min_stock_quantity, 0) THEN 'low'
        ELSE 'normal'
    END AS stock_status
FROM stock_movements sm
JOIN vente_products vp ON sm.product_id = vp.id
JOIN stock_warehouses sw ON sm.warehouse_id = sw.id
GROUP BY sm.user_id, sm.product_id, vp.name, vp.type, vp.category, vp.sku, sm.warehouse_id, sw.name, sw.city, vp.min_stock_quantity;