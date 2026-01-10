-- ============================================================================
-- Migration: Nettoyage des tables obsolètes après refactoring architectural
-- Date: 2026-01-10
-- Description: Supprime les tables dupliquées qui ont été recréées par erreur
--              après le refactoring architectural vers stock_warehouses
-- ============================================================================

-- Cette migration garantit que seule l'architecture unifiée est présente
-- Les tables suivantes doivent être supprimées si elles existent :
-- - boutiques (remplacée par stock_warehouses avec type='STORE')
-- - stock_movements (version Caisse, conflictuelle avec Stock module)
-- - stock_actuel (vue matérialisée, remplacée par stock_levels)

-- ============================================================================
-- 1. SUPPRIMER LA TABLE BOUTIQUES SI ELLE EXISTE
-- ============================================================================

-- Migrer les données restantes vers stock_warehouses si nécessaire
DO $$
BEGIN
  -- Vérifier si la table boutiques existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'boutiques'
    AND table_schema = 'public'
  ) THEN

    -- Migrer les boutiques qui ne sont pas encore dans stock_warehouses
    INSERT INTO public.stock_warehouses (
      user_id, name, type, address, city, country,
      gps_lat, gps_lng, manager_name, phone, is_active, created_at
    )
    SELECT
      b.user_id,
      b.nom,
      'STORE'::TEXT,
      b.adresse,
      b.ville,
      'Senegal',
      b.latitude,
      b.longitude,
      b.responsable_nom,
      b.telephone,
      CASE WHEN b.statut = 'active' THEN true ELSE false END,
      b.created_at
    FROM public.boutiques b
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stock_warehouses sw
      WHERE sw.name = b.nom AND sw.user_id = b.user_id
    );

    -- Mettre à jour les références dans caisses_journalieres si la colonne boutique_id existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'caisses_journalieres'
      AND column_name = 'boutique_id'
    ) THEN
      -- Créer warehouse_id si elle n'existe pas
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'caisses_journalieres'
        AND column_name = 'warehouse_id'
      ) THEN
        ALTER TABLE public.caisses_journalieres
        ADD COLUMN warehouse_id UUID;
      END IF;

      -- Copier les IDs en faisant correspondre nom de boutique avec nom de warehouse
      UPDATE public.caisses_journalieres cj
      SET warehouse_id = sw.id
      FROM public.boutiques b
      JOIN public.stock_warehouses sw ON sw.name = b.nom AND sw.user_id = b.user_id
      WHERE cj.boutique_id = b.id
      AND cj.warehouse_id IS NULL;

      -- Ajouter la foreign key si elle n'existe pas
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'caisses_journalieres_warehouse_id_fkey'
      ) THEN
        ALTER TABLE public.caisses_journalieres
        ADD CONSTRAINT caisses_journalieres_warehouse_id_fkey
        FOREIGN KEY (warehouse_id)
        REFERENCES public.stock_warehouses(id)
        ON DELETE RESTRICT;
      END IF;

      -- Supprimer la colonne boutique_id
      ALTER TABLE public.caisses_journalieres
      DROP COLUMN IF EXISTS boutique_id CASCADE;
    END IF;

    -- Mettre à jour les références dans vente_orders si la colonne boutique_id existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'vente_orders'
      AND column_name = 'boutique_id'
    ) THEN
      -- Créer warehouse_id si elle n'existe pas
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vente_orders'
        AND column_name = 'warehouse_id'
      ) THEN
        ALTER TABLE public.vente_orders
        ADD COLUMN warehouse_id UUID;
      END IF;

      -- Copier les IDs
      UPDATE public.vente_orders vo
      SET warehouse_id = sw.id
      FROM public.boutiques b
      JOIN public.stock_warehouses sw ON sw.name = b.nom AND sw.user_id = b.user_id
      WHERE vo.boutique_id = b.id
      AND vo.warehouse_id IS NULL;

      -- Supprimer la colonne boutique_id
      ALTER TABLE public.vente_orders
      DROP COLUMN IF EXISTS boutique_id CASCADE;
    END IF;

    -- Supprimer la table boutiques
    DROP TABLE IF EXISTS public.boutiques CASCADE;

    RAISE NOTICE 'Table boutiques supprimée et données migrées vers stock_warehouses';
  ELSE
    RAISE NOTICE 'Table boutiques n''existe pas, rien à faire';
  END IF;
END $$;

-- ============================================================================
-- 2. SUPPRIMER LA VUE STOCK_ACTUEL SI ELLE EXISTE
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.stock_actuel CASCADE;
DROP VIEW IF EXISTS public.stock_actuel CASCADE;

-- ============================================================================
-- 3. NETTOYER LES DOUBLONS DANS STOCK_MOVEMENTS SI NÉCESSAIRE
-- ============================================================================

-- Vérifier qu'il n'y a qu'une seule table stock_movements (celle du module Stock)
DO $$
BEGIN
  -- S'assurer que stock_movements a les bonnes colonnes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements'
    AND column_name = 'boutique_id'
  ) THEN
    -- Migrer boutique_id vers warehouse_id si nécessaire
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stock_movements'
      AND column_name = 'warehouse_id'
    ) THEN
      ALTER TABLE public.stock_movements
      RENAME COLUMN boutique_id TO warehouse_id;
    END IF;
  END IF;

  -- Renommer produit_id vers product_id si nécessaire
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements'
    AND column_name = 'produit_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stock_movements'
      AND column_name = 'product_id'
    ) THEN
      ALTER TABLE public.stock_movements
      RENAME COLUMN produit_id TO product_id;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 4. VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
  v_boutiques_exists BOOLEAN;
  v_stock_actuel_exists BOOLEAN;
BEGIN
  -- Vérifier que boutiques n'existe plus
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'boutiques'
    AND table_schema = 'public'
  ) INTO v_boutiques_exists;

  -- Vérifier que stock_actuel n'existe plus
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'stock_actuel'
    AND table_schema = 'public'
  ) INTO v_stock_actuel_exists;

  IF v_boutiques_exists THEN
    RAISE EXCEPTION 'ERREUR: La table boutiques existe encore après nettoyage';
  END IF;

  IF v_stock_actuel_exists THEN
    RAISE EXCEPTION 'ERREUR: La vue stock_actuel existe encore après nettoyage';
  END IF;

  RAISE NOTICE '✓ Nettoyage terminé avec succès';
  RAISE NOTICE '✓ Architecture unifiée confirmée';
  RAISE NOTICE '✓ stock_warehouses est la seule source pour les warehouses/boutiques';
END $$;

-- ============================================================================
-- FIN DE LA MIGRATION DE NETTOYAGE
-- ============================================================================
