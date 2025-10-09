import { useState, useEffect, useMemo } from 'react';
import { SocialPlatform } from '@/types/Post';
import { TimeAnalyticsService, BestTimes } from '@/services/timeAnalytics';

export interface BestTimeRecommendation {
  recommended: Date;
  alternatives: Date[];
  reason: string;
  confidence: number;
  insights: {
    totalPosts: number;
    avgEngagement: number;
    improvement: number;
  };
}

/**
 * Hook personnalisé pour obtenir les meilleurs moments de publication
 * @param platform - Plateforme sociale ciblée
 * @param posts - Posts historiques pour l'analyse
 * @returns Recommandations de timing optimisé
 */
export const useBestTime = (
  platform: SocialPlatform | null,
  posts: any[] = []
): BestTimeRecommendation | null => {
  const [bestTimes, setBestTimes] = useState<BestTimes | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Analyser les meilleurs moments quand la plateforme ou les posts changent
  useEffect(() => {
    if (!platform) {
      setBestTimes(null);
      return;
    }

    setIsLoading(true);
    
    // Simuler un délai d'analyse (pour l'UX)
    const analyzeTimer = setTimeout(() => {
      try {
        const analysis = TimeAnalyticsService.analyzePostPerformance(posts, platform);
        setBestTimes(analysis);
      } catch (error) {
        console.error('Erreur lors de l\'analyse des meilleurs moments:', error);
        // Fallback vers les données par défaut
        const defaultAnalysis = TimeAnalyticsService.analyzePostPerformance([], platform);
        setBestTimes(defaultAnalysis);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(analyzeTimer);
  }, [platform, posts]);

  // Générer les recommandations avec dates calculées
  const recommendation = useMemo(() => {
    if (!bestTimes) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    // Calculer la prochaine occurrence du jour recommandé
    const getNextOccurrence = (targetDay: string, targetHour: number): Date => {
      const dayMap: { [key: string]: number } = {
        'Dimanche': 0, 'Lundi': 1, 'Mardi': 2, 'Mercredi': 3,
        'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6
      };
      
      const targetDayIndex = dayMap[targetDay];
      const daysUntilTarget = (targetDayIndex - currentDay + 7) % 7;
      
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + daysUntilTarget);
      nextDate.setHours(targetHour, 0, 0, 0);
      
      // Si l'heure est passée aujourd'hui, prendre la semaine prochaine
      if (daysUntilTarget === 0 && targetHour <= currentHour) {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      
      return nextDate;
    };

    // Générer les dates recommandées
    const recommended = getNextOccurrence(bestTimes.recommended.dayOfWeek, bestTimes.recommended.hour);
    const alternatives = bestTimes.alternatives.map(alt => 
      getNextOccurrence(alt.dayOfWeek, alt.hour)
    );

    // Générer les messages d'insight
    const reason = TimeAnalyticsService.generateInsightMessage(bestTimes);
    const confidence = bestTimes.recommended.confidence;

    return {
      recommended,
      alternatives,
      reason,
      confidence,
      insights: bestTimes.insights
    };
  }, [bestTimes]);

  return recommendation;
};

/**
 * Hook pour obtenir les données de graphique d'engagement par heure
 * @param platform - Plateforme sociale
 * @param posts - Posts historiques
 * @returns Données formatées pour Recharts
 */
export const useEngagementChart = (
  platform: SocialPlatform | null,
  posts: any[] = []
) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!platform) {
      setChartData([]);
      return;
    }

    try {
      const analysis = TimeAnalyticsService.analyzePostPerformance(posts, platform);
      
      // Créer les données de graphique par heure (0-23)
      const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const hourSlots = analysis.alternatives
          .concat([analysis.recommended])
          .filter(slot => slot.hour === hour);
        
        const avgEngagement = hourSlots.length > 0 
          ? hourSlots.reduce((sum, slot) => sum + slot.avgEngagement, 0) / hourSlots.length
          : 0;
        
        return {
          hour: `${hour}h`,
          engagement: Math.round(avgEngagement * 100) / 100,
          posts: hourSlots.reduce((sum, slot) => sum + slot.postCount, 0)
        };
      });

      setChartData(hourlyData);
    } catch (error) {
      console.error('Erreur lors de la génération du graphique:', error);
      setChartData([]);
    }
  }, [platform, posts]);

  return chartData;
};

/**
 * Hook pour obtenir les statistiques de performance par jour
 * @param platform - Plateforme sociale
 * @param posts - Posts historiques
 * @returns Données de performance par jour
 */
export const useDailyPerformance = (
  platform: SocialPlatform | null,
  posts: any[] = []
) => {
  const [dailyData, setDailyData] = useState<any[]>([]);

  useEffect(() => {
    if (!platform) {
      setDailyData([]);
      return;
    }

    try {
      const analysis = TimeAnalyticsService.analyzePostPerformance(posts, platform);
      
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const dailyStats = days.map(day => {
        const daySlots = analysis.alternatives
          .concat([analysis.recommended])
          .filter(slot => slot.dayOfWeek === day);
        
        const avgEngagement = daySlots.length > 0 
          ? daySlots.reduce((sum, slot) => sum + slot.avgEngagement, 0) / daySlots.length
          : 0;
        
        return {
          day,
          engagement: Math.round(avgEngagement * 100) / 100,
          posts: daySlots.reduce((sum, slot) => sum + slot.postCount, 0)
        };
      });

      setDailyData(dailyStats);
    } catch (error) {
      console.error('Erreur lors de la génération des statistiques quotidiennes:', error);
      setDailyData([]);
    }
  }, [platform, posts]);

  return dailyData;
};
