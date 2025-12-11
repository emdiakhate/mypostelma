/**
 * Composant pour sélectionner les comptes connectés
 * Utilise Meta OAuth pour afficher les comptes Facebook/Instagram connectés
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Instagram, 
  Facebook, 
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
  const { user } = useAuth();
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les comptes Meta (Facebook/Instagram) depuis connected_accounts
  useEffect(() => {
    const fetchMetaAccounts = async () => {
      if (!user) {
        setLoading(false);
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
        setLoading(false);
      }
    };

    fetchMetaAccounts();
  }, [user]);

  // Vérifier si c'est une vidéo
  const isVideo = (mediaFile && mediaFile.type.startsWith('video/')) || videoUrl;
  const isImage = mediaFile && mediaFile.type.startsWith('image/');
  
  // Mapper toutes les plateformes disponibles avec leur statut de connexion
  const allPlatforms = useMemo(() => {
    const platformMap = {
      instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: Instagram },
      facebook: { name: 'Facebook', color: 'bg-blue-600', icon: Facebook },
    };

    // Créer une map des comptes Meta connectés
    const metaMap = new Map(
      metaAccounts.map(account => [account.platform, account])
    );

    // Retourner toutes les plateformes avec leur statut
    return Object.entries(platformMap).map(([platformId, config]) => {
      const metaAccount = metaMap.get(platformId);
      const isConnected = !!metaAccount;

      return {
        id: platformId,
        accountId: metaAccount?.id, // ID de connected_accounts pour la publication
        displayName: metaAccount?.account_name || config.name,
        image: metaAccount?.avatar_url,
        isConnected,
        ...config
      };
    });
  }, [metaAccounts]);

  const handlePlatformToggle = (platformId: string, accountId: string | undefined, isConnected: boolean) => {
    // Ne permettre la sélection que si le compte est connecté
    if (!isConnected || !accountId) return;

    // On stocke l'accountId (ID de connected_accounts) pour la publication
    if (selectedAccounts.includes(accountId)) {
      onAccountsChange(selectedAccounts.filter(id => id !== accountId));
    } else {
      onAccountsChange([...selectedAccounts, accountId]);
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
          const isSelected = platform.accountId ? selectedAccounts.includes(platform.accountId) : false;
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
              onClick={() => handlePlatformToggle(platform.id, platform.accountId, platform.isConnected)}
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
      {metaAccounts.length === 0 && (
        <div className="flex items-center justify-center p-4 border border-dashed rounded-lg">
          <Link to="/app/settings/accounts">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Connecter mes comptes
            </Button>
          </Link>
        </div>
      )}

      {/* Message d'info pour Instagram */}
      {!isImage && metaAccounts.some(a => a.platform === 'instagram') && (
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
