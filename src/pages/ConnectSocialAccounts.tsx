/**
 * Page de connexion des réseaux sociaux via Upload-Post
 * Affichée après l'achat d'un abonnement
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUploadPost } from '@/hooks/useUploadPost';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConnectedAccountCard } from '@/components/settings/ConnectedAccountCard';

export default function ConnectSocialAccounts() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        redirectUrl: `${window.location.origin}/connect-accounts?connected=true`,
        logoImage: `${window.location.origin}/logo.png`,
        connectTitle: 'Connectez vos réseaux sociaux à Postelma',
        connectDescription: 'Liez vos comptes pour publier automatiquement sur vos plateformes préférées',
        platforms: ['tiktok', 'instagram', 'facebook', 'linkedin', 'x', 'threads']
      });
      
    } catch (error) {
      console.error('Error generating connect URL:', error);
      toast.error('Erreur lors de la génération du lien de connexion');
      setConnecting(false);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connectez vos réseaux sociaux</h1>
        <p className="text-muted-foreground">
          Liez vos comptes pour commencer à publier automatiquement sur vos plateformes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes sociaux</CardTitle>
          <CardDescription>
            Gérez vos connexions aux réseaux sociaux
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {connectedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-6">
                Aucun compte connecté pour le moment
              </p>
              <Button 
                onClick={handleConnectAccounts} 
                disabled={connecting || loading}
                size="lg"
              >
                {(connecting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <LinkIcon className="mr-2 h-4 w-4" />
                Connecter mes réseaux sociaux
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Liste des comptes connectés */}
              <div className="space-y-3">
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

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleConnectAccounts}
                  disabled={connecting || loading}
                >
                  {(connecting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ajouter d'autres comptes
                </Button>
                
                <Button onClick={handleContinue}>
                  Continuer vers le tableau de bord
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
