-- Ajouter la colonne lead_id à vente_orders pour lier les commandes aux clients CRM
ALTER TABLE public.vente_orders ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances des requêtes par client
CREATE INDEX IF NOT EXISTS idx_vente_orders_lead_id ON public.vente_orders(lead_id);

-- Mettre à jour la politique RLS pour inclure lead_id
-- (Les politiques existantes restent valides car elles filtrent par user_id)