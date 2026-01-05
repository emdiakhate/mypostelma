/**
 * useVente Hook
 *
 * Hook principal pour le module Vente avec 6 sous-hooks:
 * 1. useProducts - Gestion catalogue produits/services
 * 2. useQuotes - Gestion des devis
 * 3. useOrders - Gestion des commandes
 * 4. useTickets - Gestion du support client
 * 5. useStock - Gestion du stock
 * 6. useStockMovements - Gestion des mouvements de stock
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  Product,
  ProductFilters,
  Quote,
  QuoteItem,
  QuoteFilters,
  CreateQuoteInput,
  Order,
  OrderItem,
  OrderFilters,
  CreateOrderInput,
  Ticket,
  TicketResponse,
  TicketFilters,
  CreateTicketInput,
  CreateTicketResponseInput,
  StockItem,
  StockMovement,
  StockFilters,
  CreateStockMovementInput,
} from '@/types/vente';
import { calculateTTC, TVA_RATE } from '@/types/vente';

// Helper pour mapper les données DB vers les types locaux
const mapDbProduct = (item: any): Product => ({
  id: item.id,
  user_id: item.user_id,
  name: item.name,
  description: item.description,
  type: item.type as 'product' | 'service',
  category: item.category,
  price: Number(item.price),
  cost: item.cost ? Number(item.cost) : undefined,
  stock: item.stock ?? undefined,
  unit: item.unit,
  sku: item.sku ?? undefined,
  status: item.status as 'active' | 'archived',
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
});

const mapDbQuote = (item: any): Quote => ({
  id: item.id,
  user_id: item.user_id,
  number: item.number,
  client_name: item.client_name,
  client_email: item.client_email,
  client_phone: item.client_phone ?? undefined,
  client_address: item.client_address ?? undefined,
  status: item.status as Quote['status'],
  total_ht: Number(item.total_ht),
  total_ttc: Number(item.total_ttc),
  tva_rate: Number(item.tva_rate),
  valid_until: new Date(item.valid_until),
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
  sent_at: item.sent_at ? new Date(item.sent_at) : undefined,
  accepted_at: item.accepted_at ? new Date(item.accepted_at) : undefined,
  rejected_at: item.rejected_at ? new Date(item.rejected_at) : undefined,
  notes: item.notes ?? undefined,
  items: (item.items || []).map((i: any) => ({
    id: i.id,
    quote_id: i.quote_id,
    product_id: i.product_id ?? undefined,
    product_name: i.product_name,
    description: i.description,
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price),
    total: Number(i.total),
    order_index: i.order_index,
  })).sort((a: QuoteItem, b: QuoteItem) => a.order_index - b.order_index),
});

const mapDbOrder = (item: any): Order => ({
  id: item.id,
  user_id: item.user_id,
  number: item.number,
  client_name: item.client_name,
  client_email: item.client_email,
  client_phone: item.client_phone ?? undefined,
  client_address: item.client_address ?? undefined,
  status: item.status as Order['status'],
  payment_status: item.payment_status as Order['payment_status'],
  total_ht: Number(item.total_ht),
  total_ttc: Number(item.total_ttc),
  tva_rate: Number(item.tva_rate),
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
  confirmed_at: item.confirmed_at ? new Date(item.confirmed_at) : undefined,
  shipped_at: item.shipped_at ? new Date(item.shipped_at) : undefined,
  delivered_at: item.delivered_at ? new Date(item.delivered_at) : undefined,
  tracking_number: item.tracking_number ?? undefined,
  shipping_address: item.shipping_address ?? undefined,
  notes: item.notes ?? undefined,
  quote_id: item.quote_id ?? undefined,
  items: (item.items || []).map((i: any) => ({
    id: i.id,
    order_id: i.order_id,
    product_id: i.product_id ?? undefined,
    product_name: i.product_name,
    description: i.description,
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price),
    total: Number(i.total),
    order_index: i.order_index,
  })).sort((a: OrderItem, b: OrderItem) => a.order_index - b.order_index),
});

const mapDbTicket = (item: any): Ticket => ({
  id: item.id,
  user_id: item.user_id,
  number: item.number,
  subject: item.subject,
  description: item.description,
  client_name: item.client_name,
  client_email: item.client_email,
  status: item.status as Ticket['status'],
  priority: item.priority as Ticket['priority'],
  category: item.category,
  assigned_to: item.assigned_to ?? undefined,
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
  resolved_at: item.resolved_at ? new Date(item.resolved_at) : undefined,
  closed_at: item.closed_at ? new Date(item.closed_at) : undefined,
  order_id: item.order_id ?? undefined,
  responses: (item.responses || []).map((r: any) => ({
    id: r.id,
    ticket_id: r.ticket_id,
    author: r.author,
    author_email: r.author_email ?? undefined,
    message: r.message,
    is_staff: r.is_staff,
    created_at: new Date(r.created_at),
    attachments: r.attachments ?? undefined,
  })),
});

const mapDbStockItem = (item: any): StockItem => ({
  id: item.id,
  user_id: item.user_id,
  product_id: item.product_id,
  product_name: item.product_name,
  sku: item.sku,
  category: item.category,
  quantity: item.quantity,
  min_quantity: item.min_quantity,
  location: item.location,
  last_restocked_at: item.last_restocked_at ? new Date(item.last_restocked_at) : undefined,
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
  movements: (item.movements || []).map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    stock_item_id: m.stock_item_id,
    type: m.type as StockMovement['type'],
    quantity: m.quantity,
    reason: m.reason,
    created_at: new Date(m.created_at),
    created_by: m.created_by,
    order_id: m.order_id ?? undefined,
    reference: m.reference ?? undefined,
  })),
});

// ============================================================================
// 1. HOOK PRODUITS/SERVICES
// ============================================================================

export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vente_products' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
        );
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.min_price !== undefined) {
        query = query.gte('price', filters.min_price);
      }

      if (filters?.max_price !== undefined) {
        query = query.lte('price', filters.max_price);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts((data || []).map(mapDbProduct));
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les produits.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = async (productData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('vente_products' as any)
        .insert([{ ...productData, user_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;

      const newProduct = mapDbProduct(data);
      setProducts([newProduct, ...products]);
      toast({
        title: 'Produit créé',
        description: 'Le produit a été ajouté au catalogue.',
      });

      return newProduct;
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le produit.',
      });
      return null;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Omit<Product, 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('vente_products' as any)
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct = mapDbProduct(data);
      setProducts(products.map((p) => (p.id === productId ? updatedProduct : p)));
      toast({
        title: 'Produit mis à jour',
        description: 'Le produit a été modifié avec succès.',
      });

      return updatedProduct;
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit.',
      });
      return null;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('vente_products' as any)
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productId));
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé du catalogue.',
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le produit.',
      });
    }
  };

  const toggleArchive = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newStatus = product.status === 'active' ? 'archived' : 'active';
    await updateProduct(productId, { status: newStatus });
  };

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleArchive,
    loadProducts,
  };
};

// ============================================================================
// 2. HOOK DEVIS
// ============================================================================

export const useQuotes = (filters?: QuoteFilters) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vente_quotes' as any)
        .select('*, items:vente_quote_items(*)')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(
          `number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%`
        );
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.client_name) {
        query = query.ilike('client_name', `%${filters.client_name}%`);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString());
      }

      if (filters?.min_amount !== undefined) {
        query = query.gte('total_ttc', filters.min_amount);
      }

      if (filters?.max_amount !== undefined) {
        query = query.lte('total_ttc', filters.max_amount);
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
  }, [filters, toast]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const createQuote = async (quoteInput: CreateQuoteInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Calculate totals
      const totalHT = quoteInput.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const totalTTC = calculateTTC(totalHT);

      // Create quote (number will be auto-generated by trigger)
      const { data: quoteData, error: quoteError } = await supabase
        .from('vente_quotes' as any)
        .insert([
          {
            user_id: userData.user.id,
            number: '', // Will be auto-generated
            client_name: quoteInput.client_name,
            client_email: quoteInput.client_email,
            client_phone: quoteInput.client_phone,
            client_address: quoteInput.client_address,
            status: 'draft',
            total_ht: totalHT,
            total_ttc: totalTTC,
            tva_rate: TVA_RATE,
            valid_until: quoteInput.valid_until.toISOString(),
            notes: quoteInput.notes,
          },
        ])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const quoteDataAny = quoteData as any;
      const itemsData = quoteInput.items.map((item, index) => ({
        quote_id: quoteDataAny.id,
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        order_index: index,
      }));

      const { data: itemsResult, error: itemsError } = await supabase
        .from('vente_quote_items' as any)
        .insert(itemsData)
        .select();

      if (itemsError) throw itemsError;

      const newQuote = mapDbQuote({ ...quoteDataAny, items: itemsResult || [] });
      setQuotes([newQuote, ...quotes]);
      toast({
        title: 'Devis créé',
        description: `Le devis ${newQuote.number} a été créé avec succès.`,
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

  const updateQuoteStatus = async (quoteId: string, status: Quote['status']) => {
    try {
      const updates: any = { status };

      if (status === 'sent' && !quotes.find((q) => q.id === quoteId)?.sent_at) {
        updates.sent_at = new Date().toISOString();
      }

      if (status === 'accepted') {
        updates.accepted_at = new Date().toISOString();
      }

      if (status === 'rejected') {
        updates.rejected_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vente_quotes' as any)
        .update(updates)
        .eq('id', quoteId)
        .select('*, items:vente_quote_items(*)')
        .single();

      if (error) throw error;

      const updatedQuote = mapDbQuote(data);
      setQuotes(quotes.map((q) => (q.id === quoteId ? updatedQuote : q)));
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du devis a été modifié.',
      });

      return updatedQuote;
    } catch (error: any) {
      console.error('Error updating quote status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
      });
      return null;
    }
  };

  const duplicateQuote = async (quoteId: string) => {
    try {
      const quote = quotes.find((q) => q.id === quoteId);
      if (!quote) return null;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const newQuoteInput: CreateQuoteInput = {
        client_name: quote.client_name,
        client_email: quote.client_email,
        client_phone: quote.client_phone,
        client_address: quote.client_address,
        valid_until: validUntil,
        notes: quote.notes,
        items: quote.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      return await createQuote(newQuoteInput);
    } catch (error: any) {
      console.error('Error duplicating quote:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de dupliquer le devis.',
      });
      return null;
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      // Delete items first
      await supabase.from('vente_quote_items' as any).delete().eq('quote_id', quoteId);

      // Delete quote
      const { error } = await supabase.from('vente_quotes' as any).delete().eq('id', quoteId);

      if (error) throw error;

      setQuotes(quotes.filter((q) => q.id !== quoteId));
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
    createQuote,
    updateQuoteStatus,
    duplicateQuote,
    deleteQuote,
    loadQuotes,
  };
};

// ============================================================================
// 3. HOOK COMMANDES
// ============================================================================

export const useOrders = (filters?: OrderFilters) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vente_orders' as any)
        .select('*, items:vente_order_items(*)')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(
          `number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%`
        );
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.payment_status) {
        if (Array.isArray(filters.payment_status)) {
          query = query.in('payment_status', filters.payment_status);
        } else {
          query = query.eq('payment_status', filters.payment_status);
        }
      }

      if (filters?.client_name) {
        query = query.ilike('client_name', `%${filters.client_name}%`);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString());
      }

      if (filters?.min_amount !== undefined) {
        query = query.gte('total_ttc', filters.min_amount);
      }

      if (filters?.max_amount !== undefined) {
        query = query.lte('total_ttc', filters.max_amount);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders((data || []).map(mapDbOrder));
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les commandes.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const createOrder = async (orderInput: CreateOrderInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Calculate totals
      const totalHT = orderInput.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const totalTTC = calculateTTC(totalHT);

      // Create order (number will be auto-generated by trigger)
      const { data: orderData, error: orderError } = await supabase
        .from('vente_orders' as any)
        .insert([
          {
            user_id: userData.user.id,
            number: '', // Will be auto-generated
            client_name: orderInput.client_name,
            client_email: orderInput.client_email,
            client_phone: orderInput.client_phone,
            client_address: orderInput.client_address,
            shipping_address: orderInput.shipping_address,
            status: 'pending',
            payment_status: 'pending',
            total_ht: totalHT,
            total_ttc: totalTTC,
            tva_rate: TVA_RATE,
            notes: orderInput.notes,
            quote_id: orderInput.quote_id,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderDataAny = orderData as any;
      const itemsData = orderInput.items.map((item, index) => ({
        order_id: orderDataAny.id,
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        order_index: index,
      }));

      const { data: itemsResult, error: itemsError } = await supabase
        .from('vente_order_items' as any)
        .insert(itemsData)
        .select();

      if (itemsError) throw itemsError;

      const newOrder = mapDbOrder({ ...orderDataAny, items: itemsResult || [] });
      setOrders([newOrder, ...orders]);
      toast({
        title: 'Commande créée',
        description: `La commande ${newOrder.number} a été créée avec succès.`,
      });

      return newOrder;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la commande.',
      });
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updates: any = { status };

      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      }

      if (status === 'shipped') {
        updates.shipped_at = new Date().toISOString();
      }

      if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vente_orders' as any)
        .update(updates)
        .eq('id', orderId)
        .select('*, items:vente_order_items(*)')
        .single();

      if (error) throw error;

      const updatedOrder = mapDbOrder(data);
      setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de la commande a été modifié.',
      });

      return updatedOrder;
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
      });
      return null;
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: Order['payment_status']) => {
    try {
      const { data, error } = await supabase
        .from('vente_orders' as any)
        .update({ payment_status: paymentStatus })
        .eq('id', orderId)
        .select('*, items:vente_order_items(*)')
        .single();

      if (error) throw error;

      const updatedOrder = mapDbOrder(data);
      setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));
      toast({
        title: 'Paiement mis à jour',
        description: 'Le statut de paiement a été modifié.',
      });

      return updatedOrder;
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le paiement.',
      });
      return null;
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // Delete items first
      await supabase.from('vente_order_items' as any).delete().eq('order_id', orderId);

      // Delete order
      const { error } = await supabase.from('vente_orders' as any).delete().eq('id', orderId);

      if (error) throw error;

      setOrders(orders.filter((o) => o.id !== orderId));
      toast({
        title: 'Commande supprimée',
        description: 'La commande a été supprimée.',
      });
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la commande.',
      });
    }
  };

  return {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    loadOrders,
  };
};

// ============================================================================
// 4. HOOK TICKETS SUPPORT
// ============================================================================

export const useTickets = (filters?: TicketFilters) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vente_tickets' as any)
        .select('*, responses:vente_ticket_responses(*)')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(
          `number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`
        );
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority);
        } else {
          query = query.eq('priority', filters.priority);
        }
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.client_name) {
        query = query.ilike('client_name', `%${filters.client_name}%`);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setTickets((data || []).map(mapDbTicket));
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les tickets.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const createTicket = async (ticketInput: CreateTicketInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Create ticket (number will be auto-generated by trigger)
      const { data: ticketData, error: ticketError } = await supabase
        .from('vente_tickets' as any)
        .insert([
          {
            user_id: userData.user.id,
            number: '', // Will be auto-generated
            subject: ticketInput.subject,
            description: ticketInput.description,
            client_name: ticketInput.client_name,
            client_email: ticketInput.client_email,
            status: 'open',
            priority: ticketInput.priority,
            category: ticketInput.category,
            order_id: ticketInput.order_id,
          },
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      const ticketDataAny = ticketData as any;
      const newTicket = mapDbTicket({ ...ticketDataAny, responses: [] });
      setTickets([newTicket, ...tickets]);
      toast({
        title: 'Ticket créé',
        description: `Le ticket ${newTicket.number} a été créé avec succès.`,
      });

      return newTicket;
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le ticket.',
      });
      return null;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      const updates: any = { status };

      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      if (status === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vente_tickets' as any)
        .update(updates)
        .eq('id', ticketId)
        .select('*, responses:vente_ticket_responses(*)')
        .single();

      if (error) throw error;

      const updatedTicket = mapDbTicket(data);
      setTickets(tickets.map((t) => (t.id === ticketId ? updatedTicket : t)));
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du ticket a été modifié.',
      });

      return updatedTicket;
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
      });
      return null;
    }
  };

  const addResponse = async (responseInput: CreateTicketResponseInput) => {
    try {
      const { data, error } = await supabase
        .from('vente_ticket_responses' as any)
        .insert([responseInput])
        .select()
        .single();

      if (error) throw error;

      // Reload tickets to get updated responses
      await loadTickets();

      toast({
        title: 'Réponse ajoutée',
        description: 'La réponse a été ajoutée au ticket.',
      });

      return data;
    } catch (error: any) {
      console.error('Error adding response:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'ajouter la réponse.',
      });
      return null;
    }
  };

  const deleteTicket = async (ticketId: string) => {
    try {
      // Delete responses first
      await supabase.from('vente_ticket_responses' as any).delete().eq('ticket_id', ticketId);

      // Delete ticket
      const { error } = await supabase.from('vente_tickets' as any).delete().eq('id', ticketId);

      if (error) throw error;

      setTickets(tickets.filter((t) => t.id !== ticketId));
      toast({
        title: 'Ticket supprimé',
        description: 'Le ticket a été supprimé.',
      });
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le ticket.',
      });
    }
  };

  return {
    tickets,
    loading,
    createTicket,
    updateTicketStatus,
    addResponse,
    deleteTicket,
    loadTickets,
  };
};

// ============================================================================
// 5. HOOK STOCK
// ============================================================================

export const useStock = (filters?: StockFilters) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStockItems = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vente_stock_items' as any)
        .select('*, movements:vente_stock_movements(*)')
        .order('product_name', { ascending: true });

      if (filters?.search) {
        query = query.or(
          `product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
        );
      }

      if (filters?.location) {
        query = query.eq('location', filters.location);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      let items = (data || []).map(mapDbStockItem);

      // Filter by stock status
      if (filters?.status && filters.status !== 'all') {
        items = items.filter((item) => {
          if (filters.status === 'out') return item.quantity === 0;
          if (filters.status === 'low') return item.quantity > 0 && item.quantity <= item.min_quantity;
          if (filters.status === 'ok') return item.quantity > item.min_quantity;
          return true;
        });
      }

      setStockItems(items);
    } catch (error: any) {
      console.error('Error loading stock items:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger le stock.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadStockItems();
  }, [loadStockItems]);

  const updateStockQuantity = async (stockItemId: string, newQuantity: number) => {
    try {
      const { data, error } = await supabase
        .from('vente_stock_items' as any)
        .update({ quantity: newQuantity })
        .eq('id', stockItemId)
        .select('*, movements:vente_stock_movements(*)')
        .single();

      if (error) throw error;

      const updatedItem = mapDbStockItem(data);
      setStockItems(stockItems.map((s) => (s.id === stockItemId ? updatedItem : s)));
      toast({
        title: 'Stock mis à jour',
        description: 'La quantité a été modifiée.',
      });

      return updatedItem;
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le stock.',
      });
      return null;
    }
  };

  return {
    stockItems,
    loading,
    updateStockQuantity,
    loadStockItems,
  };
};

// ============================================================================
// 6. HOOK MOUVEMENTS STOCK
// ============================================================================

export const useStockMovements = (stockItemId?: string) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMovements = useCallback(async () => {
    if (!stockItemId) {
      setMovements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vente_stock_movements' as any)
        .select('*')
        .eq('stock_item_id', stockItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMovements((data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        stock_item_id: m.stock_item_id,
        type: m.type as StockMovement['type'],
        quantity: m.quantity,
        reason: m.reason,
        created_at: new Date(m.created_at),
        created_by: m.created_by,
        order_id: m.order_id ?? undefined,
        reference: m.reference ?? undefined,
      })));
    } catch (error: any) {
      console.error('Error loading movements:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les mouvements.',
      });
    } finally {
      setLoading(false);
    }
  }, [stockItemId, toast]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const createMovement = async (movementInput: CreateStockMovementInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('vente_stock_movements' as any)
        .insert([
          {
            user_id: userData.user.id,
            stock_item_id: movementInput.stock_item_id,
            type: movementInput.type,
            quantity: movementInput.quantity,
            reason: movementInput.reason,
            created_by: userData.user.email || 'Unknown',
            order_id: movementInput.order_id,
            reference: movementInput.reference,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const dataAny = data as any;
      const newMovement: StockMovement = {
        id: dataAny.id,
        user_id: dataAny.user_id,
        stock_item_id: dataAny.stock_item_id,
        type: dataAny.type as StockMovement['type'],
        quantity: dataAny.quantity,
        reason: dataAny.reason,
        created_at: new Date(dataAny.created_at),
        created_by: dataAny.created_by,
        order_id: dataAny.order_id ?? undefined,
        reference: dataAny.reference ?? undefined,
      };

      setMovements([newMovement, ...movements]);
      toast({
        title: 'Mouvement enregistré',
        description: 'Le mouvement de stock a été enregistré.',
      });

      return newMovement;
    } catch (error: any) {
      console.error('Error creating movement:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le mouvement.',
      });
      return null;
    }
  };

  return {
    movements,
    loading,
    createMovement,
    loadMovements,
  };
};

// ============================================================================
// HOOK PRINCIPAL (COMBINÉ)
// ============================================================================

export const useVente = () => {
  const products = useProducts();
  const quotes = useQuotes();
  const orders = useOrders();
  const tickets = useTickets();
  const stock = useStock();

  return {
    products,
    quotes,
    orders,
    tickets,
    stock,
  };
};

export default useVente;
