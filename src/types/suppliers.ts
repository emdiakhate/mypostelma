/**
 * Types pour la gestion des fournisseurs
 */

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  tax_number?: string;
  payment_terms?: string; // Ex: "Net 30", "Net 60", "Paiement à la livraison"
  bank_account?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductSupplier {
  id: string;
  user_id: string;
  product_id: string;
  supplier_id: string;
  supplier_sku?: string;
  purchase_price?: number;
  lead_time_days?: number;
  min_order_quantity: number;
  is_preferred: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  supplier?: Supplier;
  product?: any; // From vente_products
}

export type PurchaseOrderStatus =
  | 'draft'           // Brouillon
  | 'sent'            // Envoyée au fournisseur
  | 'confirmed'       // Confirmée par le fournisseur
  | 'partially_received' // Partiellement reçue
  | 'received'        // Complètement reçue
  | 'cancelled';      // Annulée

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface PurchaseOrder {
  id: string;
  user_id: string;
  supplier_id: string;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  warehouse_id?: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  shipping_cost: number;
  total: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  supplier?: Supplier;
  warehouse?: any; // From stock_warehouses
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  subtotal: number;
  total: number;
  quantity_received: number;
  created_at: string;
  // Relations
  product?: any; // From vente_products
}

// Helper functions
export function getPurchaseOrderStatusLabel(status: PurchaseOrderStatus): string {
  const labels: Record<PurchaseOrderStatus, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    confirmed: 'Confirmée',
    partially_received: 'Partiellement reçue',
    received: 'Reçue',
    cancelled: 'Annulée',
  };
  return labels[status];
}

export function getPurchaseOrderStatusColor(status: PurchaseOrderStatus): string {
  const colors: Record<PurchaseOrderStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-purple-100 text-purple-800',
    partially_received: 'bg-yellow-100 text-yellow-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    unpaid: 'Non payé',
    partial: 'Paiement partiel',
    paid: 'Payé',
  };
  return labels[status];
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
  };
  return colors[status];
}
