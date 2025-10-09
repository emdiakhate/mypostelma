/**
 * Hook pour la gestion des analytics
 * Phase 3: Analytics Interface
 */

import { useState, useEffect, useCallback } from 'react';
import { AnalyticsSummary, AnalyticsFilters, SocialPlatform } from '@/types/analytics';

// Fonction pour générer des données mock cohérentes
const generateMockAnalytics = (
  period: { start: Date; end: Date },
  platforms: SocialPlatform[]
): AnalyticsSummary => {
  const days = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Générer des données quotidiennes
  const dailyEngagement = Array.from({ length: days }, (_, i) => {
    const date = new Date(period.start);
    date.setDate(date.getDate() + i);
    
    return {
      date: date.toISOString().split('T')[0],
      engagement: Math.floor(Math.random() * 500) + 100,
      impressions: Math.floor(Math.random() * 5000) + 1000,
      posts: Math.floor(Math.random() * 3) + 1
    };
  });

  // Calculer les totaux
  const totalLikes = dailyEngagement.reduce((sum, day) => sum + day.engagement, 0);
  const totalImpressions = dailyEngagement.reduce((sum, day) => sum + day.impressions, 0);
  const totalComments = Math.floor(totalLikes * 0.1);
  const totalShares = Math.floor(totalLikes * 0.05);
  const totalReach = Math.floor(totalImpressions * 0.8);
  const avgEngagementRate = (totalLikes + totalComments + totalShares) / totalImpressions * 100;

  // Performance par plateforme
  const platformPerformance = platforms.map(platform => ({
    platform,
    impressions: Math.floor(Math.random() * 10000) + 5000,
    engagementRate: Math.random() * 5 + 1
  }));

  // Top posts - Données de boucherie avec vrais textes
  const boucheriePosts = [
    {
      postId: 'post-1',
      platform: 'instagram' as SocialPlatform,
      publishedAt: new Date(period.start.getTime() + Math.random() * (period.end.getTime() - period.start.getTime())),
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
      caption: '🥩 Découvrez notre sélection premium de viandes fraîches chez Mata Viande ! Nos steaks de bœuf sont parfaits pour vos grillades du weekend. Livraison gratuite dès 50€ ! #MataViande #QualitéPremium #BoucherieEnLigne',
      metrics: {
        likes: 1247,
        comments: 89,
        shares: 45,
        impressions: 8500,
        reach: 6800,
        engagement: 1381,
        engagementRate: 16.2,
        saves: 67,
        clicks: 234
      },
      lastUpdated: new Date()
    },
    {
      postId: 'post-2',
      platform: 'facebook' as SocialPlatform,
      publishedAt: new Date(period.start.getTime() + Math.random() * (period.end.getTime() - period.start.getTime())),
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop',
      caption: '🍗 Nos poulets fermiers élevés en plein air arrivent frais chaque matin ! Parfait pour un repas familial de qualité. Commandez maintenant et profitez de notre offre spéciale !',
      metrics: {
        likes: 892,
        comments: 67,
        shares: 34,
        impressions: 6200,
        reach: 4950,
        engagement: 993,
        engagementRate: 16.0,
        saves: 45,
        clicks: 156
      },
      lastUpdated: new Date()
    },
    {
      postId: 'post-3',
      platform: 'instagram' as SocialPlatform,
      publishedAt: new Date(period.start.getTime() + Math.random() * (period.end.getTime() - period.start.getTime())),
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop',
      caption: '🥓 Bacon artisanal fumé au bois de hêtre - Une saveur incomparable ! Nos charcuteries sont préparées selon les méthodes traditionnelles. Disponible en magasin et en ligne.',
      metrics: {
        likes: 756,
        comments: 43,
        shares: 28,
        impressions: 4800,
        reach: 3840,
        engagement: 827,
        engagementRate: 17.2,
        saves: 38,
        clicks: 98
      },
      lastUpdated: new Date()
    },
    {
      postId: 'post-4',
      platform: 'facebook' as SocialPlatform,
      publishedAt: new Date(period.start.getTime() + Math.random() * (period.end.getTime() - period.start.getTime())),
      image: 'https://images.unsplash.com/photo-1574781330855-d0f35f2e55ed?w=400&h=400&fit=crop',
      caption: '🐟 Poisson frais du jour ! Saumon, cabillaud, dorade... Tous nos poissons sont sélectionnés avec soin pour leur fraîcheur. Idéal pour un dîner sain et savoureux.',
      metrics: {
        likes: 634,
        comments: 52,
        shares: 31,
        impressions: 4200,
        reach: 3360,
        engagement: 717,
        engagementRate: 17.1,
        saves: 42,
        clicks: 87
      },
      lastUpdated: new Date()
    },
    {
      postId: 'post-5',
      platform: 'instagram' as SocialPlatform,
      publishedAt: new Date(period.start.getTime() + Math.random() * (period.end.getTime() - period.start.getTime())),
      image: 'https://images.unsplash.com/photo-1588347818501-0d0b0b0b0b0b?w=400&h=400&fit=crop',
      caption: '🍖 Côte de bœuf maturée 28 jours - Un délice pour les amateurs de viande ! Accompagnée de nos légumes de saison. Réservez votre table pour ce weekend.',
      metrics: {
        likes: 1123,
        comments: 78,
        shares: 41,
        impressions: 7200,
        reach: 5760,
        engagement: 1242,
        engagementRate: 17.3,
        saves: 58,
        clicks: 189
      },
      lastUpdated: new Date()
    }
  ];

  const topPosts = boucheriePosts;

  // Performance par type de contenu
  const contentTypePerformance = [
    { type: 'Image simple', avgEngagement: Math.random() * 200 + 100, count: 15 },
    { type: 'Carousel', avgEngagement: Math.random() * 300 + 200, count: 8 },
    { type: 'Reel', avgEngagement: Math.random() * 500 + 300, count: 12 },
    { type: 'Story', avgEngagement: Math.random() * 150 + 50, count: 25 }
  ];

  // Meilleurs moments
  const bestTimes = Array.from({ length: 20 }, () => ({
    day: Math.floor(Math.random() * 7),
    hour: Math.floor(Math.random() * 24),
    avgEngagement: Math.random() * 200 + 50
  }));

  return {
    totalLikes,
    totalComments,
    totalShares,
    totalImpressions,
    totalReach,
    avgEngagementRate,
    bestPerformingPlatform: platforms[0],
    bestPerformingPost: topPosts[0],
    dailyEngagement,
    platformPerformance,
    topPosts,
    contentTypePerformance,
    bestTimes
  };
};

export function useAnalytics(filters: AnalyticsFilters) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    try {
      // TODO: Remplacer par Ayrshare API
      // Endpoint: GET /api/analytics/post?id=XXX
      // Documentation: https://docs.ayrshare.com/rest-api/endpoints/analytics
      
      const fetchRealAnalytics = async () => {
        // const response = await fetch(`https://app.ayrshare.com/api/analytics/post?id=${postId}`, {
        //   headers: { 'Authorization': `Bearer ${AYRSHARE_API_KEY}` }
        // });
        // return response.json();
      };

      // Simulation du délai API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = generateMockAnalytics(filters.period, filters.platforms);
      setData(mockData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.period, filters.platforms]);

  const refresh = useCallback(() => {
    const now = new Date();
    if (lastRefresh && now.getTime() - lastRefresh.getTime() < 10 * 60 * 1000) {
      // Rate limit: 10 minutes minimum entre les refresh
      return;
    }
    fetchData();
  }, [fetchData, lastRefresh]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    refresh,
    lastRefresh,
    canRefresh: !lastRefresh || new Date().getTime() - lastRefresh.getTime() >= 10 * 60 * 1000
  };
}
