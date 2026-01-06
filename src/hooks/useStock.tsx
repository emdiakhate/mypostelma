/**
 * useStock Hook - Module Stock
 *
 * Hook principal pour le module Stock avec 4 hooks:
 * 1. useWarehouses - Gestion entrepôts/boutiques
 * 2. useStockMovements - Gestion mouvements de stock
 * 3. useDigitalAssets - Gestion licences/codes digitaux
 * 4. useStockLevels - Calcul stock actuel (vue matérialisée)
 *
 * NOTE: Les produits proviennent de useProducts (module Vente)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from './useVente'; // Import produits de Vente
import type { Product } from '@/types/vente'; // Import type Product
import type {
  Warehouse,
  WarehouseFilters,
  CreateWarehouseInput,
  StockMovement,
  StockMovementFilters,
  CreateStockMovementInput,
  DigitalAsset,
  DigitalAssetFilters,
  CreateDigitalAssetInput,
  StockLevel,
  StockLevelFilters,
} from '@/types/stock';

// ============================================================================
// MAPPERS (DB → Types TypeScript)
// ============================================================================

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

const mapDbWarehouse = (item: any): Warehouse => ({
  id: item.id,
  user_id: item.user_id,
  name: item.name,
  type: item.type,
  address: item.address,
  city: item.city,
  country: item.country,
  gps_lat: item.gps_lat ? Number(item.gps_lat) : undefined,
  gps_lng: item.gps_lng ? Number(item.gps_lng) : undefined,
  manager_name: item.manager_name,
  phone: item.phone,
  email: item.email,
  is_active: item.is_active ?? true,
  notes: item.notes,
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
});

const mapDbStockMovement = (item: any): StockMovement => ({
  id: item.id,
  user_id: item.user_id,
  product_id: item.product_id,
  movement_type: item.movement_type,
  quantity: Number(item.quantity),
  warehouse_from_id: item.warehouse_from_id,
  warehouse_to_id: item.warehouse_to_id,
  reason: item.reason,
  reference_type: item.reference_type,
  reference_id: item.reference_id,
  reference_number: item.reference_number,
  unit_cost: item.unit_cost ? Number(item.unit_cost) : undefined,
  total_cost: item.total_cost ? Number(item.total_cost) : undefined,
  notes: item.notes,
  created_at: new Date(item.created_at),
  created_by: item.created_by,
  created_by_name: item.created_by_name,
  // Relations avec vente_products
  product: item.vente_products ? mapDbProduct(item.vente_products) : undefined,
  warehouse_from: item.warehouse_from ? mapDbWarehouse(item.warehouse_from) : undefined,
  warehouse_to: item.warehouse_to ? mapDbWarehouse(item.warehouse_to) : undefined,
});

const mapDbDigitalAsset = (item: any): DigitalAsset => ({
  id: item.id,
  user_id: item.user_id,
  product_id: item.product_id,
  code_or_license: item.code_or_license,
  activation_key: item.activation_key,
  status: item.status,
  assigned_to_customer: item.assigned_to_customer,
  assigned_at: item.assigned_at ? new Date(item.assigned_at) : undefined,
  order_id: item.order_id,
  expires_at: item.expires_at ? new Date(item.expires_at) : undefined,
  notes: item.notes,
  created_at: new Date(item.created_at),
  updated_at: new Date(item.updated_at),
  // Relation avec vente_products
  product: item.vente_products ? mapDbProduct(item.vente_products) : undefined,
});

const mapDbStockLevel = (item: any): StockLevel => ({
  user_id: item.user_id,
  product_id: item.product_id,
  product_name: item.product_name,
  product_type: item.product_type,
  category: item.category,
  sku: item.sku,
  warehouse_id: item.warehouse_id,
  warehouse_name: item.warehouse_name,
  warehouse_city: item.warehouse_city,
  current_quantity: Number(item.current_quantity),
  average_cost: item.average_cost ? Number(item.average_cost) : undefined,
  last_movement_at: item.last_movement_at ? new Date(item.last_movement_at) : undefined,
});

// ============================================================================
// 1. HOOK WAREHOUSES / ENTREPÔTS
// ============================================================================

export const useWarehouses = (filters?: WarehouseFilters) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_warehouses')
        .select('*')
        .order('name', { ascending: true });

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;

      setWarehouses((data || []).map(mapDbWarehouse));
    } catch (error: any) {
      console.error('Error loading warehouses:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les entrepôts.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const createWarehouse = async (warehouseInput: CreateWarehouseInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('stock_warehouses')
        .insert([{ ...warehouseInput, user_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;

      const newWarehouse = mapDbWarehouse(data);
      setWarehouses((prev) => [newWarehouse, ...prev]);

      return newWarehouse;
    } catch (error: any) {
      console.error('Error creating warehouse:', error);
      throw error;
    }
  };

  const updateWarehouse = async (warehouseId: string, updates: Partial<CreateWarehouseInput>) => {
    try {
      const { data, error } = await supabase
        .from('stock_warehouses')
        .update(updates)
        .eq('id', warehouseId)
        .select()
        .single();

      if (error) throw error;

      const updatedWarehouse = mapDbWarehouse(data);
      setWarehouses((prev) =>
        prev.map((w) => (w.id === warehouseId ? updatedWarehouse : w))
      );

      return updatedWarehouse;
    } catch (error: any) {
      console.error('Error updating warehouse:', error);
      throw error;
    }
  };

  const deleteWarehouse = async (warehouseId: string) => {
    try {
      const { error } = await supabase
        .from('stock_warehouses')
        .delete()
        .eq('id', warehouseId);

      if (error) throw error;

      setWarehouses((prev) => prev.filter((w) => w.id !== warehouseId));
    } catch (error: any) {
      console.error('Error deleting warehouse:', error);
      throw error;
    }
  };

  return {
    warehouses,
    loading,
    loadWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };
};

// ============================================================================
// 2. HOOK STOCK MOVEMENTS / MOUVEMENTS DE STOCK
// ============================================================================

export const useStockMovements = (filters?: StockMovementFilters) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          vente_products(*),
          warehouse_from:stock_warehouses!stock_movements_warehouse_from_id_fkey(*),
          warehouse_to:stock_warehouses!stock_movements_warehouse_to_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.warehouse_id) {
        query = query.or(
          `warehouse_from_id.eq.${filters.warehouse_id},warehouse_to_id.eq.${filters.warehouse_id}`
        );
      }

      if (filters?.movement_type) {
        query = query.eq('movement_type', filters.movement_type);
      }

      if (filters?.reference_type) {
        query = query.eq('reference_type', filters.reference_type);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setMovements((data || []).map(mapDbStockMovement));
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
  }, [filters, toast]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const createMovement = async (movementInput: CreateStockMovementInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Calculer total_cost si unit_cost fourni
      const total_cost = movementInput.unit_cost
        ? movementInput.unit_cost * movementInput.quantity
        : undefined;

      const { data, error } = await supabase
        .from('stock_movements')
        .insert([
          {
            ...movementInput,
            total_cost,
            user_id: userData.user.id,
            created_by: userData.user.email,
          },
        ])
        .select(`
          *,
          vente_products(*),
          warehouse_from:stock_warehouses!stock_movements_warehouse_from_id_fkey(*),
          warehouse_to:stock_warehouses!stock_movements_warehouse_to_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      const newMovement = mapDbStockMovement(data);
      setMovements((prev) => [newMovement, ...prev]);

      return newMovement;
    } catch (error: any) {
      console.error('Error creating movement:', error);
      throw error;
    }
  };

  return {
    movements,
    loading,
    loadMovements,
    createMovement,
  };
};

// ============================================================================
// 3. HOOK DIGITAL ASSETS / ACTIFS DIGITAUX
// ============================================================================

export const useDigitalAssets = (filters?: DigitalAssetFilters) => {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_digital_assets')
        .select('*, vente_products(*)')
        .order('created_at', { ascending: false });

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.assigned_to_customer) {
        query = query.eq('assigned_to_customer', filters.assigned_to_customer);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAssets((data || []).map(mapDbDigitalAsset));
    } catch (error: any) {
      console.error('Error loading digital assets:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les actifs digitaux.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const createAsset = async (assetInput: CreateDigitalAssetInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('stock_digital_assets')
        .insert([{ ...assetInput, user_id: userData.user.id, status: 'AVAILABLE' }])
        .select('*, vente_products(*)')
        .single();

      if (error) throw error;

      const newAsset = mapDbDigitalAsset(data);
      setAssets((prev) => [newAsset, ...prev]);

      return newAsset;
    } catch (error: any) {
      console.error('Error creating digital asset:', error);
      throw error;
    }
  };

  const updateAsset = async (assetId: string, updates: Partial<CreateDigitalAssetInput>) => {
    try {
      const { data, error } = await supabase
        .from('stock_digital_assets')
        .update(updates)
        .eq('id', assetId)
        .select('*, vente_products(*)')
        .single();

      if (error) throw error;

      const updatedAsset = mapDbDigitalAsset(data);
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updatedAsset : a)));

      return updatedAsset;
    } catch (error: any) {
      console.error('Error updating digital asset:', error);
      throw error;
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('stock_digital_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (error: any) {
      console.error('Error deleting digital asset:', error);
      throw error;
    }
  };

  return {
    assets,
    loading,
    loadAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  };
};

// ============================================================================
// 4. HOOK STOCK LEVELS / NIVEAUX DE STOCK
// ============================================================================

export const useStockLevels = (filters?: StockLevelFilters) => {
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadLevels = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_levels')
        .select('*')
        .order('product_name', { ascending: true });

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }

      if (filters?.product_type) {
        query = query.eq('product_type', filters.product_type);
      }

      if (filters?.min_quantity !== undefined) {
        query = query.gte('current_quantity', filters.min_quantity);
      }

      if (filters?.max_quantity !== undefined) {
        query = query.lte('current_quantity', filters.max_quantity);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLevels((data || []).map(mapDbStockLevel));
    } catch (error: any) {
      console.error('Error loading stock levels:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les niveaux de stock.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  // RPC Functions
  const getProductStock = async (productId: string, warehouseId?: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('get_stock_quantity', {
        p_product_id: productId,
        p_warehouse_id: warehouseId || null,
      });

      if (error) throw error;

      return Number(data) || 0;
    } catch (error: any) {
      console.error('Error getting product stock:', error);
      return 0;
    }
  };

  const checkStockAvailable = async (
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_stock_available', {
        p_product_id: productId,
        p_warehouse_id: warehouseId,
        p_quantity: quantity,
      });

      if (error) throw error;

      return Boolean(data);
    } catch (error: any) {
      console.error('Error checking stock available:', error);
      return false;
    }
  };

  return {
    levels,
    loading,
    loadLevels,
    getProductStock,
    checkStockAvailable,
  };
};

// ============================================================================
// 5. HOOK PRINCIPAL (COMBINÉ)
// ============================================================================

export const useStock = () => {
  const products = useProducts(); // Produits depuis module Vente
  const warehouses = useWarehouses();
  const movements = useStockMovements();
  const digitalAssets = useDigitalAssets();
  const stockLevels = useStockLevels();

  return {
    products, // useProducts du module Vente
    warehouses,
    movements,
    digitalAssets,
    stockLevels,
  };
};

export default useStock;
