# 📋 TODO Lovable - Pages Prospects & Clients CRM

## ✅ Ce qui a été créé (Frontend - déjà fait)

### Pages CRM complètes:
1. ✅ **Prospects** (`src/pages/crm/prospects/index.tsx`)
   - Affiche les leads avec statut "interested" ou "qualified"
   - Filtres: recherche, secteur, ville, statut
   - Actions: appeler, envoyer email, convertir en client
   - Statistiques: total, intéressés, qualifiés, score moyen

2. ✅ **Clients** (`src/pages/crm/clients/index.tsx`)
   - Affiche les leads avec statut "client"
   - Filtres: recherche, secteur, ville
   - Actions: appeler, envoyer email, nouvelle commande
   - Statistiques: total, score moyen, top notés

3. ✅ **Leads** (`src/pages/crm/leads/index.tsx`) - déjà existante
   - Vue Kanban avec drag & drop
   - Tous les statuts: new, contacted, interested, qualified, client

4. ✅ **Config** (`src/pages/crm/config.tsx`) - déjà existante
   - Gestion secteurs et segments

5. ✅ **Hook useCRM** (`src/hooks/useCRM.tsx`)
   - useCRMLeads, useSectors, useSegments, useLeadInteractions
   - CRUD complet avec filtres avancés

6. ✅ **Tests** (`src/hooks/useCRM.test.tsx`)
   - 30+ tests unitaires

---

## 🔧 Ce que Lovable doit faire (Backend Supabase)

### ⚠️ IMPORTANT: Toutes les tables et configurations Supabase sont déjà documentées dans `SUPABASE_CRM_SETUP.md`

### Étape 1: Créer les tables Supabase

Dans **Supabase SQL Editor**, exécuter les scripts du fichier `SUPABASE_CRM_SETUP.md` :

#### Tables à créer (7 au total):

1. **`crm_sectors`** ✅
   - Secteurs d'activité (Restauration, Hôtellerie, etc.)
   - Avec RLS policies

2. **`crm_segments`** ✅
   - Segments au sein des secteurs (Fast Food, Gastronomie, etc.)
   - Avec RLS policies

3. **`crm_tags`** ✅
   - Tags pour catégoriser (wifi, terrasse, végétarien, etc.)
   - Avec RLS policies

4. **`crm_leads`** ✅
   - Leads enrichis avec Google Business, réseaux sociaux
   - **Champs importants:**
     - `status`: 'new', 'contacted', 'interested', 'qualified', 'client'
     - `sector_id`, `segment_id`
     - `phone`, `email`, `whatsapp`, `website`
     - `google_rating`, `google_reviews_count`
     - `score` (1-5)
   - Avec RLS policies

5. **`crm_lead_interactions`** ✅
   - Historique des interactions (email, call, whatsapp, note, status_change)
   - Avec RLS policies

6. **`crm_campaigns`** ✅
   - Campagnes marketing email/whatsapp
   - Avec RLS policies

7. **`crm_tasks`** ✅
   - Tâches CRM (relances, meetings, appels)
   - Avec RLS policies

**→ Copier-coller les scripts SQL depuis `SUPABASE_CRM_SETUP.md` sections 1 à 7**

---

### Étape 2: Créer les triggers

Dans **Supabase SQL Editor** :

```sql
-- Trigger pour updated_at automatique
-- Copier depuis SUPABASE_CRM_SETUP.md section "Triggers et Fonctions PostgreSQL"
```

**→ Copier-coller le script trigger depuis `SUPABASE_CRM_SETUP.md`**

---

### Étape 3: Déployer les Edge Functions (optionnel pour MVP)

Si vous voulez l'envoi d'emails et WhatsApp :

#### a) Créer les fichiers:
```
supabase/functions/send-email/index.ts
supabase/functions/send-whatsapp/index.ts
supabase/functions/run-campaign/index.ts
```

#### b) Copier le code depuis `SUPABASE_CRM_SETUP.md` section "Edge Functions"

#### c) Déployer:
```bash
supabase functions deploy send-email
supabase functions deploy send-whatsapp
supabase functions deploy run-campaign
```

---

### Étape 4: Configurer les variables d'environnement (optionnel pour MVP)

Dans **Supabase Dashboard > Settings > API** :

```env
EMAIL_API_KEY=your_sendgrid_or_resend_key
WHATSAPP_API_KEY=your_twilio_or_meta_key
WHATSAPP_PHONE_NUMBER=+1234567890
```

---

### Étape 5: Tester l'intégration

1. ✅ Activer feature flag `ENABLE_NEW_CRM: true` dans `src/config/featureFlags.ts`
2. ✅ Aller sur `/crm/leads`
3. ✅ Créer un lead test
4. ✅ Vérifier dans Supabase Dashboard que le lead apparaît dans `crm_leads`
5. ✅ Changer le statut du lead vers "interested"
6. ✅ Vérifier qu'il apparaît dans `/crm/prospects`
7. ✅ Convertir en client (statut "client")
8. ✅ Vérifier qu'il apparaît dans `/crm/clients`

---

## 🎯 Routes à mettre à jour

Les routes sont déjà configurées dans `src/routes.v2.tsx` :

```tsx
// Prospects (nouveau)
<Route path="/crm/prospects" element={
  isFeatureEnabled('ENABLE_NEW_CRM') ?
  <ProspectsPageNew /> :
  <Navigate to="/leads" replace />
} />

// Clients (nouveau)
<Route path="/crm/clients" element={
  isFeatureEnabled('ENABLE_NEW_CRM') ?
  <ClientsPageNew /> :
  <Navigate to="/leads" replace />
} />
```

**→ Les routes sont déjà dans le code, il suffit d'activer `ENABLE_NEW_CRM`**

---

## 📊 Schéma de données

### Workflow des statuts:

```
Acquisition (scraping/import)
    ↓
[new] Lead créé
    ↓
[contacted] Premier contact établi
    ↓
[interested] Lead montre de l'intérêt
    ↓         → Apparaît dans /crm/prospects
[qualified] Lead qualifié, prêt à acheter
    ↓         → Apparaît dans /crm/prospects
[client] Lead converti
              → Apparaît dans /crm/clients
```

### Différences entre les 3 pages:

| Page | Statuts affichés | Objectif | Actions principales |
|------|------------------|----------|-------------------|
| **Leads** | new, contacted | Qualifier les nouveaux leads | Drag & drop, import CSV, scraping |
| **Prospects** | interested, qualified | Convertir en clients | Appeler, Email, Convertir |
| **Clients** | client | Gérer la relation client | Commander, Factures, Fidélisation |

---

## ✅ Checklist complète

### Backend Supabase
- [ ] Table `crm_sectors` créée
- [ ] Table `crm_segments` créée
- [ ] Table `crm_tags` créée
- [ ] Table `crm_leads` créée
- [ ] Table `crm_lead_interactions` créée
- [ ] Table `crm_campaigns` créée (optionnel pour MVP)
- [ ] Table `crm_tasks` créée (optionnel pour MVP)
- [ ] Trigger `updated_at` sur toutes les tables
- [ ] RLS policies activées et testées
- [ ] Index créés sur les champs de recherche

### Frontend (déjà fait ✅)
- [x] Page Prospects créée
- [x] Page Clients créée
- [x] Hook useCRM créé
- [x] Tests unitaires créés
- [x] Routes configurées

### Tests end-to-end
- [ ] Créer un lead → vérifier dans DB
- [ ] Changer statut vers "interested" → apparaît dans Prospects
- [ ] Convertir en client → apparaît dans Clients
- [ ] Envoyer un email → interaction enregistrée
- [ ] Filtres fonctionnent (secteur, ville, recherche)

---

## 🚀 Ordre recommandé d'exécution

1. **Créer les 4 tables essentielles** (5 min)
   - `crm_sectors`
   - `crm_segments`
   - `crm_leads`
   - `crm_lead_interactions`

2. **Créer le trigger updated_at** (1 min)

3. **Activer feature flag** (30 sec)
   ```typescript
   ENABLE_NEW_CRM: true
   ```

4. **Tester le flow complet** (5 min)
   - Créer un lead test
   - Changer le statut
   - Vérifier dans Prospects/Clients

5. **Créer les tables optionnelles** (si besoin)
   - `crm_campaigns`
   - `crm_tasks`
   - `crm_tags`

6. **Déployer Edge Functions** (si email/whatsapp requis)

---

## 📝 Notes importantes

### Seed data (optionnel)

Pour tester rapidement, créer quelques secteurs par défaut :

```sql
INSERT INTO crm_sectors (user_id, name, description, icon, color) VALUES
  ('YOUR_USER_ID', 'Restauration', 'Restaurants, cafés, bars', 'Utensils', '#FF5733'),
  ('YOUR_USER_ID', 'Hôtellerie', 'Hôtels, gîtes', 'Hotel', '#3498DB'),
  ('YOUR_USER_ID', 'Commerce', 'Boutiques, magasins', 'ShoppingBag', '#2ECC71');
```

### Migration des anciennes données

Si vous avez déjà des leads dans une ancienne table `leads` :

```sql
-- Migrer vers crm_leads
INSERT INTO crm_leads (user_id, name, address, city, phone, email, status, added_at, category)
SELECT user_id, name, address, city, phone, email, status, added_at, category
FROM leads;
```

---

## ❓ Questions fréquentes

**Q: Les pages ne s'affichent pas**
A: Vérifiez que `ENABLE_NEW_CRM: true` dans `src/config/featureFlags.ts`

**Q: Erreur "crm_leads does not exist"**
A: Exécutez les scripts SQL de création des tables depuis `SUPABASE_CRM_SETUP.md`

**Q: Les leads n'apparaissent pas dans Prospects**
A: Vérifiez que leur statut est bien "interested" ou "qualified" dans la DB

**Q: RLS interdit l'accès aux données**
A: Vérifiez que les policies RLS sont créées et que `user_id` correspond à l'utilisateur connecté

---

**Toute la documentation technique complète est dans `SUPABASE_CRM_SETUP.md`** ✅
