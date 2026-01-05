/**
 * Types pour le module Vente
 *
 * Définit les interfaces et types pour:
 * - Catalogue produits/services
 * - Devis commerciaux
 * - Commandes clients
 * - Tickets support
 * - Gestion de stock
 */

// ============================================================================
// CATALOGUE PRODUITS/SERVICES
// ============================================================================

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: 'product' | 'service';
  category: string;
  price: number;
  cost?: number;
  stock?: number;
  unit: string;
  sku?: string;
  status: 'active' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface ProductFilters {
  search?: string;
  type?: 'product' | 'service';
  category?: string;
  status?: 'active' | 'archived';
  min_price?: number;
  max_price?: number;
}

// ============================================================================
// DEVIS
// ============================================================================

export interface Quote {
  id: string;
  user_id: string;
  number: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  total_ht: number;
  total_ttc: number;
  tva_rate: number;
  valid_until: Date;
  created_at: Date;
  updated_at: Date;
  sent_at?: Date;
  accepted_at?: Date;
  rejected_at?: Date;
  notes?: string;
  items: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  order_index: number;
}

export interface QuoteFilters {
  search?: string;
  status?: Quote['status'] | Quote['status'][];
  client_name?: string;
  date_from?: Date;
  date_to?: Date;
  min_amount?: number;
  max_amount?: number;
}

export interface CreateQuoteInput {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  valid_until: Date;
  notes?: string;
  items: CreateQuoteItemInput[];
}

export interface CreateQuoteItemInput {
  product_id?: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
}

// ============================================================================
// COMMANDES
// ============================================================================

export interface Order {
  id: string;
  user_id: string;
  number: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  total_ht: number;
  total_ttc: number;
  tva_rate: number;
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
  tracking_number?: string;
  shipping_address?: string;
  notes?: string;
  quote_id?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  order_index: number;
}

export interface OrderFilters {
  search?: string;
  status?: Order['status'] | Order['status'][];
  payment_status?: Order['payment_status'] | Order['payment_status'][];
  client_name?: string;
  date_from?: Date;
  date_to?: Date;
  min_amount?: number;
  max_amount?: number;
}

export interface CreateOrderInput {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  shipping_address?: string;
  notes?: string;
  quote_id?: string;
  items: CreateOrderItemInput[];
}

export interface CreateOrderItemInput {
  product_id?: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
}

// ============================================================================
// SERVICE CLIENT / TICKETS SUPPORT
// ============================================================================

export interface Ticket {
  id: string;
  user_id: string;
  number: string;
  subject: string;
  description: string;
  client_name: string;
  client_email: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assigned_to?: string;
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  closed_at?: Date;
  order_id?: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticket_id: string;
  author: string;
  author_email?: string;
  message: string;
  is_staff: boolean;
  created_at: Date;
  attachments?: string[];
}

export interface TicketFilters {
  search?: string;
  status?: Ticket['status'] | Ticket['status'][];
  priority?: Ticket['priority'] | Ticket['priority'][];
  category?: string;
  assigned_to?: string;
  client_name?: string;
  date_from?: Date;
  date_to?: Date;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  client_name: string;
  client_email: string;
  priority: Ticket['priority'];
  category: string;
  order_id?: string;
}

export interface CreateTicketResponseInput {
  ticket_id: string;
  author: string;
  author_email?: string;
  message: string;
  is_staff: boolean;
}

// ============================================================================
// GESTION DE STOCK
// ============================================================================

export interface StockItem {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  quantity: number;
  min_quantity: number;
  location: string;
  last_restocked_at?: Date;
  created_at: Date;
  updated_at: Date;
  movements: StockMovement[];
}

export interface StockMovement {
  id: string;
  user_id: string;
  stock_item_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  created_at: Date;
  created_by: string;
  order_id?: string;
  reference?: string;
}

export interface StockFilters {
  search?: string;
  location?: string;
  status?: 'all' | 'low' | 'ok' | 'out';
  category?: string;
}

export interface CreateStockMovementInput {
  stock_item_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  order_id?: string;
  reference?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const PRODUCT_CATEGORIES = [
  'Formation',
  'Conseil',
  'Développement',
  'Design',
  'Marketing',
  'Produit Physique',
  'Abonnement',
  'Autre',
] as const;

export const PRODUCT_UNITS = [
  'Unité',
  'Heure',
  'Jour',
  'Mois',
  'Forfait',
  'Licence',
] as const;

export const TICKET_CATEGORIES = [
  'Question produit',
  'Problème technique',
  'Demande de remboursement',
  'Facturation',
  'Livraison',
  'Autre',
] as const;

export const STOCK_LOCATIONS = [
  'Entrepôt A',
  'Entrepôt B',
  'Magasin',
  'Stock de sécurité',
] as const;

export const TVA_RATE = 0.2; // 20%

// ============================================================================
// HELPERS
// ============================================================================

export const calculateTTC = (ht: number, tvaRate: number = TVA_RATE): number => {
  return ht * (1 + tvaRate);
};

export const calculateHT = (ttc: number, tvaRate: number = TVA_RATE): number => {
  return ttc / (1 + tvaRate);
};

export const calculateMargin = (price: number, cost: number): number => {
  if (!cost || cost === 0) return 0;
  return ((price - cost) / price) * 100;
};

export const getStockStatus = (quantity: number, minQuantity: number): 'out' | 'low' | 'ok' => {
  if (quantity === 0) return 'out';
  if (quantity <= minQuantity) return 'low';
  return 'ok';
};
