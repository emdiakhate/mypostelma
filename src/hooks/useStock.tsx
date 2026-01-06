/**
 * useStock Hook - Module Stock Complet
 *
 * Hook principal pour le module Stock avec 5 sous-hooks:
 * 1. useStockProducts - Gestion produits (référentiel)
 * 2. useWarehouses - Gestion entrepôts/boutiques
 * 3. useStockMovements - Gestion mouvements de stock
 * 4. useDigitalAssets - Gestion licences/codes digitaux
 * 5. useStockLevels - Calcul stock actuel (vue matérialisée)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  StockProduct,
  StockProductFilters,
  CreateStockProductInput,
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
  StockStats,
  ProductStockSummary,
} from '@/types/stock';

// Helper pour mapper les données DB vers les types locaux
const mapDbStockProduct = (item: any): StockProduct => ({
  id: item.id,
  user_id: item.user_id,
  name: item.name,
  description: item.description,
  type: item.type,
  category: item.category,
  sku: item.sku,
  barcode: item.barcode,
  price: item.price ? Number(item.price) : undefined,
  cost_price: item.cost_price ? Number(item.cost_price) : undefined,
  tax_rate: item.tax_rate ? Number(item.tax_rate) : undefined,
  is_stockable: item.is_stockable ?? true,
  track_serial: item.track_serial ?? false,
  image_url: item.image_url,
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
  product: item.stock_products ? mapDbStockProduct(item.stock_products) : undefined,
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
  product: item.stock_products ? mapDbStockProduct(item.stock_products) : undefined,
});

const mapDbStockLevel = (item: any): StockLevel => ({
  user_id: item.user_id,
  product_id: item.product_id,
  product_name: item.product_name,
  product_type: item.product_type,
  sku: item.sku,
  warehouse_id: item.warehouse_id,
  warehouse_name: item.warehouse_name,
  current_quantity: Number(item.current_quantity),
  average_cost: item.average_cost ? Number(item.average_cost) : undefined,
  last_movement_at: item.last_movement_at ? new Date(item.last_movement_at) : undefined,
});

// ============================================================================
// 1. HOOK PRODUITS STOCK
// ============================================================================

export const useStockProducts = (filters?: StockProductFilters) => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_products' as any)
        .select('*')
        .order('name', { ascending: true });

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

      if (filters?.is_stockable !== undefined) {
        query = query.eq('is_stockable', filters.is_stockable);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts((data || []).map(mapDbStockProduct));
    } catch (error: any) {
      console.error('Error loading stock products:', error);
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

  const createProduct = async (productInput: CreateStockProductInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('stock_products' as any)
        .insert([{ ...productInput, user_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;

      const newProduct = mapDbStockProduct(data);
      setProducts([newProduct, ...products]);
      toast({
        title: 'Produit créé',
        description: 'Le produit a été ajouté au référentiel.',
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

  const updateProduct = async (productId: string, updates: Partial<StockProduct>) => {
    try {
      const { data, error } = await supabase
        .from('stock_products' as any)
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct = mapDbStockProduct(data);
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
        .from('stock_products' as any)
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productId));
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé du référentiel.',
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

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    loadProducts,
  };
};

// ============================================================================
// 2. HOOK ENTREPÔTS/BOUTIQUES
// ============================================================================

export const useWarehouses = (filters?: WarehouseFilters) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_warehouses' as any)
        .select('*')
        .order('name', { ascending: true });

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
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
        .from('stock_warehouses' as any)
        .insert([{ ...warehouseInput, user_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;

      const newWarehouse = mapDbWarehouse(data);
      setWarehouses([newWarehouse, ...warehouses]);
      toast({
        title: 'Entrepôt créé',
        description: 'L\'entrepôt a été ajouté avec succès.',
      });

      return newWarehouse;
    } catch (error: any) {
      console.error('Error creating warehouse:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer l\'entrepôt.',
      });
      return null;
    }
  };

  const updateWarehouse = async (warehouseId: string, updates: Partial<Warehouse>) => {
    try {
      const { data, error } = await supabase
        .from('stock_warehouses' as any)
        .update(updates)
        .eq('id', warehouseId)
        .select()
        .single();

      if (error) throw error;

      const updatedWarehouse = mapDbWarehouse(data);
      setWarehouses(warehouses.map((w) => (w.id === warehouseId ? updatedWarehouse : w)));
      toast({
        title: 'Entrepôt mis à jour',
        description: 'L\'entrepôt a été modifié avec succès.',
      });

      return updatedWarehouse;
    } catch (error: any) {
      console.error('Error updating warehouse:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'entrepôt.',
      });
      return null;
    }
  };

  const deleteWarehouse = async (warehouseId: string) => {
    try {
      const { error } = await supabase
        .from('stock_warehouses' as any)
        .delete()
        .eq('id', warehouseId);

      if (error) throw error;

      setWarehouses(warehouses.filter((w) => w.id !== warehouseId));
      toast({
        title: 'Entrepôt supprimé',
        description: 'L\'entrepôt a été supprimé.',
      });
    } catch (error: any) {
      console.error('Error deleting warehouse:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'entrepôt.',
      });
    }
  };

  return {
    warehouses,
    loading,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    loadWarehouses,
  };
};

// ============================================================================
// 3. HOOK MOUVEMENTS DE STOCK
// ============================================================================

export const useStockMovements = (filters?: StockMovementFilters) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_movements' as any)
        .select(`
          *,
          stock_products(*),
          warehouse_from:stock_warehouses!warehouse_from_id(*),
          warehouse_to:stock_warehouses!warehouse_to_id(*)
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

      // Calcul total_cost
      const totalCost =
        movementInput.unit_cost && movementInput.quantity
          ? movementInput.unit_cost * movementInput.quantity
          : undefined;

      const { data, error } = await supabase
        .from('stock_movements' as any)
        .insert([
          {
            ...movementInput,
            user_id: userData.user.id,
            total_cost: totalCost,
            created_by: userData.user.id,
            created_by_name: userData.user.email || 'Unknown',
          },
        ])
        .select(`
          *,
          stock_products(*),
          warehouse_from:stock_warehouses!warehouse_from_id(*),
          warehouse_to:stock_warehouses!warehouse_to_id(*)
        `)
        .single();

      if (error) throw error;

      const newMovement = mapDbStockMovement(data);
      setMovements([newMovement, ...movements]);
      toast({
        title: 'Mouvement enregistré',
        description: 'Le mouvement de stock a été enregistré avec succès.',
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

  const deleteMovement = async (movementId: string) => {
    try {
      const { error } = await supabase
        .from('stock_movements' as any)
        .delete()
        .eq('id', movementId);

      if (error) throw error;

      setMovements(movements.filter((m) => m.id !== movementId));
      toast({
        title: 'Mouvement supprimé',
        description: 'Le mouvement a été supprimé.',
      });
    } catch (error: any) {
      console.error('Error deleting movement:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le mouvement.',
      });
    }
  };

  return {
    movements,
    loading,
    createMovement,
    deleteMovement,
    loadMovements,
  };
};

// ============================================================================
// 4. HOOK DIGITAL ASSETS
// ============================================================================

export const useDigitalAssets = (filters?: DigitalAssetFilters) => {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_digital_assets' as any)
        .select('*, stock_products(*)')
        .order('created_at', { ascending: false });

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.assigned_to_customer) {
        query = query.ilike('assigned_to_customer', `%${filters.assigned_to_customer}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAssets((data || []).map(mapDbDigitalAsset));
    } catch (error: any) {
      console.error('Error loading digital assets:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les assets digitaux.',
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
        .from('stock_digital_assets' as any)
        .insert([{ ...assetInput, user_id: userData.user.id, status: 'AVAILABLE' }])
        .select('*, stock_products(*)')
        .single();

      if (error) throw error;

      const newAsset = mapDbDigitalAsset(data);
      setAssets([newAsset, ...assets]);
      toast({
        title: 'Asset créé',
        description: 'L\'asset digital a été ajouté.',
      });

      return newAsset;
    } catch (error: any) {
      console.error('Error creating digital asset:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer l\'asset.',
      });
      return null;
    }
  };

  const updateAsset = async (assetId: string, updates: Partial<DigitalAsset>) => {
    try {
      const { data, error} = await supabase
        .from('stock_digital_assets' as any)
        .update(updates)
        .eq('id', assetId)
        .select('*, stock_products(*)')
        .single();

      if (error) throw error;

      const updatedAsset = mapDbDigitalAsset(data);
      setAssets(assets.map((a) => (a.id === assetId ? updatedAsset : a)));
      toast({
        title: 'Asset mis à jour',
        description: 'L\'asset a été modifié.',
      });

      return updatedAsset;
    } catch (error: any) {
      console.error('Error updating asset:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'asset.',
      });
      return null;
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('stock_digital_assets' as any)
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      setAssets(assets.filter((a) => a.id !== assetId));
      toast({
        title: 'Asset supprimé',
        description: 'L\'asset a été supprimé.',
      });
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'asset.',
      });
    }
  };

  return {
    assets,
    loading,
    createAsset,
    updateAsset,
    deleteAsset,
    loadAssets,
  };
};

// ============================================================================
// 5. HOOK STOCK LEVELS (Vue calculée)
// ============================================================================

export const useStockLevels = (filters?: StockLevelFilters) => {
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadLevels = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_levels' as any)
        .select('*')
        .order('current_quantity', { ascending: true });

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }

      if (filters?.min_quantity !== undefined) {
        query = query.gte('current_quantity', filters.min_quantity);
      }

      if (filters?.max_quantity !== undefined) {
        query = query.lte('current_quantity', filters.max_quantity);
      }

      if (filters?.product_type) {
        query = query.eq('product_type', filters.product_type);
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

  // Fonction helper pour obtenir le stock d'un produit dans un entrepôt
  const getProductStock = async (productId: string, warehouseId?: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('get_stock_quantity', {
        p_product_id: productId,
        p_warehouse_id: warehouseId || null,
      });

      if (error) throw error;

      return Number(data || 0);
    } catch (error) {
      console.error('Error getting product stock:', error);
      return 0;
    }
  };

  // Fonction helper pour vérifier stock disponible
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
// 6. HOOK PRINCIPAL (COMBINÉ)
// ============================================================================

export const useStock = () => {
  const products = useStockProducts();
  const warehouses = useWarehouses();
  const movements = useStockMovements();
  const digitalAssets = useDigitalAssets();
  const stockLevels = useStockLevels();

  return {
    products,
    warehouses,
    movements,
    digitalAssets,
    stockLevels,
  };
};

export default useStock;
