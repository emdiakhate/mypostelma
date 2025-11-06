import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface QuotaInfo {
  count: number;
  limit: number;
  remaining: number;
}

export interface UserQuotas {
  ai_images: QuotaInfo;
  ai_videos: QuotaInfo;
  lead_searches: QuotaInfo;
  beta_user: boolean;
  quota_reset_date: string;
}

/**
 * Hook pour gérer les quotas des beta-testeurs
 * - Images IA: 15 max
 * - Vidéos IA: 5 max
 * - Recherches de leads: 5 max (avec 10 résultats max par recherche)
 */
export function useQuotas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les quotas de l'utilisateur
  const {
    data: quotas,
    isLoading,
    error,
    refetch,
  } = useQuery<UserQuotas>({
    queryKey: ['user-quotas', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_user_quotas', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as UserQuotas;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 60000, // 1 minute
  });

  // Vérifier si un quota spécifique est disponible
  const canUseQuota = (type: 'ai_images' | 'ai_videos' | 'lead_searches'): boolean => {
    if (!quotas) return false;
    if (!quotas.beta_user) return true; // Pas de limite pour les non-beta
    return quotas[type].remaining > 0;
  };

  // Obtenir le message d'erreur approprié
  const getQuotaErrorMessage = (type: 'ai_images' | 'ai_videos' | 'lead_searches'): string => {
    const messages = {
      ai_images: `Vous avez atteint votre limite de génération d'images IA (${quotas?.ai_images.limit || 15} max). Contactez-nous pour augmenter votre quota.`,
      ai_videos: `Vous avez atteint votre limite de génération de vidéos IA (${quotas?.ai_videos.limit || 5} max). Contactez-nous pour augmenter votre quota.`,
      lead_searches: `Vous avez atteint votre limite de recherches de leads (${quotas?.lead_searches.limit || 5} max). Contactez-nous pour augmenter votre quota.`,
    };
    return messages[type];
  };

  // Mutation pour incrémenter le compteur d'images IA
  const incrementImageQuota = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('increment_ai_image_generation', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to increment quota');
      }

      return result;
    },
    onSuccess: () => {
      // Rafraîchir les quotas
      queryClient.invalidateQueries({ queryKey: ['user-quotas', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation pour incrémenter le compteur de vidéos IA
  const incrementVideoQuota = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('increment_ai_video_generation', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to increment quota');
      }

      return result;
    },
    onSuccess: () => {
      // Rafraîchir les quotas
      queryClient.invalidateQueries({ queryKey: ['user-quotas', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation pour incrémenter le compteur de recherches de leads (utilise la fonction existante)
  const incrementLeadSearchQuota = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('increment_lead_generation', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to increment quota');
      }

      return result;
    },
    onSuccess: () => {
      // Rafraîchir les quotas
      queryClient.invalidateQueries({ queryKey: ['user-quotas', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Fonction helper pour vérifier et consommer un quota
  const checkAndUseQuota = async (
    type: 'ai_images' | 'ai_videos' | 'lead_searches'
  ): Promise<boolean> => {
    // Vérifier d'abord si le quota est disponible
    if (!canUseQuota(type)) {
      toast.error(getQuotaErrorMessage(type));
      return false;
    }

    try {
      // Incrémenter le compteur approprié
      if (type === 'ai_images') {
        await incrementImageQuota.mutateAsync();
      } else if (type === 'ai_videos') {
        await incrementVideoQuota.mutateAsync();
      } else if (type === 'lead_searches') {
        await incrementLeadSearchQuota.mutateAsync();
      }

      return true;
    } catch (error) {
      console.error('Failed to use quota:', error);
      return false;
    }
  };

  return {
    quotas,
    isLoading,
    error,
    refetch,
    canUseQuota,
    getQuotaErrorMessage,
    checkAndUseQuota,
    incrementImageQuota: incrementImageQuota.mutate,
    incrementVideoQuota: incrementVideoQuota.mutate,
    incrementLeadSearchQuota: incrementLeadSearchQuota.mutate,
    isIncrementingImage: incrementImageQuota.isPending,
    isIncrementingVideo: incrementVideoQuota.isPending,
    isIncrementingLeadSearch: incrementLeadSearchQuota.isPending,
  };
}
