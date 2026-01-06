/**
 * Types pour le module Stock (Gestion Inventaire)
 *
 * Module indépendant pour gérer:
 * - Mouvements de stock (IN/OUT/TRANSFER/ADJUSTMENT)
 * - Multi-boutique / Multi-entrepôt
 * - Licences et codes pour produits digitaux
 * - Calcul stock basé sur mouvements (best practice)
 *
 * NOTE: Utilise vente_products comme référentiel unique de produits
 */

import { Product } from './vente';

// ============================================================================
// ENTREPÔTS / BOUTIQUES
// ============================================================================

export type WarehouseType = 'STORE' | 'WAREHOUSE' | 'MOBILE' | 'OTHER';

export interface Warehouse {
  id: string;
  user_id: string;
  name: string;
  type: WarehouseType;
  // Localisation
  address?: string;
  city?: string;
  country?: string;
  gps_lat?: number;
  gps_lng?: number;
  // Contact
  manager_name?: string;
  phone?: string;
  email?: string;
  // Métadonnées
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WarehouseFilters {
  search?: string;
  type?: WarehouseType;
  city?: string;
  is_active?: boolean;
}

export interface CreateWarehouseInput {
  name: string;
  type: WarehouseType;
  address?: string;
  city?: string;
  country?: string;
  gps_lat?: number;
  gps_lng?: number;
  manager_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  is_active?: boolean;
}

// ============================================================================
// MOUVEMENTS DE STOCK
// ============================================================================

export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
export type ReferenceType = 'SALE' | 'PURCHASE' | 'RETURN' | 'MANUAL' | 'LOSS' | 'PRODUCTION';

export interface StockMovement {
  id: string;
  user_id: string;
  product_id: string;
  // Type de mouvement
  movement_type: MovementType;
  // Quantité (toujours positive, le signe est dans movement_type)
  quantity: number;
  // Entrepôts
  warehouse_from_id?: string; // NULL pour IN
  warehouse_to_id?: string; // NULL pour OUT
  // Raison et référence
  reason: string;
  reference_type?: ReferenceType;
  reference_id?: string;
  reference_number?: string;
  // Coût unitaire
  unit_cost?: number;
  total_cost?: number;
  // Métadonnées
  notes?: string;
  created_at: Date;
  created_by?: string;
  created_by_name?: string;
  // Relations (chargées avec join)
  product?: Product; // Référence vente_products
  warehouse_from?: Warehouse;
  warehouse_to?: Warehouse;
}

export interface StockMovementFilters {
  product_id?: string;
  warehouse_id?: string; // Filtre pour warehouse_from OU warehouse_to
  movement_type?: MovementType;
  reference_type?: ReferenceType;
  date_from?: Date;
  date_to?: Date;
}

export interface CreateStockMovementInput {
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  warehouse_from_id?: string;
  warehouse_to_id?: string;
  reason: string;
  reference_type?: ReferenceType;
  reference_id?: string;
  reference_number?: string;
  unit_cost?: number;
  notes?: string;
}

// ============================================================================
// DIGITAL ASSETS (Licences, codes, clés)
// ============================================================================

export type DigitalAssetStatus = 'AVAILABLE' | 'USED' | 'EXPIRED' | 'REVOKED';

export interface DigitalAsset {
  id: string;
  user_id: string;
  product_id: string;
  // Licence/Code
  code_or_license: string;
  activation_key?: string;
  // Statut
  status: DigitalAssetStatus;
  // Attribution
  assigned_to_customer?: string;
  assigned_at?: Date;
  order_id?: string;
  // Validité
  expires_at?: Date;
  // Métadonnées
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Relations
  product?: Product; // Référence vente_products
}

export interface DigitalAssetFilters {
  product_id?: string;
  status?: DigitalAssetStatus;
  assigned_to_customer?: string;
}

export interface CreateDigitalAssetInput {
  product_id: string;
  code_or_license: string;
  activation_key?: string;
  expires_at?: Date;
  notes?: string;
}

// ============================================================================
// STOCK LEVELS (Vue calculée)
// ============================================================================

export interface StockLevel {
  user_id: string;
  product_id: string;
  product_name: string;
  product_type: 'product' | 'service'; // De vente_products.type
  category?: string;
  sku?: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_city?: string;
  current_quantity: number;
  average_cost?: number;
  last_movement_at?: Date;
}

export interface StockLevelFilters {
  product_id?: string;
  warehouse_id?: string;
  min_quantity?: number;
  max_quantity?: number;
  product_type?: 'product' | 'service';
}

// ============================================================================
// STATISTIQUES
// ============================================================================

export interface StockStats {
  total_products: number;
  total_warehouses: number;
  total_movements_today: number;
  total_movements_month: number;
  products_low_stock: number;
  products_out_of_stock: number;
  total_stock_value: number;
}

export interface WarehouseStats {
  warehouse_id: string;
  warehouse_name: string;
  total_products: number;
  total_quantity: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface ProductStockSummary {
  product_id: string;
  product_name: string;
  product_type: 'product' | 'service';
  sku?: string;
  total_quantity: number; // Total tous entrepôts
  warehouses: {
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
  }[];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vérifie si un produit est stockable (type 'product')
 * Les services ne sont pas gérés en stock
 */
export const isProductStockable = (product: Product): boolean => {
  return product.type === 'product';
};

/**
 * Vérifie si un produit est un service digital
 * (dans vente_products, les produits digitaux sont type='service')
 */
export const isProductDigital = (product: Product): boolean => {
  // Dans notre cas, un produit digital est un service avec des assets
  return product.type === 'service';
};

export const getMovementSign = (movementType: MovementType): number => {
  switch (movementType) {
    case 'IN':
    case 'ADJUSTMENT':
      return 1;
    case 'OUT':
      return -1;
    case 'TRANSFER':
      return 0; // Dépend de warehouse_from/to
    default:
      return 0;
  }
};

export const calculateStockValue = (quantity: number, averageCost?: number): number => {
  if (!averageCost) return 0;
  return quantity * averageCost;
};

export const isLowStock = (currentQuantity: number, minQuantity: number): boolean => {
  return currentQuantity > 0 && currentQuantity <= minQuantity;
};

export const isOutOfStock = (currentQuantity: number): boolean => {
  return currentQuantity <= 0;
};

export const getStockStatus = (
  currentQuantity: number,
  minQuantity: number = 0
): 'out' | 'low' | 'ok' => {
  if (currentQuantity <= 0) return 'out';
  if (currentQuantity <= minQuantity) return 'low';
  return 'ok';
};

export const getProductTypeLabel = (type: 'product' | 'service'): string => {
  switch (type) {
    case 'product':
      return 'Produit';
    case 'service':
      return 'Service';
    default:
      return type;
  }
};

export const getWarehouseTypeLabel = (type: WarehouseType): string => {
  switch (type) {
    case 'STORE':
      return 'Boutique';
    case 'WAREHOUSE':
      return 'Entrepôt';
    case 'MOBILE':
      return 'Mobile';
    case 'OTHER':
      return 'Autre';
    default:
      return type;
  }
};

export const getMovementTypeLabel = (type: MovementType): string => {
  switch (type) {
    case 'IN':
      return 'Entrée';
    case 'OUT':
      return 'Sortie';
    case 'TRANSFER':
      return 'Transfert';
    case 'ADJUSTMENT':
      return 'Ajustement';
    default:
      return type;
  }
};

export const getMovementTypeColor = (type: MovementType): string => {
  switch (type) {
    case 'IN':
      return 'text-green-600';
    case 'OUT':
      return 'text-red-600';
    case 'TRANSFER':
      return 'text-blue-600';
    case 'ADJUSTMENT':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
};

// ============================================================================
// CONSTANTES
// ============================================================================

export const WAREHOUSE_TYPES: WarehouseType[] = ['STORE', 'WAREHOUSE', 'MOBILE', 'OTHER'];

export const MOVEMENT_TYPES: MovementType[] = ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'];

export const REFERENCE_TYPES: ReferenceType[] = [
  'SALE',
  'PURCHASE',
  'RETURN',
  'MANUAL',
  'LOSS',
  'PRODUCTION',
];

export const DIGITAL_ASSET_STATUSES: DigitalAssetStatus[] = [
  'AVAILABLE',
  'USED',
  'EXPIRED',
  'REVOKED',
];

export const DEFAULT_TAX_RATE = 0.2; // 20% TVA

export const DEFAULT_MIN_STOCK_QUANTITY = 10; // Seuil alerte stock bas par défaut
