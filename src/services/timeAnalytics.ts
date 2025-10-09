import { Post, SocialPlatform } from '@/types/Post';

// Types pour l'analyse des meilleurs moments
export interface BestTime {
  dayOfWeek: string;
  hour: number;
  avgEngagement: number;
  postCount: number;
  confidence: number; // 0-1, basé sur le nombre de posts
}

export interface BestTimes {
  platform: SocialPlatform;
  recommended: BestTime;
  alternatives: BestTime[];
  insights: {
    totalPosts: number;
    avgEngagement: number;
    bestDay: string;
    bestHour: number;
    improvement: number; // % d'amélioration vs moyenne
  };
}

export interface TimeSlot {
  dayOfWeek: string;
  hour: number;
  posts: Post[];
  avgEngagement: number;
  postCount: number;
}

/**
 * Service d'analyse des meilleurs moments de publication
 * Analyse les performances historiques pour recommander les créneaux optimaux
 */
export class TimeAnalyticsService {
  /**
   * Analyse les performances des posts pour déterminer les meilleurs moments
   * @param posts - Liste des posts historiques
   * @param platform - Plateforme sociale ciblée
   * @returns Analyse des meilleurs moments
   */
  static analyzePostPerformance(posts: Post[], platform: SocialPlatform): BestTimes {
    // Filtrer les posts par plateforme
    const platformPosts = posts.filter(post => 
      post.platforms.includes(platform)
    );

    if (platformPosts.length === 0) {
      return this.getDefaultBestTimes(platform);
    }

    // Grouper les posts par jour de semaine et heure
    const timeSlots = this.groupPostsByTimeSlot(platformPosts);
    
    // Calculer l'engagement moyen par slot
    const analyzedSlots = this.calculateEngagementBySlot(timeSlots);
    
    // Identifier les meilleurs créneaux
    const sortedSlots = analyzedSlots.sort((a, b) => b.avgEngagement - a.avgEngagement);
    
    // Calculer les insights
    const insights = this.calculateInsights(platformPosts, sortedSlots);
    
    return {
      platform,
      recommended: sortedSlots[0],
      alternatives: sortedSlots.slice(1, 3),
      insights
    };
  }

  /**
   * Groupe les posts par créneau horaire (jour + heure)
   */
  private static groupPostsByTimeSlot(posts: Post[]): TimeSlot[] {
    const slots: { [key: string]: TimeSlot } = {};
    
    posts.forEach(post => {
      const date = new Date(post.scheduledTime);
      const dayOfWeek = this.getDayOfWeek(date.getDay());
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;
      
      if (!slots[key]) {
        slots[key] = {
          dayOfWeek,
          hour,
          posts: [],
          avgEngagement: 0,
          postCount: 0
        };
      }
      
      slots[key].posts.push(post);
    });
    
    return Object.values(slots);
  }

  /**
   * Calcule l'engagement moyen par créneau
   */
  private static calculateEngagementBySlot(slots: TimeSlot[]): BestTime[] {
    return slots.map(slot => {
      const totalEngagement = slot.posts.reduce((sum, post) => {
        // Calculer l'engagement basé sur les métriques disponibles
        const likes = post.likes || 0;
        const comments = post.comments || 0;
        const shares = post.shares || 0;
        const views = post.views || 0;
        
        // Formule d'engagement : (likes + comments + shares) / views * 100
        // Si pas de views, utiliser une estimation basée sur les followers
        const estimatedViews = views || (likes + comments + shares) * 10;
        return (likes + comments + shares) / estimatedViews * 100;
      }, 0);
      
      const avgEngagement = totalEngagement / slot.posts.length;
      const confidence = Math.min(slot.posts.length / 5, 1); // Max confiance à 5 posts
      
      return {
        dayOfWeek: slot.dayOfWeek,
        hour: slot.hour,
        avgEngagement,
        postCount: slot.posts.length,
        confidence
      };
    });
  }

  /**
   * Calcule les insights généraux
   */
  private static calculateInsights(posts: Post[], sortedSlots: BestTime[]) {
    const totalEngagement = posts.reduce((sum, post) => {
      const likes = post.likes || 0;
      const comments = post.comments || 0;
      const shares = post.shares || 0;
      const views = post.views || 0;
      const estimatedViews = views || (likes + comments + shares) * 10;
      return sum + (likes + comments + shares) / estimatedViews * 100;
    }, 0);
    
    const avgEngagement = totalEngagement / posts.length;
    const bestSlot = sortedSlots[0];
    const improvement = bestSlot ? (bestSlot.avgEngagement - avgEngagement) / avgEngagement * 100 : 0;
    
    return {
      totalPosts: posts.length,
      avgEngagement,
      bestDay: bestSlot?.dayOfWeek || 'Lundi',
      bestHour: bestSlot?.hour || 18,
      improvement: Math.round(improvement)
    };
  }

  /**
   * Retourne les meilleurs moments par défaut selon la plateforme
   */
  private static getDefaultBestTimes(platform: SocialPlatform): BestTimes {
    const defaultTimes = this.getDefaultTimesByPlatform(platform);
    
    return {
      platform,
      recommended: defaultTimes.recommended,
      alternatives: defaultTimes.alternatives,
      insights: {
        totalPosts: 0,
        avgEngagement: 0,
        bestDay: defaultTimes.recommended.dayOfWeek,
        bestHour: defaultTimes.recommended.hour,
        improvement: 0
      }
    };
  }

  /**
   * Retourne les meilleurs moments par défaut selon la plateforme
   */
  private static getDefaultTimesByPlatform(platform: SocialPlatform) {
    const platformDefaults = {
      instagram: {
        recommended: { dayOfWeek: 'Mardi', hour: 18, avgEngagement: 4.2, postCount: 0, confidence: 0.8 },
        alternatives: [
          { dayOfWeek: 'Jeudi', hour: 19, avgEngagement: 4.0, postCount: 0, confidence: 0.8 },
          { dayOfWeek: 'Samedi', hour: 11, avgEngagement: 3.8, postCount: 0, confidence: 0.7 }
        ]
      },
      linkedin: {
        recommended: { dayOfWeek: 'Mardi', hour: 8, avgEngagement: 3.5, postCount: 0, confidence: 0.9 },
        alternatives: [
          { dayOfWeek: 'Mercredi', hour: 12, avgEngagement: 3.3, postCount: 0, confidence: 0.8 },
          { dayOfWeek: 'Jeudi', hour: 9, avgEngagement: 3.1, postCount: 0, confidence: 0.8 }
        ]
      },
      twitter: {
        recommended: { dayOfWeek: 'Mardi', hour: 9, avgEngagement: 2.8, postCount: 0, confidence: 0.8 },
        alternatives: [
          { dayOfWeek: 'Jeudi', hour: 15, avgEngagement: 2.6, postCount: 0, confidence: 0.7 },
          { dayOfWeek: 'Vendredi', hour: 10, avgEngagement: 2.4, postCount: 0, confidence: 0.7 }
        ]
      },
      facebook: {
        recommended: { dayOfWeek: 'Mercredi', hour: 14, avgEngagement: 3.2, postCount: 0, confidence: 0.8 },
        alternatives: [
          { dayOfWeek: 'Jeudi', hour: 15, avgEngagement: 3.0, postCount: 0, confidence: 0.8 },
          { dayOfWeek: 'Vendredi', hour: 13, avgEngagement: 2.8, postCount: 0, confidence: 0.7 }
        ]
      },
      tiktok: {
        recommended: { dayOfWeek: 'Mardi', hour: 20, avgEngagement: 5.5, postCount: 0, confidence: 0.9 },
        alternatives: [
          { dayOfWeek: 'Jeudi', hour: 21, avgEngagement: 5.2, postCount: 0, confidence: 0.8 },
          { dayOfWeek: 'Samedi', hour: 19, avgEngagement: 4.8, postCount: 0, confidence: 0.8 }
        ]
      },
      youtube: {
        recommended: { dayOfWeek: 'Dimanche', hour: 19, avgEngagement: 4.8, postCount: 0, confidence: 0.9 },
        alternatives: [
          { dayOfWeek: 'Samedi', hour: 18, avgEngagement: 4.5, postCount: 0, confidence: 0.8 },
          { dayOfWeek: 'Vendredi', hour: 20, avgEngagement: 4.2, postCount: 0, confidence: 0.7 }
        ]
      }
    };

    return platformDefaults[platform] || platformDefaults.instagram;
  }

  /**
   * Convertit le jour de la semaine (0-6) en nom français
   */
  private static getDayOfWeek(dayIndex: number): string {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayIndex];
  }

  /**
   * Génère un message d'insight personnalisé
   */
  static generateInsightMessage(bestTimes: BestTimes): string {
    const { recommended, insights } = bestTimes;
    
    if (insights.totalPosts === 0) {
      return `Moment optimal général : ${recommended.dayOfWeek} à ${recommended.hour}h`;
    }
    
    if (insights.totalPosts < 10) {
      return `Basé sur ${insights.totalPosts} posts. Moment optimal : ${recommended.dayOfWeek} à ${recommended.hour}h`;
    }
    
    return `Vos posts du ${recommended.dayOfWeek} à ${recommended.hour}h génèrent +${insights.improvement}% d'engagement`;
  }

  /**
   * Génère un message de recommandation
   */
  static generateRecommendationMessage(bestTimes: BestTimes): string {
    const { recommended, alternatives } = bestTimes;
    
    if (alternatives.length === 0) {
      return `Publiez ${recommended.dayOfWeek} à ${recommended.hour}h pour un engagement optimal`;
    }
    
    const altText = alternatives.map(alt => `${alt.dayOfWeek} ${alt.hour}h`).join(', ');
    return `Publiez ${recommended.dayOfWeek} à ${recommended.hour}h, ou essayez : ${altText}`;
  }
}
