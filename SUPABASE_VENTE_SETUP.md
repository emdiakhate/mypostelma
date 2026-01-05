# Configuration Supabase - Module Vente

Ce document contient tous les scripts SQL nécessaires pour configurer le module Vente dans Supabase.

## 📋 Tables du Module Vente

Le module Vente utilise **9 tables** organisées en 5 domaines :

1. **Catalogue** : `vente_products`
2. **Devis** : `vente_quotes`, `vente_quote_items`
3. **Commandes** : `vente_orders`, `vente_order_items`
4. **Support** : `vente_tickets`, `vente_ticket_responses`
5. **Stock** : `vente_stock_items`, `vente_stock_movements`

---

## 1. Table : vente_products (Catalogue Produits/Services)

```sql
-- Table des produits et services
CREATE TABLE vente_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Index pour améliorer les performances
CREATE INDEX idx_vente_products_user_id ON vente_products(user_id);
CREATE INDEX idx_vente_products_type ON vente_products(type);
CREATE INDEX idx_vente_products_category ON vente_products(category);
CREATE INDEX idx_vente_products_status ON vente_products(status);
CREATE INDEX idx_vente_products_sku ON vente_products(sku) WHERE sku IS NOT NULL;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vente_products_updated_at
  BEFORE UPDATE ON vente_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE vente_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
  ON vente_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON vente_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON vente_products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON vente_products FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 2. Table : vente_quotes (Devis)

```sql
-- Table des devis
CREATE TABLE vente_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Index
CREATE INDEX idx_vente_quotes_user_id ON vente_quotes(user_id);
CREATE INDEX idx_vente_quotes_number ON vente_quotes(number);
CREATE INDEX idx_vente_quotes_status ON vente_quotes(status);
CREATE INDEX idx_vente_quotes_client_name ON vente_quotes(client_name);
CREATE INDEX idx_vente_quotes_created_at ON vente_quotes(created_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER update_vente_quotes_updated_at
  BEFORE UPDATE ON vente_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE vente_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON vente_quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON vente_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON vente_quotes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON vente_quotes FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 3. Table : vente_quote_items (Lignes de Devis)

```sql
-- Table des lignes de devis
CREATE TABLE vente_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES vente_quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES vente_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Index
CREATE INDEX idx_vente_quote_items_quote_id ON vente_quote_items(quote_id);
CREATE INDEX idx_vente_quote_items_product_id ON vente_quote_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_vente_quote_items_order_index ON vente_quote_items(quote_id, order_index);

-- RLS Policies
ALTER TABLE vente_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quote items from their quotes"
  ON vente_quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vente_quotes
      WHERE vente_quotes.id = vente_quote_items.quote_id
      AND vente_quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quote items to their quotes"
  ON vente_quote_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vente_quotes
      WHERE vente_quotes.id = vente_quote_items.quote_id
      AND vente_quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quote items from their quotes"
  ON vente_quote_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vente_quotes
      WHERE vente_quotes.id = vente_quote_items.quote_id
      AND vente_quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quote items from their quotes"
  ON vente_quote_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vente_quotes
      WHERE vente_quotes.id = vente_quote_items.quote_id
      AND vente_quotes.user_id = auth.uid()
    )
  );
```

---

## 4. Table : vente_orders (Commandes)

```sql
-- Table des commandes
CREATE TABLE vente_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  quote_id UUID REFERENCES vente_quotes(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX idx_vente_orders_user_id ON vente_orders(user_id);
CREATE INDEX idx_vente_orders_number ON vente_orders(number);
CREATE INDEX idx_vente_orders_status ON vente_orders(status);
CREATE INDEX idx_vente_orders_payment_status ON vente_orders(payment_status);
CREATE INDEX idx_vente_orders_client_name ON vente_orders(client_name);
CREATE INDEX idx_vente_orders_created_at ON vente_orders(created_at DESC);
CREATE INDEX idx_vente_orders_quote_id ON vente_orders(quote_id) WHERE quote_id IS NOT NULL;

-- Trigger pour updated_at
CREATE TRIGGER update_vente_orders_updated_at
  BEFORE UPDATE ON vente_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE vente_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON vente_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON vente_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON vente_orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON vente_orders FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 5. Table : vente_order_items (Lignes de Commandes)

```sql
-- Table des lignes de commandes
CREATE TABLE vente_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES vente_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES vente_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Index
CREATE INDEX idx_vente_order_items_order_id ON vente_order_items(order_id);
CREATE INDEX idx_vente_order_items_product_id ON vente_order_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_vente_order_items_order_index ON vente_order_items(order_id, order_index);

-- RLS Policies
ALTER TABLE vente_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items from their orders"
  ON vente_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vente_orders
      WHERE vente_orders.id = vente_order_items.order_id
      AND vente_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items to their orders"
  ON vente_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vente_orders
      WHERE vente_orders.id = vente_order_items.order_id
      AND vente_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update order items from their orders"
  ON vente_order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vente_orders
      WHERE vente_orders.id = vente_order_items.order_id
      AND vente_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete order items from their orders"
  ON vente_order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vente_orders
      WHERE vente_orders.id = vente_order_items.order_id
      AND vente_orders.user_id = auth.uid()
    )
  );
```

---

## 6. Table : vente_tickets (Tickets Support)

```sql
-- Table des tickets de support
CREATE TABLE vente_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  order_id UUID REFERENCES vente_orders(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX idx_vente_tickets_user_id ON vente_tickets(user_id);
CREATE INDEX idx_vente_tickets_number ON vente_tickets(number);
CREATE INDEX idx_vente_tickets_status ON vente_tickets(status);
CREATE INDEX idx_vente_tickets_priority ON vente_tickets(priority);
CREATE INDEX idx_vente_tickets_category ON vente_tickets(category);
CREATE INDEX idx_vente_tickets_client_name ON vente_tickets(client_name);
CREATE INDEX idx_vente_tickets_created_at ON vente_tickets(created_at DESC);
CREATE INDEX idx_vente_tickets_order_id ON vente_tickets(order_id) WHERE order_id IS NOT NULL;

-- Trigger pour updated_at
CREATE TRIGGER update_vente_tickets_updated_at
  BEFORE UPDATE ON vente_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE vente_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON vente_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets"
  ON vente_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON vente_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets"
  ON vente_tickets FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 7. Table : vente_ticket_responses (Réponses Tickets)

```sql
-- Table des réponses aux tickets
CREATE TABLE vente_ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES vente_tickets(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_email TEXT,
  message TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Index
CREATE INDEX idx_vente_ticket_responses_ticket_id ON vente_ticket_responses(ticket_id);
CREATE INDEX idx_vente_ticket_responses_created_at ON vente_ticket_responses(created_at);

-- RLS Policies
ALTER TABLE vente_ticket_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses from their tickets"
  ON vente_ticket_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vente_tickets
      WHERE vente_tickets.id = vente_ticket_responses.ticket_id
      AND vente_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert responses to their tickets"
  ON vente_ticket_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vente_tickets
      WHERE vente_tickets.id = vente_ticket_responses.ticket_id
      AND vente_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update responses from their tickets"
  ON vente_ticket_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vente_tickets
      WHERE vente_tickets.id = vente_ticket_responses.ticket_id
      AND vente_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete responses from their tickets"
  ON vente_ticket_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vente_tickets
      WHERE vente_tickets.id = vente_ticket_responses.ticket_id
      AND vente_tickets.user_id = auth.uid()
    )
  );
```

---

## 8. Table : vente_stock_items (Articles en Stock)

```sql
-- Table des articles en stock
CREATE TABLE vente_stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES vente_products(id) ON DELETE CASCADE,
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

-- Index
CREATE INDEX idx_vente_stock_items_user_id ON vente_stock_items(user_id);
CREATE INDEX idx_vente_stock_items_product_id ON vente_stock_items(product_id);
CREATE INDEX idx_vente_stock_items_sku ON vente_stock_items(sku);
CREATE INDEX idx_vente_stock_items_location ON vente_stock_items(location);
CREATE INDEX idx_vente_stock_items_quantity ON vente_stock_items(quantity);

-- Trigger pour updated_at
CREATE TRIGGER update_vente_stock_items_updated_at
  BEFORE UPDATE ON vente_stock_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE vente_stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock items"
  ON vente_stock_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock items"
  ON vente_stock_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock items"
  ON vente_stock_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock items"
  ON vente_stock_items FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 9. Table : vente_stock_movements (Mouvements de Stock)

```sql
-- Table des mouvements de stock
CREATE TABLE vente_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES vente_stock_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  order_id UUID REFERENCES vente_orders(id) ON DELETE SET NULL,
  reference TEXT
);

-- Index
CREATE INDEX idx_vente_stock_movements_user_id ON vente_stock_movements(user_id);
CREATE INDEX idx_vente_stock_movements_stock_item_id ON vente_stock_movements(stock_item_id);
CREATE INDEX idx_vente_stock_movements_type ON vente_stock_movements(type);
CREATE INDEX idx_vente_stock_movements_created_at ON vente_stock_movements(created_at DESC);
CREATE INDEX idx_vente_stock_movements_order_id ON vente_stock_movements(order_id) WHERE order_id IS NOT NULL;

-- RLS Policies
ALTER TABLE vente_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view movements from their stock items"
  ON vente_stock_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert movements to their stock items"
  ON vente_stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update movements from their stock items"
  ON vente_stock_movements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete movements from their stock items"
  ON vente_stock_movements FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🔧 Triggers Additionnels

### Auto-incrémentation des numéros de devis

```sql
-- Fonction pour générer le numéro de devis
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  -- Récupérer l'année courante
  year_prefix := TO_CHAR(NOW(), 'YYYY');

  -- Compter les devis de l'année
  SELECT COUNT(*) + 1 INTO next_number
  FROM vente_quotes
  WHERE user_id = NEW.user_id
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  -- Générer le numéro
  NEW.number := 'DEV-' || year_prefix || '-' || LPAD(next_number::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-générer le numéro (optionnel, si number n'est pas fourni)
CREATE TRIGGER auto_generate_quote_number
  BEFORE INSERT ON vente_quotes
  FOR EACH ROW
  WHEN (NEW.number IS NULL)
  EXECUTE FUNCTION generate_quote_number();
```

### Auto-incrémentation des numéros de commandes

```sql
-- Fonction pour générer le numéro de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  -- Récupérer l'année courante
  year_prefix := TO_CHAR(NOW(), 'YYYY');

  -- Compter les commandes de l'année
  SELECT COUNT(*) + 1 INTO next_number
  FROM vente_orders
  WHERE user_id = NEW.user_id
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  -- Générer le numéro
  NEW.number := 'CMD-' || year_prefix || '-' || LPAD(next_number::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-générer le numéro (optionnel, si number n'est pas fourni)
CREATE TRIGGER auto_generate_order_number
  BEFORE INSERT ON vente_orders
  FOR EACH ROW
  WHEN (NEW.number IS NULL)
  EXECUTE FUNCTION generate_order_number();
```

### Auto-incrémentation des numéros de tickets

```sql
-- Fonction pour générer le numéro de ticket
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Compter tous les tickets de l'utilisateur
  SELECT COUNT(*) + 1 INTO next_number
  FROM vente_tickets
  WHERE user_id = NEW.user_id;

  -- Générer le numéro
  NEW.number := 'TICKET-' || LPAD(next_number::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-générer le numéro (optionnel, si number n'est pas fourni)
CREATE TRIGGER auto_generate_ticket_number
  BEFORE INSERT ON vente_tickets
  FOR EACH ROW
  WHEN (NEW.number IS NULL)
  EXECUTE FUNCTION generate_ticket_number();
```

---

## 📊 Vues Utiles (Optionnel)

### Vue : Statistiques des devis par statut

```sql
CREATE OR REPLACE VIEW vente_quote_stats AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
  SUM(total_ttc) FILTER (WHERE status = 'accepted') as accepted_revenue,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('sent', 'accepted', 'rejected'))::NUMERIC, 0)) * 100,
    2
  ) as conversion_rate
FROM vente_quotes
GROUP BY user_id;
```

### Vue : Alertes stock faible

```sql
CREATE OR REPLACE VIEW vente_stock_alerts AS
SELECT
  si.id,
  si.user_id,
  si.product_name,
  si.sku,
  si.quantity,
  si.min_quantity,
  si.location,
  CASE
    WHEN si.quantity = 0 THEN 'out_of_stock'
    WHEN si.quantity <= si.min_quantity THEN 'low_stock'
    ELSE 'ok'
  END as alert_level
FROM vente_stock_items si
WHERE si.quantity <= si.min_quantity
ORDER BY si.quantity ASC;
```

### Vue : CA mensuel par produit

```sql
CREATE OR REPLACE VIEW vente_monthly_revenue_by_product AS
SELECT
  o.user_id,
  oi.product_name,
  DATE_TRUNC('month', o.created_at) as month,
  SUM(oi.total) as revenue_ht,
  SUM(oi.quantity) as units_sold,
  COUNT(DISTINCT o.id) as order_count
FROM vente_orders o
JOIN vente_order_items oi ON oi.order_id = o.id
WHERE o.payment_status = 'paid'
GROUP BY o.user_id, oi.product_name, DATE_TRUNC('month', o.created_at)
ORDER BY month DESC, revenue_ht DESC;
```

---

## 🚀 Edge Functions (Optionnel)

### 1. Génération PDF Devis

```typescript
// supabase/functions/generate-quote-pdf/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { quoteId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Récupérer le devis avec items
    const { data: quote, error } = await supabaseClient
      .from('vente_quotes')
      .select('*, items:vente_quote_items(*)')
      .eq('id', quoteId)
      .single();

    if (error) throw error;

    // Générer le PDF (utiliser une librairie comme pdfmake ou puppeteer)
    // ... Code de génération PDF ...

    return new Response(
      JSON.stringify({ success: true, pdfUrl: 'https://...' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 2. Envoi Email Devis

```typescript
// supabase/functions/send-quote-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { quoteId, recipientEmail } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Récupérer le devis
    const { data: quote, error } = await supabaseClient
      .from('vente_quotes')
      .select('*, items:vente_quote_items(*)')
      .eq('id', quoteId)
      .single();

    if (error) throw error;

    // Envoyer l'email (utiliser Resend, SendGrid, etc.)
    // ... Code d'envoi email ...

    // Mettre à jour le statut
    await supabaseClient
      .from('vente_quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## ✅ Validation et Tests

Après avoir exécuté tous les scripts SQL, validez l'installation :

```sql
-- 1. Vérifier que toutes les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'vente_%'
ORDER BY table_name;

-- Résultat attendu : 9 tables
-- vente_orders
-- vente_order_items
-- vente_products
-- vente_quotes
-- vente_quote_items
-- vente_stock_items
-- vente_stock_movements
-- vente_ticket_responses
-- vente_tickets

-- 2. Vérifier que RLS est activé sur toutes les tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'vente_%';

-- Toutes les lignes doivent avoir rowsecurity = true

-- 3. Compter les policies
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'vente_%'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Chaque table devrait avoir 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 4. Tester l'insertion d'un produit
INSERT INTO vente_products (user_id, name, description, type, category, price, unit, status)
VALUES (auth.uid(), 'Test Product', 'Description test', 'service', 'Formation', 1000, 'Forfait', 'active');

-- 5. Vérifier les index
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'vente_%'
ORDER BY tablename, indexname;
```

---

## 🎯 Conclusion

Vous avez maintenant un schéma Supabase complet pour le module Vente avec :

- ✅ 9 tables relationnelles
- ✅ RLS activé sur toutes les tables
- ✅ Index optimisés pour les performances
- ✅ Triggers pour updated_at
- ✅ Auto-génération des numéros (devis, commandes, tickets)
- ✅ Vues pour statistiques et alertes
- ✅ (Optionnel) Edge Functions pour PDF et emails

**Prochaine étape** : Consultez `LOVABLE_VENTE_TODO.md` pour les instructions d'intégration avec l'application React.
