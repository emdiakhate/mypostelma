-- ============================================================================
-- Module Comptabilité: Devis, Factures, Paiements, OCR
-- ============================================================================

-- Fonction pour générer les numéros de séquence
CREATE OR REPLACE FUNCTION public.get_next_sequence_number(
  p_user_id UUID,
  p_sequence_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_prefix TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Définir le préfixe selon le type
  CASE p_sequence_type
    WHEN 'quote' THEN v_prefix := 'DEV';
    WHEN 'invoice' THEN v_prefix := 'FAC';
    ELSE v_prefix := 'DOC';
  END CASE;

  -- Compter les documents existants pour cet utilisateur cette année
  IF p_sequence_type = 'quote' THEN
    SELECT COUNT(*) + 1 INTO v_count
    FROM compta_quotes
    WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  ELSIF p_sequence_type = 'invoice' THEN
    SELECT COUNT(*) + 1 INTO v_count
    FROM compta_invoices
    WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  ELSE
    v_count := 1;
  END IF;

  v_number := v_prefix || '-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

-- ============================================================================
-- Table: compta_quotes (Devis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compta_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  quote_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  
  currency TEXT NOT NULL DEFAULT 'XOF',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  notes TEXT,
  terms TEXT,
  
  created_from_ocr BOOLEAN DEFAULT FALSE,
  ocr_scan_id UUID,
  converted_to_invoice_id UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_compta_quotes_user_id ON public.compta_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_compta_quotes_client_id ON public.compta_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_compta_quotes_status ON public.compta_quotes(status);
CREATE INDEX IF NOT EXISTS idx_compta_quotes_issue_date ON public.compta_quotes(issue_date);

-- ============================================================================
-- Table: compta_quote_items (Lignes de devis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compta_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.compta_quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.vente_products(id) ON DELETE SET NULL,
  
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  line_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compta_quote_items_quote_id ON public.compta_quote_items(quote_id);

-- ============================================================================
-- Table: compta_invoices (Factures)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compta_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.compta_quotes(id) ON DELETE SET NULL,
  
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  
  currency TEXT NOT NULL DEFAULT 'XOF',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  notes TEXT,
  terms TEXT,
  
  created_from_ocr BOOLEAN DEFAULT FALSE,
  ocr_scan_id UUID,
  stock_impact_applied BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compta_invoices_user_id ON public.compta_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_compta_invoices_client_id ON public.compta_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_compta_invoices_status ON public.compta_invoices(status);
CREATE INDEX IF NOT EXISTS idx_compta_invoices_due_date ON public.compta_invoices(due_date);

-- ============================================================================
-- Table: compta_invoice_items (Lignes de factures)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compta_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.compta_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.vente_products(id) ON DELETE SET NULL,
  
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  line_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compta_invoice_items_invoice_id ON public.compta_invoice_items(invoice_id);

-- ============================================================================
-- Table: compta_payments (Paiements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compta_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.compta_invoices(id) ON DELETE CASCADE,
  
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'other')),
  reference TEXT,
  
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_compta_payments_invoice_id ON public.compta_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_compta_payments_user_id ON public.compta_payments(user_id);

-- ============================================================================
-- Table: compta_ocr_scans (Scans OCR)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compta_ocr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  
  extracted_data JSONB,
  raw_text TEXT,
  confidence_score NUMERIC(5,2),
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  created_quote_id UUID REFERENCES public.compta_quotes(id) ON DELETE SET NULL,
  created_invoice_id UUID REFERENCES public.compta_invoices(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compta_ocr_scans_user_id ON public.compta_ocr_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_compta_ocr_scans_status ON public.compta_ocr_scans(status);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.compta_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_ocr_scans ENABLE ROW LEVEL SECURITY;

-- Quotes policies
CREATE POLICY "Users can view their own quotes" ON public.compta_quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes" ON public.compta_quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes" ON public.compta_quotes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes" ON public.compta_quotes
  FOR DELETE USING (auth.uid() = user_id);

-- Quote items policies
CREATE POLICY "Users can view their quote items" ON public.compta_quote_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.compta_quotes WHERE id = quote_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create their quote items" ON public.compta_quote_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.compta_quotes WHERE id = quote_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their quote items" ON public.compta_quote_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.compta_quotes WHERE id = quote_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their quote items" ON public.compta_quote_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.compta_quotes WHERE id = quote_id AND user_id = auth.uid()
  ));

-- Invoices policies
CREATE POLICY "Users can view their own invoices" ON public.compta_invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" ON public.compta_invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON public.compta_invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON public.compta_invoices
  FOR DELETE USING (auth.uid() = user_id);

-- Invoice items policies
CREATE POLICY "Users can view their invoice items" ON public.compta_invoice_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.compta_invoices WHERE id = invoice_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create their invoice items" ON public.compta_invoice_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.compta_invoices WHERE id = invoice_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their invoice items" ON public.compta_invoice_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.compta_invoices WHERE id = invoice_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their invoice items" ON public.compta_invoice_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.compta_invoices WHERE id = invoice_id AND user_id = auth.uid()
  ));

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.compta_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON public.compta_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.compta_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments" ON public.compta_payments
  FOR DELETE USING (auth.uid() = user_id);

-- OCR scans policies
CREATE POLICY "Users can view their own scans" ON public.compta_ocr_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans" ON public.compta_ocr_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans" ON public.compta_ocr_scans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans" ON public.compta_ocr_scans
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers pour updated_at
-- ============================================================================

CREATE TRIGGER update_compta_quotes_updated_at
  BEFORE UPDATE ON public.compta_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compta_invoices_updated_at
  BEFORE UPDATE ON public.compta_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Trigger pour mettre à jour balance_due et status après paiement
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_invoice_after_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_paid NUMERIC(15,2);
  v_invoice_total NUMERIC(15,2);
  v_new_status TEXT;
BEGIN
  -- Calculer le total payé
  SELECT COALESCE(SUM(amount), 0), i.total
  INTO v_total_paid, v_invoice_total
  FROM compta_payments p
  JOIN compta_invoices i ON i.id = NEW.invoice_id
  WHERE p.invoice_id = NEW.invoice_id
  GROUP BY i.total;

  -- Déterminer le nouveau statut
  IF v_total_paid >= v_invoice_total THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'sent';
  END IF;

  -- Mettre à jour la facture
  UPDATE compta_invoices
  SET 
    amount_paid = v_total_paid,
    balance_due = v_invoice_total - v_total_paid,
    status = v_new_status,
    paid_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE paid_at END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_invoice_after_payment
  AFTER INSERT ON public.compta_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_after_payment();