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
  
  // Mapper toutes les plateformes disponibles avec leur statut de connexion
  const allPlatforms = useMemo(() => {
    const platformMap = {
      instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', restriction: '📸 Images uniquement', videoOnly: false, icon: Instagram },
      facebook: { name: 'Facebook', color: 'bg-blue-600', restriction: '📸 Images uniquement', videoOnly: false, icon: Facebook },
      twitter: { name: 'X (Twitter)', color: 'bg-black', restriction: '📸 Images uniquement', videoOnly: false, icon: Twitter },
      linkedin: { name: 'LinkedIn', color: 'bg-blue-700', restriction: '📸 Images uniquement', videoOnly: false, icon: Linkedin },
      youtube: { name: 'YouTube', color: 'bg-red-600', restriction: '🎥 Vidéo uniquement', videoOnly: true, icon: Youtube },
      tiktok: { name: 'TikTok', color: 'bg-black', restriction: '🎥 Vidéo uniquement', videoOnly: true, icon: Music },
    };

    // Créer une map des comptes connectés
    const connectedMap = new Map(
      connectedAccounts.map(account => [account.platform, account])
    );

    // Retourner toutes les plateformes avec leur statut
    return Object.entries(platformMap).map(([platformId, config]) => {
      const connectedAccount = connectedMap.get(platformId as any);
      const isConnected = !!connectedAccount;
      
      // Filtrer par type de média
      let shouldShow = true;
      if (isVideo && !config.videoOnly) {
        shouldShow = false;
      } else if (isImage && config.videoOnly) {
        shouldShow = false;
      }

      return {
        id: platformId,
        displayName: connectedAccount?.display_name || config.name,
        username: connectedAccount?.username,
        image: connectedAccount?.social_images,
        isConnected,
        shouldShow,
        ...config
      };
    }).filter(platform => platform.shouldShow);
  }, [connectedAccounts, isVideo, isImage]);

  const handlePlatformToggle = (platformId: string, isConnected: boolean) => {
    // Ne permettre la sélection que si le compte est connecté
    if (!isConnected) return;

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

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-semibold text-muted-foreground">Plateformes</h3>
      <div className="flex items-center gap-3 flex-wrap">
        {allPlatforms.map((platform) => {
          const isSelected = selectedAccounts.includes(platform.id);
          const Icon = platform.icon;
          const isDisabled = !platform.isConnected;
          
          return (
            <button
              key={platform.id}
              type="button"
              className={cn(
                "transition-all rounded-xl p-0 border-0 outline-none",
                isDisabled && "opacity-50 cursor-not-allowed",
                !isDisabled && "cursor-pointer hover:scale-110",
                isSelected && !isDisabled && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => handlePlatformToggle(platform.id, platform.isConnected)}
              disabled={isDisabled}
            >
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center", 
                platform.color,
                isDisabled && "grayscale"
              )}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <Checkbox
                checked={isSelected}
                disabled={isDisabled}
                onCheckedChange={() => handlePlatformToggle(platform.id, platform.isConnected)}
                className="sr-only"
              />
            </button>
          );
        })}
      </div>

      {/* Lien pour connecter les comptes */}
      {connectedAccounts.length === 0 && (
        <div className="flex items-center justify-center p-4 border border-dashed rounded-lg">
          <Link to="/app/settings/accounts">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Connecter mes comptes
            </Button>
          </Link>
        </div>
      )}

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
