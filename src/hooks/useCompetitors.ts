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
        .order('added_at', { ascending: false });

      if (error) throw error;

      setCompetitors(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addCompetitor = async (competitor: Omit<Competitor, 'id' | 'user_id' | 'added_at' | 'last_analyzed_at' | 'analysis_count'>) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('competitors')
        .insert([{ 
          name: competitor.name,
          industry: competitor.industry,
          description: competitor.description,
          website_url: competitor.website_url,
          instagram_url: competitor.instagram_url,
          instagram_followers: competitor.instagram_followers,
          facebook_url: competitor.facebook_url,
          facebook_likes: competitor.facebook_likes,
          linkedin_url: competitor.linkedin_url,
          linkedin_followers: competitor.linkedin_followers,
          twitter_url: competitor.twitter_url,
          tiktok_url: competitor.tiktok_url,
          youtube_url: competitor.youtube_url,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setCompetitors(prev => [data, ...prev]);
      toast.success('Concurrent ajouté avec succès');
      return data;
    } catch (err) {
      toast.error('Erreur lors de l\'ajout du concurrent');
      throw err;
    }
  };

  const updateCompetitor = async (id: string, updates: Partial<Omit<Competitor, 'id' | 'user_id' | 'added_at' | 'last_analyzed_at' | 'analysis_count'>>) => {
    try {
      const { data, error } = await supabase
        .from('competitors')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.industry && { industry: updates.industry }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.website_url !== undefined && { website_url: updates.website_url }),
          ...(updates.instagram_url !== undefined && { instagram_url: updates.instagram_url }),
          ...(updates.instagram_followers !== undefined && { instagram_followers: updates.instagram_followers }),
          ...(updates.facebook_url !== undefined && { facebook_url: updates.facebook_url }),
          ...(updates.facebook_likes !== undefined && { facebook_likes: updates.facebook_likes }),
          ...(updates.linkedin_url !== undefined && { linkedin_url: updates.linkedin_url }),
          ...(updates.linkedin_followers !== undefined && { linkedin_followers: updates.linkedin_followers }),
          ...(updates.twitter_url !== undefined && { twitter_url: updates.twitter_url }),
          ...(updates.tiktok_url !== undefined && { tiktok_url: updates.tiktok_url }),
          ...(updates.youtube_url !== undefined && { youtube_url: updates.youtube_url })
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCompetitors(prev => prev.map(c => c.id === id ? data : c));
      toast.success('Concurrent mis à jour');
      return data;
    } catch (err) {
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
    addCompetitor,
    updateCompetitor,
    deleteCompetitor,
    refreshCompetitors: loadCompetitors
  };
};
