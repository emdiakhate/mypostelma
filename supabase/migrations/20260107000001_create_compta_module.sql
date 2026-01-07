-- Migration: Module Comptabilité - Devis & Factures
-- Création des tables pour la gestion des devis, factures et paiements

-- ============================================================================
-- 1. EXTENSION DU MODULE CRM (CLIENTS)
-- ============================================================================

-- Ajouter un flag pour identifier les clients (leads convertis)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS customer_since TIMESTAMP WITH TIME ZONE;

-- Index pour recherche rapide des clients
CREATE INDEX IF NOT EXISTS idx_leads_is_customer ON public.leads(is_customer) WHERE is_customer = true;

COMMENT ON COLUMN public.leads.is_customer IS 'Indique si le lead est devenu client (a au moins une facture)';
COMMENT ON COLUMN public.leads.customer_since IS 'Date de conversion en client';

-- ============================================================================
-- 2. TABLE DE SÉQUENCES (NUMÉROTATION AUTO)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compta_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN ('quote', 'invoice')),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  next_number INTEGER NOT NULL DEFAULT 1,
  prefix TEXT NOT NULL, -- Ex: 'DEV', 'FAC'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un seul compteur par (user, type, année)
  UNIQUE(user_id, sequence_type, year)
);

-- Index
CREATE INDEX idx_compta_sequences_user ON public.compta_sequences(user_id);

-- RLS
ALTER TABLE public.compta_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sequences"
  ON public.compta_sequences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.compta_sequences IS 'Compteurs pour numérotation automatique des devis et factures';

-- ============================================================================
-- 3. TABLE DEVIS (QUOTES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compta_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,

  -- Numérotation
  quote_number TEXT NOT NULL,

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE NOT NULL,

  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),

  -- Montants (en centimes pour éviter erreurs arrondis)
  currency TEXT NOT NULL DEFAULT 'XOF',
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00, -- Taux TVA en %
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,

  -- Textes
  notes TEXT,
  terms TEXT, -- Conditions générales

  -- Métadonnées
  created_from_ocr BOOLEAN DEFAULT false,
  ocr_scan_id UUID REFERENCES public.compta_ocr_scans(id) ON DELETE SET NULL,
  converted_to_invoice_id UUID, -- Référence facture créée

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  UNIQUE(user_id, quote_number),
  CHECK (expiration_date >= issue_date),
  CHECK (total >= 0)
);

-- Index
CREATE INDEX idx_compta_quotes_user ON public.compta_quotes(user_id);
CREATE INDEX idx_compta_quotes_client ON public.compta_quotes(client_id);
CREATE INDEX idx_compta_quotes_status ON public.compta_quotes(status);
CREATE INDEX idx_compta_quotes_issue_date ON public.compta_quotes(issue_date DESC);

-- RLS
ALTER TABLE public.compta_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quotes"
  ON public.compta_quotes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.compta_quotes IS 'Devis créés par les utilisateurs';

-- ============================================================================
-- 4. TABLE LIGNES DE DEVIS (QUOTE ITEMS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compta_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.compta_quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.vente_products(id) ON DELETE SET NULL,

  -- Description
  description TEXT NOT NULL,

  -- Quantités et prix
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,

  -- Remise et TVA
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,

  -- Total ligne
  subtotal DECIMAL(15, 2) NOT NULL, -- Avant remise et taxe
  total DECIMAL(15, 2) NOT NULL, -- Après remise et taxe

  -- Ordre d'affichage
  line_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  CHECK (quantity > 0),
  CHECK (unit_price >= 0),
  CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

-- Index
CREATE INDEX idx_compta_quote_items_quote ON public.compta_quote_items(quote_id);
CREATE INDEX idx_compta_quote_items_product ON public.compta_quote_items(product_id);

-- RLS (hérite du devis parent)
ALTER TABLE public.compta_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quote items"
  ON public.compta_quote_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.compta_quotes q
      WHERE q.id = quote_id AND q.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compta_quotes q
      WHERE q.id = quote_id AND q.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.compta_quote_items IS 'Lignes de devis (produits/services)';

-- ============================================================================
-- 5. TABLE FACTURES (INVOICES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compta_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
  quote_id UUID REFERENCES public.compta_quotes(id) ON DELETE SET NULL,

  -- Numérotation
  invoice_number TEXT NOT NULL,

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),

  -- Montants
  currency TEXT NOT NULL DEFAULT 'XOF',
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,

  -- Paiements
  amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(15, 2) NOT NULL DEFAULT 0, -- total - amount_paid

  -- Textes
  notes TEXT,
  terms TEXT,

  -- Métadonnées
  created_from_ocr BOOLEAN DEFAULT false,
  ocr_scan_id UUID REFERENCES public.compta_ocr_scans(id) ON DELETE SET NULL,
  stock_impact_applied BOOLEAN DEFAULT false, -- Impact stock déjà appliqué ?

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  UNIQUE(user_id, invoice_number),
  CHECK (due_date >= issue_date),
  CHECK (total >= 0),
  CHECK (amount_paid >= 0),
  CHECK (balance_due >= 0)
);

-- Index
CREATE INDEX idx_compta_invoices_user ON public.compta_invoices(user_id);
CREATE INDEX idx_compta_invoices_client ON public.compta_invoices(client_id);
CREATE INDEX idx_compta_invoices_status ON public.compta_invoices(status);
CREATE INDEX idx_compta_invoices_issue_date ON public.compta_invoices(issue_date DESC);
CREATE INDEX idx_compta_invoices_due_date ON public.compta_invoices(due_date);

-- RLS
ALTER TABLE public.compta_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invoices"
  ON public.compta_invoices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.compta_invoices IS 'Factures émises aux clients';

-- ============================================================================
-- 6. TABLE LIGNES DE FACTURES (INVOICE ITEMS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compta_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.compta_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.vente_products(id) ON DELETE SET NULL,

  -- Description
  description TEXT NOT NULL,

  -- Quantités et prix
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,

  -- Remise et TVA
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,

  -- Total ligne
  subtotal DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,

  -- Ordre d'affichage
  line_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  CHECK (quantity > 0),
  CHECK (unit_price >= 0),
  CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

-- Index
CREATE INDEX idx_compta_invoice_items_invoice ON public.compta_invoice_items(invoice_id);
CREATE INDEX idx_compta_invoice_items_product ON public.compta_invoice_items(product_id);

-- RLS
ALTER TABLE public.compta_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their invoice items"
  ON public.compta_invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.compta_invoices i
      WHERE i.id = invoice_id AND i.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compta_invoices i
      WHERE i.id = invoice_id AND i.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.compta_invoice_items IS 'Lignes de factures (produits/services)';

-- ============================================================================
-- 7. TABLE PAIEMENTS (PAYMENTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compta_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.compta_invoices(id) ON DELETE CASCADE,

  -- Montant et méthode
  amount DECIMAL(15, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'other')),

  -- Référence paiement
  reference TEXT, -- Ex: numéro de transaction Wave, Orange Money

  -- Date
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT, -- Email utilisateur qui a enregistré le paiement

  -- Contraintes
  CHECK (amount > 0)
);

-- Index
CREATE INDEX idx_compta_payments_invoice ON public.compta_payments(invoice_id);
CREATE INDEX idx_compta_payments_user ON public.compta_payments(user_id);
CREATE INDEX idx_compta_payments_date ON public.compta_payments(payment_date DESC);

-- RLS
ALTER TABLE public.compta_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their payments"
  ON public.compta_payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.compta_payments IS 'Paiements reçus pour les factures';

-- ============================================================================
-- 8. TABLE SCANS OCR
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compta_ocr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Fichier uploadé
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image/jpeg', 'application/pdf', etc.
  file_size INTEGER, -- En bytes

  -- Résultat OCR
  extracted_data JSONB, -- Données structurées extraites
  raw_text TEXT, -- Texte brut extrait
  confidence_score DECIMAL(5, 2), -- Score de confiance (0-100)

  -- Statut traitement
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Création suite au scan
  created_quote_id UUID REFERENCES public.compta_quotes(id) ON DELETE SET NULL,
  created_invoice_id UUID REFERENCES public.compta_invoices(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,

  -- Contraintes
  CHECK (file_size > 0 AND file_size <= 20971520) -- Max 20MB
);

-- Index
CREATE INDEX idx_compta_ocr_scans_user ON public.compta_ocr_scans(user_id);
CREATE INDEX idx_compta_ocr_scans_status ON public.compta_ocr_scans(status);
CREATE INDEX idx_compta_ocr_scans_created_at ON public.compta_ocr_scans(created_at DESC);

-- RLS
ALTER TABLE public.compta_ocr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their OCR scans"
  ON public.compta_ocr_scans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.compta_ocr_scans IS 'Scans OCR de factures et devis papier';

-- ============================================================================
-- 9. FONCTIONS & TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER update_compta_quotes_updated_at
  BEFORE UPDATE ON public.compta_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compta_invoices_updated_at
  BEFORE UPDATE ON public.compta_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compta_sequences_updated_at
  BEFORE UPDATE ON public.compta_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer le balance_due automatiquement
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due = NEW.total - NEW.amount_paid;

  -- Mettre à jour le statut selon le paiement
  IF NEW.balance_due = 0 AND NEW.total > 0 THEN
    NEW.status = 'paid';
    NEW.paid_at = NOW();
  ELSIF NEW.amount_paid > 0 AND NEW.balance_due > 0 THEN
    NEW.status = 'partial';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.balance_due > 0 AND NEW.status NOT IN ('cancelled', 'draft') THEN
    NEW.status = 'overdue';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour balance_due
CREATE TRIGGER calculate_invoice_balance_trigger
  BEFORE INSERT OR UPDATE OF total, amount_paid, due_date ON public.compta_invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_balance();

-- Fonction pour mettre à jour amount_paid après ajout paiement
CREATE OR REPLACE FUNCTION update_invoice_amount_paid()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.compta_invoices
  SET amount_paid = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.compta_payments
    WHERE invoice_id = NEW.invoice_id
  )
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger après insertion paiement
CREATE TRIGGER update_invoice_amount_paid_trigger
  AFTER INSERT ON public.compta_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_amount_paid();

-- Fonction pour obtenir le prochain numéro de séquence
CREATE OR REPLACE FUNCTION get_next_sequence_number(
  p_user_id UUID,
  p_sequence_type TEXT,
  p_prefix TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
  v_prefix TEXT;
  v_sequence_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());

  -- Déterminer le préfixe
  v_prefix := COALESCE(p_prefix, CASE p_sequence_type
    WHEN 'quote' THEN 'DEV'
    WHEN 'invoice' THEN 'FAC'
    ELSE 'DOC'
  END);

  -- Insérer ou mettre à jour la séquence
  INSERT INTO public.compta_sequences (user_id, sequence_type, year, next_number, prefix)
  VALUES (p_user_id, p_sequence_type, v_year, 2, v_prefix)
  ON CONFLICT (user_id, sequence_type, year)
  DO UPDATE SET
    next_number = public.compta_sequences.next_number + 1,
    updated_at = NOW()
  RETURNING next_number - 1 INTO v_next_number;

  -- Si c'était une insertion, next_number vaut 2, donc on récupère 1
  IF v_next_number IS NULL THEN
    v_next_number := 1;
  END IF;

  -- Formater le numéro: DEV-2026-0001
  v_sequence_number := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 4, '0');

  RETURN v_sequence_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_sequence_number IS 'Génère le prochain numéro de devis ou facture';

-- ============================================================================
-- 10. DONNÉES INITIALES
-- ============================================================================

-- Créer les séquences initiales pour les utilisateurs existants
INSERT INTO public.compta_sequences (user_id, sequence_type, year, next_number, prefix)
SELECT
  u.id,
  'quote',
  EXTRACT(YEAR FROM NOW())::INTEGER,
  1,
  'DEV'
FROM auth.users u
ON CONFLICT (user_id, sequence_type, year) DO NOTHING;

INSERT INTO public.compta_sequences (user_id, sequence_type, year, next_number, prefix)
SELECT
  u.id,
  'invoice',
  EXTRACT(YEAR FROM NOW())::INTEGER,
  1,
  'FAC'
FROM auth.users u
ON CONFLICT (user_id, sequence_type, year) DO NOTHING;

-- ============================================================================
-- 11. RÉSUMÉ
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'compta_%';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename LIKE 'compta_%';

  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_next_sequence_number', 'calculate_invoice_balance', 'update_invoice_amount_paid');

  RAISE NOTICE 'Migration Module Comptabilité terminée:';
  RAISE NOTICE '- Tables créées: %', table_count;
  RAISE NOTICE '- Policies RLS: %', policy_count;
  RAISE NOTICE '- Fonctions: %', function_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Tables: compta_sequences, compta_quotes, compta_quote_items,';
  RAISE NOTICE '        compta_invoices, compta_invoice_items, compta_payments,';
  RAISE NOTICE '        compta_ocr_scans';
END $$;
