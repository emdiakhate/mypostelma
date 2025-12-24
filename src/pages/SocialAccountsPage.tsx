/**
 * Page de gestion des comptes sociaux
 * Utilise Upload-Post pour tous les réseaux SAUF Facebook qui utilise l'API Meta
 */

import { useState, useEffect, useMemo } from 'react';
import { useUploadPost } from '@/hooks/useUploadPost';
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
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import type { SocialPlatform } from '@/types/uploadPost.types';
import { supabase } from '@/integrations/supabase/client';

// Flag pour utiliser Meta API pour Facebook au lieu de Upload Post
const USE_META_FOR_FACEBOOK = true;

// Icône TikTok personnalisée
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Icône Threads personnalisée
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V12c.008-3.508.865-6.37 2.497-8.415C5.846 1.246 8.567.024 12.106 0h.014c2.905.016 5.353.808 7.27 2.354 1.728 1.394 2.987 3.392 3.742 5.94l-3.182.85c-1.12-3.794-3.592-5.702-7.357-5.675-2.626.019-4.62.876-5.928 2.55-1.2 1.537-1.811 3.696-1.82 6.413v.076c.003 2.71.616 4.89 1.82 6.479 1.308 1.725 3.296 2.625 5.914 2.675 2.096.04 3.846-.51 5.203-1.634 1.186-.984 1.864-2.321 2.015-3.976l.012-.127c.016-.188.024-.382.024-.58 0-1.186-.272-2.156-.81-2.885-.55-.745-1.372-1.145-2.444-1.19a4.063 4.063 0 0 0-1.535.258c.132-.396.198-.828.198-1.287 0-.466-.066-.898-.198-1.287a4.063 4.063 0 0 1 1.535-.258c1.687.016 3.074.654 4.127 1.9 1.082 1.28 1.631 2.995 1.631 5.098 0 .282-.011.559-.033.828l-.013.152c-.22 2.494-1.265 4.53-3.109 6.058C17.914 23.102 15.31 24 12.186 24z"/>
  </svg>
);

// Configuration des plateformes disponibles
const AVAILABLE_PLATFORMS: {
  id: SocialPlatform;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  description: string;
}[] = [
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram,
    bgColor: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    textColor: 'text-pink-600',
    description: 'Photos, Reels et Stories'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: Facebook,
    bgColor: 'bg-blue-600',
    textColor: 'text-blue-600',
    description: 'Pages et publications'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: TikTokIcon,
    bgColor: 'bg-black',
    textColor: 'text-black',
    description: 'Vidéos courtes'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Linkedin,
    bgColor: 'bg-blue-700',
    textColor: 'text-blue-700',
    description: 'Réseau professionnel'
  },
  { 
    id: 'x', 
    name: 'X (Twitter)', 
    icon: Twitter,
    bgColor: 'bg-black',
    textColor: 'text-black',
    description: 'Tweets et fils'
  },
  { 
    id: 'threads', 
    name: 'Threads', 
    icon: ThreadsIcon,
    bgColor: 'bg-black',
    textColor: 'text-black',
    description: 'Conversations texte'
  }
];

export default function SocialAccountsPage() {
  const { profile, connectedAccounts, loading, error, refreshProfile, connectAccounts } = useUploadPost();
  const [connecting, setConnecting] = useState(false);
  const [metaAccounts, setMetaAccounts] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Charger les comptes connectés via Meta API
  const fetchMetaAccounts = async () => {
    try {
      setLoadingMeta(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('platform', ['facebook', 'instagram']);

      if (error) throw error;
      setMetaAccounts(data || []);
    } catch (err) {
      console.error('Error fetching Meta accounts:', err);
    } finally {
      setLoadingMeta(false);
    }
  };

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
      refreshProfile();
      fetchMetaAccounts();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Charger les comptes Meta au démarrage
  useEffect(() => {
    fetchMetaAccounts();
  }, []);

  // Créer un map des comptes connectés par plateforme (Upload Post)
  const connectedMap = useMemo(() => {
    const map = new Map<string, typeof connectedAccounts[0]>();
    connectedAccounts.forEach(account => {
      // Ne pas inclure Facebook/Instagram d'Upload Post si on utilise Meta API
      if (USE_META_FOR_FACEBOOK && (account.platform === 'facebook' || account.platform === 'instagram')) {
        return;
      }
      map.set(account.platform, account);
    });
    return map;
  }, [connectedAccounts]);

  // Map des comptes Meta
  const metaConnectedMap = useMemo(() => {
    const map = new Map<string, any>();
    metaAccounts.forEach(account => {
      map.set(account.platform, account);
    });
    return map;
  }, [metaAccounts]);

  // Connexion via Meta OAuth pour Facebook/Instagram
  const handleConnectMeta = async (platform: 'facebook' | 'instagram') => {
    try {
      setConnecting(true);
      
      // Récupérer la configuration Meta OAuth
      const { data, error } = await supabase.functions.invoke('get-meta-oauth-config', {
        body: { platform }
      });

      if (error) throw error;
      if (!data?.authUrl) throw new Error('URL de connexion non disponible');

      // Rediriger vers la page d'autorisation Meta
      window.location.href = data.authUrl;
    } catch (err: any) {
      console.error('Meta OAuth error:', err);
      toast.error(err.message || 'Erreur lors de la connexion Meta');
      setConnecting(false);
    }
  };

  const handleConnectAccounts = async () => {
    try {
      setConnecting(true);
      await connectAccounts({
        redirectUrl: `${window.location.origin}/social-accounts?connected=true`,
        connectTitle: 'Connectez vos réseaux sociaux',
        connectDescription: 'Sélectionnez les comptes à connecter pour publier automatiquement',
        redirectButtonText: 'Retourner à PostElma'
      });
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la connexion');
    } finally {
      setConnecting(false);
    }
  };

  // Gérer le clic sur une plateforme
  const handlePlatformClick = (platformId: string) => {
    if (USE_META_FOR_FACEBOOK && platformId === 'facebook') {
      handleConnectMeta('facebook');
    } else if (USE_META_FOR_FACEBOOK && platformId === 'instagram') {
      handleConnectMeta('instagram');
    } else {
      handleConnectAccounts();
    }
  };

  // Loading skeleton
  if (loading && !profile) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
              Gérez vos connexions à vos réseaux sociaux
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshProfile()}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
            
            <Badge 
              variant="outline" 
              className="text-sm px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
            >
              <Check className="w-4 h-4 mr-2 text-green-600" />
              {connectedMap.size + metaConnectedMap.size} / {AVAILABLE_PLATFORMS.length} connecté(s)
            </Badge>
          </div>
        </div>

        {/* Bouton principal de connexion (pour autres plateformes) */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-lg mb-1">Connecter vos réseaux sociaux</h3>
                <p className="text-sm text-muted-foreground">
                  Cliquez pour ouvrir la fenêtre de connexion et sélectionner vos comptes
                </p>
              </div>
              <Button 
                onClick={handleConnectAccounts}
                disabled={connecting}
                size="lg"
                className="min-w-[200px]"
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Connecter des comptes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid des plateformes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_PLATFORMS.map((platform) => {
            // Vérifier si c'est un compte Meta ou Upload Post
            const isMetaPlatform = USE_META_FOR_FACEBOOK && (platform.id === 'facebook' || platform.id === 'instagram');
            const isConnected = isMetaPlatform 
              ? metaConnectedMap.has(platform.id) 
              : connectedMap.has(platform.id);
            const accountData = isMetaPlatform 
              ? metaConnectedMap.get(platform.id) 
              : connectedMap.get(platform.id);
            const Icon = platform.icon;

            return (
              <Tooltip key={platform.id}>
                <TooltipTrigger asChild>
                  <Card 
                    className={cn(
                      "rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer",
                      isConnected && "border-green-500/50 shadow-green-100 dark:shadow-green-900/20"
                    )}
                    onClick={!isConnected ? () => handlePlatformClick(platform.id) : undefined}
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
                            <div className="flex items-center gap-2">
                              {isMetaPlatform && (
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                  Meta API
                                </Badge>
                              )}
                              <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                                <Check className="w-3 h-3 mr-1" />
                                Connecté
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-col items-center text-center space-y-3 py-4">
                            <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                              {(isMetaPlatform ? accountData.avatar_url : accountData.social_images) ? (
                                <AvatarImage 
                                  src={isMetaPlatform ? accountData.avatar_url : accountData.social_images} 
                                  alt={isMetaPlatform ? accountData.account_name : accountData.display_name} 
                                />
                              ) : (
                                <AvatarFallback className={platform.bgColor}>
                                  <Icon className="w-8 h-8 text-white" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div>
                              <p className="font-bold text-lg">
                                {isMetaPlatform ? accountData.account_name : (accountData.display_name || accountData.username)}
                              </p>
                              {!isMetaPlatform && accountData.username && (
                                <p className="text-sm text-muted-foreground">
                                  @{accountData.username}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Card Déconnecté
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center opacity-60">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Déconnecté
                            </span>
                          </div>

                          <div className="flex flex-col items-center text-center space-y-3 py-8">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center opacity-60">
                              <Icon className="w-10 h-10 text-muted-foreground" />
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
                            variant="outline"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlatformClick(platform.id);
                            }}
                          >
                            <Link2 className="mr-2 h-4 w-4" />
                            Connecter
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-900">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Comment ça marche ?
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Cliquez sur "Connecter des comptes" pour ouvrir la fenêtre de connexion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Sélectionnez les réseaux sociaux que vous souhaitez connecter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>Autorisez PostElma à publier sur vos comptes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>Revenez ici et actualisez pour voir vos comptes connectés</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
