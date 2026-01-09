/**
 * useInventory Hook - Module Stock - Gestion d'inventaire
 *
 * Hooks pour la gestion d'inventaire:
 * 1. useInventories - Gestion des prises d'inventaire
 * 2. useAdjustments - Gestion des ajustements manuels
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  StockInventory,
  StockInventoryItem,
  StockAdjustment,
  InventoryStatus,
  AdjustmentReason,
  AdjustmentType,
} from '@/types/inventory';

// ============================================================================
// MAPPERS (DB → Types TypeScript)
// ============================================================================

const mapDbInventoryItem = (item: any): StockInventoryItem => ({
  id: item.id,
  inventory_id: item.inventory_id,
  product_id: item.product_id,
  expected_quantity: Number(item.expected_quantity),
  counted_quantity: item.counted_quantity != null ? Number(item.counted_quantity) : undefined,
  difference: item.difference != null ? Number(item.difference) : undefined,
  notes: item.notes,
  created_at: item.created_at,
  updated_at: item.updated_at,
  product: item.vente_products || undefined,
});

const mapDbInventory = (item: any): StockInventory => ({
  id: item.id,
  user_id: item.user_id,
  warehouse_id: item.warehouse_id,
  inventory_number: item.inventory_number,
  inventory_date: item.inventory_date,
  status: item.status,
  counted_by: item.counted_by,
  notes: item.notes,
  completed_at: item.completed_at,
  created_at: item.created_at,
  updated_at: item.updated_at,
  warehouse: item.stock_warehouses || undefined,
  items: item.stock_inventory_items
    ? item.stock_inventory_items.map(mapDbInventoryItem)
    : undefined,
});

const mapDbAdjustment = (item: any): StockAdjustment => ({
  id: item.id,
  user_id: item.user_id,
  warehouse_id: item.warehouse_id,
  product_id: item.product_id,
  adjustment_type: item.adjustment_type,
  quantity_before: Number(item.quantity_before),
  quantity_change: Number(item.quantity_change),
  quantity_after: Number(item.quantity_after),
  reason: item.reason,
  cost_impact: item.cost_impact ? Number(item.cost_impact) : undefined,
  notes: item.notes,
  performed_by: item.performed_by,
  performed_at: item.performed_at,
  created_at: item.created_at,
  warehouse: item.stock_warehouses || undefined,
  product: item.vente_products || undefined,
});

// ============================================================================
// 1. HOOK INVENTORIES / INVENTAIRES
// ============================================================================

interface InventoryFilters {
  warehouse_id?: string;
  status?: InventoryStatus;
  date_from?: Date;
  date_to?: Date;
}

interface CreateInventoryInput {
  warehouse_id: string;
  inventory_date: string;
  counted_by?: string;
  notes?: string;
}

interface UpdateInventoryItemInput {
  counted_quantity: number;
  notes?: string;
}

export const useInventories = (filters?: InventoryFilters) => {
  const [inventories, setInventories] = useState<StockInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const warehouseId = filters?.warehouse_id;
  const status = filters?.status;
  const dateFromIso = filters?.date_from?.toISOString();
  const dateToIso = filters?.date_to?.toISOString();

  const loadInventories = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_inventories')
        .select(`
          *,
          stock_warehouses(*),
          stock_inventory_items(*, vente_products(*))
        `)
        .order('created_at', { ascending: false });

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (dateFromIso) {
        query = query.gte('inventory_date', dateFromIso);
      }

      if (dateToIso) {
        query = query.lte('inventory_date', dateToIso);
      }

      const { data, error } = await query;

      if (error) throw error;

      setInventories((data || []).map(mapDbInventory));
    } catch (error: any) {
      console.error('Error loading inventories:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les inventaires.',
      });
    } finally {
      setLoading(false);
    }
  }, [warehouseId, status, dateFromIso, dateToIso, toast]);

  useEffect(() => {
    loadInventories();
  }, [loadInventories]);

  const generateInventoryNumber = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('stock_inventories')
        .select('inventory_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const lastNumber = data?.[0]?.inventory_number;
      if (!lastNumber) {
        return 'INV-2026-0001';
      }

      const match = lastNumber.match(/INV-(\d{4})-(\d{4})/);
      if (!match) {
        return 'INV-2026-0001';
      }

      const year = new Date().getFullYear();
      const lastYear = parseInt(match[1]);
      const lastNum = parseInt(match[2]);

      if (year !== lastYear) {
        return `INV-${year}-0001`;
      }

      const nextNum = (lastNum + 1).toString().padStart(4, '0');
      return `INV-${year}-${nextNum}`;
    } catch (error) {
      console.error('Error generating inventory number:', error);
      return `INV-${new Date().getFullYear()}-0001`;
    }
  };

  const createInventory = async (input: CreateInventoryInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const inventoryNumber = await generateInventoryNumber();

      const { data, error } = await supabase
        .from('stock_inventories')
        .insert([
          {
            user_id: userData.user.id,
            warehouse_id: input.warehouse_id,
            inventory_number: inventoryNumber,
            inventory_date: input.inventory_date,
            counted_by: input.counted_by,
            notes: input.notes,
            status: 'draft',
          },
        ])
        .select(`
          *,
          stock_warehouses(*),
          stock_inventory_items(*, vente_products(*))
        `)
        .single();

      if (error) throw error;

      const newInventory = mapDbInventory(data);
      setInventories((prev) => [newInventory, ...prev]);

      return newInventory;
    } catch (error: any) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  };

  const startInventory = async (inventoryId: string, productIds: string[]) => {
    try {
      // Récupérer les quantités actuelles depuis stock_levels
      const { data: stockLevels, error: levelsError } = await supabase
        .from('stock_levels')
        .select('product_id, current_quantity')
        .in('product_id', productIds);

      if (levelsError) throw levelsError;

      // Créer les lignes d'inventaire
      const items = productIds.map((productId) => {
        const level = stockLevels?.find((l) => l.product_id === productId);
        return {
          inventory_id: inventoryId,
          product_id: productId,
          expected_quantity: level?.current_quantity || 0,
        };
      });

      const { error: itemsError } = await supabase
        .from('stock_inventory_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Mettre à jour le statut à in_progress
      const { data, error: updateError } = await supabase
        .from('stock_inventories')
        .update({ status: 'in_progress' })
        .eq('id', inventoryId)
        .select(`
          *,
          stock_warehouses(*),
          stock_inventory_items(*, vente_products(*))
        `)
        .single();

      if (updateError) throw updateError;

      const updated = mapDbInventory(data);
      setInventories((prev) => prev.map((inv) => (inv.id === inventoryId ? updated : inv)));

      return updated;
    } catch (error: any) {
      console.error('Error starting inventory:', error);
      throw error;
    }
  };

  const updateInventoryItem = async (
    itemId: string,
    updates: UpdateInventoryItemInput
  ) => {
    try {
      // Calculer la différence
      const { data: itemData, error: fetchError } = await supabase
        .from('stock_inventory_items')
        .select('expected_quantity')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const difference = updates.counted_quantity - itemData.expected_quantity;

      const { error } = await supabase
        .from('stock_inventory_items')
        .update({
          counted_quantity: updates.counted_quantity,
          difference,
          notes: updates.notes,
        })
        .eq('id', itemId);

      if (error) throw error;

      await loadInventories();
    } catch (error: any) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  };

  const completeInventory = async (inventoryId: string) => {
    try {
      // Appeler la fonction PostgreSQL (cast as any car les types ne sont pas encore mis à jour)
      const { error } = await (supabase.rpc as any)('complete_inventory', {
        p_inventory_id: inventoryId,
      });

      if (error) throw error;

      await loadInventories();
    } catch (error: any) {
      console.error('Error completing inventory:', error);
      throw error;
    }
  };

  const deleteInventory = async (inventoryId: string) => {
    try {
      const { error } = await supabase
        .from('stock_inventories')
        .delete()
        .eq('id', inventoryId);

      if (error) throw error;

      setInventories((prev) => prev.filter((inv) => inv.id !== inventoryId));
    } catch (error: any) {
      console.error('Error deleting inventory:', error);
      throw error;
    }
  };

  return {
    inventories,
    loading,
    loadInventories,
    generateInventoryNumber,
    createInventory,
    startInventory,
    updateInventoryItem,
    completeInventory,
    deleteInventory,
  };
};

// ============================================================================
// 2. HOOK ADJUSTMENTS / AJUSTEMENTS
// ============================================================================

interface AdjustmentFilters {
  warehouse_id?: string;
  product_id?: string;
  reason?: AdjustmentReason;
  date_from?: Date;
  date_to?: Date;
}

interface CreateAdjustmentInput {
  warehouse_id: string;
  product_id: string;
  adjustment_type: AdjustmentType;
  quantity_change: number;
  reason: AdjustmentReason;
  cost_impact?: number;
  notes?: string;
}

export const useAdjustments = (filters?: AdjustmentFilters) => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const warehouseId = filters?.warehouse_id;
  const productId = filters?.product_id;
  const reason = filters?.reason;
  const dateFromIso = filters?.date_from?.toISOString();
  const dateToIso = filters?.date_to?.toISOString();

  const loadAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_adjustments')
        .select('*, stock_warehouses(*), vente_products(*)')
        .order('performed_at', { ascending: false });

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (reason) {
        query = query.eq('reason', reason);
      }

      if (dateFromIso) {
        query = query.gte('performed_at', dateFromIso);
      }

      if (dateToIso) {
        query = query.lte('performed_at', dateToIso);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAdjustments((data || []).map(mapDbAdjustment));
    } catch (error: any) {
      console.error('Error loading adjustments:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les ajustements.',
      });
    } finally {
      setLoading(false);
    }
  }, [warehouseId, productId, reason, dateFromIso, dateToIso, toast]);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  const createAdjustment = async (input: CreateAdjustmentInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Récupérer la quantité actuelle
      const { data: stockLevel, error: levelError } = await supabase
        .from('stock_levels')
        .select('current_quantity')
        .eq('product_id', input.product_id)
        .eq('warehouse_id', input.warehouse_id)
        .single();

      if (levelError && levelError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw levelError;
      }

      const quantityBefore = stockLevel?.current_quantity || 0;
      const quantityAfter = quantityBefore + input.quantity_change;

      // Créer l'ajustement
      const { data, error } = await supabase
        .from('stock_adjustments')
        .insert([
          {
            user_id: userData.user.id,
            warehouse_id: input.warehouse_id,
            product_id: input.product_id,
            adjustment_type: input.adjustment_type,
            quantity_before: quantityBefore,
            quantity_change: input.quantity_change,
            quantity_after: quantityAfter,
            reason: input.reason,
            cost_impact: input.cost_impact,
            notes: input.notes,
            performed_by: userData.user.email || 'Unknown',
          },
        ])
        .select('*, stock_warehouses(*), vente_products(*)')
        .single();

      if (error) throw error;

      // Créer le mouvement de stock correspondant
      await supabase.from('stock_movements').insert([
        {
          user_id: userData.user.id,
          product_id: input.product_id,
          warehouse_id: input.warehouse_id,
          movement_type: input.quantity_change > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          quantity: Math.abs(input.quantity_change),
          reason: `Ajustement manuel - ${input.reason}`,
          notes: input.notes,
          performed_by: userData.user.email || 'Unknown',
        },
      ]);

      const newAdjustment = mapDbAdjustment(data);
      setAdjustments((prev) => [newAdjustment, ...prev]);

      return newAdjustment;
    } catch (error: any) {
      console.error('Error creating adjustment:', error);
      throw error;
    }
  };

  const deleteAdjustment = async (adjustmentId: string) => {
    try {
      const { error } = await supabase
        .from('stock_adjustments')
        .delete()
        .eq('id', adjustmentId);

      if (error) throw error;

      setAdjustments((prev) => prev.filter((adj) => adj.id !== adjustmentId));
    } catch (error: any) {
      console.error('Error deleting adjustment:', error);
      throw error;
    }
  };

  return {
    adjustments,
    loading,
    loadAdjustments,
    createAdjustment,
    deleteAdjustment,
  };
};
