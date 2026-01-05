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
        .from('vente_products')
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

      setProducts((data || []).map((item) => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
      })));
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
      const { data, error } = await supabase
        .from('vente_products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      const newProduct: Product = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

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

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('vente_products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct: Product = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

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
        .from('vente_products')
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
        .from('vente_quotes')
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

      setQuotes(
        (data || []).map((item) => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
          valid_until: new Date(item.valid_until),
          sent_at: item.sent_at ? new Date(item.sent_at) : undefined,
          accepted_at: item.accepted_at ? new Date(item.accepted_at) : undefined,
          rejected_at: item.rejected_at ? new Date(item.rejected_at) : undefined,
          items: (item.items || []).sort((a: any, b: any) => a.order_index - b.order_index),
        }))
      );
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
      // Calculate totals
      const totalHT = quoteInput.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const totalTTC = calculateTTC(totalHT);

      // Generate quote number
      const { count } = await supabase
        .from('vente_quotes')
        .select('*', { count: 'exact', head: true });

      const quoteNumber = `DEV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      // Create quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('vente_quotes')
        .insert([
          {
            number: quoteNumber,
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
      const itemsData = quoteInput.items.map((item, index) => ({
        quote_id: quoteData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        order_index: index,
      }));

      const { data: itemsResult, error: itemsError } = await supabase
        .from('vente_quote_items')
        .insert(itemsData)
        .select();

      if (itemsError) throw itemsError;

      const newQuote: Quote = {
        ...quoteData,
        created_at: new Date(quoteData.created_at),
        updated_at: new Date(quoteData.updated_at),
        valid_until: new Date(quoteData.valid_until),
        items: itemsResult || [],
      };

      setQuotes([newQuote, ...quotes]);
      toast({
        title: 'Devis créé',
        description: `Le devis ${quoteNumber} a été créé avec succès.`,
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
        .from('vente_quotes')
        .update(updates)
        .eq('id', quoteId)
        .select('*, items:vente_quote_items(*)')
        .single();

      if (error) throw error;

      const updatedQuote: Quote = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        valid_until: new Date(data.valid_until),
        sent_at: data.sent_at ? new Date(data.sent_at) : undefined,
        accepted_at: data.accepted_at ? new Date(data.accepted_at) : undefined,
        rejected_at: data.rejected_at ? new Date(data.rejected_at) : undefined,
        items: (data.items || []).sort((a: any, b: any) => a.order_index - b.order_index),
      };

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
      await supabase.from('vente_quote_items').delete().eq('quote_id', quoteId);

      // Delete quote
      const { error } = await supabase.from('vente_quotes').delete().eq('id', quoteId);

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
        .from('vente_orders')
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

      setOrders(
        (data || []).map((item) => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
          confirmed_at: item.confirmed_at ? new Date(item.confirmed_at) : undefined,
          shipped_at: item.shipped_at ? new Date(item.shipped_at) : undefined,
          delivered_at: item.delivered_at ? new Date(item.delivered_at) : undefined,
          items: (item.items || []).sort((a: any, b: any) => a.order_index - b.order_index),
        }))
      );
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
      // Calculate totals
      const totalHT = orderInput.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const totalTTC = calculateTTC(totalHT);

      // Generate order number
      const { count } = await supabase
        .from('vente_orders')
        .select('*', { count: 'exact', head: true });

      const orderNumber = `CMD-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('vente_orders')
        .insert([
          {
            number: orderNumber,
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
      const itemsData = orderInput.items.map((item, index) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        order_index: index,
      }));

      const { data: itemsResult, error: itemsError } = await supabase
        .from('vente_order_items')
        .insert(itemsData)
        .select();

      if (itemsError) throw itemsError;

      const newOrder: Order = {
        ...orderData,
        created_at: new Date(orderData.created_at),
        updated_at: new Date(orderData.updated_at),
        items: itemsResult || [],
      };

      setOrders([newOrder, ...orders]);
      toast({
        title: 'Commande créée',
        description: `La commande ${orderNumber} a été créée avec succès.`,
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
      const currentOrder = orders.find((o) => o.id === orderId);

      if (status === 'confirmed' && !currentOrder?.confirmed_at) {
        updates.confirmed_at = new Date().toISOString();
      }

      if (status === 'shipped' && !currentOrder?.shipped_at) {
        updates.shipped_at = new Date().toISOString();
        updates.tracking_number = `FR${Math.random().toString().slice(2, 11)}`;
      }

      if (status === 'delivered' && !currentOrder?.delivered_at) {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vente_orders')
        .update(updates)
        .eq('id', orderId)
        .select('*, items:vente_order_items(*)')
        .single();

      if (error) throw error;

      const updatedOrder: Order = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        confirmed_at: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
        shipped_at: data.shipped_at ? new Date(data.shipped_at) : undefined,
        delivered_at: data.delivered_at ? new Date(data.delivered_at) : undefined,
        items: (data.items || []).sort((a: any, b: any) => a.order_index - b.order_index),
      };

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
        .from('vente_orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId)
        .select('*, items:vente_order_items(*)')
        .single();

      if (error) throw error;

      const updatedOrder: Order = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        confirmed_at: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
        shipped_at: data.shipped_at ? new Date(data.shipped_at) : undefined,
        delivered_at: data.delivered_at ? new Date(data.delivered_at) : undefined,
        items: (data.items || []).sort((a: any, b: any) => a.order_index - b.order_index),
      };

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
      await supabase.from('vente_order_items').delete().eq('order_id', orderId);

      // Delete order
      const { error } = await supabase.from('vente_orders').delete().eq('id', orderId);

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
        .from('vente_tickets')
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

      setTickets(
        (data || []).map((item) => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
          resolved_at: item.resolved_at ? new Date(item.resolved_at) : undefined,
          closed_at: item.closed_at ? new Date(item.closed_at) : undefined,
          responses: (item.responses || []).map((r: any) => ({
            ...r,
            created_at: new Date(r.created_at),
          })),
        }))
      );
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
      // Generate ticket number
      const { count } = await supabase
        .from('vente_tickets')
        .select('*', { count: 'exact', head: true });

      const ticketNumber = `TICKET-${String((count || 0) + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('vente_tickets')
        .insert([
          {
            number: ticketNumber,
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
        .select('*, responses:vente_ticket_responses(*)')
        .single();

      if (error) throw error;

      const newTicket: Ticket = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        responses: [],
      };

      setTickets([newTicket, ...tickets]);
      toast({
        title: 'Ticket créé',
        description: `Le ticket ${ticketNumber} a été créé avec succès.`,
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
      const currentTicket = tickets.find((t) => t.id === ticketId);

      if (status === 'resolved' && !currentTicket?.resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }

      if (status === 'closed' && !currentTicket?.closed_at) {
        updates.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vente_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select('*, responses:vente_ticket_responses(*)')
        .single();

      if (error) throw error;

      const updatedTicket: Ticket = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        resolved_at: data.resolved_at ? new Date(data.resolved_at) : undefined,
        closed_at: data.closed_at ? new Date(data.closed_at) : undefined,
        responses: (data.responses || []).map((r: any) => ({
          ...r,
          created_at: new Date(r.created_at),
        })),
      };

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
        .from('vente_ticket_responses')
        .insert([responseInput])
        .select()
        .single();

      if (error) throw error;

      const newResponse: TicketResponse = {
        ...data,
        created_at: new Date(data.created_at),
      };

      // Update ticket with new response
      setTickets(
        tickets.map((t) =>
          t.id === responseInput.ticket_id
            ? { ...t, responses: [...t.responses, newResponse], updated_at: new Date() }
            : t
        )
      );

      toast({
        title: 'Réponse ajoutée',
        description: 'Votre réponse a été envoyée.',
      });

      return newResponse;
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
      await supabase.from('vente_ticket_responses').delete().eq('ticket_id', ticketId);

      // Delete ticket
      const { error } = await supabase.from('vente_tickets').delete().eq('id', ticketId);

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

  const loadStock = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vente_stock_items')
        .select('*, movements:vente_stock_movements(*)')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }

      if (filters?.location) {
        query = query.eq('location', filters.location);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      let items = (data || []).map((item) => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
        last_restocked_at: item.last_restocked_at ? new Date(item.last_restocked_at) : undefined,
        movements: (item.movements || []).map((m: any) => ({
          ...m,
          created_at: new Date(m.created_at),
        })),
      }));

      // Apply status filter
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
      console.error('Error loading stock:', error);
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
    loadStock();
  }, [loadStock]);

  const createStockItem = async (
    stockData: Omit<StockItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'movements'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('vente_stock_items')
        .insert([stockData])
        .select()
        .single();

      if (error) throw error;

      const newItem: StockItem = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        last_restocked_at: data.last_restocked_at ? new Date(data.last_restocked_at) : undefined,
        movements: [],
      };

      setStockItems([newItem, ...stockItems]);
      toast({
        title: 'Article créé',
        description: 'L\'article a été ajouté au stock.',
      });

      return newItem;
    } catch (error: any) {
      console.error('Error creating stock item:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer l\'article.',
      });
      return null;
    }
  };

  const updateStockItem = async (itemId: string, updates: Partial<StockItem>) => {
    try {
      const { data, error } = await supabase
        .from('vente_stock_items')
        .update(updates)
        .eq('id', itemId)
        .select('*, movements:vente_stock_movements(*)')
        .single();

      if (error) throw error;

      const updatedItem: StockItem = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        last_restocked_at: data.last_restocked_at ? new Date(data.last_restocked_at) : undefined,
        movements: (data.movements || []).map((m: any) => ({
          ...m,
          created_at: new Date(m.created_at),
        })),
      };

      setStockItems(stockItems.map((item) => (item.id === itemId ? updatedItem : item)));
      toast({
        title: 'Article mis à jour',
        description: 'L\'article a été modifié avec succès.',
      });

      return updatedItem;
    } catch (error: any) {
      console.error('Error updating stock item:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'article.',
      });
      return null;
    }
  };

  const deleteStockItem = async (itemId: string) => {
    try {
      // Delete movements first
      await supabase.from('vente_stock_movements').delete().eq('stock_item_id', itemId);

      // Delete stock item
      const { error } = await supabase.from('vente_stock_items').delete().eq('id', itemId);

      if (error) throw error;

      setStockItems(stockItems.filter((item) => item.id !== itemId));
      toast({
        title: 'Article supprimé',
        description: 'L\'article a été supprimé du stock.',
      });
    } catch (error: any) {
      console.error('Error deleting stock item:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'article.',
      });
    }
  };

  return {
    stockItems,
    loading,
    createStockItem,
    updateStockItem,
    deleteStockItem,
    loadStock,
  };
};

// ============================================================================
// 6. HOOK MOUVEMENTS DE STOCK
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
        .from('vente_stock_movements')
        .select('*')
        .eq('stock_item_id', stockItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMovements(
        (data || []).map((m) => ({
          ...m,
          created_at: new Date(m.created_at),
        }))
      );
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

  const addMovement = async (movementInput: CreateStockMovementInput) => {
    try {
      // Get current stock item
      const { data: stockItem, error: stockError } = await supabase
        .from('vente_stock_items')
        .select('quantity')
        .eq('id', movementInput.stock_item_id)
        .single();

      if (stockError) throw stockError;

      // Calculate new quantity
      let newQuantity = stockItem.quantity;
      if (movementInput.type === 'in' || movementInput.type === 'adjustment') {
        newQuantity += movementInput.quantity;
      } else if (movementInput.type === 'out') {
        newQuantity -= movementInput.quantity;
      }
      newQuantity = Math.max(0, newQuantity);

      // Create movement
      const { data: movementData, error: movementError } = await supabase
        .from('vente_stock_movements')
        .insert([movementInput])
        .select()
        .single();

      if (movementError) throw movementError;

      // Update stock quantity
      const updates: any = { quantity: newQuantity };
      if (movementInput.type === 'in') {
        updates.last_restocked_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('vente_stock_items')
        .update(updates)
        .eq('id', movementInput.stock_item_id);

      if (updateError) throw updateError;

      const newMovement: StockMovement = {
        ...movementData,
        created_at: new Date(movementData.created_at),
      };

      setMovements([newMovement, ...movements]);
      toast({
        title: 'Mouvement enregistré',
        description: 'Le mouvement de stock a été enregistré avec succès.',
      });

      return newMovement;
    } catch (error: any) {
      console.error('Error adding movement:', error);
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
    addMovement,
    loadMovements,
  };
};
