/**
 * Types pour l'interface Analytics
 * Phase 3: Analytics Interface
 */

import { SocialPlatform } from './Post';

// Export for external use
export type { SocialPlatform };

export interface PostAnalytics {
  postId: string;
  platform: SocialPlatform;
  publishedAt: Date;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    reach: number;
    engagement: number;
    engagementRate: number;
    saves?: number; // Instagram uniquement
    clicks?: number; // Si lien
  };
  lastUpdated: Date;
}

export interface AccountAnalytics {
  platform: SocialPlatform;
  username: string;
  period: { start: Date; end: Date };
  metrics: {
    followersStart: number;
    followersEnd: number;
    followersGrowth: number;
    avgEngagementRate: number;
    totalPosts: number;
    totalImpressions: number;
    totalReach: number;
  };
  topPosts: PostAnalytics[]; // Top 5
}

export interface AnalyticsSummary {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalImpressions: number;
  totalReach: number;
  avgEngagementRate: number;
  bestPerformingPlatform: SocialPlatform;
  bestPerformingPost: PostAnalytics;
  dailyEngagement: Array<{
    date: string;
    engagement: number;
    impressions: number;
    posts: number;
  }>;
  platformPerformance: Array<{
    platform: SocialPlatform;
    impressions: number;
    engagementRate: number;
  }>;
  topPosts: PostAnalytics[];
  contentTypePerformance: Array<{
    type: string;
    avgEngagement: number;
    count: number;
  }>;
  bestTimes: Array<{
    day: number;
    hour: number;
    avgEngagement: number;
  }>;
}

export interface AnalyticsFilters {
  period: {
    start: Date;
    end: Date;
  };
  platforms: SocialPlatform[];
}

export interface AnalyticsPeriod {
  label: string;
  days: number;
  start: Date;
  end: Date;
}
