/**
 * Types pour la gestion d'inventaire
 */

export type InventoryStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export type AdjustmentType = 'increase' | 'decrease' | 'correction';

export type AdjustmentReason =
  | 'damaged' // Produit endommagé
  | 'lost' // Produit perdu
  | 'found' // Produit retrouvé
  | 'error' // Erreur de saisie
  | 'theft' // Vol
  | 'expired' // Périmé
  | 'return_supplier' // Retour fournisseur
  | 'other'; // Autre raison

export interface StockInventory {
  id: string;
  user_id: string;
  warehouse_id: string;
  inventory_number: string;
  inventory_date: string;
  status: InventoryStatus;
  counted_by?: string;
  notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  warehouse?: any; // From stock_warehouses
  items?: StockInventoryItem[];
}

export interface StockInventoryItem {
  id: string;
  inventory_id: string;
  product_id: string;
  expected_quantity: number;
  counted_quantity?: number;
  difference?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  product?: any; // From vente_products
}

export interface StockAdjustment {
  id: string;
  user_id: string;
  warehouse_id: string;
  product_id: string;
  adjustment_type: AdjustmentType;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  reason: AdjustmentReason;
  cost_impact?: number;
  notes?: string;
  performed_by: string;
  performed_at: string;
  created_at: string;
  // Relations
  warehouse?: any; // From stock_warehouses
  product?: any; // From vente_products
}

// Helper functions
export function getInventoryStatusLabel(status: InventoryStatus): string {
  const labels: Record<InventoryStatus, string> = {
    draft: 'Brouillon',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };
  return labels[status];
}

export function getInventoryStatusColor(status: InventoryStatus): string {
  const colors: Record<InventoryStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getAdjustmentReasonLabel(reason: AdjustmentReason): string {
  const labels: Record<AdjustmentReason, string> = {
    damaged: 'Produit endommagé',
    lost: 'Produit perdu',
    found: 'Produit retrouvé',
    error: 'Erreur de saisie',
    theft: 'Vol',
    expired: 'Périmé',
    return_supplier: 'Retour fournisseur',
    other: 'Autre',
  };
  return labels[reason];
}

export function getAdjustmentTypeLabel(type: AdjustmentType): string {
  const labels: Record<AdjustmentType, string> = {
    increase: 'Augmentation',
    decrease: 'Diminution',
    correction: 'Correction',
  };
  return labels[type];
}

export function getAdjustmentTypeColor(type: AdjustmentType): string {
  const colors: Record<AdjustmentType, string> = {
    increase: 'bg-green-100 text-green-800',
    decrease: 'bg-red-100 text-red-800',
    correction: 'bg-orange-100 text-orange-800',
  };
  return colors[type];
}
