/**
 * Données mock pour les comptes sociaux
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import { SocialAccount, SocialPlatform } from '@/types/socialAccount';

// Données mock réalistes pour différents types de comptes
export const MOCK_SOCIAL_ACCOUNTS: SocialAccount[] = [
  // Comptes Instagram
  {
    id: 'ig-1',
    platform: 'instagram',
    username: 'mata_viande',
    displayName: 'Mata Viande - Boucherie Premium',
    followers: 2847,
    isConnected: true,
    connectedAt: new Date('2024-11-15T10:30:00Z'),
    lastSync: new Date('2025-01-04T14:20:00Z'),
    status: 'connected',
    permissions: {
      readProfile: true,
      readPosts: true,
      publishPosts: true,
      readAnalytics: true
    }
  },
  {
    id: 'ig-2',
    platform: 'instagram',
    username: 'mata_viande_recettes',
    displayName: 'Mata Viande - Recettes',
    followers: 1250,
    isConnected: true,
    connectedAt: new Date('2024-12-01T09:15:00Z'),
    lastSync: new Date('2025-01-03T16:45:00Z'),
    status: 'connected',
    permissions: {
      readProfile: true,
      readPosts: true,
      publishPosts: true,
      readAnalytics: false
    }
  },
  {
    id: 'ig-3',
    platform: 'instagram',
    username: 'mata_viande_team',
    displayName: 'Mata Viande - Équipe',
    followers: 340,
    isConnected: true,
    connectedAt: new Date('2024-12-20T14:00:00Z'),
    lastSync: new Date('2025-01-02T11:30:00Z'),
    status: 'reconnect_needed',
    permissions: {
      readProfile: true,
      readPosts: true,
      publishPosts: false,
      readAnalytics: false
    }
  },
  
  // Page Facebook
  {
    id: 'fb-1',
    platform: 'facebook',
    username: 'MataViandeBoucherie',
    displayName: 'Mata Viande - Boucherie Artisanale',
    followers: 5620,
    isConnected: true,
    connectedAt: new Date('2024-10-10T08:00:00Z'),
    lastSync: new Date('2025-01-04T12:15:00Z'),
    status: 'connected',
    permissions: {
      readProfile: true,
      readPosts: true,
      publishPosts: true,
      readAnalytics: true
    }
  },
  
  // Compte LinkedIn
  {
    id: 'li-1',
    platform: 'linkedin',
    username: 'mata-viande',
    displayName: 'Mata Viande - Boucherie Professionnelle',
    followers: 890,
    isConnected: true,
    connectedAt: new Date('2024-11-30T16:20:00Z'),
    lastSync: new Date('2025-01-01T09:00:00Z'),
    status: 'connected',
    permissions: {
      readProfile: true,
      readPosts: true,
      publishPosts: true,
      readAnalytics: true
    }
  },
  
  // Compte Twitter/X
  {
    id: 'tw-1',
    platform: 'twitter',
    username: 'MataViande',
    displayName: 'Mata Viande',
    followers: 1250,
    isConnected: true,
    connectedAt: new Date('2024-12-15T13:45:00Z'),
    lastSync: new Date('2024-12-28T10:30:00Z'),
    status: 'disconnected',
    permissions: {
      readProfile: true,
      readPosts: false,
      publishPosts: false,
      readAnalytics: false
    }
  },
  
  // Compte TikTok
  {
    id: 'tt-1',
    platform: 'tiktok',
    username: '@mata_viande',
    displayName: 'Mata Viande - Recettes Rapides',
    followers: 4200,
    isConnected: true,
    connectedAt: new Date('2024-12-10T11:00:00Z'),
    lastSync: new Date('2025-01-04T15:45:00Z'),
    status: 'connected',
    permissions: {
      readProfile: true,
      readPosts: true,
      publishPosts: true,
      readAnalytics: true
    }
  }
];

// Données pour les recommandations basées sur l'industrie
export const INDUSTRY_RECOMMENDATIONS = {
  'food': {
    platforms: ['instagram', 'tiktok', 'facebook'],
    suggestions: [
      'Connectez TikTok pour partager des recettes en vidéo',
      'LinkedIn vous aiderait à toucher les professionnels de la restauration',
      'YouTube est parfait pour des tutoriels de cuisine détaillés'
    ]
  },
  'retail': {
    platforms: ['instagram', 'facebook', 'pinterest'],
    suggestions: [
      'Pinterest est idéal pour montrer vos produits',
      'TikTok peut booster votre visibilité auprès des jeunes',
      'LinkedIn pour les ventes B2B'
    ]
  },
  'services': {
    platforms: ['linkedin', 'facebook', 'instagram'],
    suggestions: [
      'LinkedIn est essentiel pour les services professionnels',
      'Instagram pour montrer votre expertise visuellement',
      'Twitter pour l\'actualité et l\'engagement en temps réel'
    ]
  }
};

// Fonction pour obtenir des recommandations basées sur les comptes connectés
export const getRecommendations = (connectedAccounts: SocialAccount[], industry?: string) => {
  const connectedPlatforms = connectedAccounts.map(acc => acc.platform);
  const allPlatforms: SocialPlatform[] = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube', 'pinterest'];
  const missingPlatforms = allPlatforms.filter(platform => !connectedPlatforms.includes(platform as SocialPlatform));
  
  const recommendations = [];
  
  // Recommandations basées sur l'industrie
  if (industry && INDUSTRY_RECOMMENDATIONS[industry as keyof typeof INDUSTRY_RECOMMENDATIONS]) {
    const industryData = INDUSTRY_RECOMMENDATIONS[industry as keyof typeof INDUSTRY_RECOMMENDATIONS];
    const missingIndustryPlatforms = industryData.platforms.filter(platform => !connectedPlatforms.includes(platform as SocialPlatform));
    
    missingIndustryPlatforms.forEach(platform => {
      recommendations.push({
        platform,
        reason: industryData.suggestions[Math.floor(Math.random() * industryData.suggestions.length)],
        priority: 'high'
      });
    });
  }
  
  // Recommandations générales pour les plateformes manquantes
  missingPlatforms.forEach(platform => {
    if (!recommendations.find(rec => rec.platform === platform)) {
      recommendations.push({
        platform,
        reason: `Connectez ${platform} pour élargir votre portée`,
        priority: 'medium'
      });
    }
  });
  
  return recommendations.slice(0, 3); // Limiter à 3 recommandations
};
