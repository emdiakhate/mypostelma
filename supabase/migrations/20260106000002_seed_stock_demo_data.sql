-- Migration: Données de démonstration pour le module Stock
-- Crée des entrepôts et mouvements de stock pour les produits existants

-- ============================================================================
-- 1. CRÉER DES ENTREPÔTS DE DÉMONSTRATION
-- ============================================================================

-- Insérer des entrepôts pour chaque utilisateur qui a des produits
INSERT INTO public.stock_warehouses (user_id, name, type, address, city, country, is_active, manager_name, phone)
SELECT DISTINCT
  p.user_id,
  'Entrepôt Principal',
  'WAREHOUSE',
  '123 Rue du Commerce',
  'Paris',
  'France',
  true,
  'Gestionnaire Stock',
  '+33 1 23 45 67 89'
FROM public.vente_products p
WHERE p.type = 'product' -- Uniquement pour les produits physiques
  AND NOT EXISTS (
    -- Ne créer que si l'utilisateur n'a pas déjà d'entrepôt
    SELECT 1 FROM public.stock_warehouses w WHERE w.user_id = p.user_id
  );

-- Ajouter un deuxième entrepôt "Boutique" pour chaque utilisateur
INSERT INTO public.stock_warehouses (user_id, name, type, address, city, country, is_active, manager_name, phone)
SELECT DISTINCT
  p.user_id,
  'Boutique Centre-Ville',
  'STORE',
  '45 Avenue Principale',
  'Paris',
  'France',
  true,
  'Responsable Boutique',
  '+33 1 98 76 54 32'
FROM public.vente_products p
WHERE p.type = 'product'
  AND NOT EXISTS (
    -- Ne créer que si l'utilisateur n'a pas déjà 2 entrepôts
    SELECT 1 FROM public.stock_warehouses w
    WHERE w.user_id = p.user_id
    GROUP BY w.user_id
    HAVING COUNT(*) >= 2
  );

-- ============================================================================
-- 2. CRÉER DES MOUVEMENTS DE STOCK INITIAUX (IN)
-- ============================================================================

-- Pour chaque produit physique, créer un mouvement d'entrée initial
INSERT INTO public.stock_movements (
  user_id,
  product_id,
  warehouse_to_id,
  movement_type,
  quantity,
  reason,
  reference_type,
  reference_number,
  unit_cost,
  total_cost,
  created_by,
  created_at
)
SELECT
  p.user_id,
  p.id,
  w.id,
  'IN',
  -- Quantité basée sur le stock défini dans vente_products (ou 100 par défaut)
  COALESCE(p.stock, 100),
  'Stock initial',
  'MANUAL',
  'INIT-' || SUBSTRING(p.id::text, 1, 8),
  -- Coût unitaire = cost du produit (ou prix / 2 si pas de cost)
  COALESCE(p.cost, p.price * 0.5),
  COALESCE(p.cost, p.price * 0.5) * COALESCE(p.stock, 100),
  'system',
  NOW() - INTERVAL '30 days'  -- Créé il y a 30 jours
FROM public.vente_products p
INNER JOIN public.stock_warehouses w ON w.user_id = p.user_id AND w.type = 'WAREHOUSE'
WHERE p.type = 'product'  -- Uniquement produits physiques
  AND p.status = 'active'
  AND NOT EXISTS (
    -- Ne pas dupliquer si déjà existant
    SELECT 1 FROM public.stock_movements sm
    WHERE sm.product_id = p.id AND sm.movement_type = 'IN'
  );

-- ============================================================================
-- 3. CRÉER QUELQUES MOUVEMENTS DE SORTIE (OUT) POUR RÉALISME
-- ============================================================================

-- Créer des sorties aléatoires pour simuler des ventes
INSERT INTO public.stock_movements (
  user_id,
  product_id,
  warehouse_from_id,
  movement_type,
  quantity,
  reason,
  reference_type,
  reference_number,
  created_by,
  created_at
)
SELECT
  p.user_id,
  p.id,
  w.id,
  'OUT',
  -- Sortie entre 5 et 20 unités
  5 + (RANDOM() * 15)::INTEGER,
  'Vente en ligne',
  'ORDER',
  'CMD-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0'),
  'system',
  NOW() - INTERVAL '15 days' + (RANDOM() * INTERVAL '14 days')
FROM public.vente_products p
INNER JOIN public.stock_warehouses w ON w.user_id = p.user_id AND w.type = 'WAREHOUSE'
WHERE p.type = 'product'
  AND p.status = 'active'
  AND RANDOM() > 0.5  -- 50% des produits ont des sorties
LIMIT 10;

-- ============================================================================
-- 4. CRÉER QUELQUES TRANSFERTS POUR DÉMONSTRATION
-- ============================================================================

-- Créer des transferts entre entrepôt et boutique
INSERT INTO public.stock_movements (
  user_id,
  product_id,
  warehouse_from_id,
  warehouse_to_id,
  movement_type,
  quantity,
  reason,
  reference_type,
  reference_number,
  created_by,
  created_at
)
SELECT
  p.user_id,
  p.id,
  w_from.id,
  w_to.id,
  'TRANSFER',
  -- Transfert entre 10 et 30 unités
  10 + (RANDOM() * 20)::INTEGER,
  'Réapprovisionnement boutique',
  'MANUAL',
  'TRF-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0'),
  'system',
  NOW() - INTERVAL '7 days' + (RANDOM() * INTERVAL '6 days')
FROM public.vente_products p
INNER JOIN public.stock_warehouses w_from ON w_from.user_id = p.user_id AND w_from.type = 'WAREHOUSE'
INNER JOIN public.stock_warehouses w_to ON w_to.user_id = p.user_id AND w_to.type = 'STORE'
WHERE p.type = 'product'
  AND p.status = 'active'
  AND RANDOM() > 0.7  -- 30% des produits ont des transferts
LIMIT 5;

-- ============================================================================
-- 5. CRÉER DES ALERTES DE STOCK BAS
-- ============================================================================

-- Créer des alertes pour les produits avec stock bas (basé sur stock_levels)
INSERT INTO public.stock_alerts (
  user_id,
  product_id,
  warehouse_id,
  alert_type,
  current_quantity,
  threshold_quantity,
  message,
  status,
  created_at
)
SELECT
  sl.user_id,
  sl.product_id,
  sl.warehouse_id,
  'LOW_STOCK',
  sl.current_quantity,
  20,  -- Seuil: 20 unités
  'Stock bas pour ' || sl.product_name || ' dans ' || sl.warehouse_name,
  'ACTIVE',
  NOW()
FROM public.stock_levels sl
WHERE sl.current_quantity > 0
  AND sl.current_quantity < 20  -- Moins de 20 unités
  AND NOT EXISTS (
    SELECT 1 FROM public.stock_alerts sa
    WHERE sa.product_id = sl.product_id
      AND sa.warehouse_id = sl.warehouse_id
      AND sa.status = 'ACTIVE'
  )
LIMIT 10;

-- ============================================================================
-- 6. COMMENTAIRES ET RÉSUMÉ
-- ============================================================================

COMMENT ON MIGRATION IS 'Données de démonstration pour le module Stock: entrepôts, mouvements (IN/OUT/TRANSFER), et alertes de stock bas';

-- Afficher un résumé des données créées
DO $$
DECLARE
  warehouse_count INTEGER;
  movement_count INTEGER;
  alert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO warehouse_count FROM public.stock_warehouses;
  SELECT COUNT(*) INTO movement_count FROM public.stock_movements;
  SELECT COUNT(*) INTO alert_count FROM public.stock_alerts WHERE status = 'ACTIVE';

  RAISE NOTICE 'Migration terminée:';
  RAISE NOTICE '- Entrepôts créés: %', warehouse_count;
  RAISE NOTICE '- Mouvements créés: %', movement_count;
  RAISE NOTICE '- Alertes actives: %', alert_count;
END $$;
