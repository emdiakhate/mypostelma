import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompetitorMetric {
  id: string;
  competitor_id: string;
  instagram_followers: number | null;
  facebook_likes: number | null;
  linkedin_followers: number | null;
  avg_engagement_rate: number | null;
  posts_last_7_days: number | null;
  posts_last_30_days: number | null;
  recorded_at: string;
}

export const useCompetitorMetrics = (competitorId: string | null, days: number = 30) => {
  const [metrics, setMetrics] = useState<CompetitorMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitorId) {
      setLoading(false);
      return;
    }

    const loadMetrics = async () => {
      try {
        setLoading(true);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { data, error } = await supabase
          .from('competitor_metrics_history')
          .select('*')
          .eq('competitor_id', competitorId)
          .gte('recorded_at', cutoffDate.toISOString())
          .order('recorded_at', { ascending: true });

        if (error) throw error;
        setMetrics(data || []);
      } catch (error) {
        console.error('Error loading metrics:', error);
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [competitorId, days]);

  return { metrics, loading };
};
