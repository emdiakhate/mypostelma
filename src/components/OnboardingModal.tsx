/**
 * Modal d'onboarding affiché après l'inscription
 * Permet à l'utilisateur de connecter ses comptes de réseaux sociaux
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  const [creationError, setCreationError] = useState<string | null>(null);

  // Créer le profil Upload-Post avec le nom de l'utilisateur formaté
  useEffect(() => {
    const createProfile = async () => {
      if (!isOpen || profileCreated || creatingProfile) return;

      setCreatingProfile(true);
      setCreationError(null);
      
      try {
        // Formater le nom d'utilisateur pour respecter les règles Upload-Post
        const formattedUsername = formatUsernameForUploadPost(userName, userId);
        console.log(`[OnboardingModal] Creating Upload-Post profile with username: ${formattedUsername}`);
        
        const result = await UploadPostService.createUserProfile(formattedUsername);
        console.log('[OnboardingModal] Profile created successfully:', result);
        
        // Stocker le username dans le profil Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ upload_post_username: formattedUsername })
          .eq('id', userId);
        
        if (updateError) {
          console.error('[OnboardingModal] Error saving username to profile:', updateError);
          throw new Error(`Impossible de sauvegarder le nom d'utilisateur: ${updateError.message}`);
        }
        
        console.log('[OnboardingModal] Username saved to profile successfully');
        
        setProfileCreated(true);
        
        // Attendre un peu avant de rafraîchir pour que l'API soit à jour
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshProfile();
        
        toast.success(`Profil @${formattedUsername} créé avec succès`);
      } catch (error: any) {
        console.error('[OnboardingModal] Error creating Upload-Post profile:', error);
        const errorMessage = error?.message || 'Erreur lors de la création du profil';
        setCreationError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setCreatingProfile(false);
      }
    };

    createProfile();
  }, [isOpen, userId, userName, profileCreated, creatingProfile]);

  const handleConnectAccounts = async () => {
    if (!profileCreated) {
      toast.error('Veuillez d\'abord créer votre profil');
      return;
    }
    
    try {
      setConnecting(true);
      
      await connectAccounts({
        redirectUrl: `${window.location.origin}/onboarding?connected=true`,
        logoImage: `${window.location.origin}/logo.png`,
        connectTitle: 'Premiers pas - Connectez vos réseaux sociaux',
        connectDescription: 'Liez vos comptes pour commencer à publier automatiquement',
        platforms: ['tiktok', 'instagram', 'facebook', 'linkedin', 'x', 'threads'],
        redirectButtonText: 'Revenir à PostElma'
      });
      
      toast.success('Fenêtre de connexion ouverte. Connectez vos comptes puis revenez ici.');
      
    } catch (error: any) {
      console.error('[OnboardingModal] Error connecting accounts:', error);
      const errorMsg = error?.message || 'Erreur lors de la connexion des comptes';
      toast.error(errorMsg);
    } finally {
      setConnecting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
    navigate('/app/dashboard');
  };

  const handleContinue = () => {
    onComplete();
    navigate('/app/settings/accounts');
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
              <p className="text-muted-foreground">Création de votre profil...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Profil : @{formatUsernameForUploadPost(userName, userId)}
              </p>
            </div>
          </div>
        ) : creationError ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <h4 className="font-medium text-destructive mb-2">Erreur de création du profil</h4>
              <p className="text-sm text-destructive/90">{creationError}</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleSkip}
                className="flex-1"
              >
                Passer cette étape
              </Button>
              <Button 
                onClick={() => {
                  setCreationError(null);
                  setProfileCreated(false);
                }}
                className="flex-1"
              >
                Réessayer
              </Button>
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
