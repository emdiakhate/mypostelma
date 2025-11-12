import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Competitor } from '@/types/competitor';
import { toast } from 'sonner';

export const useCompetitors = () => {
  const { user } = useAuth();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCompetitors = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: Competitor[] = (data || []).map(item => ({
        ...item,
        added_at: new Date(item.added_at),
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
        social_media: item.social_media as Competitor['social_media'],
        metrics: item.metrics as Competitor['metrics']
      }));

      setCompetitors(transformedData);
    } catch (err) {
      console.error('Error loading competitors:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addCompetitor = async (competitor: Omit<Competitor, 'id' | 'user_id' | 'added_at' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('competitors')
        .insert([{ 
          name: competitor.name,
          category: competitor.category,
          address: competitor.address,
          city: competitor.city,
          postal_code: competitor.postal_code,
          phone: competitor.phone,
          email: competitor.email,
          website: competitor.website,
          social_media: competitor.social_media || {},
          notes: competitor.notes,
          tags: competitor.tags,
          metrics: competitor.metrics || {},
          source: competitor.source,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const transformedData: Competitor = {
        ...data,
        added_at: new Date(data.added_at),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        social_media: data.social_media as Competitor['social_media'],
        metrics: data.metrics as Competitor['metrics']
      };

      setCompetitors(prev => [transformedData, ...prev]);
      toast.success('Concurrent ajouté avec succès');
      return transformedData;
    } catch (err) {
      console.error('Error adding competitor:', err);
      toast.error('Erreur lors de l\'ajout du concurrent');
      throw err;
    }
  };

  const updateCompetitor = async (id: string, updates: Partial<Omit<Competitor, 'id' | 'user_id' | 'added_at' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('competitors')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.category && { category: updates.category }),
          ...(updates.address && { address: updates.address }),
          ...(updates.city && { city: updates.city }),
          ...(updates.postal_code !== undefined && { postal_code: updates.postal_code }),
          ...(updates.phone !== undefined && { phone: updates.phone }),
          ...(updates.email !== undefined && { email: updates.email }),
          ...(updates.website !== undefined && { website: updates.website }),
          ...(updates.social_media && { social_media: updates.social_media }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
          ...(updates.tags && { tags: updates.tags }),
          ...(updates.metrics && { metrics: updates.metrics }),
          ...(updates.source && { source: updates.source })
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedData: Competitor = {
        ...data,
        added_at: new Date(data.added_at),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        social_media: data.social_media as Competitor['social_media'],
        metrics: data.metrics as Competitor['metrics']
      };

      setCompetitors(prev => prev.map(c => c.id === id ? transformedData : c));
      toast.success('Concurrent mis à jour');
      return transformedData;
    } catch (err) {
      console.error('Error updating competitor:', err);
      toast.error('Erreur lors de la mise à jour');
      throw err;
    }
  };

  const deleteCompetitor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompetitors(prev => prev.filter(c => c.id !== id));
      toast.success('Concurrent supprimé');
    } catch (err) {
      console.error('Error deleting competitor:', err);
      toast.error('Erreur lors de la suppression');
      throw err;
    }
  };

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  return {
    competitors,
    loading,
    error,
    loadCompetitors,
    addCompetitor,
    updateCompetitor,
    deleteCompetitor,
  };
};
