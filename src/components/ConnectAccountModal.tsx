/**
 * Modal pour connecter un compte social (simulation OAuth)
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import React, { useState } from 'react';
import { SocialPlatform, PLATFORM_CONFIG, SocialAccount } from '@/types/socialAccount';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Music, 
  Youtube, 
  Bookmark,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Users,
  Shield,
  BarChart3,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accountData: any) => void;
  platform: SocialPlatform | null;
}

const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  platform
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<'oauth' | 'permissions' | 'form' | 'success'>('oauth');
  const [permissions, setPermissions] = useState({
    readProfile: true,
    readPosts: true,
    publishPosts: true,
    readAnalytics: false
  });
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    followers: 0
  });

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'tiktok': return Music;
      case 'youtube': return Youtube;
      case 'pinterest': return Bookmark;
      default: return Instagram;
    }
  };

  const handleConnect = async () => {
    if (!platform) return;
    
    setIsConnecting(true);
    
    try {
      // TODO: Remplacer par vrai OAuth Ayrshare
      // 1. Appeler POST /api/profiles/connect
      // 2. Rediriger vers authUrl
      // 3. Gérer callback /auth/callback
      // 4. Sauvegarder profileKey
      
      // Simulation du processus OAuth
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Créer le compte avec les données du formulaire
      const mockAccountData: SocialAccount = {
        id: Date.now().toString(),
        platform,
        username: formData.username || `user_${Date.now()}`,
        displayName: formData.displayName || `Compte ${PLATFORM_CONFIG[platform].name}`,
        followers: formData.followers || Math.floor(Math.random() * 10000) + 100,
        isConnected: true,
        connectedAt: new Date(),
        lastSync: new Date(),
        status: 'connected' as const,
        permissions
      };
      
      // Sauvegarder dans localStorage
      const existingAccounts = JSON.parse(localStorage.getItem('postelma_social_accounts') || '[]');
      existingAccounts.push(mockAccountData);
      localStorage.setItem('postelma_social_accounts', JSON.stringify(existingAccounts));
      
      setStep('success');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(mockAccountData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      setStep('oauth');
      setFormData({ username: '', displayName: '', followers: 0 });
      onClose();
    }
  };

  if (!platform) return null;

  const config = PLATFORM_CONFIG[platform];
  const PlatformIcon = getPlatformIcon(platform);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              config.gradient ? `bg-gradient-to-r ${config.gradient}` : '',
              !config.gradient && `bg-[${config.color}]`
            )}>
              <PlatformIcon className="w-4 h-4 text-white" />
            </div>
            <span>Connecter {config.name}</span>
          </DialogTitle>
          <DialogDescription>
            {step === 'oauth' && 'Autorisez Postelma à accéder à votre compte pour publier du contenu.'}
            {step === 'permissions' && 'Configurez les permissions pour votre compte.'}
            {step === 'success' && 'Compte connecté avec succès !'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'oauth' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                config.gradient ? `bg-gradient-to-r ${config.gradient}` : '',
                !config.gradient && `bg-[${config.color}]`
              )}>
                <PlatformIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connecter {config.name}
              </h3>
              <p className="text-sm text-gray-600">
                Postelma aura accès à votre compte {config.name} pour publier du contenu.
              </p>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous serez redirigé vers {config.name} pour autoriser l'accès à votre compte.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Postelma aura accès à :</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Lire votre profil et informations de base</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Publier du contenu en votre nom</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Lire les statistiques de vos publications</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === 'permissions' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="readProfile"
                  checked={permissions.readProfile}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, readProfile: !!checked }))}
                />
                <Label htmlFor="readProfile" className="text-sm">
                  Lire le profil et les informations de base
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="readPosts"
                  checked={permissions.readPosts}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, readPosts: !!checked }))}
                />
                <Label htmlFor="readPosts" className="text-sm">
                  Lire les publications existantes
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="publishPosts"
                  checked={permissions.publishPosts}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, publishPosts: !!checked }))}
                />
                <Label htmlFor="publishPosts" className="text-sm">
                  Publier du nouveau contenu
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="readAnalytics"
                  checked={permissions.readAnalytics}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, readAnalytics: !!checked }))}
                />
                <Label htmlFor="readAnalytics" className="text-sm">
                  Lire les statistiques et analytics
                </Label>
              </div>
            </div>
          </div>
        )}
        
        {step === 'form' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3",
                config.gradient ? `bg-gradient-to-r ${config.gradient}` : '',
                !config.gradient && `bg-[${config.color}]`
              )}>
                <PlatformIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Informations du compte {config.name}
              </h3>
              <p className="text-sm text-gray-600">
                Remplissez les informations de votre compte pour la simulation
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Nom d'utilisateur
                </Label>
                <Input
                  id="username"
                  placeholder="@username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">
                  Nom d'affichage
                </Label>
                <Input
                  id="displayName"
                  placeholder="Nom d'affichage"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="followers" className="text-sm font-medium">
                  Nombre de followers
                </Label>
                <Input
                  id="followers"
                  type="number"
                  placeholder="1000"
                  value={formData.followers}
                  onChange={(e) => setFormData(prev => ({ ...prev, followers: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
        )}
        
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Compte connecté !</h3>
              <p className="text-sm text-gray-600">
                ✓ {config.name} @{formData.username || 'username'} connecté
              </p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          {step === 'oauth' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isConnecting}>
                Annuler
              </Button>
              <Button 
                onClick={() => setStep('permissions')}
                disabled={isConnecting}
                style={{ backgroundColor: config.color }}
              >
                Continuer
              </Button>
            </>
          )}
          
          {step === 'permissions' && (
            <>
              <Button variant="outline" onClick={() => setStep('oauth')} disabled={isConnecting}>
                Retour
              </Button>
              <Button 
                onClick={() => setStep('form')}
                disabled={isConnecting}
                style={{ backgroundColor: config.color }}
              >
                Continuer
              </Button>
            </>
          )}
          
          {step === 'form' && (
            <>
              <Button variant="outline" onClick={() => setStep('permissions')} disabled={isConnecting}>
                Retour
              </Button>
              <Button 
                onClick={handleConnect}
                disabled={isConnecting || !formData.username.trim()}
                style={{ backgroundColor: config.color }}
              >
                {isConnecting ? 'Connexion...' : 'Connecter le compte'}
              </Button>
            </>
          )}
          
          {step === 'success' && (
            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectAccountModal;
