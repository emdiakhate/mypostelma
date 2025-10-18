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
import { getPlatformConfig } from '@/config/platforms';

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
  const platformStyles = getPlatformConfig(platform as any);
  
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

    if (connectionStatus.isConnected) {
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
          ✓ Connecté
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

    if (connectionStatus.isConnected) {
      return (
        <Button 
          onClick={() => onConnect(platform)}
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
        >
          Déconnecter
        </Button>
      );
    }

    return (
      <Button 
        onClick={() => onConnect(platform)}
        className={cn("w-full", platformStyles.bgClass, platformStyles.textClass)}
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
              1 compte connecté
            </span>
          ) : (
            <span>
              1 compte maximum par réseau
            </span>
          )}
        </div>
        
        {getActionButton()}
      </CardContent>
    </Card>
  );
};

export default PlatformCard;
