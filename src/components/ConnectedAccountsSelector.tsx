/**
 * Composant pour sélectionner les comptes connectés
 * Utilise Upload-Post pour les plateformes tierces ET Meta API pour Facebook/Instagram
 * 
 * Configuration: USE_META_FOR_FACEBOOK dans usePostPublishing.ts
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useUploadPost } from '@/hooks/useUploadPost';
import { Button } from '@/components/ui/button';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// CONFIGURATION: Activer Meta API pour Facebook (doit correspondre à usePostPublishing.ts)
// =============================================================================
const USE_META_FOR_FACEBOOK = true;

// Custom TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Custom X (Twitter) icon
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Custom Threads icon
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.733 2.14-1.166 3.546-1.22 1.302-.049 2.579.138 3.786.556.082-.83.07-1.644-.036-2.432l2.009-.36c.166.93.212 1.91.136 2.918 1.268.636 2.285 1.529 2.958 2.6.903 1.435 1.14 3.15.666 4.822-.637 2.244-2.06 4.036-4.001 5.04C17.075 23.268 14.847 24 12.186 24zm-1.638-8.904c-.98.036-1.755.305-2.31.801-.524.468-.79 1.087-.752 1.742.038.635.36 1.2.905 1.591.588.422 1.39.62 2.26.558 1.182-.064 2.07-.485 2.64-1.251.507-.683.788-1.584.835-2.678-1.098-.375-2.298-.577-3.578-.763z"/>
  </svg>
);

interface ConnectedAccountsSelectorProps {
  selectedAccounts: string[];
  onAccountsChange: (accountIds: string[]) => void;
  className?: string;
  mediaFile?: File | null;
  videoUrl?: string | null;
}

interface MetaConnectedAccount {
  id: string;
  platform: string;
  account_name: string | null;
  avatar_url: string | null;
  status: string | null;
}

const ConnectedAccountsSelector: React.FC<ConnectedAccountsSelectorProps> = ({
  selectedAccounts,
  onAccountsChange,
  className,
  mediaFile,
  videoUrl
}) => {
  const { connectedAccounts, loading: uploadPostLoading, connectAccounts } = useUploadPost();
  const [metaAccounts, setMetaAccounts] = useState<MetaConnectedAccount[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Charger les comptes Meta depuis connected_accounts
  useEffect(() => {
    const loadMetaAccounts = async () => {
      if (!USE_META_FOR_FACEBOOK) {
        setMetaLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setMetaLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('connected_accounts')
          .select('id, platform, account_name, avatar_url, status')
          .eq('user_id', user.id)
          .in('platform', ['facebook', 'instagram']);

        if (error) {
          console.error('Error loading Meta accounts:', error);
        } else {
          setMetaAccounts(data || []);
        }
      } catch (err) {
        console.error('Error loading Meta accounts:', err);
      } finally {
        setMetaLoading(false);
      }
    };

    loadMetaAccounts();
  }, []);

  // Vérifier si c'est une vidéo
  const isVideo = (mediaFile && mediaFile.type.startsWith('video/')) || videoUrl;
  const isImage = mediaFile && mediaFile.type.startsWith('image/');
  
  const loading = uploadPostLoading || metaLoading;

  // Mapper toutes les plateformes disponibles avec leur statut de connexion
  const allPlatforms = useMemo(() => {
    const platformMap = {
      instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: Instagram },
      facebook: { name: 'Facebook', color: 'bg-blue-600', icon: Facebook },
      tiktok: { name: 'TikTok', color: 'bg-black', icon: TikTokIcon },
      linkedin: { name: 'LinkedIn', color: 'bg-blue-700', icon: Linkedin },
      x: { name: 'X', color: 'bg-black', icon: XIcon },
      threads: { name: 'Threads', color: 'bg-black', icon: ThreadsIcon },
    };

    // Créer une map des comptes Upload-Post connectés
    const uploadPostMap = new Map(
      connectedAccounts.map(account => [account.platform, account])
    );

    // Créer une map des comptes Meta connectés
    const metaMap = new Map(
      metaAccounts.map(account => [account.platform, account])
    );

    // Retourner toutes les plateformes avec leur statut
    return Object.entries(platformMap).map(([platformId, config]) => {
      // Pour Facebook, priorité à Meta API si activé
      if (USE_META_FOR_FACEBOOK && platformId === 'facebook') {
        const metaAccount = metaMap.get('facebook');
        const isConnected = !!metaAccount && metaAccount.status === 'active';
        return {
          id: platformId,
          displayName: metaAccount?.account_name || config.name,
          username: undefined,
          image: metaAccount?.avatar_url,
          isConnected,
          isMeta: true, // Marqueur pour distinguer les comptes Meta
          ...config
        };
      }

      // Pour les autres plateformes, utiliser Upload-Post
      const uploadPostAccount = uploadPostMap.get(platformId as any);
      const isConnected = !!uploadPostAccount;

      return {
        id: platformId,
        displayName: uploadPostAccount?.display_name || config.name,
        username: uploadPostAccount?.username,
        image: uploadPostAccount?.social_images,
        isConnected,
        isMeta: false,
        ...config
      };
    });
  }, [connectedAccounts, metaAccounts]);

  const handlePlatformToggle = (platformId: string, isConnected: boolean) => {
    // Ne permettre la sélection que si le compte est connecté
    if (!isConnected) return;

    // On stocke le platformId pour la publication
    if (selectedAccounts.includes(platformId)) {
      onAccountsChange(selectedAccounts.filter(id => id !== platformId));
    } else {
      onAccountsChange([...selectedAccounts, platformId]);
    }
  };

  const handleConnectAccounts = () => {
    connectAccounts({
      platforms: ['instagram', 'facebook', 'tiktok', 'linkedin', 'x', 'threads'],
      connectTitle: 'Connecter vos réseaux',
      connectDescription: 'Connectez vos comptes pour publier',
      redirectUrl: window.location.href
    });
  };

  // Nombre de comptes connectés (Meta + Upload-Post)
  const totalConnectedCount = useMemo(() => {
    const metaConnected = USE_META_FOR_FACEBOOK ? metaAccounts.filter(a => a.status === 'active').length : 0;
    const uploadPostConnected = connectedAccounts.length;
    // Si Meta est activé pour Facebook, ne pas compter Facebook de Upload-Post
    const adjustedUploadPost = USE_META_FOR_FACEBOOK 
      ? connectedAccounts.filter(a => a.platform !== 'facebook').length 
      : uploadPostConnected;
    return metaConnected + adjustedUploadPost;
  }, [metaAccounts, connectedAccounts]);

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
      <div className="flex flex-wrap gap-3">
        {allPlatforms.map((platform) => {
          const isSelected = selectedAccounts.includes(platform.id);
          const Icon = platform.icon;
          const isDisabled = !platform.isConnected;
          
          return (
            <button
              key={platform.id}
              type="button"
              className={cn(
                "relative group",
                isDisabled && "opacity-40 cursor-not-allowed",
                !isDisabled && "cursor-pointer"
              )}
              onClick={() => handlePlatformToggle(platform.id, platform.isConnected)}
              disabled={isDisabled}
            >
              {/* Container avec icône */}
              <div className={cn(
                "relative w-16 h-16 rounded-full transition-all",
                isSelected && !isDisabled && "ring-4 ring-primary ring-offset-2",
                !isDisabled && !isSelected && "hover:scale-105"
              )}>
                <div className={cn(
                  "w-full h-full rounded-full flex items-center justify-center", 
                  platform.color,
                  isDisabled && "opacity-40 grayscale"
                )}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Badge de sélection */}
                {isSelected && !isDisabled && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}

                {/* Badge Meta API */}
                {platform.isMeta && platform.isConnected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center" title="Connecté via Meta">
                    <span className="text-white text-[8px] font-bold">M</span>
                  </div>
                )}
              </div>
              
              {/* Nom du compte */}
              <div className="mt-2 text-center">
                <p className="text-xs font-medium truncate max-w-[64px]">
                  {platform.displayName}
                </p>
                {platform.username && (
                  <p className="text-[10px] text-muted-foreground truncate max-w-[64px]">
                    @{platform.username}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bouton pour connecter les comptes */}
      {totalConnectedCount === 0 && (
        <div className="flex items-center justify-center p-4 border border-dashed rounded-lg">
          <Button variant="outline" size="sm" onClick={handleConnectAccounts}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Connecter mes comptes
          </Button>
        </div>
      )}

      {/* Message d'info pour Instagram */}
      {!isImage && selectedAccounts.includes('instagram') && (
        <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Instagram nécessite au moins une image pour publier
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectedAccountsSelector;
