/**
 * Composant pour sélectionner les comptes connectés
 * Utilise Upload-Post ET Meta OAuth pour afficher les comptes réellement connectés
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useUploadPost } from '@/hooks/useUploadPost';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

interface MetaAccount {
  id: string;
  platform: string;
  account_name: string;
  avatar_url?: string;
}

const ConnectedAccountsSelector: React.FC<ConnectedAccountsSelectorProps> = ({
  selectedAccounts,
  onAccountsChange,
  className,
  mediaFile,
  videoUrl
}) => {
  const { connectedAccounts: uploadPostAccounts, loading: uploadPostLoading } = useUploadPost();
  const { user } = useAuth();
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Charger les comptes Meta (Facebook/Instagram) depuis connected_accounts
  useEffect(() => {
    const fetchMetaAccounts = async () => {
      if (!user) {
        setMetaLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('connected_accounts')
          .select('id, platform, account_name, avatar_url')
          .eq('user_id', user.id)
          .in('platform', ['facebook', 'instagram'])
          .eq('status', 'active');
        
        if (error) throw error;
        setMetaAccounts(data || []);
      } catch (err) {
        console.error('[ConnectedAccountsSelector] Error fetching Meta accounts:', err);
      } finally {
        setMetaLoading(false);
      }
    };

    fetchMetaAccounts();
  }, [user]);

  const loading = uploadPostLoading || metaLoading;

  // Vérifier si c'est une vidéo
  const isVideo = (mediaFile && mediaFile.type.startsWith('video/')) || videoUrl;
  const isImage = mediaFile && mediaFile.type.startsWith('image/');
  
  // Mapper toutes les plateformes disponibles avec leur statut de connexion
  const allPlatforms = useMemo(() => {
    const platformMap = {
      instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', videoOnly: false, icon: Instagram },
      facebook: { name: 'Facebook', color: 'bg-blue-600', videoOnly: false, icon: Facebook },
      x: { name: 'X', color: 'bg-black', videoOnly: false, icon: Twitter },
      linkedin: { name: 'LinkedIn', color: 'bg-blue-700', videoOnly: false, icon: Linkedin },
      youtube: { name: 'YouTube', color: 'bg-red-600', videoOnly: true, icon: Youtube },
      tiktok: { name: 'TikTok', color: 'bg-black', videoOnly: true, icon: Music },
    };

    // Créer une map des comptes Upload-Post connectés (exclure facebook et instagram car gérés par Meta)
    const uploadPostMap = new Map(
      uploadPostAccounts
        .filter(account => !['facebook', 'instagram'].includes(account.platform))
        .map(account => [account.platform, account])
    );

    // Créer une map des comptes Meta connectés
    const metaMap = new Map(
      metaAccounts.map(account => [account.platform, account])
    );

    // Retourner toutes les plateformes avec leur statut
    return Object.entries(platformMap).map(([platformId, config]) => {
      // Vérifier d'abord Meta pour Facebook/Instagram, sinon Upload-Post
      const metaAccount = metaMap.get(platformId);
      const uploadPostAccount = uploadPostMap.get(platformId as any);
      const connectedAccount = metaAccount || uploadPostAccount;
      const isConnected = !!connectedAccount;
      
      // Filtrer par type de média : les images ne sont pas supportées sur TikTok et YouTube
      let shouldShow = true;
      if (isImage && config.videoOnly) {
        shouldShow = false;
      }

      return {
        id: platformId,
        displayName: metaAccount?.account_name || uploadPostAccount?.display_name || config.name,
        username: uploadPostAccount?.username,
        image: metaAccount?.avatar_url || uploadPostAccount?.social_images,
        isConnected,
        shouldShow,
        ...config
      };
    }).filter(platform => platform.shouldShow);
  }, [uploadPostAccounts, metaAccounts, isVideo, isImage]);

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
              </div>
              
              {/* Nom du compte (optionnel) */}
              <div className="mt-2 text-center">
                <p className="text-xs font-medium truncate max-w-[64px]">
                  {platform.displayName}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lien pour connecter les comptes */}
      {uploadPostAccounts.length === 0 && metaAccounts.length === 0 && (
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
      {isImage && (
        <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            TikTok et YouTube acceptent uniquement les vidéos
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectedAccountsSelector;
