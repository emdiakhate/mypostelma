import { useState, useEffect, useMemo } from 'react';
import { SocialPlatform } from '@/types/Post';
import { 
  HashtagAnalyticsService, 
  HashtagStats, 
  HashtagSet, 
  HashtagSuggestion 
} from '@/services/hashtagAnalytics';

export interface HashtagFilters {
  platform?: SocialPlatform;
  performance?: 'high' | 'medium' | 'low';
  trend?: 'up' | 'down' | 'stable';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface HashtagAnalytics {
  allHashtags: HashtagStats[];
  topPerformers: HashtagStats[];
  trending: HashtagStats[];
  hashtagSets: HashtagSet[];
  suggestions: HashtagSuggestion[];
  combinations: Array<{
    combination: string[];
    avgEngagement: number;
    usageCount: number;
  }>;
  totalHashtags: number;
  avgEngagement: number;
  bestPerformingSet: HashtagSet | null;
}

/**
 * Hook personnalisé pour l'analyse des hashtags
 * @param posts - Posts à analyser
 * @param filters - Filtres optionnels
 * @returns Données d'analyse complètes des hashtags
 */
export const useHashtagStats = (
  posts: any[] = [],
  filters: HashtagFilters = {}
): HashtagAnalytics => {
  const [analytics, setAnalytics] = useState<HashtagAnalytics>({
    allHashtags: [],
    topPerformers: [],
    trending: [],
    hashtagSets: [],
    suggestions: [],
    combinations: [],
    totalHashtags: 0,
    avgEngagement: 0,
    bestPerformingSet: null
  });

  const [isLoading, setIsLoading] = useState(false);

  // Analyser les hashtags quand les posts ou filtres changent
  useEffect(() => {
    if (posts.length === 0) {
      setAnalytics({
        allHashtags: [],
        topPerformers: [],
        trending: [],
        hashtagSets: getDefaultHashtagSets(),
        suggestions: [],
        combinations: [],
        totalHashtags: 0,
        avgEngagement: 0,
        bestPerformingSet: null
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculer les performances de tous les hashtags
      const allHashtags = HashtagAnalyticsService.calculateHashtagPerformance(posts);
      
      // Appliquer les filtres
      const filteredHashtags = applyFilters(allHashtags, filters);
      
      // Calculer les métriques dérivées
      const topPerformers = HashtagAnalyticsService.getTopPerformers(filteredHashtags, 10);
      const trending = HashtagAnalyticsService.getTrendingHashtags(filteredHashtags);
      const combinations = HashtagAnalyticsService.analyzeHashtagCombinations(posts);
      
      // Calculer les statistiques globales
      const totalHashtags = filteredHashtags.length;
      const avgEngagement = filteredHashtags.length > 0 
        ? filteredHashtags.reduce((sum, stat) => sum + stat.avgEngagement, 0) / filteredHashtags.length
        : 0;
      
      // Obtenir les sets de hashtags
      const hashtagSets = getDefaultHashtagSets();
      
      // Calculer les stats des sets
      const setsWithStats = hashtagSets.map(set => 
        HashtagAnalyticsService.calculateSetStats(set, allHashtags)
      );
      
      // Trouver le meilleur set
      const bestPerformingSet = setsWithStats.length > 0
        ? setsWithStats.reduce((best, current) => 
            current.avgEngagement > best.avgEngagement ? current : best
          )
        : null;
      
      setAnalytics({
        allHashtags: filteredHashtags,
        topPerformers,
        trending,
        hashtagSets: setsWithStats,
        suggestions: [],
        combinations,
        totalHashtags,
        avgEngagement,
        bestPerformingSet
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse des hashtags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [posts, filters]);

  return analytics;
};

/**
 * Hook pour générer des suggestions de hashtags
 * @param content - Contenu du post
 * @param platform - Plateforme cible
 * @param existingHashtags - Hashtags déjà utilisés
 * @returns Suggestions intelligentes
 */
export const useHashtagSuggestions = (
  content: string,
  platform: SocialPlatform | null,
  existingHashtags: string[] = []
): HashtagSuggestion[] => {
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([]);

  useEffect(() => {
    if (!platform || !content.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const newSuggestions = HashtagAnalyticsService.generateHashtagSuggestions(
        content,
        platform,
        existingHashtags
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Erreur lors de la génération des suggestions:', error);
      setSuggestions([]);
    }
  }, [content, platform, existingHashtags]);

  return suggestions;
};

/**
 * Hook pour gérer les sets de hashtags
 * @param initialSets - Sets initiaux
 * @returns Fonctions de gestion des sets
 */
export const useHashtagSets = (initialSets: HashtagSet[] = []) => {
  const [hashtagSets, setHashtagSets] = useState<HashtagSet[]>(initialSets);

  const createSet = (name: string, description: string, hashtags: string[], category: HashtagSet['category'] = 'custom') => {
    const newSet = HashtagAnalyticsService.createHashtagSet(name, description, hashtags, category);
    setHashtagSets(prev => [...prev, newSet]);
    return newSet;
  };

  const updateSet = (id: string, updates: Partial<HashtagSet>) => {
    setHashtagSets(prev => prev.map(set => 
      set.id === id ? { ...set, ...updates, updatedAt: new Date() } : set
    ));
  };

  const deleteSet = (id: string) => {
    setHashtagSets(prev => prev.filter(set => set.id !== id));
  };

  const addHashtagToSet = (setId: string, hashtag: string) => {
    setHashtagSets(prev => prev.map(set => 
      set.id === setId 
        ? { ...set, hashtags: [...set.hashtags, hashtag], updatedAt: new Date() }
        : set
    ));
  };

  const removeHashtagFromSet = (setId: string, hashtag: string) => {
    setHashtagSets(prev => prev.map(set => 
      set.id === setId 
        ? { ...set, hashtags: set.hashtags.filter(tag => tag !== hashtag), updatedAt: new Date() }
        : set
    ));
  };

  return {
    hashtagSets,
    createSet,
    updateSet,
    deleteSet,
    addHashtagToSet,
    removeHashtagFromSet
  };
};

/**
 * Hook pour les statistiques de performance en temps réel
 * @param hashtag - Hashtag à analyser
 * @param posts - Posts contenant ce hashtag
 * @returns Métriques détaillées
 */
export const useHashtagPerformance = (hashtag: string, posts: any[] = []) => {
  const [performance, setPerformance] = useState<{
    totalPosts: number;
    avgEngagement: number;
    totalReach: number;
    trend: 'up' | 'down' | 'stable';
    bestPosts: any[];
    relatedHashtags: string[];
  }>({
    totalPosts: 0,
    avgEngagement: 0,
    totalReach: 0,
    trend: 'stable',
    bestPosts: [],
    relatedHashtags: []
  });

  useEffect(() => {
    if (!hashtag || posts.length === 0) {
      setPerformance({
        totalPosts: 0,
        avgEngagement: 0,
        totalReach: 0,
        trend: 'stable',
        bestPosts: [],
        relatedHashtags: []
      });
      return;
    }

    try {
      // Filtrer les posts contenant ce hashtag
      const hashtagPosts = posts.filter(post => 
        HashtagAnalyticsService.extractHashtags(post.content || '').includes(hashtag)
      );

      if (hashtagPosts.length === 0) {
        setPerformance({
          totalPosts: 0,
          avgEngagement: 0,
          totalReach: 0,
          trend: 'stable',
          bestPosts: [],
          relatedHashtags: []
        });
        return;
      }

      // Calculer les métriques
      const totalEngagement = hashtagPosts.reduce((sum, post) => {
        const likes = post.likes || 0;
        const comments = post.comments || 0;
        const shares = post.shares || 0;
        const views = post.views || 0;
        const estimatedViews = views || (likes + comments + shares) * 10;
        return sum + (likes + comments + shares) / estimatedViews * 100;
      }, 0);

      const avgEngagement = totalEngagement / hashtagPosts.length;
      const totalReach = hashtagPosts.reduce((sum, post) => sum + (post.reach || 0), 0);

      // Trier les posts par engagement
      const bestPosts = hashtagPosts
        .sort((a, b) => {
          const engagementA = ((a.likes || 0) + (a.comments || 0) + (a.shares || 0)) / ((a.views || 0) || 1);
          const engagementB = ((b.likes || 0) + (b.comments || 0) + (b.shares || 0)) / ((b.views || 0) || 1);
          return engagementB - engagementA;
        })
        .slice(0, 5);

      // Analyser la tendance (simplifié)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentPosts = hashtagPosts.filter(post => 
        new Date(post.scheduledTime) >= thirtyDaysAgo
      );
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentPosts.length > hashtagPosts.length * 0.6) trend = 'up';
      else if (recentPosts.length < hashtagPosts.length * 0.4) trend = 'down';

      // Trouver les hashtags liés
      const allHashtags = hashtagPosts.flatMap(post => 
        HashtagAnalyticsService.extractHashtags(post.content || '')
      );
      const hashtagCounts = allHashtags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const relatedHashtags = Object.entries(hashtagCounts)
        .filter(([tag]) => tag !== hashtag)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      setPerformance({
        totalPosts: hashtagPosts.length,
        avgEngagement,
        totalReach,
        trend,
        bestPosts,
        relatedHashtags
      });

    } catch (error) {
      console.error('Erreur lors du calcul de performance:', error);
    }
  }, [hashtag, posts]);

  return performance;
};

/**
 * Applique les filtres aux statistiques de hashtags
 */
function applyFilters(hashtagStats: HashtagStats[], filters: HashtagFilters): HashtagStats[] {
  let filtered = [...hashtagStats];

  if (filters.platform) {
    filtered = filtered.filter(stat => stat.platforms.includes(filters.platform!));
  }

  if (filters.performance) {
    filtered = filtered.filter(stat => stat.performance === filters.performance);
  }

  if (filters.trend) {
    filtered = filtered.filter(stat => stat.trend === filters.trend);
  }

  if (filters.dateRange) {
    filtered = filtered.filter(stat => 
      stat.lastUsed >= filters.dateRange!.start && 
      stat.lastUsed <= filters.dateRange!.end
    );
  }

  return filtered;
}

/**
 * Retourne les sets de hashtags par défaut
 */
function getDefaultHashtagSets(): HashtagSet[] {
  return [
    {
      id: 'engagement-set',
      name: 'Engagement',
      description: 'Hashtags pour maximiser l\'engagement',
      hashtags: ['#engagement', '#community', '#interaction', '#feedback', '#discussion'],
      category: 'engagement',
      createdAt: new Date(),
      updatedAt: new Date(),
      avgEngagement: 4.2,
      totalUsage: 156
    },
    {
      id: 'reach-set',
      name: 'Reach',
      description: 'Hashtags pour étendre la portée',
      hashtags: ['#viral', '#trending', '#popular', '#discover', '#explore'],
      category: 'reach',
      createdAt: new Date(),
      updatedAt: new Date(),
      avgEngagement: 3.8,
      totalUsage: 203
    },
    {
      id: 'sales-set',
      name: 'Vente',
      description: 'Hashtags orientés conversion',
      hashtags: ['#sale', '#offer', '#deal', '#promotion', '#buy'],
      category: 'sales',
      createdAt: new Date(),
      updatedAt: new Date(),
      avgEngagement: 2.9,
      totalUsage: 89
    },
    {
      id: 'awareness-set',
      name: 'Awareness',
      description: 'Hashtags pour la notoriété de marque',
      hashtags: ['#brand', '#company', '#business', '#professional', '#quality'],
      category: 'awareness',
      createdAt: new Date(),
      updatedAt: new Date(),
      avgEngagement: 3.5,
      totalUsage: 134
    }
  ];
}
