-- ============================================================================
-- CORRECTIONS TEST 1: Parcours Client Complet
-- ============================================================================

-- 1. Ajouter order_id à compta_invoices pour lien direct commande → facture
ALTER TABLE public.compta_invoices 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.vente_orders(id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_compta_invoices_order_id ON public.compta_invoices(order_id);

-- 2. Fonction pour synchroniser le statut de paiement de la commande
CREATE OR REPLACE FUNCTION public.sync_order_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Récupérer l'order_id de la facture
  SELECT order_id INTO v_order_id
  FROM compta_invoices
  WHERE id = NEW.id;

  -- Si la facture est liée à une commande, mettre à jour son statut
  IF v_order_id IS NOT NULL THEN
    UPDATE vente_orders
    SET payment_status = CASE 
      WHEN NEW.status = 'paid' THEN 'paid'
      WHEN NEW.status = 'partial' THEN 'partial'
      ELSE payment_status
    END,
    updated_at = NOW()
    WHERE id = v_order_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour synchroniser automatiquement
DROP TRIGGER IF EXISTS trigger_sync_order_payment_status ON compta_invoices;
CREATE TRIGGER trigger_sync_order_payment_status
AFTER UPDATE OF status ON compta_invoices
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_order_payment_status();

-- 3. Fonction pour logger automatiquement les interactions CRM lors des changements de statut
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Logger uniquement si le statut a changé
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO crm_lead_interactions (
      lead_id,
      user_id,
      type,
      content,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'status_change',
      'Statut changé de "' || COALESCE(OLD.status::text, 'nouveau') || '" à "' || NEW.status::text || '"',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour logger les changements de statut
DROP TRIGGER IF EXISTS trigger_log_lead_status_change ON leads;
CREATE TRIGGER trigger_log_lead_status_change
AFTER UPDATE OF status ON leads
FOR EACH ROW
EXECUTE FUNCTION log_lead_status_change();