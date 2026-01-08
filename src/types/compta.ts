/**
 * Types pour le module Comptabilité (Devis & Factures)
 *
 * Module pour gérer:
 * - Devis professionnels
 * - Factures et paiements
 * - Scanner OCR de documents
 * - Numérotation automatique
 *
 * NOTE: Utilise leads comme clients et vente_products pour les lignes
 */

import { Product } from './vente';

// Type Lead simplifié pour éviter les erreurs d'import circulaire
export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status: string;
  source: string;
  score?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  is_customer?: boolean;
  customer_since?: Date;
}

// ============================================================================
// DEVIS (QUOTES)
// ============================================================================

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface Quote {
  id: string;
  user_id: string;
  client_id: string;

  // Numérotation
  quote_number: string; // Ex: DEV-2026-0001

  // Dates
  issue_date: Date;
  expiration_date: Date;

  // Statut
  status: QuoteStatus;

  // Montants
  currency: string; // XOF, EUR, etc.
  subtotal: number;
  tax_rate: number; // En pourcentage (ex: 18.00)
  tax_amount: number;
  discount_amount?: number;
  total: number;

  // Textes
  notes?: string;
  terms?: string; // Conditions générales

  // Métadonnées
  created_from_ocr: boolean;
  ocr_scan_id?: string;
  converted_to_invoice_id?: string;

  created_at: Date;
  updated_at: Date;

  // Relations (chargées avec join)
  client?: Lead;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;

  // Description
  description: string;

  // Quantités et prix
  quantity: number;
  unit_price: number;

  // Remise et TVA
  discount_percent?: number;
  discount_amount?: number;
  tax_rate: number;
  tax_amount: number;

  // Total ligne
  subtotal: number; // Avant remise et taxe
  total: number; // Après remise et taxe

  // Ordre d'affichage
  line_order: number;

  created_at: Date;

  // Relations
  product?: Product;
}

export interface QuoteFilters {
  client_id?: string;
  status?: QuoteStatus;
  search?: string; // Recherche par numéro ou client
  date_from?: Date;
  date_to?: Date;
}

export interface CreateQuoteInput {
  client_id: string;
  issue_date: Date;
  expiration_date: Date;
  currency?: string;
  tax_rate?: number;
  notes?: string;
  terms?: string;
  items: CreateQuoteItemInput[];
}

export interface CreateQuoteItemInput {
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
}

// ============================================================================
// FACTURES (INVOICES)
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  quote_id?: string;

  // Numérotation
  invoice_number: string; // Ex: FAC-2026-0001

  // Dates
  issue_date: Date;
  due_date: Date;
  paid_at?: Date;

  // Statut
  status: InvoiceStatus;

  // Montants
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount?: number;
  total: number;

  // Paiements
  amount_paid: number;
  balance_due: number; // total - amount_paid (calculé auto)

  // Textes
  notes?: string;
  terms?: string;

  // Métadonnées
  created_from_ocr: boolean;
  ocr_scan_id?: string;
  stock_impact_applied: boolean; // Impact stock déjà fait ?

  created_at: Date;
  updated_at: Date;

  // Relations
  client?: Lead;
  quote?: Quote;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;

  // Description
  description: string;

  // Quantités et prix
  quantity: number;
  unit_price: number;

  // Remise et TVA
  discount_percent?: number;
  discount_amount?: number;
  tax_rate: number;
  tax_amount: number;

  // Total ligne
  subtotal: number;
  total: number;

  // Ordre d'affichage
  line_order: number;

  created_at: Date;

  // Relations
  product?: Product;
}

export interface InvoiceFilters {
  client_id?: string;
  status?: InvoiceStatus;
  search?: string;
  date_from?: Date;
  date_to?: Date;
  overdue_only?: boolean;
}

export interface CreateInvoiceInput {
  client_id: string;
  quote_id?: string; // Si créée depuis un devis
  issue_date: Date;
  due_date: Date;
  currency?: string;
  tax_rate?: number;
  notes?: string;
  terms?: string;
  items: CreateInvoiceItemInput[];
}

export interface CreateInvoiceItemInput {
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
}

// ============================================================================
// PAIEMENTS (PAYMENTS)
// ============================================================================

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string;

  // Montant et méthode
  amount: number;
  payment_method: PaymentMethod;

  // Référence
  reference?: string; // Ex: numéro transaction Wave

  // Date
  payment_date: Date;

  // Notes
  notes?: string;

  created_at: Date;
  created_by?: string; // Email utilisateur

  // Relations
  invoice?: Invoice;
}

export interface CreatePaymentInput {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference?: string;
  payment_date: Date;
  notes?: string;
}

// ============================================================================
// OCR SCANS
// ============================================================================

export type OcrScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface OcrScan {
  id: string;
  user_id: string;

  // Fichier
  file_url: string;
  file_path: string; // Chemin relatif dans le bucket storage
  file_name: string;
  file_type: string;
  file_size?: number;

  // Résultats OCR
  extracted_data?: OcrExtractedData;
  raw_text?: string;
  confidence_score?: number; // 0-100

  // Statut
  status: OcrScanStatus;
  error_message?: string;

  // Création depuis scan
  created_quote_id?: string;
  created_invoice_id?: string;

  created_at: Date;
  processed_at?: Date;
}

export interface OcrExtractedData {
  // Informations de base
  company_name?: string;
  document_type?: 'quote' | 'invoice'; // Devis ou Facture
  document_number?: string;

  // Dates
  issue_date?: string; // Format ISO
  due_date?: string;
  expiration_date?: string;

  // Montants
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total?: number;
  currency?: string;

  // Lignes de produits (optionnel, difficile à extraire)
  items?: Array<{
    description: string;
    quantity?: number;
    unit_price?: number;
    total?: number;
  }>;

  // Client (si détecté)
  client_name?: string;
  client_company?: string;
  client_address?: string;
  client_phone?: string;

  // Score de confiance
  confidence_score?: number;

  // Métadonnées
  confidence_items?: {
    [key: string]: number; // Score par champ
  };
}

export interface CreateOcrScanInput {
  file_url: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size?: number;
}

// ============================================================================
// HELPERS & CONSTANTS
// ============================================================================

export const QUOTE_STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
export const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'];
export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'];

export const getQuoteStatusLabel = (status: QuoteStatus): string => {
  const labels: Record<QuoteStatus, string> = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    rejected: 'Refusé',
    expired: 'Expiré',
  };
  return labels[status];
};

export const getQuoteStatusColor = (status: QuoteStatus): string => {
  const colors: Record<QuoteStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800',
  };
  return colors[status];
};

export const getInvoiceStatusLabel = (status: InvoiceStatus): string => {
  const labels: Record<InvoiceStatus, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    partial: 'Paiement partiel',
    overdue: 'En retard',
    cancelled: 'Annulée',
  };
  return labels[status];
};

export const getInvoiceStatusColor = (status: InvoiceStatus): string => {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return colors[status];
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Espèces',
    bank_transfer: 'Virement bancaire',
    mobile_money: 'Mobile Money',
    check: 'Chèque',
    other: 'Autre',
  };
  return labels[method];
};

// Calculer les montants d'une ligne
export const calculateLineAmounts = (
  quantity: number,
  unitPrice: number,
  taxRate: number = 0,
  discountPercent: number = 0
): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
} => {
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discountPercent) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
  const total = subtotalAfterDiscount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// Calculer les totaux d'un devis/facture
export const calculateDocumentTotals = (
  items: Array<{ subtotal: number; discountAmount?: number; taxAmount: number; total: number }>
): {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
} => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
};

// Formater un montant avec devise
export const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  const symbols: Record<string, string> = {
    XOF: 'FCFA',
    EUR: '€',
    USD: '$',
  };

  const symbol = symbols[currency] || currency;

  return `${formatted} ${symbol}`;
};

// Vérifier si un devis est expiré
export const isQuoteExpired = (expirationDate: Date): boolean => {
  return new Date(expirationDate) < new Date();
};

// Vérifier si une facture est en retard
export const isInvoiceOverdue = (dueDate: Date, status: InvoiceStatus): boolean => {
  return new Date(dueDate) < new Date() && status !== 'paid' && status !== 'cancelled';
};
