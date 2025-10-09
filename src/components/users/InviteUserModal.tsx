/**
 * Modal pour inviter un nouvel utilisateur
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React, { useState } from 'react';
import { UserRole } from '@/types/user';
import { useUser } from '@/contexts/UserContext';
import { useRolePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, MessageSquare, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { inviteUser, isLoading, error } = useUser();
  const { availableRoles } = useRolePermissions();
  
  const [formData, setFormData] = useState({
    email: '',
    role: 'creator' as UserRole,
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Accès complet à toutes les fonctionnalités et paramètres';
      case 'manager':
        return 'Peut gérer l\'équipe et approuver le contenu';
      case 'creator':
        return 'Peut créer et programmer du contenu';
      case 'viewer':
        return 'Accès en lecture seule aux analytics';
      default:
        return '';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'creator':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'manager':
        return 'Manager';
      case 'creator':
        return 'Créateur';
      case 'viewer':
        return 'Observateur';
      default:
        return role;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await inviteUser(
        formData.email.trim(),
        formData.role,
        formData.message.trim() || undefined
      );
      
      // Reset form
      setFormData({
        email: '',
        role: 'creator',
        message: ''
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        email: '',
        role: 'creator',
        message: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Inviter un utilisateur</span>
          </DialogTitle>
          <DialogDescription>
            Envoyez une invitation à un nouvel utilisateur pour rejoindre votre équipe.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Adresse email</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="utilisateur@exemple.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Rôle</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getRoleColor(role as UserRole))}
                      >
                        {getRoleLabel(role as UserRole)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {getRoleDescription(formData.role)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Message personnalisé (optionnel)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Ajoutez un message personnalisé à l'invitation..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!formData.email.trim() || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? 'Envoi...' : 'Inviter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserModal;
