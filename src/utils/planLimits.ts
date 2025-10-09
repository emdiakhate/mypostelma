/**
 * Utilitaires pour la gestion des limites par plan
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

export type PlanType = 'free' | 'starter' | 'pro' | 'business';

export interface PlanLimits {
  maxAccounts: number;
  platforms: string[] | 'all';
  features: string[];
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: { 
    maxAccounts: 1, 
    platforms: ['instagram'],
    features: ['basic_publishing', 'scheduling']
  },
  starter: { 
    maxAccounts: 5, 
    platforms: ['instagram', 'facebook', 'linkedin', 'twitter'],
    features: ['basic_publishing', 'scheduling', 'analytics', 'team_collaboration']
  },
  pro: { 
    maxAccounts: 15, 
    platforms: 'all',
    features: ['advanced_publishing', 'scheduling', 'analytics', 'team_collaboration', 'automation', 'custom_branding']
  },
  business: { 
    maxAccounts: 999, 
    platforms: 'all',
    features: ['enterprise_publishing', 'advanced_scheduling', 'enterprise_analytics', 'unlimited_team', 'white_label', 'api_access', 'priority_support']
  }
};

// Fonction pour vérifier si une plateforme est disponible dans un plan
export const isPlatformAvailable = (platform: string, plan: PlanType): boolean => {
  const limits = PLAN_LIMITS[plan];
  return limits.platforms === 'all' || limits.platforms.includes(platform);
};

// Fonction pour vérifier si l'utilisateur peut ajouter un compte
export const canAddAccount = (currentCount: number, plan: PlanType): boolean => {
  const limits = PLAN_LIMITS[plan];
  return currentCount < limits.maxAccounts;
};

// Fonction pour obtenir le message de limite atteinte
export const getLimitMessage = (plan: PlanType, currentCount: number): string => {
  const limits = PLAN_LIMITS[plan];
  return `Vous avez atteint la limite de votre plan (${currentCount}/${limits.maxAccounts})`;
};

// Fonction pour obtenir le plan recommandé pour une plateforme
export const getRecommendedPlan = (platform: string): PlanType => {
  if (platform === 'instagram') return 'free';
  if (['facebook', 'linkedin', 'twitter'].includes(platform)) return 'starter';
  if (['tiktok', 'youtube', 'pinterest'].includes(platform)) return 'pro';
  return 'business';
};

// Fonction pour obtenir les fonctionnalités d'un plan
export const getPlanFeatures = (plan: PlanType): string[] => {
  return PLAN_LIMITS[plan].features;
};

// Fonction pour vérifier si une fonctionnalité est disponible
export const hasFeature = (feature: string, plan: PlanType): boolean => {
  return PLAN_LIMITS[plan].features.includes(feature);
};
