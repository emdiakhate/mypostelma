import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Warehouse } from '@/types/caisse';

interface WarehouseFormData {
  name: string;
  type?: 'STORE' | 'WAREHOUSE' | 'MOBILE' | 'OTHER';
  address?: string;
  city?: string;
  country?: string;
  gps_lat?: number;
  gps_lng?: number;
  manager_name?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

/**
 * Hook pour gérer les warehouses (boutiques/entrepôts)
 *
 * Utilise la table stock_warehouses du module Stock
 * - type='STORE' = boutique physique
 * - type='WAREHOUSE' = entrepôt
 * - type='MOBILE' = stock mobile
 */
export const useWarehouses = (filterType?: 'STORE' | 'WAREHOUSE' | 'MOBILE' | 'OTHER') => {
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

      // Filtrer par type si spécifié
      if (filterType) {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setWarehouses(
        (data || []).map((w) => ({
          ...w,
          created_at: new Date(w.created_at),
          updated_at: new Date(w.updated_at),
        }))
      );
    } catch (error: any) {
      console.error('Error loading warehouses:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les emplacements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filterType, toast]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const createWarehouse = async (
    formData: WarehouseFormData
  ): Promise<Warehouse | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('stock_warehouses')
        .insert([
          {
            user_id: userData.user.id,
            ...formData,
            type: formData.type || 'STORE',
            is_active: formData.is_active !== undefined ? formData.is_active : true,
            country: formData.country || 'Senegal',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newWarehouse: Warehouse = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setWarehouses((prev) => [...prev, newWarehouse]);

      toast({
        title: 'Succès',
        description: `${formData.type === 'STORE' ? 'Boutique' : 'Entrepôt'} créé(e) avec succès`,
      });

      return newWarehouse;
    } catch (error: any) {
      console.error('Error creating warehouse:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'emplacement',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateWarehouse = async (
    id: string,
    updates: Partial<WarehouseFormData>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('stock_warehouses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, ...updates, updated_at: new Date() }
            : w
        )
      );

      toast({
        title: 'Succès',
        description: 'Emplacement mis à jour avec succès',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating warehouse:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour l\'emplacement',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteWarehouse = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('stock_warehouses').delete().eq('id', id);

      if (error) throw error;

      setWarehouses((prev) => prev.filter((w) => w.id !== id));

      toast({
        title: 'Succès',
        description: 'Emplacement supprimé avec succès',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting warehouse:', error);
      toast({
        title: 'Erreur',
        description:
          error.message ||
          'Impossible de supprimer l\'emplacement (vérifiez les dépendances)',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleActive = async (
    id: string,
    is_active: boolean
  ): Promise<boolean> => {
    return updateWarehouse(id, { is_active });
  };

  const getWarehouseById = (id: string): Warehouse | undefined => {
    return warehouses.find((w) => w.id === id);
  };

  const getActiveWarehouses = (): Warehouse[] => {
    return warehouses.filter((w) => w.is_active);
  };

  const getStores = (): Warehouse[] => {
    return warehouses.filter((w) => w.type === 'STORE');
  };

  const getActiveStores = (): Warehouse[] => {
    return warehouses.filter((w) => w.type === 'STORE' && w.is_active);
  };

  return {
    warehouses,
    loading,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    toggleActive,
    getWarehouseById,
    getActiveWarehouses,
    getStores,
    getActiveStores,
    reload: loadWarehouses,
  };
};
