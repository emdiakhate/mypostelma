import { Post, SocialPlatform } from '@/types/Post';

// Types pour l'analyse des hashtags
export interface HashtagStats {
  tag: string;
  usageCount: number;
  avgEngagement: number;
  avgReach: number;
  trend: 'up' | 'down' | 'stable';
  lastUsed: Date;
  performance: 'high' | 'medium' | 'low';
  platforms: SocialPlatform[];
  relatedHashtags: string[];
  engagementRate: number;
  reachRate: number;
}

export interface HashtagSet {
  id: string;
  name: string;
  description: string;
  hashtags: string[];
  category: 'engagement' | 'reach' | 'sales' | 'awareness' | 'custom';
  createdAt: Date;
  updatedAt: Date;
  avgEngagement: number;
  totalUsage: number;
}

export interface HashtagSuggestion {
  hashtag: string;
  reason: string;
  confidence: number;
  category: string;
  expectedEngagement: number;
  relatedHashtags: string[];
}

export interface HashtagPerformance {
  hashtag: string;
  posts: Post[];
  totalEngagement: number;
  avgEngagement: number;
  reach: number;
  impressions: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
}

/**
 * Service d'analyse des performances des hashtags
 * Analyse les hashtags utilisés dans les posts pour optimiser l'engagement
 */
export class HashtagAnalyticsService {
  /**
   * Extrait tous les hashtags d'un caption
   * @param caption - Texte du post
   * @returns Liste des hashtags trouvés
   */
  static extractHashtags(caption: string): string[] {
    if (!caption) return [];
    
    // Regex pour trouver tous les hashtags (incluant les caractères Unicode)
    const hashtagRegex = /#[\w\u00c0-\u017f\u0100-\u017f\u0180-\u024f\u1e00-\u1eff]+/gi;
    const matches = caption.match(hashtagRegex);
    
    if (!matches) return [];
    
    // Nettoyer et normaliser les hashtags
    return matches
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 1) // Exclure les hashtags d'un seul caractère
      .filter((tag, index, array) => array.indexOf(tag) === index); // Supprimer les doublons
  }

  /**
   * Calcule les performances de tous les hashtags utilisés
   * @param posts - Liste des posts à analyser
   * @returns Statistiques détaillées par hashtag
   */
  static calculateHashtagPerformance(posts: Post[]): HashtagStats[] {
    const hashtagMap = new Map<string, {
      posts: Post[];
      platforms: Set<SocialPlatform>;
      usages: Date[];
    }>();

    // Analyser tous les posts
    posts.forEach(post => {
      const hashtags = this.extractHashtags(post.content || '');
      
      hashtags.forEach(hashtag => {
        if (!hashtagMap.has(hashtag)) {
          hashtagMap.set(hashtag, {
            posts: [],
            platforms: new Set(),
            usages: []
          });
        }
        
        const data = hashtagMap.get(hashtag)!;
        data.posts.push(post);
        data.platforms.add(post.platforms[0]);
        data.usages.push(new Date(post.scheduledTime));
      });
    });

    // Calculer les statistiques pour chaque hashtag
    const hashtagStats: HashtagStats[] = [];
    
    hashtagMap.forEach((data, hashtag) => {
      const stats = this.calculateHashtagStats(hashtag, data);
      hashtagStats.push(stats);
    });

    // Trier par engagement moyen décroissant
    return hashtagStats.sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  /**
   * Calcule les statistiques détaillées pour un hashtag
   */
  private static calculateHashtagStats(
    hashtag: string, 
    data: { posts: Post[]; platforms: Set<SocialPlatform>; usages: Date[] }
  ): HashtagStats {
    const { posts, platforms, usages } = data;
    
    // Calculer l'engagement moyen
    const totalEngagement = posts.reduce((sum, post) => {
      const likes = post.likes || 0;
      const comments = post.comments || 0;
      const shares = post.shares || 0;
      const views = post.views || 0;
      
      // Formule d'engagement : (likes + comments + shares) / views * 100
      const estimatedViews = views || (likes + comments + shares) * 10;
      return sum + (likes + comments + shares) / estimatedViews * 100;
    }, 0);
    
    const avgEngagement = totalEngagement / posts.length;
    
    // Calculer le reach moyen
    const totalReach = posts.reduce((sum, post) => {
      return sum + (post.reach || 0);
    }, 0);
    
    const avgReach = totalReach / posts.length;
    
    // Déterminer la tendance (comparaison des 30 derniers jours vs précédents)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentUsages = usages.filter(date => date >= thirtyDaysAgo).length;
    const previousUsages = usages.filter(date => date < thirtyDaysAgo).length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentUsages > previousUsages * 1.2) trend = 'up';
    else if (recentUsages < previousUsages * 0.8) trend = 'down';
    
    // Déterminer le niveau de performance
    let performance: 'high' | 'medium' | 'low' = 'low';
    if (avgEngagement > 5) performance = 'high';
    else if (avgEngagement > 2) performance = 'medium';
    
    // Calculer les hashtags liés (co-occurrence)
    const relatedHashtags = this.findRelatedHashtags(hashtag, posts);
    
    return {
      tag: hashtag,
      usageCount: posts.length,
      avgEngagement,
      avgReach,
      trend,
      lastUsed: new Date(Math.max(...usages.map(d => d.getTime()))),
      performance,
      platforms: Array.from(platforms),
      relatedHashtags,
      engagementRate: avgEngagement,
      reachRate: avgReach
    };
  }

  /**
   * Trouve les hashtags qui apparaissent souvent ensemble
   */
  private static findRelatedHashtags(targetHashtag: string, posts: Post[]): string[] {
    const coOccurrence = new Map<string, number>();
    
    posts.forEach(post => {
      const hashtags = this.extractHashtags(post.content || '');
      if (hashtags.includes(targetHashtag)) {
        hashtags.forEach(hashtag => {
          if (hashtag !== targetHashtag) {
            coOccurrence.set(hashtag, (coOccurrence.get(hashtag) || 0) + 1);
          }
        });
      }
    });
    
    // Retourner les 5 hashtags les plus co-occurrents
    return Array.from(coOccurrence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hashtag]) => hashtag);
  }

  /**
   * Génère des suggestions de hashtags basées sur l'analyse
   */
  static generateHashtagSuggestions(
    content: string, 
    platform: SocialPlatform, 
    existingHashtags: string[] = []
  ): HashtagSuggestion[] {
    // Hashtags populaires par plateforme (mock data)
    const popularHashtags = this.getPopularHashtagsByPlatform(platform);
    
    // Analyser le contenu pour suggérer des hashtags pertinents
    const contentKeywords = this.extractKeywords(content);
    
    const suggestions: HashtagSuggestion[] = [];
    
    // Hashtags basés sur les mots-clés du contenu
    contentKeywords.forEach(keyword => {
      const hashtag = `#${keyword.toLowerCase()}`;
      if (!existingHashtags.includes(hashtag)) {
        suggestions.push({
          hashtag,
          reason: `Basé sur le mot-clé "${keyword}"`,
          confidence: 0.8,
          category: 'content',
          expectedEngagement: 3.2,
          relatedHashtags: []
        });
      }
    });
    
    // Hashtags populaires de la plateforme
    popularHashtags.forEach(hashtag => {
      if (!existingHashtags.includes(hashtag)) {
        suggestions.push({
          hashtag,
          reason: `Populaire sur ${platform}`,
          confidence: 0.9,
          category: 'trending',
          expectedEngagement: 4.5,
          relatedHashtags: []
        });
      }
    });
    
    // Retourner les 10 meilleures suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Extrait les mots-clés importants du contenu
   */
  private static extractKeywords(content: string): string[] {
    // Mots vides à ignorer
    const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'dont', 'où', 'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs'];
    
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .filter((word, index, array) => array.indexOf(word) === index)
      .slice(0, 5);
  }

  /**
   * Retourne les hashtags populaires par plateforme
   */
  private static getPopularHashtagsByPlatform(platform: SocialPlatform): string[] {
    const platformHashtags = {
      instagram: [
        '#instagood', '#photooftheday', '#fashion', '#beautiful', '#happy',
        '#cute', '#tbt', '#like4like', '#followme', '#picoftheday',
        '#selfie', '#summer', '#art', '#friends', '#nature'
      ],
      facebook: [
        '#facebook', '#news', '#viral', '#trending', '#community',
        '#local', '#business', '#events', '#life', '#family'
      ],
      linkedin: [
        '#linkedin', '#career', '#business', '#networking', '#professional',
        '#leadership', '#innovation', '#success', '#motivation', '#entrepreneur'
      ],
      x: [
        '#x', '#trending', '#news', '#viral', '#tech',
        '#politics', '#sports', '#entertainment', '#lifestyle', '#innovation'
      ],
      tiktok: [
        '#tiktok', '#fyp', '#viral', '#dance', '#comedy',
        '#trending', '#foryou', '#fun', '#music', '#creative'
      ],
      youtube: [
        '#youtube', '#video', '#tutorial', '#review', '#entertainment',
        '#education', '#music', '#gaming', '#lifestyle', '#tech'
      ]
    };
    
    return platformHashtags[platform] || [];
  }

  /**
   * Crée un nouveau set de hashtags
   */
  static createHashtagSet(
    name: string,
    description: string,
    hashtags: string[],
    category: HashtagSet['category'] = 'custom'
  ): HashtagSet {
    return {
      id: `set-${Date.now()}`,
      name,
      description,
      hashtags,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
      avgEngagement: 0,
      totalUsage: 0
    };
  }

  /**
   * Calcule les statistiques d'un set de hashtags
   */
  static calculateSetStats(set: HashtagSet, allHashtagStats: HashtagStats[]): HashtagSet {
    const setHashtagStats = allHashtagStats.filter(stat => 
      set.hashtags.includes(stat.tag)
    );
    
    const avgEngagement = setHashtagStats.length > 0 
      ? setHashtagStats.reduce((sum, stat) => sum + stat.avgEngagement, 0) / setHashtagStats.length
      : 0;
    
    const totalUsage = setHashtagStats.reduce((sum, stat) => sum + stat.usageCount, 0);
    
    return {
      ...set,
      avgEngagement,
      totalUsage,
      updatedAt: new Date()
    };
  }

  /**
   * Trouve les hashtags les plus performants
   */
  static getTopPerformers(hashtagStats: HashtagStats[], limit: number = 10): HashtagStats[] {
    return hashtagStats
      .filter(stat => stat.performance === 'high')
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, limit);
  }

  /**
   * Trouve les hashtags en tendance
   */
  static getTrendingHashtags(hashtagStats: HashtagStats[]): HashtagStats[] {
    return hashtagStats
      .filter(stat => stat.trend === 'up')
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  /**
   * Analyse les combinaisons de hashtags performantes
   */
  static analyzeHashtagCombinations(posts: Post[]): Array<{
    combination: string[];
    avgEngagement: number;
    usageCount: number;
  }> {
    const combinations = new Map<string, { posts: Post[]; engagement: number }>();
    
    posts.forEach(post => {
      const hashtags = this.extractHashtags(post.content || '');
      if (hashtags.length >= 2) {
        // Analyser toutes les combinaisons de 2-3 hashtags
        for (let i = 0; i < hashtags.length - 1; i++) {
          for (let j = i + 1; j < Math.min(i + 3, hashtags.length); j++) {
            const combination = [hashtags[i], hashtags[j]].sort().join('+');
            
            if (!combinations.has(combination)) {
              combinations.set(combination, { posts: [], engagement: 0 });
            }
            
            const data = combinations.get(combination)!;
            data.posts.push(post);
            
            // Calculer l'engagement
            const likes = post.likes || 0;
            const comments = post.comments || 0;
            const shares = post.shares || 0;
            const views = post.views || 0;
            const estimatedViews = views || (likes + comments + shares) * 10;
            data.engagement += (likes + comments + shares) / estimatedViews * 100;
          }
        }
      }
    });
    
    // Convertir en array et calculer les moyennes
    return Array.from(combinations.entries())
      .map(([combination, data]) => ({
        combination: combination.split('+'),
        avgEngagement: data.engagement / data.posts.length,
        usageCount: data.posts.length
      }))
      .filter(item => item.usageCount >= 2) // Au moins 2 utilisations
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 20);
  }
}
