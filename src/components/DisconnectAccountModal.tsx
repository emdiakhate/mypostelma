/**
 * Modal de confirmation pour déconnecter un compte social
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import React, { useState } from 'react';
import { SocialAccount, PLATFORM_CONFIG } from '@/types/socialAccount';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Music, 
  Youtube, 
  Bookmark,
  AlertTriangle,
  Trash2,
  Calendar,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisconnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accountId: string) => void;
  account: SocialAccount | null;
}

const DisconnectAccountModal: React.FC<DisconnectAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  account
}) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const getPlatformIcon = (platform: string) => {
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

  const handleDisconnect = async () => {
    if (!account || !understood) return;
    
    setIsDisconnecting(true);
    
    try {
      // Simulation du délai de déconnexion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Supprimer de localStorage
      const existingAccounts = JSON.parse(localStorage.getItem('postelma_social_accounts') || '[]');
      const updatedAccounts = existingAccounts.filter((acc: SocialAccount) => acc.id !== account.id);
      localStorage.setItem('postelma_social_accounts', JSON.stringify(updatedAccounts));
      
      onConfirm(account.id);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleClose = () => {
    if (!isDisconnecting) {
      setUnderstood(false);
      onClose();
    }
  };

  if (!account) return null;

  const config = PLATFORM_CONFIG[account.platform];
  const PlatformIcon = getPlatformIcon(account.platform);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <span>Déconnecter le compte</span>
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible et aura des conséquences sur vos publications.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informations du compte */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                config.gradient ? `bg-gradient-to-r ${config.gradient}` : '',
                !config.gradient && `bg-[${config.color}]`
              )}>
                <PlatformIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">@{account.username}</h3>
                <p className="text-sm text-gray-600">{account.displayName}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Users className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{account.followers} followers</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alert de warning */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Êtes-vous sûr de vouloir déconnecter @{account.username} ?</strong>
            </AlertDescription>
          </Alert>
          
          {/* Conséquences */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Conséquences de la déconnexion :</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Calendar className="w-4 h-4 text-orange-500 mt-0.5" />
                <span className="text-sm text-gray-700">
                  Les posts programmés pour ce compte seront annulés
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Trash2 className="w-4 h-4 text-red-500 mt-0.5" />
                <span className="text-sm text-gray-700">
                  Toutes les données de ce compte seront supprimées
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span className="text-sm text-gray-700">
                  Vous devrez reconnecter le compte pour republier
                </span>
              </div>
            </div>
          </div>
          
          {/* Checkbox de confirmation */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="understood"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(!!checked)}
            />
            <Label htmlFor="understood" className="text-sm text-gray-700">
              Je comprends les conséquences et souhaite déconnecter ce compte
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDisconnecting}>
            Annuler
          </Button>
          <Button 
            onClick={handleDisconnect}
            disabled={!understood || isDisconnecting}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            {isDisconnecting ? 'Déconnexion...' : 'Déconnecter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisconnectAccountModal;
