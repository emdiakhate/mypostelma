/**
 * Page de gestion des comptes sociaux
 * Affiche tous les réseaux sociaux avec leur statut de connexion
 */

import { useState, useEffect, useMemo } from 'react';
import { useUploadPost } from '@/hooks/useUploadPost';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users,
  Loader2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Music,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SocialPlatform } from '@/types/uploadPost.types';

// Configuration des plateformes disponibles
const AVAILABLE_PLATFORMS = [
  { 
    id: 'instagram' as SocialPlatform, 
    name: 'Instagram', 
    icon: Instagram,
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'facebook' as SocialPlatform, 
    name: 'Facebook', 
    icon: Facebook,
    color: 'from-blue-600 to-blue-700'
  },
  { 
    id: 'tiktok' as SocialPlatform, 
    name: 'TikTok', 
    icon: Music,
    color: 'from-black to-gray-800'
  },
  { 
    id: 'linkedin' as SocialPlatform, 
    name: 'LinkedIn', 
    icon: Linkedin,
    color: 'from-blue-700 to-blue-800'
  },
  { 
    id: 'x' as SocialPlatform, 
    name: 'X (Twitter)', 
    icon: Twitter,
    color: 'from-black to-gray-900'
  },
  { 
    id: 'threads' as SocialPlatform, 
    name: 'Threads', 
    icon: Instagram,
    color: 'from-gray-800 to-black'
  }
];

export default function SocialAccountsPage() {
  const { profile, connectedAccounts, loading, error, refreshProfile, connectAccounts } = useUploadPost();
  const [connecting, setConnecting] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);

  // Vérifier si l'utilisateur revient après connexion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast.success('Comptes connectés avec succès !');
      refreshProfile();
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
        connectTitle: 'Connectez vos réseaux sociaux à Postelma',
        connectDescription: 'Liez vos comptes pour publier automatiquement sur vos plateformes préférées',
        platforms: [platformId]
      });
      
      toast.success('Fenêtre de connexion ouverte. Connectez votre compte puis revenez ici.');
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
        connectTitle: 'Connectez vos réseaux sociaux à Postelma',
        connectDescription: 'Liez vos comptes pour publier automatiquement sur vos plateformes préférées',
        platforms: AVAILABLE_PLATFORMS.map(p => p.id)
      });
      
      toast.success('Fenêtre de connexion ouverte. Connectez vos comptes puis revenez ici.');
    } catch (error: any) {
      console.error('Error connecting accounts:', error);
      toast.error(error?.message || 'Erreur lors de la connexion des comptes');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectPlatform = async (platformId: SocialPlatform) => {
    toast.info('Fonctionnalité de déconnexion en cours de développement');
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Afficher un message si pas de profil Upload-Post
  if (!profile && !loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Comptes Sociaux</h1>
            <p className="text-muted-foreground">
              Gérez vos comptes sociaux connectés
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Profil non configuré
                </h3>
                <p className="text-muted-foreground mb-6">
                  Votre profil Upload-Post n'a pas encore été créé. Veuillez compléter l'onboarding pour connecter vos comptes sociaux.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Rafraîchir la page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comptes Sociaux</h1>
          <p className="text-muted-foreground">
            Gérez vos comptes sociaux connectés
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {connectedAccounts.length} / {AVAILABLE_PLATFORMS.length} connecté(s)
          </Badge>
          
          <Button 
            onClick={handleConnectMultiplePlatforms} 
            disabled={connecting || loading}
          >
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connecter tous les comptes
          </Button>
        </div>
      </div>

      {/* Grid des plateformes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_PLATFORMS.map((platform) => {
          const isConnected = connectedMap.has(platform.id);
          const accountData = connectedMap.get(platform.id);
          const Icon = platform.icon;

          return (
            <Card 
              key={platform.id}
              className={cn(
                "transition-all hover:shadow-md",
                isConnected && "border-green-500"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center",
                      platform.color
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{platform.name}</h3>
                      {isConnected && accountData && (
                        <p className="text-sm text-muted-foreground">
                          @{accountData.username || accountData.display_name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isConnected ? (
                    <Badge variant="default" className="bg-green-500">
                      Connecté
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Non connecté
                    </Badge>
                  )}
                </div>

                {isConnected && accountData ? (
                  <div className="space-y-3">
                    {accountData.social_images && (
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={accountData.social_images} />
                        <AvatarFallback>{platform.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <p className="text-sm font-medium">
                      {accountData.display_name}
                    </p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDisconnectPlatform(platform.id)}
                    >
                      Déconnecter
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnectPlatform(platform.id)}
                    disabled={connecting}
                  >
                    {connecting && selectedPlatforms.includes(platform.id) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Connecter
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message d'information */}
      {connectedAccounts.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-3">
              <Users className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Commencez par connecter vos comptes
                </h3>
                <p className="text-muted-foreground">
                  Connectez vos réseaux sociaux pour publier du contenu automatiquement sur toutes vos plateformes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
