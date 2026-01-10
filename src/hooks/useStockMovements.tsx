import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  StockMovement,
  StockActuel,
  StockMovementFormData,
  StockMovementFilters,
} from '@/types/caisse';

export const useStockMovements = (filters?: StockMovementFilters) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockActuel, setStockActuel] = useState<StockActuel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      // La table stock_movements utilise warehouse_id (pas boutique_id)
      // et product_id (pas produit_id)
      let query = (supabase as any)
        .from('stock_movements')
        .select(
          `
          *,
          produit:vente_products!product_id(id, name, sku)
        `
        )
        .order('created_at', { ascending: false });

      // Apply filters - map boutique_id to warehouse_id for compatibility
      if (filters?.boutique_id) {
        query = query.eq('warehouse_id', filters.boutique_id);
      }
      if (filters?.produit_id) {
        query = query.eq('product_id', filters.produit_id);
      }
      if (filters?.type) {
        query = query.eq('movement_type', filters.type);
      }
      if (filters?.date_debut) {
        query = query.gte('created_at', filters.date_debut.toISOString());
      }
      if (filters?.date_fin) {
        query = query.lte('created_at', filters.date_fin.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map the data to the expected format
      setMovements(
        (data || []).map((m: any) => ({
          id: m.id,
          boutique_id: m.warehouse_id,
          produit_id: m.product_id,
          quantite: m.quantity,
          type: m.movement_type,
          reference_type: m.reference_type,
          reference_id: m.reference_id,
          user_id: m.user_id,
          notes: m.notes,
          statut: 'completed',
          created_at: new Date(m.created_at),
          produit: m.produit,
        }))
      );
    } catch (error: any) {
      console.error('Error loading stock movements:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les mouvements de stock',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const loadStockActuel = useCallback(
    async (boutiqueId?: string) => {
      try {
        // La table stock_movements utilise warehouse_id et product_id
        let query = (supabase as any)
          .from('stock_movements')
          .select(
            `
            warehouse_id,
            product_id,
            quantity,
            movement_type,
            produit:vente_products!product_id(id, name, sku, price)
          `
          );

        if (boutiqueId) {
          query = query.eq('warehouse_id', boutiqueId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Aggregate by warehouse_id + product_id
        const stockMap = new Map<string, StockActuel>();

        (data || []).forEach((m: any) => {
          const key = `${m.warehouse_id}-${m.product_id}`;
          const existing = stockMap.get(key);
          
          // Calculate quantity based on movement type
          let qty = m.quantity || 0;
          if (m.movement_type === 'OUT') {
            qty = -qty;
          }

          if (existing) {
            existing.quantite_disponible += qty;
            existing.derniere_mise_a_jour = new Date();
          } else {
            stockMap.set(key, {
              boutique_id: m.warehouse_id,
              produit_id: m.product_id,
              quantite_disponible: qty,
              derniere_mise_a_jour: new Date(),
              produit: m.produit,
            });
          }
        });

        // Filter out negative or zero stock
        const stockList = Array.from(stockMap.values()).filter(
          (s) => s.quantite_disponible > 0
        );

        // Sort by quantity ascending
        stockList.sort((a, b) => a.quantite_disponible - b.quantite_disponible);

        setStockActuel(stockList);
      } catch (error: any) {
        console.error('Error loading stock actuel:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le stock actuel',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const createMovement = async (
    formData: StockMovementFormData
  ): Promise<StockMovement | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Map from caisse types to stock_movements table structure
      const { data, error } = await (supabase as any)
        .from('stock_movements')
        .insert([
          {
            user_id: userData.user.id,
            product_id: formData.produit_id,
            warehouse_id: formData.boutique_id,
            movement_type: formData.type === 'entree' ? 'IN' : formData.type === 'sortie' ? 'OUT' : 'ADJUSTMENT',
            quantity: formData.quantite,
            reference_type: formData.reference_type,
            reference_id: formData.reference_id,
            notes: formData.notes,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newMovement: StockMovement = {
        id: data.id,
        boutique_id: data.warehouse_id,
        produit_id: data.product_id,
        quantite: data.quantity,
        type: data.movement_type === 'IN' ? 'entree' : data.movement_type === 'OUT' ? 'sortie' : 'ajustement',
        reference_type: data.reference_type,
        reference_id: data.reference_id,
        user_id: data.user_id,
        notes: data.notes,
        statut: 'completed',
        created_at: new Date(data.created_at),
      };

      setMovements((prev) => [newMovement, ...prev]);

      toast({
        title: 'Succès',
        description: 'Mouvement de stock enregistré avec succès',
      });

      // Rafraîchir le stock actuel
      await loadStockActuel(formData.boutique_id);

      return newMovement;
    } catch (error: any) {
      console.error('Error creating movement:', error);
      toast({
        title: 'Erreur',
        description:
          error.message || 'Impossible de créer le mouvement de stock',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getStockProduit = (
    boutiqueId: string,
    produitId: string
  ): number => {
    const stock = stockActuel.find(
      (s) => s.boutique_id === boutiqueId && s.produit_id === produitId
    );
    return stock?.quantite_disponible || 0;
  };

  const checkStockDisponible = (
    boutiqueId: string,
    produitId: string,
    quantiteRequise: number
  ): boolean => {
    const quantiteDisponible = getStockProduit(boutiqueId, produitId);
    return quantiteDisponible >= quantiteRequise;
  };

  const getStocksBoutique = (boutiqueId: string): StockActuel[] => {
    return stockActuel.filter((s) => s.boutique_id === boutiqueId);
  };

  const getStocksBas = (
    boutiqueId: string,
    seuil: number = 10
  ): StockActuel[] => {
    return stockActuel.filter(
      (s) => s.boutique_id === boutiqueId && s.quantite_disponible <= seuil
    );
  };

  const getTotalStockValue = (boutiqueId: string): number => {
    return stockActuel
      .filter((s) => s.boutique_id === boutiqueId)
      .reduce((total, s) => {
        const price = s.produit?.price || 0;
        return total + s.quantite_disponible * price;
      }, 0);
  };

  return {
    movements,
    stockActuel,
    loading,
    createMovement,
    getStockProduit,
    checkStockDisponible,
    getStocksBoutique,
    getStocksBas,
    getTotalStockValue,
    reloadMovements: loadMovements,
    reloadStock: loadStockActuel,
  };
};
