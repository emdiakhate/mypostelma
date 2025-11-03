/**
 * Modal d'onboarding affiché après l'inscription
 * Permet à l'utilisateur de connecter ses comptes de réseaux sociaux
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Link as LinkIcon, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadPost } from '@/hooks/useUploadPost';
import { ConnectedAccountCard } from '@/components/settings/ConnectedAccountCard';
import { UploadPostService } from '@/services/uploadPost.service';
import { formatUsernameForUploadPost } from '@/utils/usernameFormatter';

interface OnboardingModalProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, userId, userName, onComplete }: OnboardingModalProps) {
  const navigate = useNavigate();
  const { connectedAccounts, loading, refreshProfile, connectAccounts } = useUploadPost();
  const [connecting, setConnecting] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);

  // Créer le profil Upload-Post avec le nom de l'utilisateur formaté
  useEffect(() => {
    const createProfile = async () => {
      if (!isOpen || profileCreated) return;

      setCreatingProfile(true);
      try {
        // Formater le nom d'utilisateur pour respecter les règles Upload-Post
        const formattedUsername = formatUsernameForUploadPost(userName, userId);
        console.log(`Creating Upload-Post profile with username: ${formattedUsername}`);
        
        await UploadPostService.createUserProfile(formattedUsername);
        setProfileCreated(true);
        await refreshProfile();
      } catch (error) {
        console.error('Error creating Upload-Post profile:', error);
        // Continuer même si le profil existe déjà
        setProfileCreated(true);
      } finally {
        setCreatingProfile(false);
      }
    };

    createProfile();
  }, [isOpen, userId, userName, profileCreated]);

  const handleConnectAccounts = async () => {
    try {
      setConnecting(true);
      
      await connectAccounts({
        redirectUrl: `${window.location.origin}/onboarding?connected=true`,
        logoImage: `${window.location.origin}/logo.png`,
        connectTitle: 'Premiers pas - Connectez vos réseaux sociaux',
        connectDescription: 'Liez vos comptes pour commencer à publier automatiquement',
        platforms: ['tiktok', 'instagram', 'facebook', 'linkedin', 'x', 'threads'],
        redirectButtonText: 'Continuer vers le tableau de bord'
      });
      
    } catch (error) {
      console.error('Error connecting accounts:', error);
      toast.error('Erreur lors de la connexion des comptes');
      setConnecting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
    navigate('/app/dashboard');
  };

  const handleContinue = () => {
    onComplete();
    navigate('/app/dashboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Premiers pas avec PostElma</DialogTitle>
          </div>
          <DialogDescription>
            Connectez vos réseaux sociaux pour commencer à publier automatiquement
          </DialogDescription>
        </DialogHeader>

        {creatingProfile ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Préparation de votre compte...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Étapes */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium">Profil créé</h4>
                  <p className="text-sm text-muted-foreground">
                    Votre profil <strong>@{formatUsernameForUploadPost(userName, userId)}</strong> a été créé avec succès
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2">Connectez vos réseaux sociaux</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Liez vos comptes TikTok, Instagram, Facebook, LinkedIn, X et Threads
                  </p>

                  {connectedAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {connectedAccounts.map((account) => (
                        <ConnectedAccountCard 
                          key={account.platform}
                          platform={account.platform}
                          displayName={account.display_name}
                          image={account.social_images}
                          username={account.username}
                        />
                      ))}
                      <Button 
                        variant="outline" 
                        onClick={handleConnectAccounts}
                        disabled={connecting || loading}
                        className="w-full"
                      >
                        {(connecting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ajouter d'autres comptes
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleConnectAccounts} 
                      disabled={connecting || loading}
                      className="w-full"
                    >
                      {(connecting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Connecter mes réseaux sociaux
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="flex-1"
              >
                Passer cette étape
              </Button>
              
              {connectedAccounts.length > 0 && (
                <Button onClick={handleContinue} className="flex-1">
                  Continuer vers le tableau de bord
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
