-- Migration: Ajouter plus de produits de démonstration (physiques et digitaux)
-- Pour tester le lien entre le module Vente et le module Stock

-- ============================================================================
-- 1. PRODUITS PHYSIQUES (Électronique & Informatique)
-- ============================================================================

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'MacBook Pro 14"',
  'Ordinateur portable Apple M3 Pro, 16GB RAM, 512GB SSD',
  'product',
  'Électronique',
  2399.00,
  1800.00,
  15,
  'unité',
  'APPLE-MBP14-001',
  'active',
  NOW() - INTERVAL '60 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'APPLE-MBP14-001'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'iPhone 15 Pro',
  'Smartphone Apple 256GB, Titane Naturel',
  'product',
  'Électronique',
  1229.00,
  920.00,
  25,
  'unité',
  'APPLE-IP15P-256',
  'active',
  NOW() - INTERVAL '55 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'APPLE-IP15P-256'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Dell XPS 13',
  'Ultraportable Dell Intel i7, 16GB RAM, 1TB SSD',
  'product',
  'Électronique',
  1599.00,
  1200.00,
  12,
  'unité',
  'DELL-XPS13-001',
  'active',
  NOW() - INTERVAL '50 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'DELL-XPS13-001'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Samsung Galaxy S24 Ultra',
  'Smartphone Samsung 512GB, 12GB RAM, Noir Titanium',
  'product',
  'Électronique',
  1399.00,
  1050.00,
  20,
  'unité',
  'SAMS-S24U-512',
  'active',
  NOW() - INTERVAL '45 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'SAMS-S24U-512'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Lenovo ThinkPad X1 Carbon',
  'PC portable professionnel Intel i7, 32GB RAM, 1TB SSD',
  'product',
  'Électronique',
  1899.00,
  1400.00,
  8,
  'unité',
  'LENO-X1C-001',
  'active',
  NOW() - INTERVAL '40 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'LENO-X1C-001'
)
LIMIT 1;

-- ============================================================================
-- 2. ACCESSOIRES INFORMATIQUES
-- ============================================================================

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Logitech MX Master 3S',
  'Souris sans fil ergonomique pour professionnels',
  'product',
  'Accessoires',
  109.00,
  65.00,
  45,
  'unité',
  'LOGI-MX3S-001',
  'active',
  NOW() - INTERVAL '35 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'LOGI-MX3S-001'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Keychron K2 Pro',
  'Clavier mécanique sans fil RGB, switches Brown',
  'product',
  'Accessoires',
  119.00,
  75.00,
  30,
  'unité',
  'KEYC-K2P-BRW',
  'active',
  NOW() - INTERVAL '30 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'KEYC-K2P-BRW'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Samsung SSD 990 PRO 2TB',
  'SSD NVMe M.2 PCIe 4.0, vitesse lecture 7450 MB/s',
  'product',
  'Stockage',
  189.00,
  130.00,
  50,
  'unité',
  'SAMS-990P-2TB',
  'active',
  NOW() - INTERVAL '25 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'SAMS-990P-2TB'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'LG UltraWide 34" 5K2K',
  'Écran incurvé 34 pouces 5120x2160, USB-C 90W',
  'product',
  'Périphériques',
  899.00,
  650.00,
  10,
  'unité',
  'LG-34WK-5K2K',
  'active',
  NOW() - INTERVAL '20 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'LG-34WK-5K2K'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Sony WH-1000XM5',
  'Casque sans fil à réduction de bruit active, Noir',
  'product',
  'Audio',
  399.00,
  280.00,
  35,
  'unité',
  'SONY-WH1000X5',
  'active',
  NOW() - INTERVAL '15 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'SONY-WH1000X5'
)
LIMIT 1;

-- ============================================================================
-- 3. PRODUITS DIGITAUX (Logiciels & Licences)
-- ============================================================================

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Microsoft Office 365 Business Standard',
  'Suite bureautique cloud - Licence 1 an pour 1 utilisateur',
  'product',
  'Logiciels',
  149.00,
  95.00,
  100,
  'licence',
  'MSFT-O365-BS',
  'active',
  NOW() - INTERVAL '60 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'MSFT-O365-BS'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Adobe Creative Cloud All Apps',
  'Suite complète Adobe - Licence annuelle individuelle',
  'product',
  'Logiciels',
  659.00,
  480.00,
  50,
  'licence',
  'ADBE-CC-ALL',
  'active',
  NOW() - INTERVAL '55 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'ADBE-CC-ALL'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Windows 11 Pro',
  'Système d''exploitation Microsoft Windows 11 Professionnel',
  'product',
  'Logiciels',
  259.00,
  180.00,
  75,
  'licence',
  'MSFT-W11PRO',
  'active',
  NOW() - INTERVAL '50 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'MSFT-W11PRO'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Kaspersky Total Security',
  'Antivirus premium - Protection 5 appareils pour 1 an',
  'product',
  'Sécurité',
  89.00,
  55.00,
  120,
  'licence',
  'KASP-TS-5D1Y',
  'active',
  NOW() - INTERVAL '45 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'KASP-TS-5D1Y'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'AutoCAD 2024',
  'Logiciel de conception CAO/DAO - Licence annuelle',
  'product',
  'Logiciels',
  1899.00,
  1400.00,
  20,
  'licence',
  'ADSK-ACAD24',
  'active',
  NOW() - INTERVAL '40 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'ADSK-ACAD24'
)
LIMIT 1;

-- ============================================================================
-- 4. SERVICES (Non stockables)
-- ============================================================================

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Installation & Configuration PC',
  'Service d''installation et configuration complète d''ordinateur',
  'service',
  'Services IT',
  79.00,
  NULL,
  NULL,
  'prestation',
  'SRV-INSTALL-PC',
  'active',
  NOW() - INTERVAL '30 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'SRV-INSTALL-PC'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Support Technique à Distance',
  'Assistance technique à distance - 1 heure',
  'service',
  'Services IT',
  59.00,
  NULL,
  NULL,
  'heure',
  'SRV-SUPP-1H',
  'active',
  NOW() - INTERVAL '25 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'SRV-SUPP-1H'
)
LIMIT 1;

INSERT INTO public.vente_products (user_id, name, description, type, category, price, cost, stock, unit, sku, status, created_at)
SELECT
  u.id,
  'Formation Office 365',
  'Formation individuelle à Microsoft Office 365 - Session 2h',
  'service',
  'Formation',
  149.00,
  NULL,
  NULL,
  'session',
  'SRV-FORM-O365',
  'active',
  NOW() - INTERVAL '20 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.vente_products p
  WHERE p.user_id = u.id AND p.sku = 'SRV-FORM-O365'
)
LIMIT 1;

-- ============================================================================
-- 5. RÉSUMÉ DES PRODUITS CRÉÉS
-- ============================================================================

DO $$
DECLARE
  physical_count INTEGER;
  digital_count INTEGER;
  service_count INTEGER;
  total_stock BIGINT;
BEGIN
  SELECT COUNT(*) INTO physical_count
  FROM public.vente_products
  WHERE type = 'product' AND category IN ('Électronique', 'Accessoires', 'Stockage', 'Périphériques', 'Audio');

  SELECT COUNT(*) INTO digital_count
  FROM public.vente_products
  WHERE type = 'product' AND category IN ('Logiciels', 'Sécurité');

  SELECT COUNT(*) INTO service_count
  FROM public.vente_products
  WHERE type = 'service';

  SELECT SUM(COALESCE(stock, 0)) INTO total_stock
  FROM public.vente_products
  WHERE type = 'product';

  RAISE NOTICE 'Migration terminée:';
  RAISE NOTICE '- Produits physiques: %', physical_count;
  RAISE NOTICE '- Produits digitaux/licences: %', digital_count;
  RAISE NOTICE '- Services (non stockables): %', service_count;
  RAISE NOTICE '- Stock total disponible: % unités', total_stock;
END $$;

COMMENT ON MIGRATION IS 'Produits de démonstration pour tester le lien Vente ↔ Stock : physiques, digitaux, services';
