/**
 * Hook pour récupérer les analytics depuis Supabase
 * Connecté à post_analytics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsSummary, AnalyticsFilters, PostAnalytics } from '@/types/analytics';
import { SocialPlatform } from '@/types/Post';

export function useAnalytics(filters: AnalyticsFilters) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const lastFetchRef = useRef<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Récupérer les posts avec leurs analytics dans la période
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          post_analytics (
            likes,
            comments,
            shares,
            views,
            reach,
            updated_at
          )
        `)
        .gte('published_at', filters.period.start.toISOString())
        .lte('published_at', filters.period.end.toISOString())
        .eq('status', 'published');

      if (postsError) throw postsError;

      // Filtrer par plateformes si spécifié
      const filteredPosts = postsData?.filter(post => 
        filters.platforms.length === 0 || 
        post.platforms.some((p: string) => filters.platforms.includes(p as SocialPlatform))
      ) || [];

      // Calculer les métriques globales
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      let totalImpressions = 0;
      let totalReach = 0;
      let totalEngagement = 0;
      let postCount = 0;

      const postAnalytics: PostAnalytics[] = [];
      const dailyEngagementMap = new Map<string, { engagement: number; impressions: number; posts: number }>();
      const platformMetrics = new Map<SocialPlatform, { impressions: number; engagement: number; count: number }>();
      const hourlyEngagement = new Map<string, { engagement: number; count: number }>();

      filteredPosts.forEach(post => {
        const analytics = post.post_analytics?.[0];
        if (!analytics) return;

        const likes = analytics.likes || 0;
        const comments = analytics.comments || 0;
        const shares = analytics.shares || 0;
        const views = analytics.views || 0;
        const reach = analytics.reach || 0;

        totalLikes += likes;
        totalComments += comments;
        totalShares += shares;
        totalImpressions += views;
        totalReach += reach;
        
        const engagement = likes + comments + shares;
        totalEngagement += engagement;
        postCount++;

        // Créer l'objet PostAnalytics
        const postAnalytic: PostAnalytics = {
          postId: post.id,
          platform: post.platforms[0] as SocialPlatform,
          publishedAt: new Date(post.published_at),
          metrics: {
            likes,
            comments,
            shares,
            impressions: views,
            reach,
            engagement,
            engagementRate: views > 0 ? (engagement / views) * 100 : 0,
          },
          lastUpdated: new Date(analytics.updated_at)
        };
        postAnalytics.push(postAnalytic);

        // Agrégation par jour
        const dateKey = new Date(post.published_at).toISOString().split('T')[0];
        const dayData = dailyEngagementMap.get(dateKey) || { engagement: 0, impressions: 0, posts: 0 };
        dayData.engagement += engagement;
        dayData.impressions += views;
        dayData.posts += 1;
        dailyEngagementMap.set(dateKey, dayData);

        // Agrégation par plateforme
        post.platforms.forEach((platform: SocialPlatform) => {
          const platData = platformMetrics.get(platform) || { impressions: 0, engagement: 0, count: 0 };
          platData.impressions += views;
          platData.engagement += engagement;
          platData.count += 1;
          platformMetrics.set(platform, platData);
        });

        // Agrégation par heure
        const publishedDate = new Date(post.published_at);
        const day = publishedDate.getDay();
        const hour = publishedDate.getHours();
        const hourKey = `${day}-${hour}`;
        const hourData = hourlyEngagement.get(hourKey) || { engagement: 0, count: 0 };
        hourData.engagement += engagement;
        hourData.count += 1;
        hourlyEngagement.set(hourKey, hourData);
      });

      // Calculer le taux d'engagement moyen
      const avgEngagementRate = totalImpressions > 0 
        ? (totalEngagement / totalImpressions) * 100 
        : 0;

      // Trouver la meilleure plateforme
      let bestPlatform: SocialPlatform = 'instagram';
      let bestEngagementRate = 0;
      platformMetrics.forEach((metrics, platform) => {
        const rate = metrics.impressions > 0 ? (metrics.engagement / metrics.impressions) * 100 : 0;
        if (rate > bestEngagementRate) {
          bestEngagementRate = rate;
          bestPlatform = platform;
        }
      });

      // Trouver le meilleur post
      const bestPost = postAnalytics.reduce((best, current) => {
        return current.metrics.engagementRate > best.metrics.engagementRate ? current : best;
      }, postAnalytics[0]);

      // Préparer les données pour le graphique quotidien
      const dailyEngagement = Array.from(dailyEngagementMap.entries())
        .map(([date, data]) => ({
          date,
          engagement: data.engagement,
          impressions: data.impressions,
          posts: data.posts
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Préparer les performances par plateforme
      const platformPerformance = Array.from(platformMetrics.entries())
        .map(([platform, metrics]) => ({
          platform,
          impressions: metrics.impressions,
          engagementRate: metrics.impressions > 0 ? (metrics.engagement / metrics.impressions) * 100 : 0
        }));

      // Top posts
      const topPosts = [...postAnalytics]
        .sort((a, b) => b.metrics.engagement - a.metrics.engagement)
        .slice(0, 5);

      // Performance par type de contenu (simplifié)
      const contentTypePerformance = [
        {
          type: 'Image',
          avgEngagement: totalEngagement / Math.max(postCount, 1),
          count: postCount
        }
      ];

      // Meilleurs moments (heatmap data)
      const bestTimes = Array.from(hourlyEngagement.entries())
        .map(([key, data]) => {
          const [day, hour] = key.split('-').map(Number);
          return {
            day,
            hour,
            avgEngagement: data.engagement / data.count
          };
        })
        .sort((a, b) => b.avgEngagement - a.avgEngagement);

      const summary: AnalyticsSummary = {
        totalLikes,
        totalComments,
        totalShares,
        totalImpressions,
        totalReach,
        avgEngagementRate,
        bestPerformingPlatform: bestPlatform,
        bestPerformingPost: bestPost,
        dailyEngagement,
        platformPerformance,
        topPosts,
        contentTypePerformance,
        bestTimes
      };

      setData(summary);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refresh = useCallback(() => {
    const now = new Date();
    const timeSinceLastFetch = now.getTime() - lastFetchRef.current.getTime();
    
    // Rate limiting: 10 minutes
    if (timeSinceLastFetch < 10 * 60 * 1000) {
      alert('Veuillez attendre avant de rafraîchir à nouveau');
      return;
    }
    
    lastFetchRef.current = now;
    fetchData();
  }, [fetchData]);

  const canRefresh = useCallback(() => {
    const now = new Date();
    const timeSinceLastFetch = now.getTime() - lastFetchRef.current.getTime();
    return timeSinceLastFetch >= 10 * 60 * 1000;
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    refresh,
    lastRefresh,
    canRefresh: canRefresh()
  };
}
