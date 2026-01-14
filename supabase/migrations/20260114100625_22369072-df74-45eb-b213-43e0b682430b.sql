-- =====================================================
-- PHASE 1: CORRECTIONS DE SÉCURITÉ CRITIQUES
-- =====================================================

-- 1. Ajouter les rôles manquants à l'enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'creator';