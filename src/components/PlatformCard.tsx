/**
 * Composant PlatformCard pour connecter une plateforme
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import React from 'react';
import { SocialPlatform, PLATFORM_CONFIG, ConnectionStatus } from '@/types/socialAccount';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Music, 
  Youtube, 
  Bookmark,
  Lock,
  Plus,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformCardProps {
  platform: SocialPlatform;
  connectionStatus: ConnectionStatus;
  onConnect: (platform: SocialPlatform) => void;
  onUpgrade: () => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  connectionStatus,
  onConnect,
  onUpgrade
}) => {
  const config = PLATFORM_CONFIG[platform];
  
  const getPlatformIcon = (platform: SocialPlatform) => {
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

  const getStatusBadge = () => {
    if (!config.isSupported) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Lock className="w-3 h-3 mr-1" />
          Bientôt disponible
        </Badge>
      );
    }

    if (config.isProOnly && !connectionStatus.isAvailable) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Lock className="w-3 h-3 mr-1" />
          Pro requis
        </Badge>
      );
    }

    if (connectionStatus.isConnected) {
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
          ✓ {connectionStatus.accountCount} connecté{connectionStatus.accountCount > 1 ? 's' : ''}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs">
        Connecter
      </Badge>
    );
  };

  const getActionButton = () => {
    if (!config.isSupported) {
      return (
        <Button disabled variant="outline" className="w-full">
          Bientôt disponible
        </Button>
      );
    }

    if (config.isProOnly && !connectionStatus.isAvailable) {
      return (
        <Button 
          onClick={onUpgrade}
          variant="outline" 
          className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Passer à Pro
        </Button>
      );
    }

    if (connectionStatus.isConnected) {
      const canAddMore = connectionStatus.accountCount < connectionStatus.maxAccounts;
      return (
        <Button 
          onClick={() => onConnect(platform)}
          variant="outline"
          className="w-full"
          disabled={!canAddMore}
        >
          <Plus className="w-4 h-4 mr-2" />
          {canAddMore ? 'Ajouter un compte' : 'Limite atteinte'}
        </Button>
      );
    }

    return (
      <Button 
        onClick={() => onConnect(platform)}
        className="w-full"
        style={{ backgroundColor: config.color }}
      >
        Connecter
      </Button>
    );
  };

  const PlatformIcon = getPlatformIcon(platform);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            config.gradient ? `bg-gradient-to-r ${config.gradient}` : '',
            !config.gradient && `bg-[${config.color}]`
          )}>
            <PlatformIcon className="w-6 h-6 text-white" />
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {config.name}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            {config.description}
          </p>
        </div>
        
        <div className="text-xs text-gray-500">
          {connectionStatus.isConnected ? (
            <span>
              {connectionStatus.accountCount}/{connectionStatus.maxAccounts} comptes connectés
            </span>
          ) : (
            <span>
              Max {connectionStatus.maxAccounts} compte{connectionStatus.maxAccounts > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {getActionButton()}
      </CardContent>
    </Card>
  );
};

export default PlatformCard;
