-- ============================================================================
-- MODULE VENTE - CRÉATION DES 9 TABLES
-- ============================================================================

-- 1. Table des produits et services
CREATE TABLE public.vente_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  cost DECIMAL(10, 2) CHECK (cost >= 0),
  stock INTEGER CHECK (stock >= 0),
  unit TEXT NOT NULL,
  sku TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index produits
CREATE INDEX idx_vente_products_user_id ON public.vente_products(user_id);
CREATE INDEX idx_vente_products_type ON public.vente_products(type);
CREATE INDEX idx_vente_products_category ON public.vente_products(category);
CREATE INDEX idx_vente_products_status ON public.vente_products(status);
CREATE INDEX idx_vente_products_sku ON public.vente_products(sku) WHERE sku IS NOT NULL;

-- Trigger updated_at pour produits
CREATE TRIGGER update_vente_products_updated_at
  BEFORE UPDATE ON public.vente_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Produits
ALTER TABLE public.vente_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
  ON public.vente_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON public.vente_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.vente_products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.vente_products FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Table des devis
-- ============================================================================

CREATE TABLE public.vente_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  client_address TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  total_ht DECIMAL(10, 2) NOT NULL CHECK (total_ht >= 0),
  total_ttc DECIMAL(10, 2) NOT NULL CHECK (total_ttc >= 0),
  tva_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.20,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Index devis
CREATE INDEX idx_vente_quotes_user_id ON public.vente_quotes(user_id);
CREATE INDEX idx_vente_quotes_number ON public.vente_quotes(number);
CREATE INDEX idx_vente_quotes_status ON public.vente_quotes(status);
CREATE INDEX idx_vente_quotes_client_name ON public.vente_quotes(client_name);
CREATE INDEX idx_vente_quotes_created_at ON public.vente_quotes(created_at DESC);

-- Trigger updated_at pour devis
CREATE TRIGGER update_vente_quotes_updated_at
  BEFORE UPDATE ON public.vente_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Devis
ALTER TABLE public.vente_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON public.vente_quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON public.vente_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON public.vente_quotes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON public.vente_quotes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Table des lignes de devis
-- ============================================================================

CREATE TABLE public.vente_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.vente_quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.vente_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Index lignes devis
CREATE INDEX idx_vente_quote_items_quote_id ON public.vente_quote_items(quote_id);
CREATE INDEX idx_vente_quote_items_product_id ON public.vente_quote_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_vente_quote_items_order_index ON public.vente_quote_items(quote_id, order_index);

-- RLS Lignes devis
ALTER TABLE public.vente_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quote items from their quotes"
  ON public.vente_quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_quotes
      WHERE vente_quotes.id = vente_quote_items.quote_id
      AND vente_quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quote items to their quotes"
  ON public.vente_quote_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vente_quotes
      WHERE vente_quotes.id = vente_quote_items.quote_id
      AND vente_quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quote items from their quotes"
  ON public.vente_quote_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_quotes
      WHERE vente_quotes.id = vente_quote_items.quote_id
      AND vente_quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quote items from their quotes"
  ON public.vente_quote_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_quotes
      WHERE vente_quotes.id = vente_quote_items.quote_id
      AND vente_quotes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Table des commandes
-- ============================================================================

CREATE TABLE public.vente_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  client_address TEXT,
  shipping_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  total_ht DECIMAL(10, 2) NOT NULL CHECK (total_ht >= 0),
  total_ttc DECIMAL(10, 2) NOT NULL CHECK (total_ttc >= 0),
  tva_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  notes TEXT,
  quote_id UUID REFERENCES public.vente_quotes(id) ON DELETE SET NULL
);

-- Index commandes
CREATE INDEX idx_vente_orders_user_id ON public.vente_orders(user_id);
CREATE INDEX idx_vente_orders_number ON public.vente_orders(number);
CREATE INDEX idx_vente_orders_status ON public.vente_orders(status);
CREATE INDEX idx_vente_orders_payment_status ON public.vente_orders(payment_status);
CREATE INDEX idx_vente_orders_client_name ON public.vente_orders(client_name);
CREATE INDEX idx_vente_orders_created_at ON public.vente_orders(created_at DESC);
CREATE INDEX idx_vente_orders_quote_id ON public.vente_orders(quote_id) WHERE quote_id IS NOT NULL;

-- Trigger updated_at pour commandes
CREATE TRIGGER update_vente_orders_updated_at
  BEFORE UPDATE ON public.vente_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Commandes
ALTER TABLE public.vente_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.vente_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON public.vente_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON public.vente_orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON public.vente_orders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Table des lignes de commandes
-- ============================================================================

CREATE TABLE public.vente_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.vente_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.vente_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Index lignes commandes
CREATE INDEX idx_vente_order_items_order_id ON public.vente_order_items(order_id);
CREATE INDEX idx_vente_order_items_product_id ON public.vente_order_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_vente_order_items_order_index ON public.vente_order_items(order_id, order_index);

-- RLS Lignes commandes
ALTER TABLE public.vente_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items from their orders"
  ON public.vente_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_orders
      WHERE vente_orders.id = vente_order_items.order_id
      AND vente_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items to their orders"
  ON public.vente_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vente_orders
      WHERE vente_orders.id = vente_order_items.order_id
      AND vente_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update order items from their orders"
  ON public.vente_order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_orders
      WHERE vente_orders.id = vente_order_items.order_id
      AND vente_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete order items from their orders"
  ON public.vente_order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_orders
      WHERE vente_orders.id = vente_order_items.order_id
      AND vente_orders.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. Table des tickets de support
-- ============================================================================

CREATE TABLE public.vente_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES public.vente_orders(id) ON DELETE SET NULL
);

-- Index tickets
CREATE INDEX idx_vente_tickets_user_id ON public.vente_tickets(user_id);
CREATE INDEX idx_vente_tickets_number ON public.vente_tickets(number);
CREATE INDEX idx_vente_tickets_status ON public.vente_tickets(status);
CREATE INDEX idx_vente_tickets_priority ON public.vente_tickets(priority);
CREATE INDEX idx_vente_tickets_category ON public.vente_tickets(category);
CREATE INDEX idx_vente_tickets_client_name ON public.vente_tickets(client_name);
CREATE INDEX idx_vente_tickets_created_at ON public.vente_tickets(created_at DESC);
CREATE INDEX idx_vente_tickets_order_id ON public.vente_tickets(order_id) WHERE order_id IS NOT NULL;

-- Trigger updated_at pour tickets
CREATE TRIGGER update_vente_tickets_updated_at
  BEFORE UPDATE ON public.vente_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Tickets
ALTER TABLE public.vente_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON public.vente_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets"
  ON public.vente_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON public.vente_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets"
  ON public.vente_tickets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. Table des réponses aux tickets
-- ============================================================================

CREATE TABLE public.vente_ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.vente_tickets(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_email TEXT,
  message TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Index réponses tickets
CREATE INDEX idx_vente_ticket_responses_ticket_id ON public.vente_ticket_responses(ticket_id);
CREATE INDEX idx_vente_ticket_responses_created_at ON public.vente_ticket_responses(created_at);

-- RLS Réponses tickets
ALTER TABLE public.vente_ticket_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses from their tickets"
  ON public.vente_ticket_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_tickets
      WHERE vente_tickets.id = vente_ticket_responses.ticket_id
      AND vente_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert responses to their tickets"
  ON public.vente_ticket_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vente_tickets
      WHERE vente_tickets.id = vente_ticket_responses.ticket_id
      AND vente_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update responses from their tickets"
  ON public.vente_ticket_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_tickets
      WHERE vente_tickets.id = vente_ticket_responses.ticket_id
      AND vente_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete responses from their tickets"
  ON public.vente_ticket_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vente_tickets
      WHERE vente_tickets.id = vente_ticket_responses.ticket_id
      AND vente_tickets.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. Table des articles en stock
-- ============================================================================

CREATE TABLE public.vente_stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.vente_products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  location TEXT NOT NULL,
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index stock items
CREATE INDEX idx_vente_stock_items_user_id ON public.vente_stock_items(user_id);
CREATE INDEX idx_vente_stock_items_product_id ON public.vente_stock_items(product_id);
CREATE INDEX idx_vente_stock_items_sku ON public.vente_stock_items(sku);
CREATE INDEX idx_vente_stock_items_location ON public.vente_stock_items(location);
CREATE INDEX idx_vente_stock_items_quantity ON public.vente_stock_items(quantity);

-- Trigger updated_at pour stock items
CREATE TRIGGER update_vente_stock_items_updated_at
  BEFORE UPDATE ON public.vente_stock_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Stock items
ALTER TABLE public.vente_stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock items"
  ON public.vente_stock_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock items"
  ON public.vente_stock_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock items"
  ON public.vente_stock_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock items"
  ON public.vente_stock_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. Table des mouvements de stock
-- ============================================================================

CREATE TABLE public.vente_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stock_item_id UUID NOT NULL REFERENCES public.vente_stock_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  order_id UUID REFERENCES public.vente_orders(id) ON DELETE SET NULL,
  reference TEXT
);

-- Index mouvements stock
CREATE INDEX idx_vente_stock_movements_user_id ON public.vente_stock_movements(user_id);
CREATE INDEX idx_vente_stock_movements_stock_item_id ON public.vente_stock_movements(stock_item_id);
CREATE INDEX idx_vente_stock_movements_type ON public.vente_stock_movements(type);
CREATE INDEX idx_vente_stock_movements_created_at ON public.vente_stock_movements(created_at DESC);
CREATE INDEX idx_vente_stock_movements_order_id ON public.vente_stock_movements(order_id) WHERE order_id IS NOT NULL;

-- RLS Mouvements stock
ALTER TABLE public.vente_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view movements from their stock items"
  ON public.vente_stock_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert movements to their stock items"
  ON public.vente_stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update movements from their stock items"
  ON public.vente_stock_movements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete movements from their stock items"
  ON public.vente_stock_movements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS AUTO-NUMÉROTATION
-- ============================================================================

-- Fonction pour générer le numéro de devis
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO next_number
  FROM public.vente_quotes
  WHERE user_id = NEW.user_id
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  NEW.number := 'DEV-' || year_prefix || '-' || LPAD(next_number::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger auto-génération numéro devis
CREATE TRIGGER auto_generate_quote_number
  BEFORE INSERT ON public.vente_quotes
  FOR EACH ROW
  WHEN (NEW.number IS NULL OR NEW.number = '')
  EXECUTE FUNCTION public.generate_quote_number();

-- Fonction pour générer le numéro de commande
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO next_number
  FROM public.vente_orders
  WHERE user_id = NEW.user_id
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  NEW.number := 'CMD-' || year_prefix || '-' || LPAD(next_number::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger auto-génération numéro commande
CREATE TRIGGER auto_generate_order_number
  BEFORE INSERT ON public.vente_orders
  FOR EACH ROW
  WHEN (NEW.number IS NULL OR NEW.number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- Fonction pour générer le numéro de ticket
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO next_number
  FROM public.vente_tickets
  WHERE user_id = NEW.user_id;

  NEW.number := 'TICKET-' || LPAD(next_number::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger auto-génération numéro ticket
CREATE TRIGGER auto_generate_ticket_number
  BEFORE INSERT ON public.vente_tickets
  FOR EACH ROW
  WHEN (NEW.number IS NULL OR NEW.number = '')
  EXECUTE FUNCTION public.generate_ticket_number();