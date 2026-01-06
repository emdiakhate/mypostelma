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
  warehouse_from_id: item.warehouse_id, // DB column is 'warehouse_id'
  warehouse_to_id: item.destination_warehouse_id, // DB column is 'destination_warehouse_id'
  reason: item.reason,
  reference_type: item.reference_type,
  reference_id: item.reference_id,
  reference_number: item.reference_id,
  unit_cost: item.unit_cost ? Number(item.unit_cost) : undefined,
  total_cost: item.total_cost ? Number(item.total_cost) : undefined,
  notes: item.notes,
  created_at: new Date(item.created_at),
  created_by: item.performed_by, // DB column is 'performed_by'
  created_by_name: item.performed_by,
  // Relations avec vente_products
  product: item.vente_products ? mapDbProduct(item.vente_products) : undefined,
  warehouse_from: item.stock_warehouses ? mapDbWarehouse(item.stock_warehouses) : undefined,
  warehouse_to: item.destination_warehouse ? mapDbWarehouse(item.destination_warehouse) : undefined,
});

const mapDbDigitalAsset = (item: any): DigitalAsset => ({
  id: item.id,
  user_id: item.user_id,
  product_id: item.product_id,
  code_or_license: item.code, // DB column is 'code'
  activation_key: item.license_key, // DB column is 'license_key'
  status: item.status,
  assigned_to_customer: item.assigned_to,
  assigned_at: item.assigned_at ? new Date(item.assigned_at) : undefined,
  order_id: undefined,
  expires_at: item.expires_at ? new Date(item.expires_at) : undefined,
  notes: undefined,
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

  // Éviter les boucles de fetch dues à l'identité de l'objet `filters`
  const search = filters?.search;
  const type = filters?.type;
  const city = filters?.city;
  const isActive = filters?.is_active;

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_warehouses')
        .select('*')
        .order('name', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
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
  }, [search, type, city, isActive, toast]);

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

  // Éviter les boucles de fetch dues à l'identité de l'objet `filters`
  const productId = filters?.product_id;
  const warehouseId = filters?.warehouse_id;
  const movementType = filters?.movement_type;
  const referenceType = filters?.reference_type;
  const dateFromIso = filters?.date_from ? filters.date_from.toISOString() : undefined;
  const dateToIso = filters?.date_to ? filters.date_to.toISOString() : undefined;

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          vente_products:vente_products!stock_movements_product_id_fkey(*),
          stock_warehouses:stock_warehouses!stock_movements_warehouse_id_fkey(*),
          destination_warehouse:stock_warehouses!stock_movements_destination_warehouse_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (warehouseId) {
        query = query.or(
          `warehouse_id.eq.${warehouseId},destination_warehouse_id.eq.${warehouseId}`
        );
      }

      if (movementType) {
        query = query.eq('movement_type', movementType);
      }

      if (referenceType) {
        query = query.eq('reference_type', referenceType);
      }

      if (dateFromIso) {
        query = query.gte('created_at', dateFromIso);
      }

      if (dateToIso) {
        query = query.lte('created_at', dateToIso);
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
  }, [productId, warehouseId, movementType, referenceType, dateFromIso, dateToIso, toast]);

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

      // Mapper les champs pour la DB
      const dbInput = {
        user_id: userData.user.id,
        product_id: movementInput.product_id,
        warehouse_id: movementInput.warehouse_from_id || movementInput.warehouse_to_id,
        destination_warehouse_id: movementInput.movement_type === 'TRANSFER' ? movementInput.warehouse_to_id : null,
        movement_type: movementInput.movement_type,
        quantity: movementInput.quantity,
        unit_cost: movementInput.unit_cost,
        total_cost,
        reference_type: movementInput.reference_type,
        reference_id: movementInput.reference_number,
        reason: movementInput.reason,
        notes: movementInput.notes,
        performed_by: userData.user.email,
      };

      const { data, error } = await supabase
        .from('stock_movements')
        .insert([dbInput])
        .select(`
          *,
          vente_products:product_id(*),
          stock_warehouses:warehouse_id(*),
          destination_warehouse:destination_warehouse_id(*)
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

  // Éviter les boucles de fetch dues à l'identité de l'objet `filters`
  const productId = filters?.product_id;
  const status = filters?.status;
  const assignedToCustomer = filters?.assigned_to_customer;

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_digital_assets')
        .select('*, vente_products(*)')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (assignedToCustomer) {
        query = query.ilike('assigned_to_customer', `%${assignedToCustomer}%`);
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
  }, [productId, status, assignedToCustomer, toast]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);
  const createAsset = async (assetInput: CreateDigitalAssetInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Map les champs du type local vers les colonnes DB
      const dbInput = {
        user_id: userData.user.id,
        product_id: assetInput.product_id,
        code: assetInput.code_or_license, // DB column is 'code'
        license_key: assetInput.activation_key, // DB column is 'license_key'
        expires_at: assetInput.expires_at?.toISOString(),
        status: 'AVAILABLE',
      };

      const { data, error } = await supabase
        .from('stock_digital_assets')
        .insert([dbInput])
        .select('*, vente_products:product_id(*)')
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
      // Map les champs du type local vers les colonnes DB
      const dbUpdates: Record<string, any> = {};
      if (updates.code_or_license !== undefined) dbUpdates.code = updates.code_or_license;
      if (updates.activation_key !== undefined) dbUpdates.license_key = updates.activation_key;
      if (updates.expires_at !== undefined) dbUpdates.expires_at = updates.expires_at?.toISOString();
      if (updates.product_id !== undefined) dbUpdates.product_id = updates.product_id;

      const { data, error } = await supabase
        .from('stock_digital_assets')
        .update(dbUpdates)
        .eq('id', assetId)
        .select('*, vente_products:product_id(*)')
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

  // Éviter les boucles de fetch dues à l'identité de l'objet `filters`
  const productId = filters?.product_id;
  const warehouseId = filters?.warehouse_id;
  const minQuantity = filters?.min_quantity;
  const maxQuantity = filters?.max_quantity;
  const productType = filters?.product_type;

  const loadLevels = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_levels')
        .select('*')
        .order('product_name', { ascending: true });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      if (minQuantity !== undefined) {
        query = query.gte('current_quantity', minQuantity);
      }

      if (maxQuantity !== undefined) {
        query = query.lte('current_quantity', maxQuantity);
      }

      if (productType) {
        query = query.eq('product_type', productType);
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
  }, [productId, warehouseId, minQuantity, maxQuantity, productType, toast]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);
  // Fonction helper pour obtenir le stock d'un produit dans un entrepôt
  const getProductStock = async (productId: string, warehouseId?: string): Promise<number> => {
    try {
      // Use the stock_levels view instead of RPC
      let query = supabase
        .from('stock_levels')
        .select('current_quantity')
        .eq('product_id', productId);

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sum all quantities if no specific warehouse
      const totalQuantity = (data || []).reduce((sum, item) => sum + (item.current_quantity || 0), 0);
      return totalQuantity;
    } catch (error) {
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
      const currentStock = await getProductStock(productId, warehouseId);
      return currentStock >= quantity;
    } catch (error) {
      console.error('Error checking stock:', error);
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
