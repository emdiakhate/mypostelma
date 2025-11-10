import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LeadGenerationData {
  count: number;
  limit: number;
  remaining: number;
  canGenerate: boolean;
  isLoading: boolean;
}

export const useLeadGeneration = () => {
  const { user } = useAuth();
  const [data, setData] = useState<LeadGenerationData>({
    count: 0,
    limit: 3,
    remaining: 3,
    canGenerate: true,
    isLoading: true,
  });

  const fetchLeadGenerationData = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('lead_generation_count, lead_generation_limit, beta_user')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const count = profile?.lead_generation_count || 0;
      const limit = profile?.lead_generation_limit || 3;
      const remaining = Math.max(0, limit - count);
      const canGenerate = remaining > 0;

      setData({
        count,
        limit,
        remaining,
        canGenerate,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching lead generation data:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const incrementCount = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    try {
      const { data: result, error } = await supabase.rpc('increment_lead_generation', {
        p_user_id: user.id
      });

      if (error) throw error;

      // Typage explicite du résultat
      const typedResult = result as { 
        success: boolean; 
        message?: string; 
        count: number; 
        limit: number; 
        remaining: number; 
      };

      if (!typedResult.success) {
        toast.error(typedResult.message || 'Limite de génération atteinte');
        return false;
      }

      setData({
        count: typedResult.count,
        limit: typedResult.limit,
        remaining: typedResult.remaining,
        canGenerate: typedResult.remaining > 0,
        isLoading: false,
      });

      // Alertes selon le nombre restant
      if (typedResult.remaining === 0) {
        toast.error('Vous avez atteint la limite de génération de leads (3/3)');
      } else if (typedResult.remaining <= 1) {
        toast.warning(`Plus que ${typedResult.remaining} génération${typedResult.remaining > 1 ? 's' : ''} de leads restante${typedResult.remaining > 1 ? 's' : ''}`);
      } else {
        toast.success(`Lead généré avec succès (${typedResult.count}/${typedResult.limit})`);
      }

      return true;
    } catch (error) {
      console.error('Error incrementing lead generation count:', error);
      toast.error('Erreur lors de la génération du lead');
      return false;
    }
  };

  useEffect(() => {
    fetchLeadGenerationData();
  }, [user]);

  return {
    ...data,
    incrementCount,
    refreshData: fetchLeadGenerationData,
  };
};
