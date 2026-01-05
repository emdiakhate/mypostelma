# Guide d'Implémentation Module Vente - Lovable

Ce document explique étape par étape ce que Lovable doit faire pour intégrer le module Vente avec Supabase.

## 📋 Résumé

Le module Vente est maintenant **développé côté frontend** avec :
- ✅ Types TypeScript (`src/types/vente.ts`)
- ✅ Hook useVente.tsx avec 6 sous-hooks
- ✅ Tests unitaires complets
- ✅ 5 pages UI déjà créées (avec données mockées)

**Ce qu'il reste à faire côté Lovable** : Configurer Supabase (9 tables + RLS + triggers).

---

## ⚙️ Étape 1 : Créer les Tables Supabase

### Action : Exécuter le script SQL dans Supabase

1. Ouvre **Supabase Dashboard** → SQL Editor
2. Copie-colle **l'intégralité** du fichier `SUPABASE_VENTE_SETUP.md` section par section
3. Exécute les scripts dans cet ordre :

**Ordre d'exécution :**
```
1. vente_products
2. vente_quotes
3. vente_quote_items
4. vente_orders
5. vente_order_items
6. vente_tickets
7. vente_ticket_responses
8. vente_stock_items
9. vente_stock_movements
10. Triggers (update_updated_at_column, auto-génération numéros)
11. Vues (optionnel)
```

### Vérification :
```sql
-- Lance cette requête pour vérifier que les 9 tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'vente_%'
ORDER BY table_name;
```

**Résultat attendu** : 9 tables
- vente_orders
- vente_order_items
- vente_products
- vente_quotes
- vente_quote_items
- vente_stock_items
- vente_stock_movements
- vente_ticket_responses
- vente_tickets

---

## 🔐 Étape 2 : Vérifier Row Level Security (RLS)

### Action : Vérifier que RLS est bien activé

```sql
-- Vérifie que RLS est activé sur toutes les tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'vente_%';
```

**Résultat attendu** : Toutes les lignes doivent avoir `rowsecurity = true`

### Vérifier les Policies :
```sql
-- Compte les policies par table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'vente_%'
GROUP BY tablename
ORDER BY tablename;
```

**Résultat attendu** : Chaque table doit avoir **4 policies** (SELECT, INSERT, UPDATE, DELETE)

---

## 🧪 Étape 3 : Tester les Opérations CRUD

### Test 1 : Créer un produit

```sql
-- Remplace auth.uid() par ton vrai user_id de test
INSERT INTO vente_products (user_id, name, description, type, category, price, cost, unit, status)
VALUES (
  'YOUR_USER_ID_HERE',
  'Formation Social Media Marketing',
  'Formation complète sur 2 jours',
  'service',
  'Formation',
  1500.00,
  400.00,
  'Forfait',
  'active'
)
RETURNING *;
```

### Test 2 : Créer un devis avec items

```sql
-- 1. Créer le devis
INSERT INTO vente_quotes (
  user_id, number, client_name, client_email, status, total_ht, total_ttc, tva_rate, valid_until
)
VALUES (
  'YOUR_USER_ID_HERE',
  'DEV-2026-001',
  'Test Client',
  'test@example.com',
  'draft',
  1500.00,
  1800.00,
  0.20,
  '2026-02-15'
)
RETURNING id;

-- 2. Créer les items (remplace QUOTE_ID par l'ID retourné ci-dessus)
INSERT INTO vente_quote_items (quote_id, product_name, description, quantity, unit_price, total, order_index)
VALUES
  ('QUOTE_ID', 'Formation SMM', 'Formation 2 jours', 1, 1500, 1500, 0);
```

### Test 3 : Lire les données

```sql
-- Récupère tous les devis avec leurs items (comme le fait le hook)
SELECT q.*,
       json_agg(qi ORDER BY qi.order_index) as items
FROM vente_quotes q
LEFT JOIN vente_quote_items qi ON qi.quote_id = q.id
WHERE q.user_id = 'YOUR_USER_ID_HERE'
GROUP BY q.id
ORDER BY q.created_at DESC;
```

---

## 🎨 Étape 4 : Activer le Feature Flag (Si nécessaire)

Si tu as un système de feature flags pour activer progressivement les modules :

```typescript
// src/lib/featureFlags.ts ou équivalent
export const ENABLE_VENTE_MODULE = true; // Activer le module Vente
```

Ou dans une table Supabase `feature_flags` :
```sql
INSERT INTO feature_flags (name, enabled) VALUES ('vente_module', true);
```

---

## 🔄 Étape 5 : Tester l'Intégration Frontend

### Test dans l'application React

1. **Lance l'app en dev** : `npm run dev`

2. **Navigue vers les pages Vente** :
   - `/vente/catalogue` → Gestion produits/services
   - `/vente/devis` → Gestion devis
   - `/vente/commandes` → Gestion commandes
   - `/vente/service-client` → Support tickets
   - `/vente/stock` → Gestion stock

3. **Teste chaque page** :
   - ✅ Création d'un produit
   - ✅ Création d'un devis avec items
   - ✅ Conversion devis → commande
   - ✅ Création ticket support
   - ✅ Ajout mouvement stock

### Tests Unitaires

```bash
# Lance les tests
npm run test src/hooks/useVente.test.tsx
```

**Résultat attendu** : Tous les tests passent (40+ tests)

---

## 📊 Étape 6 : Peupler avec des Données de Démo (Optionnel)

Pour faciliter les démos, tu peux insérer des données de test :

```sql
-- Produits de démonstration
INSERT INTO vente_products (user_id, name, description, type, category, price, cost, unit, status) VALUES
  ('YOUR_USER_ID', 'Formation Social Media Marketing', 'Formation complète sur 2 jours', 'service', 'Formation', 1500, 400, 'Forfait', 'active'),
  ('YOUR_USER_ID', 'Audit Réseaux Sociaux', 'Analyse complète de votre présence', 'service', 'Conseil', 800, 200, 'Forfait', 'active'),
  ('YOUR_USER_ID', 'Gestion de Campagne Publicitaire', 'Création et gestion de campagnes Meta et Google', 'service', 'Marketing', 150, 50, 'Heure', 'active'),
  ('YOUR_USER_ID', 'Abonnement MyPostelma Pro', 'Accès complet à la plateforme', 'service', 'Abonnement', 99, NULL, 'Mois', 'active'),
  ('YOUR_USER_ID', 'Pack Starter', 'Kit de démarrage complet', 'product', 'Produit Physique', 150, 60, 'Unité', 'active');

-- Devis de démonstration
INSERT INTO vente_quotes (user_id, number, client_name, client_email, status, total_ht, total_ttc, tva_rate, valid_until, created_at, sent_at)
VALUES
  ('YOUR_USER_ID', 'DEV-2026-001', 'Entreprise ABC', 'contact@abc.com', 'sent', 5000, 6000, 0.20, '2026-02-15', '2026-01-02', '2026-01-03'),
  ('YOUR_USER_ID', 'DEV-2026-002', 'Startup XYZ', 'hello@xyz.io', 'accepted', 3500, 4200, 0.20, '2026-02-20', '2026-01-05', '2026-01-05');

-- Commandes de démonstration
INSERT INTO vente_orders (user_id, number, client_name, client_email, status, payment_status, total_ht, total_ttc, tva_rate, created_at)
VALUES
  ('YOUR_USER_ID', 'CMD-2026-001', 'Entreprise ABC', 'contact@abc.com', 'confirmed', 'paid', 5000, 6000, 0.20, '2026-01-04'),
  ('YOUR_USER_ID', 'CMD-2026-002', 'Startup XYZ', 'hello@xyz.io', 'processing', 'paid', 3500, 4200, 0.20, '2026-01-06');

-- Tickets de démonstration
INSERT INTO vente_tickets (user_id, number, subject, description, client_name, client_email, status, priority, category, created_at)
VALUES
  ('YOUR_USER_ID', 'TICKET-001', 'Problème de connexion', 'Je ne parviens plus à me connecter', 'Jean Dupont', 'jean@example.com', 'in_progress', 'high', 'Problème technique', '2026-01-08'),
  ('YOUR_USER_ID', 'TICKET-002', 'Question sur la facturation', 'Je souhaite obtenir une facture', 'Marie Martin', 'marie@company.fr', 'resolved', 'medium', 'Facturation', '2026-01-07');
```

---

## 🚀 Étape 7 : Déploiement et Monitoring

### 7.1 Vérifier les Performances

```sql
-- Vérifie que les index sont bien créés
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'vente_%'
ORDER BY tablename, indexname;
```

**Résultat attendu** : Chaque table devrait avoir plusieurs index (user_id, status, dates, etc.)

### 7.2 Activer les Logs Supabase (Optionnel)

Pour déboguer les requêtes en production :
- Supabase Dashboard → Settings → API → **Enable Logging**

### 7.3 Configurer les Backups (Recommandé)

- Supabase Dashboard → Settings → Backups → Configure daily backups

---

## 📝 Étape 8 : Documentation Utilisateur

Crée une documentation pour les utilisateurs finaux :

### Guide rapide : Créer un devis

1. **Aller dans Vente → Devis**
2. **Cliquer sur "Nouveau devis"**
3. **Remplir les informations client** :
   - Nom
   - Email
   - Téléphone (optionnel)
4. **Ajouter des lignes** :
   - Sélectionner un produit/service du catalogue
   - Ou créer un item personnalisé
5. **Valider** → Le total HT/TTC est calculé automatiquement
6. **Envoyer au client** → Statut passe à "Envoyé"

### Guide rapide : Gérer le stock

1. **Aller dans Vente → Stock**
2. **Voir les alertes** : Articles en stock faible apparaissent en orange/rouge
3. **Ajouter un mouvement** :
   - Entrée : Réception fournisseur
   - Sortie : Vente client
   - Ajustement : Inventaire physique
4. **Le stock est mis à jour automatiquement**

---

## ✅ Checklist Finale

Avant de considérer le module Vente comme "terminé", vérifie :

- [ ] **9 tables créées** dans Supabase
- [ ] **RLS activé** sur toutes les tables
- [ ] **Policies** configurées (4 par table)
- [ ] **Triggers** créés (updated_at, auto-génération numéros)
- [ ] **Index** créés pour performances
- [ ] **Test CRUD** : Créer un produit, devis, commande, ticket
- [ ] **Test Frontend** : Toutes les pages fonctionnent
- [ ] **Tests unitaires** : Tous les tests passent
- [ ] **Données démo** insérées (optionnel)
- [ ] **Feature flag** activé (si applicable)
- [ ] **Documentation** mise à jour

---

## 🐛 Troubleshooting

### Problème : "permission denied for table vente_products"

**Cause** : RLS activé mais policies manquantes

**Solution** :
```sql
-- Vérifie que les policies existent
SELECT * FROM pg_policies WHERE tablename = 'vente_products';

-- Si aucune policy n'apparaît, réexécute les scripts RLS
```

### Problème : "relation vente_products does not exist"

**Cause** : Table pas encore créée

**Solution** : Exécute le script SQL de création de la table

### Problème : "null value in column user_id violates not-null constraint"

**Cause** : L'utilisateur n'est pas authentifié

**Solution** : Assure-toi que l'utilisateur est bien connecté avec `auth.uid()`

### Problème : Les totaux HT/TTC ne correspondent pas

**Cause** : Calcul manuel erroné

**Solution** : Utilise les fonctions helpers :
```typescript
import { calculateTTC, calculateHT } from '@/types/vente';

const totalTTC = calculateTTC(1000); // 1200 (avec TVA 20%)
const totalHT = calculateHT(1200); // 1000
```

### Problème : Les numéros de devis/commandes ne s'auto-incrémentent pas

**Cause** : Triggers pas créés ou number fourni manuellement

**Solution** :
1. Vérifie que les triggers existent :
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'auto_generate_%';
```

2. Si tu veux auto-génération, ne fournis PAS le champ `number` lors de l'INSERT

### Problème : Stock négatif après mouvement

**Cause** : Mouvement "out" avec quantité > stock actuel

**Solution** : Le hook utilise `Math.max(0, newQuantity)` pour éviter les stocks négatifs. Vérifie que cette logique est bien dans le hook.

---

## 📚 Ressources Supplémentaires

- **Documentation Supabase RLS** : https://supabase.com/docs/guides/auth/row-level-security
- **Documentation Triggers** : https://supabase.com/docs/guides/database/functions
- **React Hook Best Practices** : https://react.dev/learn/reusing-logic-with-custom-hooks

---

## 🎯 Prochaines Étapes (Améliorations Futures)

Une fois le module de base fonctionnel, tu peux ajouter :

1. **Edge Functions** :
   - Génération PDF pour devis/factures
   - Envoi emails automatiques (devis envoyé, commande confirmée)
   - Webhook pour tracking colis

2. **Notifications** :
   - Alerte stock faible
   - Nouveau ticket support
   - Devis accepté/refusé

3. **Analytics** :
   - Dashboard avec graphiques (CA mensuel, taux conversion, etc.)
   - Export Excel/CSV
   - Rapports personnalisés

4. **Intégrations** :
   - Stripe pour paiements
   - Zapier pour automatisations
   - n8n pour workflows complexes

---

## 💬 Support

Si tu rencontres des problèmes lors de l'implémentation :

1. **Vérifie les logs Supabase** : Dashboard → Logs
2. **Teste avec SQL direct** avant de tester dans l'app
3. **Consulte les tests unitaires** pour voir des exemples d'utilisation
4. **Ouvre une issue GitHub** avec :
   - Message d'erreur complet
   - Requête SQL qui échoue
   - Version Supabase utilisée

---

**Bon courage pour l'implémentation ! 🚀**

Le module Vente est maintenant prêt à être intégré. Toute la logique frontend est en place, il ne reste plus qu'à configurer Supabase et tout devrait fonctionner immédiatement.
