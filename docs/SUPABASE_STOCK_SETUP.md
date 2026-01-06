# Module Stock - Configuration Supabase

Documentation complète pour le module **Stock indépendant** de MyPostelma ERP.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Installation](#installation)
- [Structure des tables](#structure-des-tables)
- [Vues et fonctions](#vues-et-fonctions)
- [Utilisation du hook](#utilisation-du-hook)
- [Pages UI](#pages-ui)
- [Cas d'usage](#cas-dusage)
- [Best Practices](#best-practices)

---

## 🎯 Vue d'ensemble

Le module Stock est un **module indépendant** pour gérer l'inventaire multi-boutique/multi-entrepôt basé sur les mouvements (best practice ERP).

### Caractéristiques principales

- ✅ **Movement-based**: Stock calculé à partir des mouvements (IN/OUT/TRANSFER/ADJUSTMENT)
- ✅ **Multi-warehouse**: Support boutiques, entrepôts centraux, vendeurs mobiles
- ✅ **Multi-product types**: Physique, Digital (licences), Services
- ✅ **Audit trail complet**: Historique de tous les mouvements
- ✅ **Digital assets**: Gestion licences/codes pour produits digitaux
- ✅ **Stock levels calculés**: Vue SQL performante avec coût moyen
- ✅ **RLS activé**: Isolation par user_id

---

## 🏗️ Architecture

### Principe fondamental

**❌ Anti-pattern** (ancien système):
```
Table: products
- id
- quantity ← STATIC, pas d'historique, pas d'audit
```

**✅ Best practice** (nouveau système):
```
Table: stock_movements
- movement_type (IN/OUT/TRANSFER/ADJUSTMENT)
- quantity (toujours positive)
- warehouse_from_id / warehouse_to_id
- reason, reference, cost

→ Stock actuel = SUM(movements)
→ Audit trail complet
→ Traçabilité totale
```

### Flux de données

```
┌─────────────────────┐
│  stock_products     │  ← Référentiel produits
└─────────────────────┘
         ↓
┌─────────────────────┐
│ stock_warehouses    │  ← Boutiques/Entrepôts
└─────────────────────┘
         ↓
┌─────────────────────┐
│ stock_movements     │  ← CŒUR: Tous mouvements
└─────────────────────┘
         ↓
┌─────────────────────┐
│  stock_levels (VIEW)│  ← Stock calculé en temps réel
└─────────────────────┘
```

---

## 🚀 Installation

### Étape 1: Appliquer la migration

```bash
# Depuis le dossier du projet
supabase db push

# Ou via Supabase Dashboard
# SQL Editor → Copier/coller le contenu de:
# supabase/migrations/20260106000000_refactor_stock_module.sql
```

⚠️ **ATTENTION**: Cette migration supprime les anciennes tables `vente_stock_*` !

### Étape 2: Vérifier les tables

```sql
-- Lister les tables créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'stock_%';

-- Résultat attendu:
-- stock_products
-- stock_warehouses
-- stock_movements
-- stock_digital_assets
```

### Étape 3: Créer un entrepôt par défaut (optionnel)

```sql
-- Pour chaque utilisateur, créer un entrepôt principal
INSERT INTO public.stock_warehouses (user_id, name, type, city, country, is_active)
VALUES (
  auth.uid(),
  'Entrepôt Principal',
  'WAREHOUSE',
  'Dakar',
  'Senegal',
  true
);
```

---

## 📊 Structure des tables

### 1. `stock_products` - Référentiel produits

```sql
CREATE TABLE stock_products (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('PHYSICAL', 'DIGITAL', 'SERVICE')),
  category TEXT,
  sku TEXT UNIQUE,
  barcode TEXT,
  price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  tax_rate DECIMAL(5, 4) DEFAULT 0.20,
  is_stockable BOOLEAN DEFAULT true,  -- false pour services
  track_serial BOOLEAN DEFAULT false, -- Phase 2: numéros de série
  status TEXT CHECK (status IN ('active', 'archived'))
);
```

**Exemples**:
- **PHYSICAL**: Ordinateur Dell, iPhone 15, Câble HDMI
- **DIGITAL**: Licence Office 365, Abonnement Netflix, Clé Windows
- **SERVICE**: Installation, Formation, Maintenance (is_stockable = false)

### 2. `stock_warehouses` - Entrepôts/Boutiques

```sql
CREATE TABLE stock_warehouses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('STORE', 'WAREHOUSE', 'MOBILE', 'OTHER')),
  address TEXT,
  city TEXT,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  manager_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true
);
```

**Types**:
- **STORE**: Boutique de vente (Dakar Centre, Sandaga...)
- **WAREHOUSE**: Entrepôt central (stockage)
- **MOBILE**: Vendeur mobile/ambulant (Phase 2)
- **OTHER**: Autre type

### 3. `stock_movements` - Mouvements (💎 CŒUR)

```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES stock_products(id),
  movement_type TEXT CHECK (type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
  quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
  warehouse_from_id UUID, -- NULL pour IN
  warehouse_to_id UUID,   -- NULL pour OUT
  reason TEXT NOT NULL,
  reference_type TEXT,    -- 'SALE', 'PURCHASE', 'RETURN', 'MANUAL'...
  reference_id UUID,      -- ID vente/achat/etc.
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Types de mouvements**:

| Type       | Description                    | warehouse_from | warehouse_to | Exemple                      |
|------------|--------------------------------|----------------|--------------|------------------------------|
| IN         | Entrée de stock                | NULL           | Required     | Achat fournisseur            |
| OUT        | Sortie de stock                | Required       | NULL         | Vente client                 |
| TRANSFER   | Transfert inter-entrepôts      | Required       | Required     | Boutique A → Boutique B      |
| ADJUSTMENT | Ajustement manuel (inventaire) | NULL/Optional  | Required     | Correction inventaire, casse |

### 4. `stock_digital_assets` - Licences/Codes

```sql
CREATE TABLE stock_digital_assets (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES stock_products(id),
  code_or_license TEXT NOT NULL,
  status TEXT CHECK (status IN ('AVAILABLE', 'USED', 'EXPIRED', 'REVOKED')),
  assigned_to_customer TEXT,
  assigned_at TIMESTAMP,
  order_id UUID,
  expires_at TIMESTAMP
);
```

**Exemple**: Pool de licences Office 365
```sql
-- Ajouter 10 licences
INSERT INTO stock_digital_assets (product_id, code_or_license, expires_at)
VALUES
  ('prod-123', 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', '2025-12-31'),
  ('prod-123', 'YYYYY-YYYYY-YYYYY-YYYYY-YYYYY', '2025-12-31');
  -- ... x10

-- Lors d'une vente, trigger auto-assignment marque 1 licence comme USED
```

---

## 🔍 Vues et fonctions

### Vue: `stock_levels`

Calcule le stock actuel par produit et entrepôt:

```sql
SELECT * FROM stock_levels
WHERE user_id = auth.uid()
  AND warehouse_id = 'xxx';
```

**Retour**:
```
product_id | product_name | warehouse_id | warehouse_name | current_quantity | average_cost
-----------|--------------|--------------|----------------|------------------|-------------
uuid-1     | iPhone 15    | uuid-w1      | Boutique Dakar | 25               | 850.00
uuid-2     | Dell XPS 15  | uuid-w2      | Entrepôt Thiès | 10               | 1200.00
```

### Fonction: `get_stock_quantity(product_id, warehouse_id)`

```sql
-- Stock total tous entrepôts
SELECT get_stock_quantity('product-uuid', NULL);
→ 35

-- Stock dans un entrepôt spécifique
SELECT get_stock_quantity('product-uuid', 'warehouse-uuid');
→ 25
```

### Fonction: `check_stock_available(product_id, warehouse_id, quantity)`

```sql
-- Vérifier avant vente
SELECT check_stock_available('product-uuid', 'warehouse-uuid', 10);
→ true/false
```

---

## 💻 Utilisation du hook

### Import

```typescript
import { useStock } from '@/hooks/useStock';
```

### Exemple complet

```typescript
function MyStockComponent() {
  const {
    products,
    warehouses,
    movements,
    digitalAssets,
    stockLevels,
  } = useStock();

  // 1. Créer un produit
  const handleCreateProduct = async () => {
    await products.createProduct({
      name: 'iPhone 15 Pro',
      type: 'PHYSICAL',
      category: 'Téléphones',
      sku: 'IPH-15-PRO',
      price: 1200,
      cost_price: 850,
      is_stockable: true,
    });
  };

  // 2. Créer une entrée de stock (achat fournisseur)
  const handlePurchase = async () => {
    await movements.createMovement({
      product_id: 'product-uuid',
      movement_type: 'IN',
      quantity: 50,
      warehouse_to_id: 'warehouse-uuid',
      reason: 'Achat fournisseur XYZ',
      reference_type: 'PURCHASE',
      reference_number: 'PO-2025-001',
      unit_cost: 850,
    });
  };

  // 3. Vendre un produit (sortie automatique)
  const handleSale = async () => {
    // Vérifier stock d'abord
    const available = await stockLevels.checkStockAvailable(
      'product-uuid',
      'warehouse-uuid',
      1
    );

    if (available) {
      await movements.createMovement({
        product_id: 'product-uuid',
        movement_type: 'OUT',
        quantity: 1,
        warehouse_from_id: 'warehouse-uuid',
        reason: 'Vente client',
        reference_type: 'SALE',
        reference_id: 'sale-uuid',
      });
    }
  };

  // 4. Transférer entre boutiques
  const handleTransfer = async () => {
    await movements.createMovement({
      product_id: 'product-uuid',
      movement_type: 'TRANSFER',
      quantity: 10,
      warehouse_from_id: 'warehouse-source-uuid',
      warehouse_to_id: 'warehouse-dest-uuid',
      reason: 'Réapprovisionnement boutique',
      reference_type: 'MANUAL',
    });
  };

  // 5. Consulter stock actuel
  const currentStock = await stockLevels.getProductStock(
    'product-uuid',
    'warehouse-uuid'
  );
  console.log(`Stock actuel: ${currentStock} unités`);
}
```

---

## 🎨 Pages UI

### 1. `/stock/produits` - Gestion produits

- Liste produits (PHYSICAL/DIGITAL/SERVICE)
- CRUD complet
- Filtres: type, catégorie, statut
- Affichage SKU, code-barres, prix, marge

### 2. `/stock/entrepots` - Gestion entrepôts

- Liste entrepôts/boutiques
- Types: STORE, WAREHOUSE, MOBILE, OTHER
- Localisation GPS
- Contact (responsable, téléphone, email)

### 3. `/stock/mouvements` - Historique mouvements

- Tous les mouvements (IN/OUT/TRANSFER/ADJUSTMENT)
- Filtres: type, date, produit, entrepôt
- Création nouveaux mouvements
- Audit trail complet

### 4. `/stock/transferts` - Transferts inter-entrepôts

- Interface simplifiée pour TRANSFER
- Vérification stock disponible en temps réel
- Sélection source → destination
- Validation avant création

### 5. `/stock/alertes` - Alertes stock

- Ruptures de stock (quantity = 0)
- Stock bas (quantity ≤ seuil)
- Par produit et entrepôt
- Actions rapides (créer entrée)

---

## 📚 Cas d'usage

### Cas 1: Achat fournisseur

```typescript
// 1. Réception marchandise (50 iPhones)
await movements.createMovement({
  product_id: 'iphone-15',
  movement_type: 'IN',
  quantity: 50,
  warehouse_to_id: 'entrepot-central',
  reason: 'Achat fournisseur Apple',
  reference_type: 'PURCHASE',
  reference_number: 'PO-2025-123',
  unit_cost: 850,
});

// Stock après: 50 unités à l'entrepôt central
```

### Cas 2: Transfert boutique

```typescript
// Transférer 10 iPhones vers boutique Dakar
await movements.createMovement({
  product_id: 'iphone-15',
  movement_type: 'TRANSFER',
  quantity: 10,
  warehouse_from_id: 'entrepot-central',
  warehouse_to_id: 'boutique-dakar',
  reason: 'Réapprovisionnement boutique',
  reference_type: 'MANUAL',
});

// Stock après:
// - Entrepôt central: 40
// - Boutique Dakar: 10
```

### Cas 3: Vente client

```typescript
// Vente 1 iPhone depuis boutique
await movements.createMovement({
  product_id: 'iphone-15',
  movement_type: 'OUT',
  quantity: 1,
  warehouse_from_id: 'boutique-dakar',
  reason: 'Vente client',
  reference_type: 'SALE',
  reference_id: 'vente-uuid-456',
});

// Stock après:
// - Entrepôt central: 40
// - Boutique Dakar: 9
```

### Cas 4: Produit digital (licence)

```typescript
// 1. Créer produit digital
await products.createProduct({
  name: 'Licence Office 365',
  type: 'DIGITAL',
  price: 99,
  is_stockable: false, // Pas de stock physique
});

// 2. Ajouter 5 licences au pool
for (let i = 0; i < 5; i++) {
  await digitalAssets.createAsset({
    product_id: 'office-365',
    code_or_license: generateLicenseKey(),
    expires_at: new Date('2025-12-31'),
  });
}

// 3. Lors d'une vente, trigger auto-assignment
// attribue automatiquement 1 licence AVAILABLE → USED
```

### Cas 5: Inventaire (ajustement)

```typescript
// Inventaire physique révèle 48 unités au lieu de 50
await movements.createMovement({
  product_id: 'iphone-15',
  movement_type: 'ADJUSTMENT',
  quantity: -2, // Correction négative
  warehouse_to_id: 'entrepot-central',
  reason: 'Inventaire annuel - casse détectée',
  reference_type: 'MANUAL',
  notes: '2 unités endommagées lors transport',
});

// Stock après: 48 unités
```

---

## ✅ Best Practices

### 1. Toujours vérifier le stock avant vente

```typescript
❌ MAUVAIS:
await createSale();
await movements.createMovement({ movement_type: 'OUT' });

✅ BON:
const available = await stockLevels.checkStockAvailable(productId, warehouseId, qty);
if (available) {
  await createSale();
  await movements.createMovement({ movement_type: 'OUT' });
} else {
  throw new Error('Stock insuffisant');
}
```

### 2. Utiliser reference_type et reference_id

```typescript
✅ BON: Lien avec vente
await movements.createMovement({
  movement_type: 'OUT',
  reference_type: 'SALE',
  reference_id: saleId,  // ← Traçabilité
  reference_number: 'FAC-2025-456',
});

// Permet de retrouver tous mouvements liés à une vente:
SELECT * FROM stock_movements
WHERE reference_type = 'SALE'
  AND reference_id = 'sale-uuid';
```

### 3. Toujours renseigner unit_cost pour IN

```typescript
✅ BON: Permet calcul coût moyen et valorisation stock
await movements.createMovement({
  movement_type: 'IN',
  quantity: 50,
  unit_cost: 850,  // ← Important pour valorisation
  total_cost: 42500, // Auto-calculé: 50 * 850
});
```

### 4. Services → is_stockable = false

```typescript
✅ BON:
await products.createProduct({
  name: 'Installation Windows',
  type: 'SERVICE',
  is_stockable: false,  // ← Pas de mouvements de stock
});
```

### 5. Utiliser ADJUSTMENT avec parcimonie

```typescript
⚠️ ATTENTION: ADJUSTMENT modifie directement le stock
→ À utiliser uniquement pour:
  - Inventaires physiques
  - Corrections d'erreurs
  - Casse/perte

❌ Ne PAS utiliser pour ventes/achats (utiliser IN/OUT)
```

---

## 🔒 Sécurité (RLS)

Toutes les tables ont Row Level Security activé:

```sql
-- Exemple: Les utilisateurs voient uniquement leurs produits
CREATE POLICY "Users can view their own stock products"
  ON stock_products FOR SELECT
  USING (auth.uid() = user_id);
```

**Policies actives**:
- `stock_products`: SELECT, INSERT, UPDATE, DELETE (user_id)
- `stock_warehouses`: SELECT, INSERT, UPDATE, DELETE (user_id)
- `stock_movements`: SELECT, INSERT, UPDATE, DELETE (user_id)
- `stock_digital_assets`: SELECT, INSERT, UPDATE, DELETE (user_id)

---

## 📈 Performance

### Index critiques

```sql
-- Calcul stock par produit/entrepôt (TRÈS IMPORTANT)
CREATE INDEX idx_stock_movements_product_warehouse
  ON stock_movements(product_id, warehouse_to_id, warehouse_from_id);

-- Recherche par type mouvement
CREATE INDEX idx_stock_movements_type
  ON stock_movements(movement_type);

-- Recherche par date
CREATE INDEX idx_stock_movements_created_at
  ON stock_movements(created_at DESC);
```

### Optimisation requêtes

```typescript
// ✅ BON: Filtrer côté DB
const { data } = await supabase
  .from('stock_movements')
  .select('*')
  .eq('movement_type', 'IN')
  .gte('created_at', startDate)
  .limit(100);

// ❌ MAUVAIS: Charger tout puis filtrer en JS
const { data } = await supabase.from('stock_movements').select('*');
const filtered = data.filter(m => m.movement_type === 'IN');
```

---

## 🐛 Troubleshooting

### Erreur: "Stock levels view returns empty"

```sql
-- Vérifier mouvements existants
SELECT COUNT(*) FROM stock_movements WHERE user_id = auth.uid();

-- Si 0: Créer des mouvements de test
-- Si > 0: Vérifier la vue
SELECT * FROM stock_levels WHERE user_id = auth.uid();
```

### Erreur: "Foreign key violation on delete product"

```sql
-- ON DELETE RESTRICT: Impossible de supprimer un produit avec mouvements
-- Solution: Archiver au lieu de supprimer
UPDATE stock_products SET status = 'archived' WHERE id = 'xxx';
```

### Erreur: "RLS policy violation"

```bash
# Vérifier auth
const { data: { user } } = await supabase.auth.getUser();
console.log(user.id); // Doit matcher user_id dans tables
```

---

## 📞 Support

- **Documentation**: `/docs/SUPABASE_STOCK_SETUP.md`
- **Types**: `/src/types/stock.ts`
- **Hook**: `/src/hooks/useStock.tsx`
- **Migration**: `/supabase/migrations/20260106000000_refactor_stock_module.sql`
- **Tests**: `/src/hooks/useStock.test.tsx`

---

## 🗺️ Roadmap (Phase 2)

- [ ] Numéros de série (track_serial)
- [ ] Codes-barres scanning
- [ ] Alertes emails (stock bas)
- [ ] Rapports Excel export
- [ ] Vendeurs mobiles offline (MOBILE warehouses)
- [ ] API publique pour intégrations
- [ ] Gestion lots/expirations (FIFO/FEFO)
- [ ] Réservations stock

---

**Dernière mise à jour**: 06/01/2026
**Version**: 1.0.0 (Module Stock Indépendant)
