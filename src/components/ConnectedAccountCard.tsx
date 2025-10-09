/**
 * Composant ConnectedAccountCard pour afficher un compte connecté
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import React from 'react';
import { SocialAccount, PLATFORM_CONFIG } from '@/types/socialAccount';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Users, 
  RefreshCw, 
  Edit, 
  Trash2, 
  BarChart3,
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Music, 
  Youtube, 
  Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectedAccountCardProps {
  account: SocialAccount;
  onRefresh: (accountId: string) => void;
  onRename: (accountId: string) => void;
  onDisconnect: (accountId: string) => void;
  onViewStats: (accountId: string) => void;
  className?: string;
}

const ConnectedAccountCard: React.FC<ConnectedAccountCardProps> = ({
  account,
  onRefresh,
  onRename,
  onDisconnect,
  onViewStats,
  className
}) => {
  const config = PLATFORM_CONFIG[account.platform];
  
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

  const getStatusIndicator = () => {
    switch (account.status) {
      case 'connected':
        return (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600">Connecté</span>
          </div>
        );
      case 'reconnect_needed':
        return (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-yellow-600">Reconnexion nécessaire</span>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs text-red-600">Déconnecté</span>
          </div>
        );
      default:
        return null;
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

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Mise à jour maintenant';
    } else if (diffHours < 24) {
      return `Mise à jour il y a ${diffHours}h`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `Mise à jour il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  const PlatformIcon = getPlatformIcon(account.platform);

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-blue-300 hover:scale-[1.02] card-hover animate-fade-in",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <Avatar className="w-12 h-12 group-hover:scale-110 transition-transform duration-200">
              <AvatarImage src={account.avatar} alt={account.displayName} />
              <AvatarFallback>
                <PlatformIcon className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200 truncate">
                  @{account.username}
                </h3>
                <Badge 
                  variant="outline" 
                  className="text-xs group-hover:scale-105 transition-transform duration-200"
                  style={{ 
                    backgroundColor: `${config.color}20`,
                    borderColor: config.color,
                    color: config.color
                  }}
                >
                  <PlatformIcon className="w-3 h-3 mr-1" />
                  {config.name}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-2 truncate">
                {account.displayName}
              </p>
              
              {account.internalName && (
                <p className="text-xs text-gray-500 mb-2">
                  Alias: {account.internalName}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{formatFollowers(account.followers)} followers</span>
                </div>
                
                {account.lastSync && (
                  <div className="flex items-center space-x-1">
                    <RefreshCw className="w-4 h-4" />
                    <span>{formatLastSync(account.lastSync)}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                {getStatusIndicator()}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onRefresh(account.id)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Rafraîchir les données
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => onViewStats(account.id)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Voir les stats
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => onRename(account.id)}>
                <Edit className="w-4 h-4 mr-2" />
                Renommer
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => onDisconnect(account.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedAccountCard;
