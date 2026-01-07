/**
 * useCompta Hook - Module Comptabilité
 *
 * Hook principal pour le module Devis & Factures avec 4 hooks:
 * 1. useQuotes - Gestion devis
 * 2. useInvoices - Gestion factures
 * 3. usePayments - Gestion paiements
 * 4. useOcrScans - Gestion scans OCR
 * 
 * NOTE: Ce hook utilise des requêtes brutes car les tables compta_* 
 * ne sont pas encore dans les types Supabase générés.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  Quote,
  QuoteFilters,
  CreateQuoteInput,
  Invoice,
  InvoiceFilters,
  CreateInvoiceInput,
  Payment,
  CreatePaymentInput,
  OcrScan,
  CreateOcrScanInput,
} from '@/types/compta';
import type { Product } from '@/types/vente';

// Type Lead simplifié pour la comptabilité (évite l'import problématique)
interface ComptaLead {
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
// MAPPERS (DB → Types TypeScript)
// ============================================================================

const mapDbQuote = (item: any): Quote => ({
  id: item.id,
  user_id: item.user_id,
  client_id: item.client_id,
  quote_number: item.quote_number,
  issue_date: new Date(item.issue_date),
  expiration_date: new Date(item.expiration_date),
  status: item.status,
  currency: item.currency,
  subtotal: Number(item.subtotal),
  tax_rate: Number(item.tax_rate),
  tax_amount: Number(item.tax_amount),
  discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
  total: Number(item.total),
  notes: item.notes,
  terms: item.terms,
  created_from_ocr: item.created_from_ocr ?? false,
  ocr_scan_id: item.ocr_scan_id,
  converted_to_invoice_id: item.converted_to_invoice_id,
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
  // Relations chargées si présentes
  client: item.leads ? mapDbLead(item.leads) : undefined,
  items: item.compta_quote_items ? item.compta_quote_items.map(mapDbQuoteItem) : undefined,
});

const mapDbQuoteItem = (item: any) => ({
  id: item.id,
  quote_id: item.quote_id,
  product_id: item.product_id,
  description: item.description,
  quantity: Number(item.quantity),
  unit_price: Number(item.unit_price),
  discount_percent: item.discount_percent ? Number(item.discount_percent) : undefined,
  discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
  tax_rate: Number(item.tax_rate),
  tax_amount: Number(item.tax_amount),
  subtotal: Number(item.subtotal),
  total: Number(item.total),
  line_order: item.line_order,
  created_at: new Date(item.created_at),
  product: item.vente_products ? mapDbProduct(item.vente_products) : undefined,
});

const mapDbInvoice = (item: any): Invoice => ({
  id: item.id,
  user_id: item.user_id,
  client_id: item.client_id,
  quote_id: item.quote_id,
  invoice_number: item.invoice_number,
  issue_date: new Date(item.issue_date),
  due_date: new Date(item.due_date),
  paid_at: item.paid_at ? new Date(item.paid_at) : undefined,
  status: item.status,
  currency: item.currency,
  subtotal: Number(item.subtotal),
  tax_rate: Number(item.tax_rate),
  tax_amount: Number(item.tax_amount),
  discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
  total: Number(item.total),
  amount_paid: Number(item.amount_paid),
  balance_due: Number(item.balance_due),
  notes: item.notes,
  terms: item.terms,
  created_from_ocr: item.created_from_ocr ?? false,
  ocr_scan_id: item.ocr_scan_id,
  stock_impact_applied: item.stock_impact_applied ?? false,
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
  // Relations
  client: item.leads ? mapDbLead(item.leads) : undefined,
  quote: item.compta_quotes ? mapDbQuote(item.compta_quotes) : undefined,
  items: item.compta_invoice_items ? item.compta_invoice_items.map(mapDbInvoiceItem) : undefined,
  payments: item.compta_payments ? item.compta_payments.map(mapDbPayment) : undefined,
});

const mapDbInvoiceItem = (item: any) => ({
  id: item.id,
  invoice_id: item.invoice_id,
  product_id: item.product_id,
  description: item.description,
  quantity: Number(item.quantity),
  unit_price: Number(item.unit_price),
  discount_percent: item.discount_percent ? Number(item.discount_percent) : undefined,
  discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
  tax_rate: Number(item.tax_rate),
  tax_amount: Number(item.tax_amount),
  subtotal: Number(item.subtotal),
  total: Number(item.total),
  line_order: item.line_order,
  created_at: new Date(item.created_at),
  product: item.vente_products ? mapDbProduct(item.vente_products) : undefined,
});

const mapDbPayment = (item: any): Payment => ({
  id: item.id,
  user_id: item.user_id,
  invoice_id: item.invoice_id,
  amount: Number(item.amount),
  payment_method: item.payment_method,
  reference: item.reference,
  payment_date: new Date(item.payment_date),
  notes: item.notes,
  created_at: new Date(item.created_at),
  created_by: item.created_by,
  invoice: item.compta_invoices ? mapDbInvoice(item.compta_invoices) : undefined,
});

const mapDbOcrScan = (item: any): OcrScan => ({
  id: item.id,
  user_id: item.user_id,
  file_url: item.file_url,
  file_name: item.file_name,
  file_type: item.file_type,
  file_size: item.file_size,
  extracted_data: item.extracted_data,
  raw_text: item.raw_text,
  confidence_score: item.confidence_score ? Number(item.confidence_score) : undefined,
  status: item.status,
  error_message: item.error_message,
  created_quote_id: item.created_quote_id,
  created_invoice_id: item.created_invoice_id,
  created_at: new Date(item.created_at),
  processed_at: item.processed_at ? new Date(item.processed_at) : undefined,
});

const mapDbLead = (item: any): ComptaLead => ({
  id: item.id,
  user_id: item.user_id,
  name: item.name,
  email: item.email,
  phone: item.phone,
  company: item.company,
  position: item.position,
  status: item.status,
  source: item.source,
  score: item.score,
  notes: item.notes,
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
  is_customer: item.is_customer ?? false,
  customer_since: item.customer_since ? new Date(item.customer_since) : undefined,
});

const mapDbProduct = (item: any): Product => ({
  id: item.id,
  user_id: item.user_id,
  name: item.name,
  description: item.description,
  type: item.type,
  category: item.category,
  price: item.price ? Number(item.price) : 0,
  cost: item.cost ? Number(item.cost) : undefined,
  stock: item.stock ? Number(item.stock) : undefined,
  unit: item.unit,
  sku: item.sku,
  status: item.status,
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
});

// ============================================================================
// HELPER pour requêtes non typées (tables compta_*)
// ============================================================================

// Utilise le client Supabase avec un cast pour éviter les erreurs de typage
const getSupabaseClient = () => supabase as any;

// ============================================================================
// 1. HOOK DEVIS (QUOTES)
// ============================================================================

export const useQuotes = (filters?: QuoteFilters) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Extraire valeurs pour éviter boucles
  const clientId = filters?.client_id;
  const status = filters?.status;
  const search = filters?.search;
  const dateFromIso = filters?.date_from?.toISOString();
  const dateToIso = filters?.date_to?.toISOString();

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const client = getSupabaseClient();
      
      let query = client
        .from('compta_quotes')
        .select(`
          *,
          leads(*),
          compta_quote_items(*, vente_products(*))
        `)
        .order('issue_date', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`quote_number.ilike.%${search}%`);
      }

      if (dateFromIso) {
        query = query.gte('issue_date', dateFromIso);
      }

      if (dateToIso) {
        query = query.lte('issue_date', dateToIso);
      }

      const { data, error } = await query;

      if (error) throw error;

      setQuotes((data || []).map(mapDbQuote));
    } catch (error: any) {
      console.error('Error loading quotes:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les devis.',
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, status, search, dateFromIso, dateToIso, toast]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const createQuote = async (quoteInput: CreateQuoteInput): Promise<Quote | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const client = getSupabaseClient();

      // Générer le numéro de devis via RPC
      const { data: quoteNumber, error: seqError } = await client.rpc('get_next_sequence_number', {
        p_user_id: userData.user.id,
        p_sequence_type: 'quote',
      });

      if (seqError) throw seqError;

      // Calculer les totaux depuis les lignes
      const items = quoteInput.items.map((item, index) => {
        const quantity = item.quantity;
        const unitPrice = item.unit_price;
        const discountPercent = item.discount_percent || 0;
        const taxRate = item.tax_rate || quoteInput.tax_rate || 18;

        const subtotal = quantity * unitPrice;
        const discountAmount = (subtotal * discountPercent) / 100;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
        const total = subtotalAfterDiscount + taxAmount;

        return {
          ...item,
          tax_rate: taxRate,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          subtotal,
          total,
          line_order: index,
        };
      });

      const globalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const globalTaxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
      const globalTotal = items.reduce((sum, item) => sum + item.total, 0);

      // Créer le devis
      const { data: quote, error: quoteError } = await client
        .from('compta_quotes')
        .insert([
          {
            user_id: userData.user.id,
            client_id: quoteInput.client_id,
            quote_number: quoteNumber,
            issue_date: quoteInput.issue_date.toISOString().split('T')[0],
            expiration_date: quoteInput.expiration_date.toISOString().split('T')[0],
            currency: quoteInput.currency || 'XOF',
            tax_rate: quoteInput.tax_rate || 18,
            subtotal: globalSubtotal,
            tax_amount: globalTaxAmount,
            total: globalTotal,
            notes: quoteInput.notes,
            terms: quoteInput.terms,
            status: 'draft',
          },
        ])
        .select(`*, leads(*), compta_quote_items(*, vente_products(*))`)
        .single();

      if (quoteError) throw quoteError;

      // Créer les lignes
      const { error: itemsError } = await client.from('compta_quote_items').insert(
        items.map((item) => ({
          quote_id: quote.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          subtotal: item.subtotal,
          total: item.total,
          line_order: item.line_order,
        }))
      );

      if (itemsError) throw itemsError;

      // Recharger le devis avec les lignes
      const { data: fullQuote } = await client
        .from('compta_quotes')
        .select(`*, leads(*), compta_quote_items(*, vente_products(*))`)
        .eq('id', quote.id)
        .single();

      const newQuote = mapDbQuote(fullQuote);
      setQuotes((prev) => [newQuote, ...prev]);

      toast({
        title: 'Devis créé',
        description: `Devis ${quoteNumber} créé avec succès.`,
      });

      return newQuote;
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le devis.',
      });
      return null;
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: string): Promise<void> => {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('compta_quotes')
        .update({ status: newStatus })
        .eq('id', quoteId);

      if (error) throw error;

      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus as any } : q))
      );

      toast({
        title: 'Statut mis à jour',
        description: `Le devis a été marqué comme ${newStatus}.`,
      });
    } catch (error: any) {
      console.error('Error updating quote status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
      });
    }
  };

  const deleteQuote = async (quoteId: string): Promise<void> => {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from('compta_quotes').delete().eq('id', quoteId);

      if (error) throw error;

      setQuotes((prev) => prev.filter((q) => q.id !== quoteId));

      toast({
        title: 'Devis supprimé',
        description: 'Le devis a été supprimé.',
      });
    } catch (error: any) {
      console.error('Error deleting quote:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le devis.',
      });
    }
  };

  return {
    quotes,
    loading,
    loadQuotes,
    createQuote,
    updateQuoteStatus,
    deleteQuote,
  };
};

// ============================================================================
// 2. HOOK FACTURES (INVOICES)
// ============================================================================

export const useInvoices = (filters?: InvoiceFilters) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const clientId = filters?.client_id;
  const status = filters?.status;
  const search = filters?.search;
  const dateFromIso = filters?.date_from?.toISOString();
  const dateToIso = filters?.date_to?.toISOString();
  const overdueOnly = filters?.overdue_only;

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const client = getSupabaseClient();
      
      let query = client
        .from('compta_invoices')
        .select(`
          *,
          leads(*),
          compta_quotes(*),
          compta_invoice_items(*, vente_products(*)),
          compta_payments(*)
        `)
        .order('issue_date', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%`);
      }

      if (dateFromIso) {
        query = query.gte('issue_date', dateFromIso);
      }

      if (dateToIso) {
        query = query.lte('issue_date', dateToIso);
      }

      if (overdueOnly) {
        query = query.eq('status', 'overdue');
      }

      const { data, error } = await query;

      if (error) throw error;

      setInvoices((data || []).map(mapDbInvoice));
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les factures.',
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, status, search, dateFromIso, dateToIso, overdueOnly, toast]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const createInvoice = async (invoiceInput: CreateInvoiceInput): Promise<Invoice | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const client = getSupabaseClient();

      // Générer le numéro
      const { data: invoiceNumber, error: seqError } = await client.rpc(
        'get_next_sequence_number',
        {
          p_user_id: userData.user.id,
          p_sequence_type: 'invoice',
        }
      );

      if (seqError) throw seqError;

      // Calculer totaux
      const items = invoiceInput.items.map((item, index) => {
        const quantity = item.quantity;
        const unitPrice = item.unit_price;
        const discountPercent = item.discount_percent || 0;
        const taxRate = item.tax_rate || invoiceInput.tax_rate || 18;

        const subtotal = quantity * unitPrice;
        const discountAmount = (subtotal * discountPercent) / 100;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
        const total = subtotalAfterDiscount + taxAmount;

        return {
          ...item,
          tax_rate: taxRate,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          subtotal,
          total,
          line_order: index,
        };
      });

      const globalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const globalTaxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
      const globalTotal = items.reduce((sum, item) => sum + item.total, 0);

      // Créer la facture
      const { data: invoice, error: invoiceError } = await client
        .from('compta_invoices')
        .insert([
          {
            user_id: userData.user.id,
            client_id: invoiceInput.client_id,
            quote_id: invoiceInput.quote_id,
            invoice_number: invoiceNumber,
            issue_date: invoiceInput.issue_date.toISOString().split('T')[0],
            due_date: invoiceInput.due_date.toISOString().split('T')[0],
            currency: invoiceInput.currency || 'XOF',
            tax_rate: invoiceInput.tax_rate || 18,
            subtotal: globalSubtotal,
            tax_amount: globalTaxAmount,
            total: globalTotal,
            amount_paid: 0,
            balance_due: globalTotal,
            notes: invoiceInput.notes,
            terms: invoiceInput.terms,
            status: 'draft',
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Créer les lignes
      const { error: itemsError } = await client.from('compta_invoice_items').insert(
        items.map((item) => ({
          invoice_id: invoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          subtotal: item.subtotal,
          total: item.total,
          line_order: item.line_order,
        }))
      );

      if (itemsError) throw itemsError;

      // Si créée depuis un devis, marquer le devis comme converti
      if (invoiceInput.quote_id) {
        await client
          .from('compta_quotes')
          .update({
            converted_to_invoice_id: invoice.id,
            status: 'accepted',
          })
          .eq('id', invoiceInput.quote_id);
      }

      // Recharger
      const { data: fullInvoice } = await client
        .from('compta_invoices')
        .select(`*, leads(*), compta_invoice_items(*, vente_products(*)), compta_payments(*)`)
        .eq('id', invoice.id)
        .single();

      const newInvoice = mapDbInvoice(fullInvoice);
      setInvoices((prev) => [newInvoice, ...prev]);

      toast({
        title: 'Facture créée',
        description: `Facture ${invoiceNumber} créée avec succès.`,
      });

      return newInvoice;
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la facture.',
      });
      return null;
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string): Promise<void> => {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('compta_invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, status: newStatus as any } : i))
      );

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de la facture a été modifié.',
      });
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
      });
    }
  };

  return {
    invoices,
    loading,
    loadInvoices,
    createInvoice,
    updateInvoiceStatus,
  };
};

// ============================================================================
// 3. HOOK PAIEMENTS (PAYMENTS)
// ============================================================================

export const usePayments = (invoiceId?: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const client = getSupabaseClient();
      
      let query = client
        .from('compta_payments')
        .select('*, compta_invoices(*)')
        .order('payment_date', { ascending: false });

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPayments((data || []).map(mapDbPayment));
    } catch (error: any) {
      console.error('Error loading payments:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les paiements.',
      });
    } finally {
      setLoading(false);
    }
  }, [invoiceId, toast]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const createPayment = async (paymentInput: CreatePaymentInput): Promise<Payment | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const client = getSupabaseClient();
      const { data: payment, error } = await client
        .from('compta_payments')
        .insert([
          {
            user_id: userData.user.id,
            invoice_id: paymentInput.invoice_id,
            amount: paymentInput.amount,
            payment_method: paymentInput.payment_method,
            reference: paymentInput.reference,
            payment_date: paymentInput.payment_date.toISOString().split('T')[0],
            notes: paymentInput.notes,
            created_by: userData.user.email,
          },
        ])
        .select('*, compta_invoices(*)')
        .single();

      if (error) throw error;

      const newPayment = mapDbPayment(payment);
      setPayments((prev) => [newPayment, ...prev]);

      toast({
        title: 'Paiement enregistré',
        description: `Paiement de ${paymentInput.amount} enregistré.`,
      });

      return newPayment;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le paiement.',
      });
      return null;
    }
  };

  return {
    payments,
    loading,
    loadPayments,
    createPayment,
  };
};

// ============================================================================
// 4. HOOK OCR SCANS
// ============================================================================

export const useOcrScans = () => {
  const [scans, setScans] = useState<OcrScan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadScans = useCallback(async () => {
    try {
      setLoading(true);
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('compta_ocr_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setScans((data || []).map(mapDbOcrScan));
    } catch (error: any) {
      console.error('Error loading OCR scans:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les scans.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const createOcrScan = async (scanInput: CreateOcrScanInput): Promise<OcrScan | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const client = getSupabaseClient();
      const { data: scan, error } = await client
        .from('compta_ocr_scans')
        .insert([
          {
            user_id: userData.user.id,
            file_url: scanInput.file_url,
            file_name: scanInput.file_name,
            file_type: scanInput.file_type,
            file_size: scanInput.file_size,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newScan = mapDbOcrScan(scan);
      setScans((prev) => [newScan, ...prev]);

      return newScan;
    } catch (error: any) {
      console.error('Error creating OCR scan:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le scan.',
      });
      return null;
    }
  };

  const processOcrScan = async (scanId: string): Promise<any | null> => {
    try {
      const client = getSupabaseClient();
      
      // Mettre à jour le statut à 'processing'
      await client
        .from('compta_ocr_scans')
        .update({ status: 'processing' })
        .eq('id', scanId);

      // Appeler la fonction Edge pour traitement OCR
      const { data, error } = await supabase.functions.invoke('process-ocr', {
        body: { scan_id: scanId },
      });

      if (error) throw error;

      // Mettre à jour le scan avec les résultats
      await client
        .from('compta_ocr_scans')
        .update({
          status: 'completed',
          extracted_data: data.extracted_data,
          raw_text: data.raw_text,
          confidence_score: data.confidence_score,
          processed_at: new Date().toISOString(),
        })
        .eq('id', scanId);

      // Recharger les scans
      await loadScans();

      return data.extracted_data;
    } catch (error: any) {
      console.error('Error processing OCR scan:', error);

      const client = getSupabaseClient();
      // Marquer comme failed
      await client
        .from('compta_ocr_scans')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', scanId);

      toast({
        variant: 'destructive',
        title: 'Erreur OCR',
        description: 'Impossible de traiter le document.',
      });

      return null;
    }
  };

  return {
    scans,
    loading,
    loadScans,
    createOcrScan,
    processOcrScan,
  };
};

// ============================================================================
// 5. HOOK PRINCIPAL (COMBINÉ)
// ============================================================================

export const useCompta = () => {
  const quotes = useQuotes();
  const invoices = useInvoices();
  const payments = usePayments();
  const ocrScans = useOcrScans();

  return {
    quotes,
    invoices,
    payments,
    ocrScans,
  };
};

export default useCompta;
