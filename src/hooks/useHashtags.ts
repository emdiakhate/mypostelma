import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { getDomainHashtags } from '@/data/hashtagsByDomain';

export interface CustomHashtag {
  id: string;
  hashtag: string;
  domain: string;
  usage_count: number;
}

export const useHashtags = (domain: string) => {
  const { currentUser } = useAuth();
  const [customHashtags, setCustomHashtags] = useState<CustomHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les hashtags prédéfinis du domaine
  const predefinedHashtags = getDomainHashtags(domain);

  // Charger les hashtags personnels de l'utilisateur
  const loadCustomHashtags = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('user_custom_hashtags')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('domain', domain)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      setCustomHashtags(data || []);
    } catch (error) {
      console.error('Erreur chargement hashtags personnels:', error);
    }
  }, [currentUser, domain]);

  useEffect(() => {
    loadCustomHashtags();
  }, [loadCustomHashtags]);

  // Ajouter un hashtag personnel
  const addCustomHashtag = useCallback(async (hashtag: string) => {
    if (!currentUser) {
      toast.error('Vous devez être connecté');
      return false;
    }

    // Validation format
    const cleanHashtag = hashtag.trim();
    if (!cleanHashtag.startsWith('#')) {
      toast.error('Le hashtag doit commencer par #');
      return false;
    }

    if (cleanHashtag.length < 2) {
      toast.error('Le hashtag est trop court');
      return false;
    }

    if (cleanHashtag.includes(' ')) {
      toast.error('Le hashtag ne peut pas contenir d\'espaces');
      return false;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_custom_hashtags')
        .insert({
          user_id: currentUser.id,
          domain,
          hashtag: cleanHashtag,
          usage_count: 0
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('Ce hashtag existe déjà dans vos favoris');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Hashtag ajouté à vos favoris');
      await loadCustomHashtags();
      return true;
    } catch (error) {
      console.error('Erreur ajout hashtag:', error);
      toast.error('Erreur lors de l\'ajout du hashtag');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, domain, loadCustomHashtags]);

  // Supprimer un hashtag personnel
  const removeCustomHashtag = useCallback(async (id: string) => {
    if (!currentUser) return false;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_custom_hashtags')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      toast.success('Hashtag supprimé');
      await loadCustomHashtags();
      return true;
    } catch (error) {
      console.error('Erreur suppression hashtag:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, loadCustomHashtags]);

  // Incrémenter le compteur d'utilisation
  const incrementUsage = useCallback(async (hashtag: string) => {
    if (!currentUser) return;

    try {
      // Trouver le hashtag dans les customs
      const custom = customHashtags.find(h => h.hashtag === hashtag);
      if (!custom) return;

      await supabase
        .from('user_custom_hashtags')
        .update({ usage_count: custom.usage_count + 1 })
        .eq('id', custom.id);

      // Mettre à jour l'état local
      setCustomHashtags(prev => 
        prev.map(h => 
          h.id === custom.id 
            ? { ...h, usage_count: h.usage_count + 1 }
            : h
        ).sort((a, b) => b.usage_count - a.usage_count)
      );
    } catch (error) {
      console.error('Erreur incrémentation usage:', error);
    }
  }, [currentUser, customHashtags]);

  return {
    predefinedHashtags,
    customHashtags,
    isLoading,
    addCustomHashtag,
    removeCustomHashtag,
    incrementUsage,
    refreshHashtags: loadCustomHashtags
  };
};
