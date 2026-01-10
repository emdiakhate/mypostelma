# 🔍 ANALYSE ARCHITECTURALE - MyPostelma ERP

## 📊 ÉTAT ACTUEL (Problèmes Identifiés)

### ❌ DUPLICATIONS ET INCOHÉRENCES MAJEURES

#### 1. **BOUTIQUES / ENTREPÔTS - DUPLICATION CRITIQUE**

**Actuellement il existe 2 tables pour le même concept:**

| Table | Module | Colonnes clés | Usage |
|-------|--------|--------------|-------|
| `stock_warehouses` | Stock | name, type, address, city, manager_name, gps_lat/lng | Entrepôts/Boutiques (existant) |
| `boutiques` | Caisse | nom, adresse, ville, responsable_nom, latitude/longitude | Boutiques (que j'ai créé - **DUPLICATION**) |

**❌ PROBLÈME:** Les deux tables font LA MÊME CHOSE mais avec des noms différents.

**✅ SOLUTION:** Utiliser `stock_warehouses` partout et supprimer `boutiques`.

---

#### 2. **PRODUITS - INCOHÉRENCE**

**Il existe 2 tables de produits:**

| Table | Module | Statut | Référencé par |
|-------|--------|--------|---------------|
| `stock_products` | Stock | ❌ Deprecated (remplacé) | Ancienne version |
| `vente_products` | Vente | ✅ Actif | Catalogue unique |

**Décision déjà prise:** `vente_products` est le catalogue unique.
**❌ PROBLÈME:** `stock_products` existe encore dans certaines migrations.

**✅ SOLUTION:** S'assurer que tout référence `vente_products`.

---

#### 3. **MOUVEMENTS DE STOCK - CONFUSION**

**Il existe 3 versions de mouvements de stock:**

| Table | Module | Champs clés | Problème |
|-------|--------|------------|----------|
| `vente_stock_movements` | Vente | stock_item_id, type (in/out/adjustment) | ❌ Deprecated |
| `stock_movements` (v1) | Stock | product_id, warehouse_id, movement_type (IN/OUT/TRANSFER) | ✅ Version Stock |
| `stock_movements` (v2) | Caisse | **boutique_id**, produit_id, type (entree/sortie) | ❌ **CONFLIT MAJEUR** |

**❌ PROBLÈME CRITIQUE:**
Ma migration Caisse a créé une NOUVELLE table `stock_movements` qui entre en CONFLIT avec celle du module Stock !

**✅ SOLUTION:** Utiliser la table `stock_movements` du module Stock et l'adapter.

---

## 🎯 ARCHITECTURE CIBLE (Cohérente et Unifiée)

### 📦 PRINCIPE: "Single Source of Truth"

Chaque concept a **UNE SEULE table** utilisée par **TOUS les modules**.

---

### 🗃️ TABLES CENTRALES (Partagées)

#### 1. **CATALOGUE PRODUITS**
```
vente_products (source unique)
├─ Utilisé par: Vente, Stock, Caisse, Compta
└─ Colonnes: id, name, description, type, category, price, cost, sku, status
```

#### 2. **EMPLACEMENTS PHYSIQUES**
```
stock_warehouses (source unique)
├─ Utilisé par: Stock, Caisse
├─ Type: STORE (boutique), WAREHOUSE (entrepôt), MOBILE, OTHER
└─ Colonnes: id, name, type, address, city, manager_name, gps_lat, gps_lng, is_active
```
**💡 Une boutique = warehouse de type 'STORE'**

#### 3. **MOUVEMENTS DE STOCK**
```
stock_movements (source unique)
├─ Utilisé par: Stock, Caisse, Vente
├─ warehouse_from_id (origine)
├─ warehouse_to_id (destination)
├─ product_id → vente_products
├─ movement_type: IN, OUT, TRANSFER, ADJUSTMENT
├─ reference_type: PURCHASE, SALE, TRANSFER, ADJUSTMENT
└─ reference_id (lien vers vente_orders, etc.)
```

---

### 📋 TABLES MÉTIER (Spécifiques)

#### MODULE VENTE
```
vente_orders (commandes clients)
├─ warehouse_id (boutique où se fait la vente)
└─ items → vente_order_items
```

#### MODULE COMPTA
```
compta_invoices (factures)
compta_quotes (devis)
└─ Références vente_orders ou vente_clients
```

#### MODULE CAISSE
```
caisses_journalieres (caisses par boutique/jour)
├─ warehouse_id (au lieu de boutique_id)
└─ mouvements → mouvements_caisse

mouvements_caisse (entrées/sorties caisse)
├─ caisse_id
├─ reference_id (vente_orders, etc.)
└─ moyen_paiement
```

---

## 🔄 FLUX DE DONNÉES (Workflow Unifié)

### Exemple: Vente en boutique

```mermaid
VENTE
  └─> vente_orders
       ├─> warehouse_id = boutique XYZ
       ├─> caisse_id = caisse du jour
       └─> vente_order_items
            └─> product_id → vente_products

  Déclenche automatiquement:

  ├─> stock_movements
  │    ├─> product_id → vente_products
  │    ├─> warehouse_from_id = boutique XYZ
  │    ├─> movement_type = OUT
  │    ├─> reference_type = SALE
  │    └─> reference_id = vente_orders.id
  │
  └─> mouvements_caisse
       ├─> caisse_id = caisse du jour
       ├─> type = vente
       ├─> reference_type = vente
       └─> reference_id = vente_orders.id
```

---

## 🏗️ RESPONSABILITÉS PAR MODULE

### 📦 MODULE STOCK
**Responsabilité:** Gérer les entrepôts et les mouvements de stock

**Tables gérées:**
- ✅ `stock_warehouses` (CRUD)
- ✅ `stock_movements` (CRUD)
- ✅ Vue `stock_levels` (lecture seule)

**Utilise:**
- `vente_products` (lecture seule)

**Expose:**
- Liste des warehouses
- Stock disponible par warehouse/produit
- Historique des mouvements

---

### 🛒 MODULE VENTE
**Responsabilité:** Gérer le catalogue produits et les commandes

**Tables gérées:**
- ✅ `vente_products` (CRUD)
- ✅ `vente_orders` (CRUD)
- ✅ `vente_order_items` (CRUD)

**Utilise:**
- `stock_warehouses` (lecture - pour sélectionner boutique)
- `stock_movements` (écriture - décrémente stock lors vente)
- `caisses_journalieres` (lecture - vérifier caisse ouverte)
- `mouvements_caisse` (écriture - alimenter caisse)

**Expose:**
- Catalogue produits
- Commandes
- Fonction `createSale()` qui fait tout atomiquement

---

### 💰 MODULE CAISSE
**Responsabilité:** Gérer les caisses journalières et encaissements

**Tables gérées:**
- ✅ `caisses_journalieres` (CRUD)
- ✅ `mouvements_caisse` (CRUD)

**Utilise:**
- `stock_warehouses` (lecture - sélectionner boutique)
- `vente_orders` (lecture - voir ventes du jour)

**Expose:**
- Ouverture/clôture caisse
- Solde en temps réel
- Historique encaissements

**NE GÈRE PAS:**
- ❌ Les boutiques (c'est Stock)
- ❌ Les mouvements de stock (c'est Stock)
- ❌ Les ventes (c'est Vente)

---

### 🧾 MODULE COMPTA
**Responsabilité:** Gérer factures, devis, paiements

**Tables gérées:**
- ✅ `compta_invoices` (CRUD)
- ✅ `compta_quotes` (CRUD)
- ✅ `company_settings` (CRUD)

**Utilise:**
- `vente_orders` (lecture - convertir en facture)
- `vente_products` (lecture - lignes de facture)

**Expose:**
- Factures PDF
- Devis PDF
- Paramètres entreprise (logo, signature)

---

## 🔧 PLAN DE REFACTORING

### Phase 1: Correction Immédiate (URGENT)

1. **Supprimer table `boutiques`**
   ```sql
   DROP TABLE IF EXISTS public.boutiques CASCADE;
   ```

2. **Renommer colonnes dans tables Caisse**
   ```sql
   ALTER TABLE caisses_journalieres
     RENAME COLUMN boutique_id TO warehouse_id;
   ```

3. **Supprimer table `stock_movements` de Caisse**
   - Utiliser celle du module Stock à la place

4. **Mettre à jour hook `useSales`**
   - Utiliser `stock_movements` du module Stock
   - Utiliser `warehouse_id` au lieu de `boutique_id`

---

### Phase 2: Migration de Données

1. **Si des boutiques ont déjà été créées dans `boutiques`:**
   ```sql
   -- Migrer vers stock_warehouses
   INSERT INTO stock_warehouses (user_id, name, type, address, city, ...)
   SELECT user_id, nom, 'STORE', adresse, ville, ...
   FROM boutiques;
   ```

2. **Mettre à jour les références dans caisses**

---

### Phase 3: Mise à jour du Code Frontend

1. **Hook `useBoutiques`**
   - Renommer en `useWarehouses`
   - Interroger `stock_warehouses` avec filtre `type = 'STORE'`

2. **Hook `useStockMovements`**
   - Supprimer (utiliser celui du module Stock)

3. **Hook `useSales`**
   - Remplacer `boutique_id` par `warehouse_id`
   - Utiliser la vraie table `stock_movements`

4. **Pages UI**
   - `/caisse/boutiques` → `/caisse/entrepots` ou garder le nom mais interroger warehouses
   - Terminologie cohérente partout

---

## ✅ RÈGLES D'OR

### 1. **UN concept = UNE table**
- Produits → `vente_products`
- Emplacements → `stock_warehouses`
- Mouvements stock → `stock_movements` (module Stock)
- Caisses → `caisses_journalieres`

### 2. **Chaque module a SA responsabilité**
- Stock: gérer warehouses + mouvements
- Vente: gérer produits + commandes
- Caisse: gérer encaissements
- Compta: gérer facturation

### 3. **Les modules UTILISENT ce que d'autres créent**
- Caisse utilise `stock_warehouses` (créé par Stock)
- Vente crée des `stock_movements` (table de Stock)
- Compta utilise `vente_orders` (créé par Vente)

### 4. **Pas de duplication**
- Si ça existe déjà → on l'utilise
- Si ça n'existe pas → on crée dans le bon module

---

## 🎯 RÉSULTAT FINAL

### Tables Centrales Partagées
```
vente_products          → Catalogue (par Vente, utilisé par tous)
stock_warehouses        → Emplacements (par Stock, utilisé par Caisse/Vente)
stock_movements         → Mouvements (par Stock, créé par Vente/Caisse)
```

### Tables Métier
```
vente_orders            → Commandes (Vente)
compta_invoices         → Factures (Compta)
compta_quotes           → Devis (Compta)
caisses_journalieres    → Caisses (Caisse)
mouvements_caisse       → Encaissements (Caisse)
```

### Workflow Vente Intégré
```
1. Vendeur crée vente (module Vente)
2. Vente vérifie stock (module Stock)
3. Vente crée mouvement stock OUT (table Stock)
4. Vente crée mouvement caisse (table Caisse)
5. Tout est tracé et cohérent
```

---

## 📝 PROCHAINES ÉTAPES

Veux-tu que je:

1. ✅ **Crée une migration de correction** pour supprimer les duplications?
2. ✅ **Mette à jour tous les hooks** pour utiliser les bonnes tables?
3. ✅ **Modifie les pages UI** pour la cohérence?
4. ✅ **Teste le workflow complet** après refactoring?

Dis-moi par où commencer ! 🚀
