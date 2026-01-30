/**
 * TEST 2: Cycle Vente avec Stock
 * Stock → Vente → Compta
 * 
 * Scénario: Produit en stock → ajouté au panier → commande validée 
 *           → stock décrémenté → facture créée
 * 
 * Modules testés: Stock, Vente, Compta
 */

import { describe, it, expect, beforeAll } from 'vitest';

// ============================================================================
// TYPES SIMULÉS (basés sur le schéma réel)
// ============================================================================

interface Product {
  id: string;
  user_id: string;
  name: string;
  sku: string;
  price: number;
  cost_price?: number;
  category?: string;
  stock_quantity: number;
  min_stock_alert?: number;
  is_active: boolean;
  created_at: Date;
}

interface Warehouse {
  id: string;
  user_id: string;
  name: string;
  address?: string;
  is_default: boolean;
  created_at: Date;
}

interface StockMovement {
  id: string;
  user_id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  reference?: string;
  notes?: string;
  created_at: Date;
}

interface Order {
  id: string;
  user_id: string;
  number: string;
  lead_id?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid';
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: Date;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  order_id?: string;
  client_id?: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  created_at: Date;
}

// ============================================================================
// FONCTIONS MÉTIER SIMULÉES
// ============================================================================

const generateId = () => crypto.randomUUID();
const TEST_USER_ID = generateId();

// Base de données simulée
let products: Product[] = [];
let warehouses: Warehouse[] = [];
let stockMovements: StockMovement[] = [];
let orders: Order[] = [];
let orderItems: OrderItem[] = [];
let invoices: Invoice[] = [];

// Calculer le stock actuel d'un produit dans un entrepôt
const getStockQuantity = (productId: string, warehouseId?: string): number => {
  return stockMovements
    .filter(m => m.product_id === productId && (!warehouseId || m.warehouse_id === warehouseId))
    .reduce((total, m) => {
      if (m.movement_type === 'IN') return total + m.quantity;
      if (m.movement_type === 'OUT') return total - m.quantity;
      if (m.movement_type === 'ADJUSTMENT') return total + m.quantity;
      return total;
    }, 0);
};

// Vérifier disponibilité stock
const checkStockAvailable = (productId: string, warehouseId: string, quantity: number): boolean => {
  const currentStock = getStockQuantity(productId, warehouseId);
  return currentStock >= quantity;
};

// Créer un produit
const createProduct = (data: Partial<Product>): Product => {
  const product: Product = {
    id: generateId(),
    user_id: TEST_USER_ID,
    name: data.name || 'Produit Test',
    sku: data.sku || `SKU-${Date.now()}`,
    price: data.price || 10000,
    cost_price: data.cost_price || 5000,
    category: data.category,
    stock_quantity: 0,
    min_stock_alert: data.min_stock_alert || 5,
    is_active: true,
    created_at: new Date(),
  };
  products.push(product);
  return product;
};

// Créer un entrepôt
const createWarehouse = (data: Partial<Warehouse>): Warehouse => {
  const warehouse: Warehouse = {
    id: generateId(),
    user_id: TEST_USER_ID,
    name: data.name || 'Entrepôt Principal',
    address: data.address,
    is_default: data.is_default || false,
    created_at: new Date(),
  };
  warehouses.push(warehouse);
  return warehouse;
};

// Créer un mouvement de stock
const createStockMovement = (data: {
  product_id: string;
  warehouse_id: string;
  movement_type: StockMovement['movement_type'];
  quantity: number;
  reference?: string;
  notes?: string;
}): StockMovement => {
  const movement: StockMovement = {
    id: generateId(),
    user_id: TEST_USER_ID,
    product_id: data.product_id,
    warehouse_id: data.warehouse_id,
    movement_type: data.movement_type,
    quantity: data.quantity,
    reference: data.reference,
    notes: data.notes,
    created_at: new Date(),
  };
  stockMovements.push(movement);
  
  // Mettre à jour la quantité sur le produit
  const product = products.find(p => p.id === data.product_id);
  if (product) {
    product.stock_quantity = getStockQuantity(data.product_id);
  }
  
  return movement;
};

// Créer une commande
const createOrder = (data: {
  lead_id?: string;
  items: { product_id: string; quantity: number }[];
  warehouse_id: string;
}): { order: Order; items: OrderItem[]; stockMovements: StockMovement[] } | { error: string } => {
  // Vérifier disponibilité stock pour tous les articles
  for (const item of data.items) {
    if (!checkStockAvailable(item.product_id, data.warehouse_id, item.quantity)) {
      const product = products.find(p => p.id === item.product_id);
      const currentStock = getStockQuantity(item.product_id, data.warehouse_id);
      return { 
        error: `Stock insuffisant pour ${product?.name}: ${currentStock} disponible, ${item.quantity} demandé` 
      };
    }
  }

  // Créer la commande
  const orderNumber = `CMD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;
  let subtotal = 0;
  const createdItems: OrderItem[] = [];
  const createdMovements: StockMovement[] = [];

  for (const item of data.items) {
    const product = products.find(p => p.id === item.product_id);
    if (!product) continue;

    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;

    const orderItem: OrderItem = {
      id: generateId(),
      order_id: '', // Sera mis à jour après
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: product.price,
      total: lineTotal,
    };
    createdItems.push(orderItem);

    // Créer mouvement de sortie stock
    const movement = createStockMovement({
      product_id: item.product_id,
      warehouse_id: data.warehouse_id,
      movement_type: 'OUT',
      quantity: item.quantity,
      reference: orderNumber,
      notes: `Sortie pour commande ${orderNumber}`,
    });
    createdMovements.push(movement);
  }

  const taxRate = 18;
  const taxAmount = Math.round(subtotal * taxRate / 100);
  const total = subtotal + taxAmount;

  const order: Order = {
    id: generateId(),
    user_id: TEST_USER_ID,
    number: orderNumber,
    lead_id: data.lead_id,
    status: 'confirmed',
    payment_status: 'pending',
    subtotal,
    tax_amount: taxAmount,
    total,
    created_at: new Date(),
  };

  // Mettre à jour order_id sur les items
  createdItems.forEach(item => {
    item.order_id = order.id;
    orderItems.push(item);
  });

  orders.push(order);

  return { order, items: createdItems, stockMovements: createdMovements };
};

// Créer une facture depuis une commande
const createInvoiceFromOrder = (orderId: string): Invoice | { error: string } => {
  const order = orders.find(o => o.id === orderId);
  if (!order) return { error: 'Commande non trouvée' };

  const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;

  const invoice: Invoice = {
    id: generateId(),
    user_id: TEST_USER_ID,
    invoice_number: invoiceNumber,
    order_id: orderId,
    client_id: order.lead_id,
    status: 'sent',
    subtotal: order.subtotal,
    tax_rate: 18,
    tax_amount: order.tax_amount,
    total: order.total,
    amount_paid: 0,
    balance_due: order.total,
    created_at: new Date(),
  };

  invoices.push(invoice);
  return invoice;
};

// Vérifier alerte stock bas
const checkLowStockAlert = (productId: string): { isLow: boolean; current: number; threshold: number } => {
  const product = products.find(p => p.id === productId);
  if (!product) return { isLow: false, current: 0, threshold: 0 };
  
  const currentStock = getStockQuantity(productId);
  return {
    isLow: currentStock <= (product.min_stock_alert || 0),
    current: currentStock,
    threshold: product.min_stock_alert || 0,
  };
};

// Reset pour chaque test
const resetDatabase = () => {
  products = [];
  warehouses = [];
  stockMovements = [];
  orders = [];
  orderItems = [];
  invoices = [];
};

// ============================================================================
// TESTS D'INTÉGRATION
// ============================================================================

describe('TEST 2: Cycle Vente avec Stock', () => {
  beforeAll(() => {
    resetDatabase();
  });

  describe('Étape 1: Configuration Stock Initial', () => {
    let testProduct: Product;
    let testWarehouse: Warehouse;

    it('2.1.1 Créer un entrepôt', () => {
      testWarehouse = createWarehouse({
        name: 'Entrepôt Dakar',
        address: 'Zone Industrielle, Dakar',
        is_default: true,
      });

      expect(testWarehouse).toBeDefined();
      expect(testWarehouse.id).toBeDefined();
      expect(testWarehouse.name).toBe('Entrepôt Dakar');
      expect(testWarehouse.is_default).toBe(true);
    });

    it('2.1.2 Créer un produit', () => {
      testProduct = createProduct({
        name: 'Smartphone Galaxy S24',
        sku: 'PHONE-S24-001',
        price: 450000, // 450,000 FCFA
        cost_price: 350000,
        category: 'Électronique',
        min_stock_alert: 10,
      });

      expect(testProduct).toBeDefined();
      expect(testProduct.sku).toBe('PHONE-S24-001');
      expect(testProduct.price).toBe(450000);
      expect(testProduct.stock_quantity).toBe(0);
    });

    it('2.1.3 Entrée stock initiale', () => {
      const warehouse = warehouses[0];
      const product = products[0];

      const movement = createStockMovement({
        product_id: product.id,
        warehouse_id: warehouse.id,
        movement_type: 'IN',
        quantity: 50,
        reference: 'INIT-001',
        notes: 'Stock initial',
      });

      expect(movement).toBeDefined();
      expect(movement.movement_type).toBe('IN');
      expect(movement.quantity).toBe(50);

      // Vérifier que le stock est mis à jour
      const currentStock = getStockQuantity(product.id, warehouse.id);
      expect(currentStock).toBe(50);
    });

    it('2.1.4 Vérifier disponibilité stock', () => {
      const warehouse = warehouses[0];
      const product = products[0];

      // Devrait être disponible
      expect(checkStockAvailable(product.id, warehouse.id, 30)).toBe(true);
      expect(checkStockAvailable(product.id, warehouse.id, 50)).toBe(true);

      // Ne devrait PAS être disponible
      expect(checkStockAvailable(product.id, warehouse.id, 51)).toBe(false);
      expect(checkStockAvailable(product.id, warehouse.id, 100)).toBe(false);
    });
  });

  describe('Étape 2: Création Commande avec Vérification Stock', () => {
    it('2.2.1 Commande valide - stock suffisant', () => {
      const warehouse = warehouses[0];
      const product = products[0];

      const result = createOrder({
        items: [{ product_id: product.id, quantity: 5 }],
        warehouse_id: warehouse.id,
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.order).toBeDefined();
        expect(result.order.number).toContain('CMD-');
        expect(result.order.status).toBe('confirmed');
        expect(result.order.total).toBe(450000 * 5 * 1.18); // Prix * Qté * (1 + TVA)
        expect(result.items.length).toBe(1);
        expect(result.stockMovements.length).toBe(1);
        expect(result.stockMovements[0].movement_type).toBe('OUT');
      }
    });

    it('2.2.2 Stock décrémenté après commande', () => {
      const warehouse = warehouses[0];
      const product = products[0];

      const currentStock = getStockQuantity(product.id, warehouse.id);
      // 50 initial - 5 vendus = 45
      expect(currentStock).toBe(45);
    });

    it('2.2.3 Mouvement OUT créé avec référence commande', () => {
      const outMovements = stockMovements.filter(m => m.movement_type === 'OUT');
      expect(outMovements.length).toBe(1);
      expect(outMovements[0].reference).toContain('CMD-');
      expect(outMovements[0].quantity).toBe(5);
    });

    it('2.2.4 Commande refusée - stock insuffisant', () => {
      const warehouse = warehouses[0];
      const product = products[0];

      const result = createOrder({
        items: [{ product_id: product.id, quantity: 100 }], // Plus que le stock disponible
        warehouse_id: warehouse.id,
      });

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Stock insuffisant');
      }
    });

    it('2.2.5 Stock inchangé après commande refusée', () => {
      const warehouse = warehouses[0];
      const product = products[0];

      const currentStock = getStockQuantity(product.id, warehouse.id);
      // Toujours 45 (pas de changement après erreur)
      expect(currentStock).toBe(45);
    });
  });

  describe('Étape 3: Génération Facture depuis Commande', () => {
    it('2.3.1 Créer facture depuis commande existante', () => {
      const order = orders[0];
      const result = createInvoiceFromOrder(order.id);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.invoice_number).toContain('FAC-');
        expect(result.order_id).toBe(order.id);
        expect(result.total).toBe(order.total);
        expect(result.status).toBe('sent');
        expect(result.balance_due).toBe(order.total);
      }
    });

    it('2.3.2 Facture liée à la commande via order_id', () => {
      const order = orders[0];
      const invoice = invoices.find(i => i.order_id === order.id);

      expect(invoice).toBeDefined();
      expect(invoice?.order_id).toBe(order.id);
      expect(invoice?.client_id).toBe(order.lead_id);
    });

    it('2.3.3 Montants facture correspondent à la commande', () => {
      const order = orders[0];
      const invoice = invoices.find(i => i.order_id === order.id);

      expect(invoice?.subtotal).toBe(order.subtotal);
      expect(invoice?.tax_amount).toBe(order.tax_amount);
      expect(invoice?.total).toBe(order.total);
    });
  });

  describe('Étape 4: Alertes Stock Bas', () => {
    it('2.4.1 Pas d\'alerte si stock > seuil', () => {
      const product = products[0];
      const alert = checkLowStockAlert(product.id);

      expect(alert.isLow).toBe(false);
      expect(alert.current).toBe(45); // Stock actuel
      expect(alert.threshold).toBe(10); // Seuil configuré
    });

    it('2.4.2 Créer commandes jusqu\'à stock bas', () => {
      const warehouse = warehouses[0];
      const product = products[0];

      // Vendre 35 unités pour atteindre 10 (seuil)
      const result = createOrder({
        items: [{ product_id: product.id, quantity: 35 }],
        warehouse_id: warehouse.id,
      });

      expect('error' in result).toBe(false);

      const currentStock = getStockQuantity(product.id, warehouse.id);
      expect(currentStock).toBe(10); // 45 - 35 = 10
    });

    it('2.4.3 Alerte déclenchée au seuil', () => {
      const product = products[0];
      const alert = checkLowStockAlert(product.id);

      expect(alert.isLow).toBe(true);
      expect(alert.current).toBe(10);
      expect(alert.threshold).toBe(10);
    });
  });

  describe('Étape 5: Commande Multi-Produits', () => {
    let product2: Product;

    it('2.5.1 Créer second produit avec stock', () => {
      product2 = createProduct({
        name: 'Écouteurs Bluetooth',
        sku: 'ACC-BT-001',
        price: 25000,
        cost_price: 15000,
        category: 'Accessoires',
        min_stock_alert: 20,
      });

      const warehouse = warehouses[0];
      createStockMovement({
        product_id: product2.id,
        warehouse_id: warehouse.id,
        movement_type: 'IN',
        quantity: 100,
        reference: 'INIT-002',
      });

      expect(getStockQuantity(product2.id, warehouse.id)).toBe(100);
    });

    it('2.5.2 Commande avec plusieurs produits', () => {
      const warehouse = warehouses[0];
      const product1 = products[0];

      const result = createOrder({
        items: [
          { product_id: product1.id, quantity: 2 },
          { product_id: product2.id, quantity: 3 },
        ],
        warehouse_id: warehouse.id,
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.items.length).toBe(2);
        expect(result.stockMovements.length).toBe(2);
        
        // Calcul: (450000 * 2) + (25000 * 3) = 900000 + 75000 = 975000
        // Total avec TVA: 975000 * 1.18 = 1,150,500
        expect(result.order.subtotal).toBe(975000);
        expect(result.order.total).toBe(1150500);
      }
    });

    it('2.5.3 Stocks décrémentés pour tous les produits', () => {
      const warehouse = warehouses[0];
      const product1 = products[0];

      // Produit 1: 10 - 2 = 8
      expect(getStockQuantity(product1.id, warehouse.id)).toBe(8);
      
      // Produit 2: 100 - 3 = 97
      expect(getStockQuantity(product2.id, warehouse.id)).toBe(97);
    });
  });

  describe('Étape 6: Traçabilité Complète', () => {
    it('2.6.1 Historique mouvements par produit', () => {
      const product1 = products[0];
      const movements = stockMovements.filter(m => m.product_id === product1.id);

      // 1 entrée initiale + 3 sorties (5 + 35 + 2)
      expect(movements.length).toBe(4);
      
      const inMovements = movements.filter(m => m.movement_type === 'IN');
      const outMovements = movements.filter(m => m.movement_type === 'OUT');
      
      expect(inMovements.length).toBe(1);
      expect(outMovements.length).toBe(3);
    });

    it('2.6.2 Total entrées vs sorties', () => {
      const product1 = products[0];
      const movements = stockMovements.filter(m => m.product_id === product1.id);

      const totalIn = movements
        .filter(m => m.movement_type === 'IN')
        .reduce((sum, m) => sum + m.quantity, 0);

      const totalOut = movements
        .filter(m => m.movement_type === 'OUT')
        .reduce((sum, m) => sum + m.quantity, 0);

      expect(totalIn).toBe(50); // Stock initial
      expect(totalOut).toBe(42); // 5 + 35 + 2
      expect(totalIn - totalOut).toBe(8); // Stock actuel
    });

    it('2.6.3 Chaque commande a sa facture associée', () => {
      // On a 3 commandes valides
      expect(orders.length).toBe(3);
      
      // Créer les factures manquantes
      orders.forEach(order => {
        const existingInvoice = invoices.find(i => i.order_id === order.id);
        if (!existingInvoice) {
          createInvoiceFromOrder(order.id);
        }
      });

      // Maintenant chaque commande a sa facture
      expect(invoices.length).toBe(3);
      
      orders.forEach(order => {
        const invoice = invoices.find(i => i.order_id === order.id);
        expect(invoice).toBeDefined();
        expect(invoice?.total).toBe(order.total);
      });
    });
  });

  describe('Résumé Final', () => {
    it('2.7.1 Statistiques globales', () => {
      console.log('\n📊 RÉSUMÉ TEST 2: Cycle Vente avec Stock');
      console.log('═'.repeat(50));
      
      console.log(`\n🏭 Entrepôts: ${warehouses.length}`);
      console.log(`📦 Produits: ${products.length}`);
      console.log(`📋 Mouvements stock: ${stockMovements.length}`);
      console.log(`🛒 Commandes: ${orders.length}`);
      console.log(`📄 Factures: ${invoices.length}`);

      const totalVentes = orders.reduce((sum, o) => sum + o.total, 0);
      console.log(`\n💰 Total ventes: ${totalVentes.toLocaleString()} FCFA`);

      products.forEach(p => {
        const stock = getStockQuantity(p.id);
        const alert = checkLowStockAlert(p.id);
        console.log(`\n📦 ${p.name}:`);
        console.log(`   Stock: ${stock} | Seuil: ${alert.threshold} | Alerte: ${alert.isLow ? '⚠️ OUI' : '✅ Non'}`);
      });

      expect(true).toBe(true);
    });
  });
});
