-- Migration: Ajout table de suivi des relances factures
-- Permet de tracker les emails/WhatsApp de relance envoyés automatiquement

-- Table des relances
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL REFERENCES compta_invoices(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'whatsapp', 'both')),
  days_overdue INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_invoice_reminders_invoice_id ON public.invoice_reminders(invoice_id);
CREATE INDEX idx_invoice_reminders_user_id ON public.invoice_reminders(user_id);
CREATE INDEX idx_invoice_reminders_sent_at ON public.invoice_reminders(sent_at);

-- RLS
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reminders"
  ON public.invoice_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.invoice_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE public.invoice_reminders IS 'Suivi des relances automatiques envoyées pour les factures en retard';
COMMENT ON COLUMN public.invoice_reminders.reminder_type IS 'Type de relance: email, whatsapp, ou both';
COMMENT ON COLUMN public.invoice_reminders.days_overdue IS 'Nombre de jours de retard au moment de l''envoi';
COMMENT ON COLUMN public.invoice_reminders.status IS 'Statut de l''envoi: sent, failed, bounced';
