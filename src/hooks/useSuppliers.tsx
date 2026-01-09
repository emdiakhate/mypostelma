/**
 * useSuppliers Hook - Module Stock - Gestion Fournisseurs
 *
 * Hooks pour la gestion des fournisseurs:
 * 1. useSuppliers - Gestion fournisseurs
 * 2. useProductSuppliers - Relation produits-fournisseurs
 * 3. usePurchaseOrders - Commandes d'achat
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  Supplier,
  ProductSupplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PaymentStatus,
} from '@/types/suppliers';

// ============================================================================
// MAPPERS (DB → Types TypeScript)
// ============================================================================

const mapDbSupplier = (item: any): Supplier => ({
  id: item.id,
  user_id: item.user_id,
  name: item.name,
  company: item.company,
  email: item.email,
  phone: item.phone,
  address: item.address,
  city: item.city,
  country: item.country,
  tax_number: item.tax_number,
  payment_terms: item.payment_terms,
  bank_account: item.bank_account,
  notes: item.notes,
  is_active: item.is_active ?? true,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const mapDbProductSupplier = (item: any): ProductSupplier => ({
  id: item.id,
  user_id: item.user_id,
  product_id: item.product_id,
  supplier_id: item.supplier_id,
  supplier_sku: item.supplier_sku,
  purchase_price: item.purchase_price ? Number(item.purchase_price) : undefined,
  lead_time_days: item.lead_time_days,
  min_order_quantity: item.min_order_quantity ?? 1,
  is_preferred: item.is_preferred ?? false,
  notes: item.notes,
  created_at: item.created_at,
  updated_at: item.updated_at,
  supplier: item.suppliers ? mapDbSupplier(item.suppliers) : undefined,
  product: item.vente_products || undefined,
});

const mapDbPurchaseOrderItem = (item: any): PurchaseOrderItem => ({
  id: item.id,
  purchase_order_id: item.purchase_order_id,
  product_id: item.product_id,
  quantity: Number(item.quantity),
  unit_price: Number(item.unit_price),
  tax_rate: Number(item.tax_rate),
  discount_percent: Number(item.discount_percent),
  subtotal: Number(item.subtotal),
  total: Number(item.total),
  quantity_received: Number(item.quantity_received ?? 0),
  created_at: item.created_at,
  product: item.vente_products || undefined,
});

const mapDbPurchaseOrder = (item: any): PurchaseOrder => ({
  id: item.id,
  user_id: item.user_id,
  supplier_id: item.supplier_id,
  order_number: item.order_number,
  order_date: item.order_date,
  expected_delivery_date: item.expected_delivery_date,
  actual_delivery_date: item.actual_delivery_date,
  warehouse_id: item.warehouse_id,
  status: item.status,
  subtotal: Number(item.subtotal),
  tax_rate: Number(item.tax_rate),
  tax_amount: Number(item.tax_amount),
  shipping_cost: Number(item.shipping_cost),
  total: Number(item.total),
  payment_status: item.payment_status,
  amount_paid: Number(item.amount_paid ?? 0),
  notes: item.notes,
  created_at: item.created_at,
  updated_at: item.updated_at,
  supplier: item.suppliers ? mapDbSupplier(item.suppliers) : undefined,
  warehouse: item.stock_warehouses || undefined,
  items: item.purchase_order_items
    ? item.purchase_order_items.map(mapDbPurchaseOrderItem)
    : undefined,
});

// ============================================================================
// 1. HOOK SUPPLIERS / FOURNISSEURS
// ============================================================================

interface SupplierFilters {
  search?: string;
  is_active?: boolean;
  city?: string;
}

interface CreateSupplierInput {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_number?: string;
  payment_terms?: string;
  bank_account?: string;
  notes?: string;
  is_active?: boolean;
}

export const useSuppliers = (filters?: SupplierFilters) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const search = filters?.search;
  const isActive = filters?.is_active;
  const city = filters?.city;

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSuppliers((data || []).map(mapDbSupplier));
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les fournisseurs.',
      });
    } finally {
      setLoading(false);
    }
  }, [search, isActive, city, toast]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const createSupplier = async (supplierInput: CreateSupplierInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...supplierInput, user_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;

      const newSupplier = mapDbSupplier(data);
      setSuppliers((prev) => [newSupplier, ...prev]);

      return newSupplier;
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  };

  const updateSupplier = async (supplierId: string, updates: Partial<CreateSupplierInput>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', supplierId)
        .select()
        .single();

      if (error) throw error;

      const updatedSupplier = mapDbSupplier(data);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? updatedSupplier : s))
      );

      return updatedSupplier;
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;

      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  };

  return {
    suppliers,
    loading,
    loadSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
};

// ============================================================================
// 2. HOOK PRODUCT SUPPLIERS / PRODUITS-FOURNISSEURS
// ============================================================================

interface ProductSupplierFilters {
  product_id?: string;
  supplier_id?: string;
  is_preferred?: boolean;
}

interface CreateProductSupplierInput {
  product_id: string;
  supplier_id: string;
  supplier_sku?: string;
  purchase_price?: number;
  lead_time_days?: number;
  min_order_quantity?: number;
  is_preferred?: boolean;
  notes?: string;
}

export const useProductSuppliers = (filters?: ProductSupplierFilters) => {
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const productId = filters?.product_id;
  const supplierId = filters?.supplier_id;
  const isPreferred = filters?.is_preferred;

  const loadProductSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('product_suppliers')
        .select('*, suppliers(*), vente_products(*)')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      if (isPreferred !== undefined) {
        query = query.eq('is_preferred', isPreferred);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProductSuppliers((data || []).map(mapDbProductSupplier));
    } catch (error: any) {
      console.error('Error loading product suppliers:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les relations produits-fournisseurs.',
      });
    } finally {
      setLoading(false);
    }
  }, [productId, supplierId, isPreferred, toast]);

  useEffect(() => {
    loadProductSuppliers();
  }, [loadProductSuppliers]);

  const createProductSupplier = async (input: CreateProductSupplierInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('product_suppliers')
        .insert([{ ...input, user_id: userData.user.id }])
        .select('*, suppliers(*), vente_products(*)')
        .single();

      if (error) throw error;

      const newProductSupplier = mapDbProductSupplier(data);
      setProductSuppliers((prev) => [newProductSupplier, ...prev]);

      return newProductSupplier;
    } catch (error: any) {
      console.error('Error creating product supplier:', error);
      throw error;
    }
  };

  const updateProductSupplier = async (
    id: string,
    updates: Partial<CreateProductSupplierInput>
  ) => {
    try {
      const { data, error } = await supabase
        .from('product_suppliers')
        .update(updates)
        .eq('id', id)
        .select('*, suppliers(*), vente_products(*)')
        .single();

      if (error) throw error;

      const updated = mapDbProductSupplier(data);
      setProductSuppliers((prev) => prev.map((ps) => (ps.id === id ? updated : ps)));

      return updated;
    } catch (error: any) {
      console.error('Error updating product supplier:', error);
      throw error;
    }
  };

  const deleteProductSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProductSuppliers((prev) => prev.filter((ps) => ps.id !== id));
    } catch (error: any) {
      console.error('Error deleting product supplier:', error);
      throw error;
    }
  };

  return {
    productSuppliers,
    loading,
    loadProductSuppliers,
    createProductSupplier,
    updateProductSupplier,
    deleteProductSupplier,
  };
};

// ============================================================================
// 3. HOOK PURCHASE ORDERS / COMMANDES D'ACHAT
// ============================================================================

interface PurchaseOrderFilters {
  supplier_id?: string;
  status?: PurchaseOrderStatus;
  warehouse_id?: string;
  date_from?: Date;
  date_to?: Date;
}

interface CreatePurchaseOrderInput {
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  warehouse_id?: string;
  status?: PurchaseOrderStatus;
  tax_rate?: number;
  shipping_cost?: number;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
    discount_percent?: number;
  }[];
}

export const usePurchaseOrders = (filters?: PurchaseOrderFilters) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const supplierId = filters?.supplier_id;
  const status = filters?.status;
  const warehouseId = filters?.warehouse_id;
  const dateFromIso = filters?.date_from?.toISOString();
  const dateToIso = filters?.date_to?.toISOString();

  const loadPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(*),
          stock_warehouses(*),
          purchase_order_items(*, vente_products(*))
        `)
        .order('created_at', { ascending: false });

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      if (dateFromIso) {
        query = query.gte('order_date', dateFromIso);
      }

      if (dateToIso) {
        query = query.lte('order_date', dateToIso);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPurchaseOrders((data || []).map(mapDbPurchaseOrder));
    } catch (error: any) {
      console.error('Error loading purchase orders:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les commandes d\'achat.',
      });
    } finally {
      setLoading(false);
    }
  }, [supplierId, status, warehouseId, dateFromIso, dateToIso, toast]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  const generateOrderNumber = async (): Promise<string> => {
    try {
      // Récupérer le dernier numéro de commande
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const lastNumber = data?.[0]?.order_number;
      if (!lastNumber) {
        return 'CA-2026-0001';
      }

      // Extraire le numéro et incrémenter
      const match = lastNumber.match(/CA-(\d{4})-(\d{4})/);
      if (!match) {
        return 'CA-2026-0001';
      }

      const year = new Date().getFullYear();
      const lastYear = parseInt(match[1]);
      const lastNum = parseInt(match[2]);

      if (year !== lastYear) {
        return `CA-${year}-0001`;
      }

      const nextNum = (lastNum + 1).toString().padStart(4, '0');
      return `CA-${year}-${nextNum}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      return `CA-${new Date().getFullYear()}-0001`;
    }
  };

  const createPurchaseOrder = async (input: CreatePurchaseOrderInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Générer le numéro de commande
      const orderNumber = await generateOrderNumber();

      // Calculer les totaux
      let subtotal = 0;
      const itemsData = input.items.map((item) => {
        const itemSubtotal = item.quantity * item.unit_price;
        const discount = itemSubtotal * (item.discount_percent || 0) / 100;
        const afterDiscount = itemSubtotal - discount;
        const itemTotal = afterDiscount * (1 + (item.tax_rate || 0) / 100);
        subtotal += afterDiscount;
        return {
          ...item,
          subtotal: afterDiscount,
          total: itemTotal,
        };
      });

      const taxAmount = subtotal * (input.tax_rate || 0) / 100;
      const total = subtotal + taxAmount + (input.shipping_cost || 0);

      // Créer la commande
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([
          {
            user_id: userData.user.id,
            supplier_id: input.supplier_id,
            order_number: orderNumber,
            order_date: input.order_date,
            expected_delivery_date: input.expected_delivery_date,
            warehouse_id: input.warehouse_id,
            status: input.status || 'draft',
            subtotal,
            tax_rate: input.tax_rate || 0,
            tax_amount: taxAmount,
            shipping_cost: input.shipping_cost || 0,
            total,
            payment_status: 'unpaid',
            amount_paid: 0,
            notes: input.notes,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les lignes de commande
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(
          itemsData.map((item) => ({
            purchase_order_id: orderData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate || 0,
            discount_percent: item.discount_percent || 0,
            subtotal: item.subtotal,
            total: item.total,
            quantity_received: 0,
          }))
        );

      if (itemsError) throw itemsError;

      // Recharger la commande avec toutes les relations
      const { data: fullOrder, error: fullError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(*),
          stock_warehouses(*),
          purchase_order_items(*, vente_products(*))
        `)
        .eq('id', orderData.id)
        .single();

      if (fullError) throw fullError;

      const newOrder = mapDbPurchaseOrder(fullOrder);
      setPurchaseOrders((prev) => [newOrder, ...prev]);

      return newOrder;
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  };

  const updatePurchaseOrderStatus = async (
    orderId: string,
    status: PurchaseOrderStatus
  ) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', orderId)
        .select(`
          *,
          suppliers(*),
          stock_warehouses(*),
          purchase_order_items(*, vente_products(*))
        `)
        .single();

      if (error) throw error;

      const updated = mapDbPurchaseOrder(data);
      setPurchaseOrders((prev) => prev.map((po) => (po.id === orderId ? updated : po)));

      return updated;
    } catch (error: any) {
      console.error('Error updating purchase order status:', error);
      throw error;
    }
  };

  const receivePurchaseOrder = async (
    orderId: string,
    itemsReceived: { item_id: string; quantity_received: number }[]
  ) => {
    try {
      // Update each item with quantity received
      for (const item of itemsReceived) {
        const { error } = await supabase
          .from('purchase_order_items')
          .update({ quantity_received: item.quantity_received })
          .eq('id', item.item_id);

        if (error) throw error;
      }

      // Check if all items are fully received
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_items(*)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const allReceived = orderData.purchase_order_items.every(
        (item: any) => item.quantity_received >= item.quantity
      );
      const partiallyReceived = orderData.purchase_order_items.some(
        (item: any) => item.quantity_received > 0
      );

      const newStatus = allReceived
        ? 'received'
        : partiallyReceived
        ? 'partially_received'
        : orderData.status;

      // Update order status and actual delivery date if fully received
      const updates: any = { status: newStatus };
      if (allReceived) {
        updates.actual_delivery_date = new Date().toISOString().split('T')[0];
      }

      await updatePurchaseOrderStatus(orderId, newStatus as PurchaseOrderStatus);

      // Reload to get fresh data
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error('Error receiving purchase order:', error);
      throw error;
    }
  };

  const deletePurchaseOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setPurchaseOrders((prev) => prev.filter((po) => po.id !== orderId));
    } catch (error: any) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  };

  return {
    purchaseOrders,
    loading,
    loadPurchaseOrders,
    generateOrderNumber,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder,
    deletePurchaseOrder,
  };
};
