/**
 * Page de gestion des comptes sociaux
 * Affiche tous les réseaux sociaux avec leur statut de connexion
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUploadPost } from '@/hooks/useUploadPost';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users,
  Loader2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Music,
  MessageCircle,
  Link2,
  Check,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import type { SocialPlatform } from '@/types/uploadPost.types';

// Configuration des plateformes disponibles
const AVAILABLE_PLATFORMS = [
  { 
    id: 'instagram' as SocialPlatform, 
    name: 'Instagram', 
    icon: Instagram,
    bgColor: 'bg-gradient-to-br from-purple-500 to-pink-500',
    textColor: 'text-purple-600',
    description: 'Connectez pour publier sur Instagram'
  },
  { 
    id: 'facebook' as SocialPlatform, 
    name: 'Facebook', 
    icon: Facebook,
    bgColor: 'bg-blue-600',
    textColor: 'text-blue-600',
    description: 'Connectez pour publier sur Facebook'
  },
  { 
    id: 'tiktok' as SocialPlatform, 
    name: 'TikTok', 
    icon: Music,
    bgColor: 'bg-black',
    textColor: 'text-black',
    description: 'Connectez pour publier sur TikTok'
  },
  { 
    id: 'linkedin' as SocialPlatform, 
    name: 'LinkedIn', 
    icon: Linkedin,
    bgColor: 'bg-blue-700',
    textColor: 'text-blue-700',
    description: 'Connectez pour publier sur LinkedIn'
  },
  { 
    id: 'x' as SocialPlatform, 
    name: 'X (Twitter)', 
    icon: Twitter,
    bgColor: 'bg-black',
    textColor: 'text-black',
    description: 'Connectez pour publier sur X'
  },
  { 
    id: 'threads' as SocialPlatform, 
    name: 'Threads', 
    icon: MessageCircle,
    bgColor: 'bg-gradient-to-br from-gray-800 to-black',
    textColor: 'text-gray-800',
    description: 'Connectez pour publier sur Threads'
  }
];

export default function SocialAccountsPage() {
  const { profile, connectedAccounts, loading, error, refreshProfile, connectAccounts } = useUploadPost();
  const [connecting, setConnecting] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [justConnected, setJustConnected] = useState<string | null>(null);

  // Vérifier si l'utilisateur revient après connexion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success('🎉 Comptes connectés avec succès !');
      refreshProfile();
      
      // Scroll vers le haut
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshProfile]);

  // Créer un map des comptes connectés pour un accès rapide
  const connectedMap = useMemo(() => {
    const map = new Map();
    connectedAccounts.forEach(account => {
      map.set(account.platform, account);
    });
    return map;
  }, [connectedAccounts]);

  const handleConnectPlatform = async (platformId: SocialPlatform) => {
    try {
      setConnecting(true);
      setSelectedPlatforms([platformId]);
      
      await connectAccounts({
        redirectUrl: `${window.location.origin}/app/settings/accounts?connected=true`,
        logoImage: `${window.location.origin}/logo.png`,
        connectTitle: 'Connectez vos réseaux à Postelma',
        connectDescription: 'Autorisez Postelma à publier sur vos plateformes en toute sécurité',
        platforms: [platformId],
        redirectButtonText: 'Retour à Postelma'
      });
      
      toast.success('Fenêtre de connexion ouverte !', {
        description: 'Connectez votre compte puis revenez ici.'
      });
    } catch (error: any) {
      console.error('Error connecting platform:', error);
      toast.error(error?.message || 'Erreur lors de la connexion du compte');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectMultiplePlatforms = async () => {
    try {
      setConnecting(true);
      
      await connectAccounts({
        redirectUrl: `${window.location.origin}/app/settings/accounts?connected=true`,
        logoImage: `${window.location.origin}/logo.png`,
        connectTitle: 'Connectez vos réseaux à Postelma',
        connectDescription: 'Autorisez Postelma à publier sur vos plateformes en toute sécurité',
        platforms: AVAILABLE_PLATFORMS.map(p => p.id),
        redirectButtonText: 'Retour à Postelma'
      });
      
      toast.success('Fenêtre de connexion ouverte !', {
        description: 'Connectez vos comptes puis revenez ici.'
      });
    } catch (error: any) {
      console.error('Error connecting accounts:', error);
      toast.error(error?.message || 'Erreur lors de la connexion des comptes');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectPlatform = async (platformId: SocialPlatform) => {
    try {
      const account = connectedMap.get(platformId);
      if (!account) {
        toast.error('Compte non trouvé');
        return;
      }
      
      // Call the edge function to disconnect from Upload-Post
      const { error } = await supabase.functions.invoke('disconnect-upload-post-account', {
        body: { platform: platformId }
      });
      
      if (error) {
        console.error('Error disconnecting:', error);
        toast.error(`Erreur lors de la déconnexion: ${error.message}`);
        return;
      }
      
      toast.success(`${platformId} déconnecté avec succès`);
      refreshProfile();
    } catch (error: any) {
      console.error('Error disconnecting platform:', error);
      toast.error(error?.message || 'Erreur lors de la déconnexion');
    }
  };

  // Loading skeleton
  if (loading && connectedAccounts.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
              Gérez vos connexions aux réseaux sociaux
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className="text-sm px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 animate-fade-in"
            >
              <Check className="w-4 h-4 mr-2 text-green-600" />
              {connectedAccounts.length} / {AVAILABLE_PLATFORMS.length} connecté(s)
            </Badge>
            
            <Button 
              onClick={handleConnectMultiplePlatforms} 
              disabled={connecting || loading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {connecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Connecter tous les comptes
            </Button>
          </div>
        </div>

        {/* Grid des plateformes */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {AVAILABLE_PLATFORMS.map((platform) => {
            const isConnected = connectedMap.has(platform.id);
            const accountData = connectedMap.get(platform.id);
            const Icon = platform.icon;

            return (
              <Tooltip key={platform.id}>
                <TooltipTrigger asChild>
                  <Card 
                    className={cn(
                      "rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer animate-fade-in",
                      isConnected && "border-green-500/50 shadow-green-100 dark:shadow-green-900/20",
                      justConnected === platform.id && "ring-2 ring-green-500 shadow-green-200 dark:shadow-green-900/40"
                    )}
                  >
                    <CardContent className="p-6">
                      {isConnected && accountData ? (
                        // Card Connecté
                        <div className="space-y-4">
                          {/* Header avec icône et badge */}
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

                          {/* Avatar et infos */}
                          <div className="flex flex-col items-center text-center space-y-3 py-4">
                            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                              {accountData.social_images ? (
                                <AvatarImage src={accountData.social_images} alt={accountData.display_name} />
                              ) : (
                                <AvatarFallback className={platform.bgColor}>
                                  <Icon className="w-10 h-10 text-white" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div>
                              <p className="font-bold text-lg">
                                {accountData.display_name || accountData.username}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{accountData.username || accountData.display_name?.toLowerCase().replace(/\s/g, '')}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Connecté le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          {/* Bouton déconnecter */}
                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950"
                            onClick={() => handleDisconnectPlatform(platform.id)}
                          >
                            Déconnecter
                          </Button>
                        </div>
                      ) : (
                        // Card Déconnecté
                        <div className="space-y-4">
                          {/* Header avec icône grise */}
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center opacity-60">
                              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Déconnecté
                            </span>
                          </div>

                          {/* Icône grande centrale */}
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

                          {/* Bouton connecter avec animation pulse */}
                          <Button 
                            className={cn(
                              "w-full relative overflow-hidden",
                              "bg-primary hover:brightness-110 transition-all",
                              connecting && selectedPlatforms.includes(platform.id) && "animate-pulse"
                            )}
                            onClick={() => handleConnectPlatform(platform.id)}
                            disabled={connecting}
                          >
                            {connecting && selectedPlatforms.includes(platform.id) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connexion...
                              </>
                            ) : (
                              <>
                                <Link2 className="mr-2 h-4 w-4" />
                                Connecter
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{platform.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Empty state */}
        {connectedAccounts.length === 0 && (
          <Card className="border-dashed border-2 animate-fade-in">
            <CardContent className="p-12">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-2xl">
                    Connectez vos premiers comptes !
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Liez vos réseaux sociaux pour publier du contenu automatiquement sur toutes vos plateformes en un seul clic.
                  </p>
                </div>
                <Button 
                  size="lg"
                  onClick={handleConnectMultiplePlatforms}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Link2 className="mr-2 h-5 w-5" />
                  Commencer maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
