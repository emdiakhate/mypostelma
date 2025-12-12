/**
 * Page de gestion des comptes sociaux
 * Affiche Facebook et Instagram avec Meta OAuth
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Loader2,
  Link2,
  Check,
  Sparkles,
  Instagram,
  Facebook
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import ConnectMetaModal from '@/components/inbox/ConnectMetaModal';

// Configuration des plateformes disponibles (Meta uniquement)
const AVAILABLE_PLATFORMS = [
  { 
    id: 'facebook' as const, 
    name: 'Facebook', 
    icon: Facebook,
    bgColor: 'bg-blue-600',
    textColor: 'text-blue-600',
    description: 'Connectez pour publier sur Facebook'
  },
  { 
    id: 'instagram' as const, 
    name: 'Instagram', 
    icon: Instagram,
    bgColor: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    textColor: 'text-pink-600',
    description: 'Connectez pour publier sur Instagram'
  }
];

interface MetaAccount {
  id: string;
  platform: string;
  account_name: string;
  avatar_url?: string;
  connected_at?: string;
}

export default function SocialAccountsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metaModalPlatform, setMetaModalPlatform] = useState<'facebook' | 'instagram' | null>(null);
  const [metaConnectedAccounts, setMetaConnectedAccounts] = useState<MetaAccount[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Charger les comptes Meta connectés
  const fetchMetaAccounts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('connected_accounts')
        .select('id, platform, account_name, avatar_url, connected_at')
        .eq('user_id', user.id)
        .in('platform', ['facebook', 'instagram']);
      
      if (!error && data) {
        setMetaConnectedAccounts(data);
      }
    } catch (err) {
      console.error('Error fetching Meta accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetaAccounts();
  }, [user]);

  // Vérifier si l'utilisateur revient après connexion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success('🎉 Compte connecté avec succès !');
      fetchMetaAccounts();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Créer un map des comptes connectés
  const connectedMap = useMemo(() => {
    const map = new Map<string, MetaAccount>();
    metaConnectedAccounts.forEach(account => {
      map.set(account.platform, account);
    });
    return map;
  }, [metaConnectedAccounts]);

  const handleConnectPlatform = (platformId: 'facebook' | 'instagram') => {
    setMetaModalPlatform(platformId);
  };

  const handleDisconnectPlatform = async (platformId: string) => {
    const account = connectedMap.get(platformId);
    if (!account) {
      toast.error('Compte non trouvé');
      return;
    }

    try {
      setDisconnecting(platformId);
      
      const { error } = await supabase.functions.invoke('disconnect-account', {
        body: { account_id: account.id, platform: platformId }
      });
      
      if (error) {
        console.error('Error disconnecting:', error);
        toast.error(`Erreur lors de la déconnexion: ${error.message}`);
        return;
      }
      
      toast.success(`${platformId === 'facebook' ? 'Facebook' : 'Instagram'} déconnecté avec succès`);
      fetchMetaAccounts();
    } catch (error: any) {
      console.error('Error disconnecting platform:', error);
      toast.error(error?.message || 'Erreur lors de la déconnexion');
    } finally {
      setDisconnecting(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-fade-in">
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Comptes Sociaux</h1>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Gérez vos connexions Facebook et Instagram
            </p>
          </div>
          
          <Badge 
            variant="outline" 
            className="text-sm px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
          >
            <Check className="w-4 h-4 mr-2 text-green-600" />
            {connectedMap.size} / {AVAILABLE_PLATFORMS.length} connecté(s)
          </Badge>
        </div>

        {/* Grid des plateformes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_PLATFORMS.map((platform) => {
            const isConnected = connectedMap.has(platform.id);
            const accountData = connectedMap.get(platform.id);
            const Icon = platform.icon;
            const isDisconnecting = disconnecting === platform.id;

            return (
              <Tooltip key={platform.id}>
                <TooltipTrigger asChild>
                  <Card 
                    className={cn(
                      "rounded-xl transition-all duration-300 hover:shadow-lg",
                      isConnected && "border-green-500/50 shadow-green-100 dark:shadow-green-900/20"
                    )}
                  >
                    <CardContent className="p-6">
                      {isConnected && accountData ? (
                        // Card Connecté
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              platform.bgColor
                            )}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                              <Check className="w-3 h-3 mr-1" />
                              Connecté
                            </Badge>
                          </div>

                          <div className="flex flex-col items-center text-center space-y-3 py-4">
                            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                              {accountData.avatar_url ? (
                                <AvatarImage src={accountData.avatar_url} alt={accountData.account_name} />
                              ) : (
                                <AvatarFallback className={platform.bgColor}>
                                  <Icon className="w-10 h-10 text-white" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div>
                              <p className="font-bold text-lg">
                                {accountData.account_name}
                              </p>
                              {accountData.connected_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Connecté le {new Date(accountData.connected_at).toLocaleDateString('fr-FR', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950"
                            onClick={() => handleDisconnectPlatform(platform.id)}
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Déconnexion...
                              </>
                            ) : (
                              'Déconnecter'
                            )}
                          </Button>
                        </div>
                      ) : (
                        // Card Déconnecté
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center opacity-60">
                              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Déconnecté
                            </span>
                          </div>

                          <div className="flex flex-col items-center text-center space-y-3 py-8">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center opacity-60">
                              <Icon className="w-10 h-10 text-gray-600 dark:text-gray-400" />
                            </div>
                            
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1">
                                {platform.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {platform.description}
                              </p>
                            </div>
                          </div>

                          <Button 
                            className="w-full bg-primary hover:brightness-110 transition-all"
                            onClick={() => handleConnectPlatform(platform.id)}
                          >
                            <Link2 className="mr-2 h-4 w-4" />
                            Connecter {platform.name}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  {isConnected 
                    ? `${platform.name} connecté` 
                    : `Cliquez pour connecter ${platform.name}`
                  }
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Info message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-900 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Configuration requise pour Instagram
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Pour connecter Instagram, vous devez d'abord convertir votre compte en <strong>compte Business</strong> et le lier à une <strong>page Facebook</strong>.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">📱 Étapes à suivre :</p>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
                  <li>Ouvrez l'app Instagram → <strong>Paramètres</strong> → <strong>Compte</strong></li>
                  <li>Appuyez sur <strong>"Passer à un compte professionnel"</strong></li>
                  <li>Sélectionnez <strong>"Entreprise"</strong> (Business)</li>
                  <li>Connectez ou créez une <strong>page Facebook</strong></li>
                  <li>Vérifiez que vous êtes <strong>administrateur</strong> de la page</li>
                  <li>Revenez ici et cliquez sur <strong>"Connecter Instagram"</strong></li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Meta connection modal */}
        {metaModalPlatform && (
          <ConnectMetaModal
            platform={metaModalPlatform}
            onClose={() => setMetaModalPlatform(null)}
            onSuccess={() => {
              setMetaModalPlatform(null);
              fetchMetaAccounts();
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
