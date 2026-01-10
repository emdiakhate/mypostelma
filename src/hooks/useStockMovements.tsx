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
      // Use type assertion since the table is newly created and types not yet regenerated
      let query = (supabase as any)
        .from('stock_movements')
        .select(
          `
          *,
          boutique:boutiques(id, nom),
          produit:vente_products(id, name, sku)
        `
        )
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.boutique_id) {
        query = query.eq('boutique_id', filters.boutique_id);
      }
      if (filters?.produit_id) {
        query = query.eq('produit_id', filters.produit_id);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.statut) {
        query = query.eq('statut', filters.statut);
      }
      if (filters?.date_debut) {
        query = query.gte('created_at', filters.date_debut.toISOString());
      }
      if (filters?.date_fin) {
        query = query.lte('created_at', filters.date_fin.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setMovements(
        (data || []).map((m: any) => ({
          ...m,
          created_at: new Date(m.created_at),
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
        // Calculate stock from movements (stock_actuel is a materialized view that may not exist)
        let query = (supabase as any)
          .from('stock_movements')
          .select(
            `
            boutique_id,
            produit_id,
            quantite,
            boutique:boutiques(id, nom),
            produit:vente_products(id, name, sku, price)
          `
          )
          .eq('statut', 'completed');

        if (boutiqueId) {
          query = query.eq('boutique_id', boutiqueId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Aggregate by boutique_id + produit_id
        const stockMap = new Map<string, StockActuel>();

        (data || []).forEach((m: any) => {
          const key = `${m.boutique_id}-${m.produit_id}`;
          const existing = stockMap.get(key);

          if (existing) {
            existing.quantite_disponible += m.quantite || 0;
            existing.derniere_mise_a_jour = new Date();
          } else {
            stockMap.set(key, {
              boutique_id: m.boutique_id,
              produit_id: m.produit_id,
              quantite_disponible: m.quantite || 0,
              derniere_mise_a_jour: new Date(),
              boutique: m.boutique,
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

      const { data, error } = await (supabase as any)
        .from('stock_movements')
        .insert([
          {
            ...formData,
            user_id: userData.user.id,
            statut: 'completed',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newMovement: StockMovement = {
        ...data,
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
