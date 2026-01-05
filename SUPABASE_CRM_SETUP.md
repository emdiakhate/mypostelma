# 📋 Configuration Supabase pour le Module CRM

Ce document détaille toutes les tables, fonctions et configurations Supabase nécessaires pour le module CRM de MyPostelma.

---

## 🗄️ Tables Supabase à créer

### 1. Table: `crm_sectors`
Secteurs d'activité (Restauration, Hôtellerie, etc.)

```sql
CREATE TABLE crm_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Nom de l'icône Lucide (ex: "Utensils", "Hotel")
  color TEXT, -- Code hex (ex: "#FF5733")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_sectors_user_id ON crm_sectors(user_id);

-- RLS Policies
ALTER TABLE crm_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sectors"
  ON crm_sectors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sectors"
  ON crm_sectors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sectors"
  ON crm_sectors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sectors"
  ON crm_sectors FOR DELETE
  USING (auth.uid() = user_id);
```

### 2. Table: `crm_segments`
Segments au sein des secteurs (Fast Food, Gastronomie, etc.)

```sql
CREATE TABLE crm_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES crm_sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_segments_sector_id ON crm_segments(sector_id);

-- RLS Policies
ALTER TABLE crm_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view segments of their sectors"
  ON crm_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
      AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert segments in their sectors"
  ON crm_segments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
      AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update segments of their sectors"
  ON crm_segments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
      AND crm_sectors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete segments of their sectors"
  ON crm_segments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM crm_sectors
      WHERE crm_sectors.id = crm_segments.sector_id
      AND crm_sectors.user_id = auth.uid()
    )
  );
```

### 3. Table: `crm_tags`
Tags pour catégoriser les leads (wifi, terrasse, végétarien, etc.)

```sql
CREATE TABLE crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES crm_sectors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- 'amenity', 'feature', 'service', 'other'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_tags_user_id ON crm_tags(user_id);
CREATE INDEX idx_crm_tags_sector_id ON crm_tags(sector_id);

-- RLS Policies
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags"
  ON crm_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON crm_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON crm_tags FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Table: `crm_leads`
Leads enrichis avec informations complètes

```sql
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations de base
  name TEXT NOT NULL,
  category TEXT, -- Legacy field, peut être supprimé plus tard

  -- Nouveau système secteur/segment
  sector_id UUID REFERENCES crm_sectors(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES crm_segments(id) ON DELETE SET NULL,

  -- Localisation
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  google_maps_url TEXT,

  -- Contacts
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,

  -- Réseaux sociaux (JSONB)
  social_media JSONB DEFAULT '{}'::jsonb,

  -- Médias
  image_url TEXT,

  -- Google Business
  google_rating NUMERIC(2,1), -- 0.0 à 5.0
  google_reviews_count INTEGER,
  business_hours JSONB DEFAULT '{}'::jsonb,

  -- CRM
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'interested', 'qualified', 'client', 'not_interested', 'archived'
  score INTEGER, -- 1-5
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Métadonnées
  source TEXT DEFAULT 'manual', -- 'manual', 'scraping', 'import', 'api'
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_leads_user_id ON crm_leads(user_id);
CREATE INDEX idx_crm_leads_sector_id ON crm_leads(sector_id);
CREATE INDEX idx_crm_leads_segment_id ON crm_leads(segment_id);
CREATE INDEX idx_crm_leads_status ON crm_leads(status);
CREATE INDEX idx_crm_leads_city ON crm_leads(city);
CREATE INDEX idx_crm_leads_name ON crm_leads(name);
CREATE INDEX idx_crm_leads_tags ON crm_leads USING GIN(tags);

-- RLS Policies
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads"
  ON crm_leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON crm_leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON crm_leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON crm_leads FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. Table: `crm_lead_interactions`
Historique des interactions avec les leads

```sql
CREATE TABLE crm_lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type d'interaction
  type TEXT NOT NULL, -- 'email', 'whatsapp', 'call', 'meeting', 'note', 'status_change'
  channel TEXT,
  status TEXT, -- 'sent', 'delivered', 'read', 'replied', 'failed'

  -- Contenu
  subject TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_lead_interactions_lead_id ON crm_lead_interactions(lead_id);
CREATE INDEX idx_crm_lead_interactions_user_id ON crm_lead_interactions(user_id);
CREATE INDEX idx_crm_lead_interactions_campaign_id ON crm_lead_interactions(campaign_id);
CREATE INDEX idx_crm_lead_interactions_created_at ON crm_lead_interactions(created_at DESC);

-- RLS Policies
ALTER TABLE crm_lead_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions of their leads"
  ON crm_lead_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_leads
      WHERE crm_leads.id = crm_lead_interactions.lead_id
      AND crm_leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interactions for their leads"
  ON crm_lead_interactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_leads
      WHERE crm_leads.id = crm_lead_interactions.lead_id
      AND crm_leads.user_id = auth.uid()
    )
  );
```

### 6. Table: `crm_campaigns`
Campagnes marketing (Email & WhatsApp)

```sql
CREATE TABLE crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations de base
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL, -- 'email', 'whatsapp', 'both'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'completed', 'cancelled'

  -- Ciblage (JSONB pour flexibilité)
  target_sector_ids UUID[],
  target_segment_ids UUID[],
  target_cities TEXT[],
  target_tags TEXT[],
  target_status TEXT[],

  -- Message
  subject TEXT,
  message TEXT NOT NULL,

  -- Programmation
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Statistiques
  total_leads INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_campaigns_user_id ON crm_campaigns(user_id);
CREATE INDEX idx_crm_campaigns_status ON crm_campaigns(status);
CREATE INDEX idx_crm_campaigns_scheduled_at ON crm_campaigns(scheduled_at);

-- RLS Policies
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns"
  ON crm_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
  ON crm_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON crm_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON crm_campaigns FOR DELETE
  USING (auth.uid() = user_id);
```

### 7. Table: `crm_tasks`
Tâches CRM (relances, appels, meetings)

```sql
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Informations
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'followup', 'other'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'

  -- Dates
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_crm_tasks_user_id ON crm_tasks(user_id);
CREATE INDEX idx_crm_tasks_lead_id ON crm_tasks(lead_id);
CREATE INDEX idx_crm_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_due_date ON crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);

-- RLS Policies
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON crm_tasks FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can insert their own tasks"
  ON crm_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON crm_tasks FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their own tasks"
  ON crm_tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🔧 Functions Supabase (Edge Functions)

### 1. Edge Function: `send-email`
Envoi d'emails aux leads

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { leadId, subject, content } = await req.json();

    // Récupérer le lead
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: lead, error } = await supabase
      .from('crm_leads')
      .select('email, name')
      .eq('id', leadId)
      .single();

    if (error || !lead?.email) {
      throw new Error('Lead not found or no email');
    }

    // Envoyer l'email (intégrer votre service email ici)
    // Ex: SendGrid, Resend, Amazon SES, etc.

    // Enregistrer l'interaction
    await supabase.from('crm_lead_interactions').insert([{
      lead_id: leadId,
      type: 'email',
      status: 'sent',
      subject,
      content,
      user_id: req.headers.get('user-id'),
    }]);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 2. Edge Function: `send-whatsapp`
Envoi de messages WhatsApp

```typescript
// supabase/functions/send-whatsapp/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { leadId, message } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: lead, error } = await supabase
      .from('crm_leads')
      .select('whatsapp, name')
      .eq('id', leadId)
      .single();

    if (error || !lead?.whatsapp) {
      throw new Error('Lead not found or no WhatsApp');
    }

    // Envoyer le message WhatsApp (intégrer WhatsApp Business API)
    // Ex: Twilio, Meta Cloud API, etc.

    // Enregistrer l'interaction
    await supabase.from('crm_lead_interactions').insert([{
      lead_id: leadId,
      type: 'whatsapp',
      status: 'sent',
      content: message,
      user_id: req.headers.get('user-id'),
    }]);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 3. Edge Function: `run-campaign`
Exécution d'une campagne marketing

```typescript
// supabase/functions/run-campaign/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { campaignId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer la campagne
    const { data: campaign, error } = await supabase
      .from('crm_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) throw error;

    // Récupérer les leads ciblés
    let query = supabase.from('crm_leads').select('*');

    if (campaign.target_sector_ids?.length) {
      query = query.in('sector_id', campaign.target_sector_ids);
    }
    if (campaign.target_cities?.length) {
      query = query.in('city', campaign.target_cities);
    }
    if (campaign.target_status?.length) {
      query = query.in('status', campaign.target_status);
    }

    const { data: leads } = await query;

    // Mettre à jour le nombre de leads
    await supabase
      .from('crm_campaigns')
      .update({
        total_leads: leads?.length || 0,
        status: 'running',
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    // Envoyer les messages (async)
    // Boucle sur leads et envoi selon campaign.channel

    return new Response(
      JSON.stringify({ success: true, leads_count: leads?.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🔐 Configuration RLS (Row Level Security)

Toutes les tables CRM ont des politiques RLS configurées pour:
- ✅ Les utilisateurs ne peuvent voir que leurs propres données
- ✅ Protection contre les accès non autorisés
- ✅ Isolation des données par utilisateur

---

## 📊 Triggers et Fonctions PostgreSQL

### 1. Trigger: `updated_at`
Met à jour automatiquement le champ `updated_at`

```sql
-- Fonction
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer aux tables
CREATE TRIGGER update_crm_sectors_updated_at
    BEFORE UPDATE ON crm_sectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_segments_updated_at
    BEFORE UPDATE ON crm_segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_leads_updated_at
    BEFORE UPDATE ON crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_campaigns_updated_at
    BEFORE UPDATE ON crm_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at
    BEFORE UPDATE ON crm_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 🌱 Données de seed (optionnel)

### Secteurs par défaut

```sql
-- Exemple de secteurs pour commencer
INSERT INTO crm_sectors (user_id, name, description, icon, color) VALUES
  ('USER_ID_HERE', 'Restauration', 'Restaurants, cafés, bars', 'Utensils', '#FF5733'),
  ('USER_ID_HERE', 'Hôtellerie', 'Hôtels, gîtes, chambres d''hôtes', 'Hotel', '#3498DB'),
  ('USER_ID_HERE', 'Commerce', 'Boutiques, magasins', 'ShoppingBag', '#2ECC71'),
  ('USER_ID_HERE', 'Services', 'Coiffeurs, agences, etc.', 'Briefcase', '#9B59B6');
```

---

## ✅ Checklist d'implémentation

Pour implémenter le module CRM dans Lovable, suivez cette checklist:

### Backend (Supabase)

- [ ] **Créer les tables:**
  - [ ] `crm_sectors`
  - [ ] `crm_segments`
  - [ ] `crm_tags`
  - [ ] `crm_leads`
  - [ ] `crm_lead_interactions`
  - [ ] `crm_campaigns`
  - [ ] `crm_tasks`

- [ ] **Configurer RLS:**
  - [ ] Activer RLS sur toutes les tables
  - [ ] Créer les policies pour chaque table

- [ ] **Créer les index:**
  - [ ] Index sur user_id pour toutes les tables
  - [ ] Index sur les champs de recherche (city, name, status)
  - [ ] Index GIN sur les arrays (tags)

- [ ] **Créer les triggers:**
  - [ ] Trigger `updated_at` sur toutes les tables

- [ ] **Edge Functions:**
  - [ ] `send-email` (intégration SendGrid/Resend)
  - [ ] `send-whatsapp` (intégration Twilio/Meta)
  - [ ] `run-campaign`

- [ ] **Variables d'environnement:**
  - [ ] `EMAIL_API_KEY` (SendGrid, Resend, etc.)
  - [ ] `WHATSAPP_API_KEY` (Twilio, Meta, etc.)
  - [ ] `WHATSAPP_PHONE_NUMBER`

### Frontend (déjà créé)

- [x] Hook `useCRM.tsx`
- [x] Tests unitaires
- [x] Pages CRM (leads, prospects, clients, config)
- [x] Composants (modals, forms)

### Intégrations externes (optionnel)

- [ ] **Email:**
  - [ ] SendGrid / Resend / Amazon SES
  - [ ] Templates d'emails
  - [ ] Tracking opens/clicks

- [ ] **WhatsApp:**
  - [ ] Twilio WhatsApp API
  - [ ] Meta Cloud API
  - [ ] Templates de messages

- [ ] **Scraping (optionnel):**
  - [ ] Jina.ai pour Google Business
  - [ ] Apify pour Google Maps
  - [ ] Edge function `scrape-leads`

---

## 🚀 Déploiement

1. **Créer les tables** dans Supabase Dashboard (SQL Editor)
2. **Déployer les Edge Functions** avec Supabase CLI:
   ```bash
   supabase functions deploy send-email
   supabase functions deploy send-whatsapp
   supabase functions deploy run-campaign
   ```
3. **Configurer les variables d'environnement** dans Supabase Dashboard
4. **Tester les fonctionnalités** dans l'application

---

## 📞 Support

Pour toute question sur l'implémentation, consultez:
- [Documentation Supabase](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Dernière mise à jour:** 2026-01-05
