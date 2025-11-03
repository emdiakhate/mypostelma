/**
 * Composant pour sélectionner les comptes connectés
 * Utilise Upload-Post pour afficher uniquement les comptes réellement connectés
 */

import React, { useMemo } from 'react';
import { useUploadPost } from '@/hooks/useUploadPost';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Music, 
  Youtube,
  Users,
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ConnectedAccountsSelectorProps {
  selectedAccounts: string[];
  onAccountsChange: (accountIds: string[]) => void;
  className?: string;
  mediaFile?: File | null;
  videoUrl?: string | null;
}

const ConnectedAccountsSelector: React.FC<ConnectedAccountsSelectorProps> = ({
  selectedAccounts,
  onAccountsChange,
  className,
  mediaFile,
  videoUrl
}) => {
  const { connectedAccounts, loading } = useUploadPost();

  // Vérifier si c'est une vidéo
  const isVideo = (mediaFile && mediaFile.type.startsWith('video/')) || videoUrl;
  const isImage = mediaFile && mediaFile.type.startsWith('image/');
  
  // Mapper les comptes connectés aux plateformes disponibles
  const availablePlatforms = useMemo(() => {
    const platformMap = {
      instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', restriction: '📸 Images uniquement', videoOnly: false, icon: Instagram },
      facebook: { name: 'Facebook', color: 'bg-blue-600', restriction: '📸 Images uniquement', videoOnly: false, icon: Facebook },
      twitter: { name: 'X (Twitter)', color: 'bg-black', restriction: '📸 Images uniquement', videoOnly: false, icon: Twitter },
      x: { name: 'X', color: 'bg-black', restriction: '📸 Images uniquement', videoOnly: false, icon: Twitter },
      linkedin: { name: 'LinkedIn', color: 'bg-blue-700', restriction: '📸 Images uniquement', videoOnly: false, icon: Linkedin },
      youtube: { name: 'YouTube', color: 'bg-red-600', restriction: '🎥 Vidéo uniquement', videoOnly: true, icon: Youtube },
      tiktok: { name: 'TikTok', color: 'bg-black', restriction: '🎥 Vidéo uniquement', videoOnly: true, icon: Music },
    };

    return connectedAccounts
      .map(account => ({
        id: account.platform,
        displayName: account.display_name,
        username: account.username,
        image: account.social_images,
        ...platformMap[account.platform as keyof typeof platformMap]
      }))
      .filter(platform => {
        if (isVideo) {
          return platform.videoOnly;
        } else if (isImage) {
          return !platform.videoOnly;
        }
        return true;
      });
  }, [connectedAccounts, isVideo, isImage]);

  const handlePlatformToggle = (platformId: string) => {
    if (selectedAccounts.includes(platformId)) {
      onAccountsChange(selectedAccounts.filter(p => p !== platformId));
    } else {
      onAccountsChange([...selectedAccounts, platformId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (availablePlatforms.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">
              Aucun compte connecté
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Connectez vos réseaux sociaux pour publier du contenu
            </p>
            <Link to="/app/settings/accounts">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Connecter mes comptes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availablePlatforms.map((platform) => {
          const isSelected = selectedAccounts.includes(platform.id);
          const Icon = platform.icon;
          
          return (
            <Card
              key={platform.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => handlePlatformToggle(platform.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", platform.color)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{platform.name}</p>
                        <p className="text-xs text-gray-500 truncate">@{platform.username}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message d'information sur le type de média */}
      {(isVideo || isImage) && (
        <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            {isVideo 
              ? 'Seules les plateformes supportant les vidéos sont disponibles (TikTok, YouTube)'
              : 'Seules les plateformes supportant les images sont disponibles'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectedAccountsSelector;
