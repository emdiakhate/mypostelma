/**
 * Composant pour sélectionner les comptes connectés
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import React, { useState, useEffect } from 'react';
import { SocialAccount, PLATFORM_CONFIG } from '@/types/socialAccount';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Music, 
  Youtube, 
  Bookmark,
  Users,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectedAccountsSelectorProps {
  selectedAccounts: string[];
  onAccountsChange: (accountIds: string[]) => void;
  className?: string;
}

const ConnectedAccountsSelector: React.FC<ConnectedAccountsSelectorProps> = ({
  selectedAccounts,
  onAccountsChange,
  className
}) => {
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);

  // Charger les comptes connectés depuis localStorage
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const stored = localStorage.getItem('postelma_social_accounts');
        if (stored) {
          const accounts = JSON.parse(stored);
          // Convertir les dates string en Date objects
          const parsedAccounts = accounts.map((account: any) => ({
            ...account,
            connectedAt: new Date(account.connectedAt),
            lastSync: account.lastSync ? new Date(account.lastSync) : undefined
          }));
          setConnectedAccounts(parsedAccounts);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des comptes:', error);
      }
    };
    loadAccounts();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'tiktok': return Music;
      case 'youtube': return Youtube;
      case 'pinterest': return Bookmark;
      default: return Instagram;
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleAccountToggle = (accountId: string) => {
    if (selectedAccounts.includes(accountId)) {
      onAccountsChange(selectedAccounts.filter(id => id !== accountId));
    } else {
      onAccountsChange([...selectedAccounts, accountId]);
    }
  };

  const handleConnectAccounts = () => {
    // Rediriger vers la page des comptes sociaux
    window.location.href = '/settings/accounts';
  };

  // Affichage des plateformes même sans comptes connectés
  const platforms = [
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'twitter', name: 'X (Twitter)', color: 'bg-black' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black' },
  ];

  const handlePlatformToggle = (platformId: string) => {
    if (selectedAccounts.includes(platformId)) {
      onAccountsChange(selectedAccounts.filter(p => p !== platformId));
    } else {
      onAccountsChange([...selectedAccounts, platformId]);
    }
  };

  if (connectedAccounts.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="space-y-3">
          <label className="block text-sm font-medium">Plateformes</label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformToggle(platform.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all",
                  platform.color,
                  selectedAccounts.includes(platform.id) 
                    ? "ring-2 ring-offset-2 ring-blue-500" 
                    : "opacity-70 hover:opacity-100"
                )}
              >
                {platform.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Publier sur
        </h3>
        <Badge variant="outline" className="text-sm">
          {selectedAccounts.length} compte{selectedAccounts.length > 1 ? 's' : ''} sélectionné{selectedAccounts.length > 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {connectedAccounts.map((account) => {
          const config = PLATFORM_CONFIG[account.platform];
          const PlatformIcon = getPlatformIcon(account.platform);
          const isSelected = selectedAccounts.includes(account.id);
          
          return (
            <Card 
              key={account.id} 
              className={cn(
                "cursor-pointer transition-all duration-200",
                isSelected 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => handleAccountToggle(account.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    checked={isSelected}
                    onChange={() => handleAccountToggle(account.id)}
                    className="flex-shrink-0"
                  />
                  
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    config.gradient ? `bg-gradient-to-r ${config.gradient}` : '',
                    !config.gradient && `bg-[${config.color}]`
                  )}>
                    <PlatformIcon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900 truncate">
                        @{account.username}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${config.color}20`,
                          borderColor: config.color,
                          color: config.color
                        }}
                      >
                        {config.name}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {account.displayName}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{formatFollowers(account.followers)} followers</span>
                      </div>
                      
                      {account.status === 'reconnect_needed' && (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Reconnexion nécessaire</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {selectedAccounts.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Sélectionnez au moins un compte pour publier
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectedAccountsSelector;
