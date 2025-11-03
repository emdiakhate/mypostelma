/**
 * Page de gestion des comptes sociaux
 * Utilise Upload-Post pour afficher les vrais comptes connectés
 */

import { useState, useEffect } from 'react';
import { useUploadPost } from '@/hooks/useUploadPost';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectedAccountCard } from '@/components/settings/ConnectedAccountCard';
import { 
  Users, 
  Plus, 
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function SocialAccountsPage() {
  const { profile, connectedAccounts, loading, refreshProfile, connectAccounts } = useUploadPost();
  const [connecting, setConnecting] = useState(false);

  // Vérifier si l'utilisateur revient après connexion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast.success('Comptes connectés avec succès !');
      refreshProfile();
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnectAccounts = async () => {
    try {
      setConnecting(true);
      
      await connectAccounts({
        redirectUrl: `${window.location.origin}/app/settings/accounts?connected=true`,
        logoImage: `${window.location.origin}/logo.png`,
        connectTitle: 'Connectez vos réseaux sociaux à Postelma',
        connectDescription: 'Liez vos comptes pour publier automatiquement sur vos plateformes préférées',
        platforms: ['tiktok', 'instagram', 'facebook', 'linkedin', 'x', 'threads']
      });
      
      toast.success('Fenêtre de connexion ouverte. Connectez vos comptes puis revenez ici.');
    } catch (error: any) {
      console.error('Error connecting accounts:', error);
      toast.error(error?.message || 'Erreur lors de la connexion des comptes');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectAccount = async (platform: string) => {
    // TODO: Implémenter la déconnexion via Upload-Post API
    toast.info('Fonctionnalité de déconnexion à venir');
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptes Sociaux</h1>
          <p className="text-gray-600">
            Gérez vos comptes sociaux connectés
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {connectedAccounts.length} compte(s) connecté(s)
          </Badge>
          
          <Button 
            onClick={handleConnectAccounts} 
            disabled={connecting || loading}
          >
            {(connecting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="w-4 h-4 mr-2" />
            {connectedAccounts.length > 0 ? 'Ajouter des comptes' : 'Connecter mes comptes'}
          </Button>
        </div>
      </div>

      {/* Comptes connectés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Comptes Connectés</span>
          </CardTitle>
          <CardDescription>
            Gérez vos comptes sociaux connectés via Upload-Post
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {connectedAccounts.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun compte connecté
              </h3>
              <p className="text-gray-600 mb-4">
                Connectez vos premiers comptes sociaux pour commencer à publier.
              </p>
              <Button onClick={handleConnectAccounts} disabled={connecting || loading}>
                {(connecting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="w-4 h-4 mr-2" />
                Connecter un compte
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedAccounts.map((account) => (
                <ConnectedAccountCard 
                  key={account.platform}
                  platform={account.platform}
                  displayName={account.display_name}
                  image={account.social_images}
                  username={account.username}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
