import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Boutique, BoutiqueFormData, BoutiqueStatut } from '@/types/caisse';

export const useBoutiques = () => {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadBoutiques = useCallback(async () => {
    try {
      setLoading(true);
      // Use type assertion since the table is newly created and types not yet regenerated
      const { data, error } = await (supabase as any)
        .from('boutiques')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;

      setBoutiques(
        (data || []).map((b: any) => ({
          ...b,
          created_at: new Date(b.created_at),
          updated_at: new Date(b.updated_at),
        }))
      );
    } catch (error: any) {
      console.error('Error loading boutiques:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les boutiques',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBoutiques();
  }, [loadBoutiques]);

  const createBoutique = async (
    formData: BoutiqueFormData
  ): Promise<Boutique | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('boutiques')
        .insert([
          {
            user_id: userData.user.id,
            ...formData,
            statut: formData.statut || 'active',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newBoutique: Boutique = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setBoutiques((prev) => [...prev, newBoutique]);

      toast({
        title: 'Succès',
        description: 'Boutique créée avec succès',
      });

      return newBoutique;
    } catch (error: any) {
      console.error('Error creating boutique:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la boutique',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateBoutique = async (
    id: string,
    updates: Partial<BoutiqueFormData>
  ): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from('boutiques')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setBoutiques((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, ...updates, updated_at: new Date() }
            : b
        )
      );

      toast({
        title: 'Succès',
        description: 'Boutique mise à jour avec succès',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating boutique:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la boutique',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteBoutique = async (id: string): Promise<boolean> => {
    try {
      const { error } = await (supabase as any).from('boutiques').delete().eq('id', id);

      if (error) throw error;

      setBoutiques((prev) => prev.filter((b) => b.id !== id));

      toast({
        title: 'Succès',
        description: 'Boutique supprimée avec succès',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting boutique:', error);
      toast({
        title: 'Erreur',
        description:
          error.message ||
          'Impossible de supprimer la boutique (vérifiez les dépendances)',
        variant: 'destructive',
      });
      return false;
    }
  };

  const changeStatut = async (
    id: string,
    statut: BoutiqueStatut
  ): Promise<boolean> => {
    return updateBoutique(id, { statut });
  };

  const getBoutiqueById = (id: string): Boutique | undefined => {
    return boutiques.find((b) => b.id === id);
  };

  const getBoutiquesActives = (): Boutique[] => {
    return boutiques.filter((b) => b.statut === 'active');
  };

  return {
    boutiques,
    loading,
    createBoutique,
    updateBoutique,
    deleteBoutique,
    changeStatut,
    getBoutiqueById,
    getBoutiquesActives,
    reload: loadBoutiques,
  };
};
