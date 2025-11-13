/**
 * Configuration centralisée des plateformes sociales
 * Évite la duplication de code et facilite la maintenance
 */

import { SocialPlatform } from '@/types/Post';

export interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  colorClass: string;
  bgClass: string;
  textClass: string;
}

/**
 * Configuration des plateformes sociales
 * Utilise le design system pour les couleurs
 */
export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    colorClass: 'text-social-instagram',
    bgClass: 'bg-social-instagram',
    textClass: 'text-white'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    colorClass: 'text-social-facebook',
    bgClass: 'bg-social-facebook',
    textClass: 'text-white'
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    colorClass: 'text-social-twitter',
    bgClass: 'bg-social-twitter',
    textClass: 'text-white'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    colorClass: 'text-social-linkedin',
    bgClass: 'bg-social-linkedin',
    textClass: 'text-white'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    colorClass: 'text-social-youtube',
    bgClass: 'bg-social-youtube',
    textClass: 'text-white'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    colorClass: 'text-social-tiktok',
    bgClass: 'bg-social-tiktok',
    textClass: 'text-white'
  }
];

/**
 * Récupère la configuration d'une plateforme
 */
export const getPlatformConfig = (platformId: SocialPlatform): PlatformConfig => {
  return PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0];
};

/**
 * Map des plateformes par ID
 */
export const PLATFORMS_MAP = PLATFORMS.reduce((acc, platform) => {
  acc[platform.id] = platform;
  return acc;
}, {} as Record<SocialPlatform, PlatformConfig>);
