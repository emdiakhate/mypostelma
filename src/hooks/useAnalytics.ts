import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformAnalytics {
  [platform: string]: {
    followers?: number;
    impressions?: number;
    profileViews?: number;
    reach?: number;
    reels_plays?: number;
    [key: string]: any;
  };
}

interface AnalyticsData {
  analytics: PlatformAnalytics;
}

export function useAnalytics(username?: string, platforms?: string[]) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    if (!username || !platforms || platforms.length === 0) {
      
      return;
    }

    try {
      setLoading(true);
      setError(null);

      

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('upload-post-analytics', {
        body: { username, platforms },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to fetch analytics');
      }

      
      setData(response.data);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch analytics';
      console.error('[useAnalytics] Error:', errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [username, platforms?.join(',')]);

  return { data, loading, error, refetch: fetchAnalytics };
}
