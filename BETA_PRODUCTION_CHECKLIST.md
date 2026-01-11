# 🚀 Checklist Beta Production - MyPostelma ERP

**Date**: 2026-01-10
**Version**: Beta 1.0
**Branche**: `claude/analyze-project-con5n`

## 📋 Table des Matières

1. [Nettoyage Effectué](#nettoyage-effectué)
2. [Migrations à Appliquer](#migrations-à-appliquer)
3. [Tests Fonctionnels](#tests-fonctionnels)
4. [Checklist Technique](#checklist-technique)
5. [Guide de Déploiement](#guide-de-déploiement)
6. [Points de Vigilance](#points-de-vigilance)

---

## ✅ Nettoyage Effectué

### Refactoring Architectural Majeur

**Problème Identifié**: Duplications entre modules Caisse et Stock
- ❌ Table `boutiques` dupliquait `stock_warehouses`
- ❌ Caisse créait sa propre table `stock_movements`
- ❌ Vue `stock_actuel` dupliquait `stock_levels`

**Solution Implémentée**: Single Source of Truth
- ✅ Une seule table `stock_warehouses` pour tous les entrepôts/boutiques
- ✅ Une seule table `stock_movements` (module Stock)
- ✅ Vue unifiée `stock_levels` pour le stock actuel
- ✅ Foreign keys correctes entre tous les modules

### Fichiers Supprimés/Refactorisés

```
SUPPRIMÉS:
- src/hooks/useBoutiques.tsx → Remplacé par useWarehouses
- src/hooks/useStockMovements.tsx → Utilise maintenant module Stock

CRÉÉS:
- src/hooks/useWarehouses.tsx → Nouveau hook unifié
- supabase/migrations/20260110000002_refactor_caisse_architecture.sql
- supabase/migrations/20260110000003_add_missing_warehouse_foreign_keys.sql
- supabase/migrations/20260110000004_cleanup_obsolete_tables.sql

REFACTORISÉS:
- src/hooks/useCaisseJournaliere.tsx → Utilise warehouse_id
- src/hooks/useSales.tsx → Utilise stock_levels et warehouse_id
- src/pages/caisse/boutiques/index.tsx → Gère warehouses (type STORE)
- src/pages/caisse/journaliere/index.tsx → Utilise warehouses
- src/pages/caisse/dashboard/index.tsx → Utilise stock_levels
- src/pages/caisse/nouvelle-vente/index.tsx → Utilise warehouses
- src/types/caisse.ts → Types alignés avec Stock module
```

### Erreurs Corrigées

1. ✅ **Select.Item avec valeur vide**
   - Fichiers: PurchaseOrderForm.tsx, SupplierForm.tsx
   - Fix: Suppression des options avec `value=""`

2. ✅ **Relations Supabase manquantes**
   - purchase_orders → stock_warehouses
   - stock_inventories → stock_warehouses

---

## 🗄️ Migrations à Appliquer (dans l'ordre)

### Migration 1: Système Caisse Initial
**Fichier**: `20260110000001_caisse_system.sql`
**Statut**: ✅ Appliquée
**Description**: Crée les tables de base du système de caisse

### Migration 2: Refactoring Architecture
**Fichier**: `20260110000002_refactor_caisse_architecture.sql`
**Statut**: ⏳ À appliquer
**Description**:
- Migre `boutiques` → `stock_warehouses`
- Renomme `boutique_id` → `warehouse_id`
- Supprime tables dupliquées

**Vérifications Post-Migration**:
```sql
-- 1. Vérifier que boutiques n'existe plus
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'boutiques'; -- Doit retourner 0

-- 2. Vérifier les warehouses de type STORE
SELECT * FROM stock_warehouses WHERE type = 'STORE';

-- 3. Vérifier les caisses avec warehouse_id
SELECT id, warehouse_id, date, statut
FROM caisses_journalieres
ORDER BY date DESC LIMIT 5;
```

### Migration 3: Foreign Keys Manquantes
**Fichier**: `20260110000003_add_missing_warehouse_foreign_keys.sql`
**Statut**: ⏳ À appliquer
**Description**: Ajoute warehouse_id à purchase_orders et stock_inventories

### Migration 4: Nettoyage Final
**Fichier**: `20260110000004_cleanup_obsolete_tables.sql`
**Statut**: ⏳ À appliquer
**Description**: Supprime définitivement les tables obsolètes recréées par erreur

---

## 🧪 Tests Fonctionnels

### Test 1: Module Caisse - Workflow Complet

#### 1.1 Gestion des Boutiques (Warehouses)
```
URL: /app/caisse/boutiques

✓ Affichage de la liste des boutiques
✓ Création d'une nouvelle boutique
  - Nom: "Boutique Test Beta"
  - Ville: "Dakar"
  - Manager: "Test Manager"
  - Statut: Active
✓ Modification d'une boutique
✓ Changement de statut (Active → Inactive)
✓ Vérification que les données apparaissent dans stock_warehouses
```

**Vérification SQL**:
```sql
SELECT id, name, type, city, manager_name, is_active
FROM stock_warehouses
WHERE type = 'STORE'
ORDER BY created_at DESC;
```

#### 1.2 Ouverture de Caisse
```
URL: /app/caisse/journaliere

PRÉCONDITION: Une boutique active doit exister

✓ Cliquer sur "Ouvrir la caisse"
✓ Sélectionner la boutique dans le dropdown
✓ Entrer solde d'ouverture: 50000 FCFA
✓ Ajouter une note: "Ouverture test beta"
✓ Valider
✓ Vérifier que la caisse apparaît comme "Ouverte"
✓ Vérifier que le solde d'ouverture est correct
```

**Vérification SQL**:
```sql
SELECT cj.id, sw.name as boutique, cj.date, cj.solde_ouverture, cj.statut
FROM caisses_journalieres cj
JOIN stock_warehouses sw ON sw.id = cj.warehouse_id
WHERE cj.date = CURRENT_DATE
ORDER BY cj.created_at DESC;
```

#### 1.3 Nouvelle Vente
```
URL: /app/caisse/nouvelle-vente

PRÉCONDITION:
- Caisse ouverte
- Produits existants avec stock disponible

✓ Sélectionner la boutique (dropdown)
✓ Remplir infos client:
  - Nom: "Client Test Beta"
  - Email: "test@beta.com"
  - Téléphone: "+221 77 123 45 67"
✓ Ajouter des produits (minimum 2)
✓ Vérifier que le stock disponible s'affiche
✓ Choisir moyen de paiement: Cash
✓ Finaliser la vente
✓ Vérifier redirection vers caisse journalière
✓ Vérifier que la vente apparaît dans les mouvements
```

**Vérifications SQL**:
```sql
-- 1. Vente créée
SELECT * FROM vente_orders
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC LIMIT 1;

-- 2. Mouvement de stock créé (SORTIE)
SELECT sm.*, vp.name as product_name
FROM stock_movements sm
JOIN vente_products vp ON vp.id = sm.product_id
WHERE sm.movement_type = 'OUT'
AND sm.reference_type = 'SALE'
AND sm.created_at > NOW() - INTERVAL '1 hour';

-- 3. Mouvement de caisse créé
SELECT * FROM mouvements_caisse
WHERE type = 'vente'
AND created_at > NOW() - INTERVAL '1 hour';

-- 4. Stock levels mis à jour
SELECT sl.*, vp.name
FROM stock_levels sl
JOIN vente_products vp ON vp.id = sl.product_id
WHERE sl.warehouse_id = (SELECT warehouse_id FROM caisses_journalieres WHERE statut = 'ouverte' LIMIT 1);
```

#### 1.4 Mouvements de Caisse
```
URL: /app/caisse/journaliere

✓ Ajouter une entrée:
  - Type: Entré
  - Montant: 10000 FCFA
  - Description: "Complément de caisse"
  - Moyen: Cash
✓ Ajouter une sortie:
  - Type: Sortie
  - Montant: 5000 FCFA
  - Description: "Petites dépenses"
  - Moyen: Cash
✓ Vérifier que les mouvements apparaissent
✓ Vérifier que le solde théorique est correct
```

#### 1.5 Clôture de Caisse
```
URL: /app/caisse/journaliere

✓ Cliquer sur "Clôturer la caisse"
✓ Entrer solde de clôture réel (compter la caisse)
✓ Vérifier le calcul de l'écart
✓ Ajouter note de clôture si écart > 0
✓ Valider
✓ Vérifier que la caisse passe en statut "Fermée"
✓ Vérifier qu'on ne peut plus créer de vente pour cette caisse
```

#### 1.6 Dashboard Multi-Boutiques
```
URL: /app/caisse/dashboard

✓ Affichage du nombre de boutiques actives
✓ Affichage des caisses ouvertes
✓ Affichage de la valeur totale du stock
✓ Affichage des alertes de stock bas
✓ Tableau récapitulatif par boutique:
  - Statut caisse
  - Ventes du jour
  - Valeur stock
  - Produits en rupture
```

---

### Test 2: Module Stock

#### 2.1 Gestion des Entrepôts
```
URL: /app/stock/warehouses

✓ Voir liste des warehouses (tous types)
✓ Créer un entrepôt:
  - Nom: "Entrepôt Central Test"
  - Type: WAREHOUSE
  - Ville: "Dakar"
✓ Vérifier que boutiques ET warehouses apparaissent
✓ Filtrer par type (STORE, WAREHOUSE)
```

#### 2.2 Mouvements de Stock
```
URL: /app/stock/movements

✓ Créer un mouvement d'entrée:
  - Type: IN
  - Produit: Sélectionner un produit
  - Quantité: 50
  - Warehouse: Sélectionner warehouse
  - Raison: "Réception fournisseur test"
✓ Créer un transfert:
  - Type: TRANSFER
  - Produit: Même produit
  - Quantité: 10
  - De: Warehouse 1
  - Vers: Warehouse 2
✓ Vérifier que les mouvements apparaissent dans la liste
✓ Vérifier que stock_levels est mis à jour
```

#### 2.3 Inventaires
```
URL: /app/stock/inventories

✓ Créer un inventaire
✓ Sélectionner un warehouse
✓ Ajouter des produits avec quantités réelles
✓ Finaliser l'inventaire
✓ Vérifier que les écarts sont calculés
✓ Vérifier que les ajustements sont créés
```

#### 2.4 Fournisseurs et Commandes d'Achat
```
URL: /app/stock/suppliers

✓ Créer un fournisseur
✓ Créer une commande d'achat
✓ Sélectionner warehouse de destination
✓ Ajouter des produits
✓ Vérifier que la commande est créée
✓ Pas d'erreur de relation avec stock_warehouses
```

---

### Test 3: Module Vente

#### 3.1 Catalogue Produits
```
URL: /app/vente/products

✓ Affichage de la liste des produits
✓ Création d'un nouveau produit:
  - Type: Product (physique)
  - Nom: "Produit Test Beta"
  - Prix: 15000 FCFA
  - Catégorie: Test
✓ Modification d'un produit
✓ Archivage d'un produit
```

#### 3.2 Devis
```
URL: /app/vente/quotes

✓ Créer un nouveau devis
✓ Ajouter des produits
✓ Envoyer le devis (changement statut)
✓ Accepter le devis
✓ Convertir en commande
```

#### 3.3 Commandes
```
URL: /app/vente/orders

✓ Liste des commandes
✓ Voir détails d'une commande
✓ Changer statut (pending → confirmed → shipped → delivered)
✓ Gérer statut paiement
```

---

### Test 4: Module Compta

#### 4.1 Paramètres Entreprise
```
URL: /app/compta/settings

✓ Remplir informations entreprise
✓ Ajouter logo
✓ Configurer informations bancaires
✓ Configurer signature
✓ Sauvegarder
```

#### 4.2 Factures
```
URL: /app/compta/invoices

✓ Créer une facture
✓ Générer PDF
✓ Envoyer par email (si configuré)
✓ Marquer comme payée
```

---

## 🔧 Checklist Technique

### Performance & Optimisation

- [ ] **Indexes Vérifiés**
  ```sql
  -- Vérifier les indexes critiques
  SELECT tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN ('stock_warehouses', 'stock_movements', 'stock_levels',
                    'caisses_journalieres', 'vente_orders', 'vente_products');
  ```

- [ ] **Vues Matérialisées**
  ```sql
  -- Vérifier que stock_levels est créée
  SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';

  -- Rafraîchir si nécessaire
  REFRESH MATERIALIZED VIEW CONCURRENTLY stock_levels;
  ```

- [ ] **Queries N+1**
  - Vérifier que les hooks utilisent `.select()` avec les relations
  - Exemple: `select('*, warehouse:stock_warehouses(*)')`

- [ ] **Bundle Size**
  ```bash
  # Vérifier la taille des bundles
  npm run build
  # Analyser le rapport de build
  ```

### Sécurité

- [ ] **RLS (Row Level Security)**
  ```sql
  -- Vérifier que RLS est activé sur toutes les tables
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = false;
  ```

- [ ] **Policies**
  ```sql
  -- Lister toutes les policies
  SELECT schemaname, tablename, policyname, cmd
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```

- [ ] **Foreign Keys**
  ```sql
  -- Vérifier l'intégrité référentielle
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
  ```

### Erreurs Console

- [ ] Aucune erreur React dans la console
- [ ] Aucune erreur Supabase 400/404/500
- [ ] Aucun warning de dépendances obsolètes
- [ ] Aucune fuite mémoire (vérifier React DevTools Profiler)

### Tests Manuels Cross-Browser

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (si possible)
- [ ] Mobile Safari (responsive)
- [ ] Mobile Chrome (responsive)

---

## 🚀 Guide de Déploiement

### Pré-Déploiement

1. **Merger la PR dans `main`**
   ```bash
   # Sur GitHub
   1. Vérifier que tous les checks sont verts
   2. Merger la PR claude/analyze-project-con5n → main
   3. Supprimer la branche de feature
   ```

2. **Lovable Auto-Deploy**
   - Lovable détecte le merge sur `main`
   - Exécute les migrations automatiquement
   - Redéploie l'application

3. **Vérifications Post-Déploiement**
   ```
   ✓ Vérifier que l'app se charge
   ✓ Vérifier que les migrations ont réussi (logs Supabase)
   ✓ Tester un workflow complet (boutique → caisse → vente)
   ✓ Vérifier la console pour erreurs
   ```

### Rollback Si Nécessaire

Si problème critique détecté :

```bash
# 1. Revert le merge sur main
git revert <commit-hash-du-merge> -m 1

# 2. Push le revert
git push origin main

# 3. Lovable redéploie automatiquement
```

### Migrations Manuelles (si auto-migration échoue)

```sql
-- Se connecter à Supabase SQL Editor
-- Exécuter dans l'ordre:

-- 1. Migration refactoring
\i supabase/migrations/20260110000002_refactor_caisse_architecture.sql

-- 2. Foreign keys
\i supabase/migrations/20260110000003_add_missing_warehouse_foreign_keys.sql

-- 3. Cleanup
\i supabase/migrations/20260110000004_cleanup_obsolete_tables.sql
```

---

## ⚠️ Points de Vigilance

### Données Existantes

- **CRITIQUE**: Les boutiques existantes seront migrées automatiquement vers `stock_warehouses`
- **Vérifier**: Que tous les utilisateurs retrouvent leurs boutiques
- **Backup**: Lovable fait des snapshots automatiques, mais vérifier avant migration

### Breaking Changes

- **Hooks Supprimés**:
  - `useBoutiques()` → Utiliser `useWarehouses('STORE')`
  - `useStockMovements()` (version Caisse) → Utiliser module Stock

- **Champs Renommés**:
  - `boutique_id` → `warehouse_id`
  - `nom` → `name`
  - `statut` → `is_active`

### Performance

- **Stock Levels**: Vue matérialisée, rafraîchir régulièrement
  ```sql
  -- Créer un cron job pour rafraîchir toutes les heures
  SELECT cron.schedule(
    'refresh-stock-levels',
    '0 * * * *', -- Chaque heure
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY stock_levels$$
  );
  ```

- **Indexes**: Vérifier que tous les indexes sont créés après migration

### Monitoring

- **Supabase Dashboard**: Surveiller les erreurs API
- **Lovable Logs**: Vérifier les logs de déploiement
- **Sentry** (si configuré): Surveiller les erreurs frontend

---

## 📊 Résumé des Changements

### Architecture Avant
```
Caisse Module:
├── boutiques (table dupliquée)
├── stock_movements (conflictuelle)
└── stock_actuel (vue dupliquée)

Stock Module:
├── stock_warehouses
├── stock_movements
└── stock_levels
```

### Architecture Après (Unifiée)
```
Stock Module (Single Source of Truth):
├── stock_warehouses (type: STORE | WAREHOUSE | MOBILE | OTHER)
├── stock_movements (tous les mouvements)
└── stock_levels (vue matérialisée)

Caisse Module (utilise Stock):
├── caisses_journalieres (warehouse_id → stock_warehouses)
└── mouvements_caisse

Vente Module (utilise Stock):
└── vente_orders (warehouse_id → stock_warehouses)
```

### Avantages

✅ **Cohérence**: Une seule source de vérité
✅ **Performance**: Moins de duplications, queries optimisées
✅ **Maintenabilité**: Architecture claire, responsabilités bien définies
✅ **Scalabilité**: Facile d'ajouter de nouveaux types de warehouses
✅ **Intégrité**: Foreign keys correctes, pas de données orphelines

---

## 📝 Notes Finales

- **Version Beta**: Cette version est destinée aux tests internes
- **Feedback**: Collecter les retours utilisateurs
- **Itérations**: Prévoir des hotfixes rapides si nécessaire
- **Documentation**: Mettre à jour la doc utilisateur si architecture visible

**Date de Déploiement Prévu**: À définir après validation des tests

**Responsable**: Claude AI + Équipe DevOps

---

**Signature**: ✅ Prêt pour Beta Production
