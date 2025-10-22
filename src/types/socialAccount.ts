/**
 * Types pour la gestion des comptes sociaux
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

export type SocialPlatform = 
  | 'instagram' 
  | 'facebook' 
  | 'linkedin' 
  | 'twitter' 
  | 'tiktok' 
  | 'youtube' 
  | 'pinterest';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  avatar?: string;
  followers: number;
  isConnected: boolean;
  connectedAt: Date;
  lastSync?: Date;
  profileKey?: string; // Pour Upload Post plus tard
  status: 'connected' | 'reconnect_needed' | 'disconnected';
  internalName?: string; // Alias interne pour l'utilisateur
  permissions?: {
    readProfile: boolean;
    readPosts: boolean;
    publishPosts: boolean;
    readAnalytics: boolean;
  };
}

export interface ConnectionStatus {
  platform: SocialPlatform;
  isAvailable: boolean; // Disponible dans le plan
  isConnected: boolean;
  accountCount: number; // Nb de comptes connectés de cette plateforme
  maxAccounts: number;  // Max selon le plan
}

export interface PlatformInfo {
  platform: SocialPlatform;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient?: string;
  isSupported: boolean;
  isProOnly: boolean;
}

// Configuration des plateformes
export const PLATFORM_CONFIG: Record<SocialPlatform, PlatformInfo> = {
  instagram: {
    platform: 'instagram',
    name: 'Instagram',
    description: 'Publiez photos et stories',
    icon: 'Instagram',
    color: '#E4405F',
    gradient: 'from-purple-500 to-pink-500',
    isSupported: true,
    isProOnly: false
  },
  facebook: {
    platform: 'facebook',
    name: 'Facebook',
    description: 'Pages et groupes Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    gradient: 'from-blue-500 to-blue-600',
    isSupported: true,
    isProOnly: false
  },
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn',
    description: 'Réseau professionnel',
    icon: 'Linkedin',
    color: '#0A66C2',
    gradient: 'from-blue-600 to-blue-700',
    isSupported: true,
    isProOnly: true
  },
  twitter: {
    platform: 'twitter',
    name: 'X (Twitter)',
    description: 'Micro-blogging et actualités',
    icon: 'Twitter',
    color: '#000000',
    gradient: 'from-gray-800 to-black',
    isSupported: true,
    isProOnly: false
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok',
    description: 'Vidéos courtes et tendances',
    icon: 'Music',
    color: '#000000',
    gradient: 'from-gray-900 to-cyan-500',
    isSupported: true,
    isProOnly: true
  },
  youtube: {
    platform: 'youtube',
    name: 'YouTube',
    description: 'Vidéos et shorts YouTube',
    icon: 'Youtube',
    color: '#FF0000',
    gradient: 'from-red-500 to-red-600',
    isSupported: true,
    isProOnly: true
  },
  pinterest: {
    platform: 'pinterest',
    name: 'Pinterest',
    description: 'Tableaux et épingles',
    icon: 'Bookmark',
    color: '#E60023',
    gradient: 'from-red-600 to-pink-600',
    isSupported: true,
    isProOnly: true
  }
};

// Mock data pour les comptes connectés
export const MOCK_CONNECTED_ACCOUNTS: SocialAccount[] = [
  {
    id: '1',
    platform: 'instagram',
    username: 'mata_viande',
    displayName: 'Mata Viande',
    avatar: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=100&h=100&fit=crop&crop=face',
    followers: 1250,
    isConnected: true,
    connectedAt: new Date('2024-01-15'),
    lastSync: new Date('2024-01-20T10:30:00'),
    status: 'connected',
    internalName: 'Compte principal'
  },
  {
    id: '2',
    platform: 'facebook',
    username: 'MataViandeBoucherie',
    displayName: 'Mata Viande - Boucherie',
    avatar: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=100&h=100&fit=crop&crop=face',
    followers: 890,
    isConnected: true,
    connectedAt: new Date('2024-01-10'),
    lastSync: new Date('2024-01-20T09:15:00'),
    status: 'connected',
    internalName: 'Page Facebook'
  },
  {
    id: '3',
    platform: 'twitter',
    username: 'MataViande',
    displayName: 'Mata Viande',
    avatar: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=100&h=100&fit=crop&crop=face',
    followers: 320,
    isConnected: true,
    connectedAt: new Date('2024-01-05'),
    lastSync: new Date('2024-01-19T16:45:00'),
    status: 'reconnect_needed',
    internalName: 'Twitter officiel'
  }
];

// Mock data pour le statut des connexions
export const MOCK_CONNECTION_STATUS: ConnectionStatus[] = [
  {
    platform: 'instagram',
    isAvailable: true,
    isConnected: true,
    accountCount: 1,
    maxAccounts: 2
  },
  {
    platform: 'facebook',
    isAvailable: true,
    isConnected: true,
    accountCount: 1,
    maxAccounts: 3
  },
  {
    platform: 'linkedin',
    isAvailable: false, // Pro only
    isConnected: false,
    accountCount: 0,
    maxAccounts: 1
  },
  {
    platform: 'twitter',
    isAvailable: true,
    isConnected: true,
    accountCount: 1,
    maxAccounts: 2
  },
  {
    platform: 'tiktok',
    isAvailable: false, // Pro only
    isConnected: false,
    accountCount: 0,
    maxAccounts: 1
  },
  {
    platform: 'youtube',
    isAvailable: false, // Pro only
    isConnected: false,
    accountCount: 0,
    maxAccounts: 1
  },
  {
    platform: 'pinterest',
    isAvailable: false, // Pro only
    isConnected: false,
    accountCount: 0,
    maxAccounts: 1
  }
];
