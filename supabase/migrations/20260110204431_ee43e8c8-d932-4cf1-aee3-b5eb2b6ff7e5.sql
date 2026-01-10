-- =====================================================
-- MIGRATION: Refactoring architecture Caisse - Étape corrigée
-- =====================================================

-- =====================================================
-- ÉTAPE 1: Supprimer TOUTES les politiques RLS qui dépendent de boutique_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view their boutiques caisses" ON public.caisses_journalieres;
DROP POLICY IF EXISTS "Users can create caisses for their boutiques" ON public.caisses_journalieres;
DROP POLICY IF EXISTS "Users can update their boutiques caisses" ON public.caisses_journalieres;
DROP POLICY IF EXISTS "Users can view mouvements of their caisses" ON public.mouvements_caisse;
DROP POLICY IF EXISTS "Users can create mouvements for their caisses" ON public.mouvements_caisse;
DROP POLICY IF EXISTS "Users can view their own caisses" ON public.caisses_journalieres;
DROP POLICY IF EXISTS "Users can create their own caisses" ON public.caisses_journalieres;
DROP POLICY IF EXISTS "Users can update their own caisses" ON public.caisses_journalieres;
DROP POLICY IF EXISTS "Users can delete their own caisses" ON public.caisses_journalieres;
DROP POLICY IF EXISTS "Users can view their own mouvements" ON public.mouvements_caisse;
DROP POLICY IF EXISTS "Users can create their own mouvements" ON public.mouvements_caisse;

-- =====================================================
-- ÉTAPE 2: Supprimer les contraintes de clé étrangère
-- =====================================================

ALTER TABLE public.caisses_journalieres 
DROP CONSTRAINT IF EXISTS caisses_journalieres_boutique_id_fkey;

ALTER TABLE public.vente_orders 
DROP CONSTRAINT IF EXISTS vente_orders_boutique_id_fkey;

-- =====================================================
-- ÉTAPE 3: Supprimer les colonnes boutique_id
-- =====================================================

ALTER TABLE public.caisses_journalieres 
DROP COLUMN IF EXISTS boutique_id CASCADE;

ALTER TABLE public.vente_orders 
DROP COLUMN IF EXISTS boutique_id CASCADE;

-- =====================================================
-- ÉTAPE 4: Supprimer la table boutiques
-- =====================================================

DROP TABLE IF EXISTS public.boutiques CASCADE;

-- =====================================================
-- ÉTAPE 5: S'assurer que warehouse_id existe et a la FK correcte
-- =====================================================

-- caisses_journalieres
ALTER TABLE public.caisses_journalieres 
ADD COLUMN IF NOT EXISTS warehouse_id uuid;

ALTER TABLE public.caisses_journalieres 
DROP CONSTRAINT IF EXISTS caisses_journalieres_warehouse_id_fkey;

ALTER TABLE public.caisses_journalieres 
ADD CONSTRAINT caisses_journalieres_warehouse_id_fkey 
FOREIGN KEY (warehouse_id) REFERENCES public.stock_warehouses(id) ON DELETE CASCADE;

-- vente_orders
ALTER TABLE public.vente_orders 
ADD COLUMN IF NOT EXISTS warehouse_id uuid;

ALTER TABLE public.vente_orders 
DROP CONSTRAINT IF EXISTS vente_orders_warehouse_id_fkey;

ALTER TABLE public.vente_orders 
ADD CONSTRAINT vente_orders_warehouse_id_fkey 
FOREIGN KEY (warehouse_id) REFERENCES public.stock_warehouses(id) ON DELETE SET NULL;

-- =====================================================
-- ÉTAPE 6: Recréer les politiques RLS avec warehouse_id
-- =====================================================

-- Politiques pour caisses_journalieres
CREATE POLICY "Users can view their own caisses" 
ON public.caisses_journalieres FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own caisses" 
ON public.caisses_journalieres FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caisses" 
ON public.caisses_journalieres FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caisses" 
ON public.caisses_journalieres FOR DELETE 
USING (auth.uid() = user_id);

-- Politiques pour mouvements_caisse
CREATE POLICY "Users can view their own mouvements" 
ON public.mouvements_caisse FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mouvements" 
ON public.mouvements_caisse FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ÉTAPE 7: Ajouter solde_theorique si manquant
-- =====================================================

ALTER TABLE public.caisses_journalieres 
ADD COLUMN IF NOT EXISTS solde_theorique numeric DEFAULT 0;