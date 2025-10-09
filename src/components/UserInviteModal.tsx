/**
 * Modal pour inviter un nouvel utilisateur
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React, { useState } from 'react';
import { UserRole, ROLE_PERMISSIONS } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Shield, 
  Mail, 
  UserPlus, 
  Crown,
  Pencil,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  isEdit?: boolean;
  userToEdit?: any;
}

const UserInviteModal: React.FC<UserInviteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isEdit = false,
  userToEdit
}) => {
  const [formData, setFormData] = useState({
    email: userToEdit?.email || '',
    name: userToEdit?.name || '',
    role: (userToEdit?.role || 'creator') as UserRole,
    sendEmail: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Propriétaire',
          icon: Crown,
          description: 'Accès complet à toutes les fonctionnalités',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconClassName: 'text-yellow-600'
        };
      case 'manager':
        return {
          label: 'Manager',
          icon: Shield,
          description: 'Gère l\'équipe et approuve le contenu',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          iconClassName: 'text-blue-600'
        };
      case 'creator':
        return {
          label: 'Créateur',
          icon: Pencil,
          description: 'Crée du contenu, nécessite approbation',
          className: 'bg-green-100 text-green-800 border-green-200',
          iconClassName: 'text-green-600'
        };
      case 'viewer':
        return {
          label: 'Observateur',
          icon: Eye,
          description: 'Consultation uniquement, pas de modification',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          iconClassName: 'text-gray-600'
        };
      default:
        return {
          label: role,
          icon: Shield,
          description: '',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          iconClassName: 'text-gray-600'
        };
    }
  };

  const getRolePermissions = (role: UserRole) => {
    const permissions = ROLE_PERMISSIONS[role];
    const permissionItems = [
      { key: 'canPublish', label: 'Publier du contenu', icon: CheckCircle },
      { key: 'canSchedule', label: 'Programmer du contenu', icon: CheckCircle },
      { key: 'canDelete', label: 'Supprimer du contenu', icon: CheckCircle },
      { key: 'canManageUsers', label: 'Gérer l\'équipe', icon: CheckCircle },
      { key: 'canManageAccounts', label: 'Gérer les comptes', icon: CheckCircle },
      { key: 'canViewAnalytics', label: 'Voir les analytics', icon: CheckCircle },
      { key: 'canApproveContent', label: 'Approuver le contenu', icon: CheckCircle },
      { key: 'canManageBilling', label: 'Gérer la facturation', icon: CheckCircle }
    ];

    return permissionItems.map(item => ({
      ...item,
      hasPermission: permissions[item.key as keyof typeof permissions]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.name.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // TODO: Implémenter l'API d'invitation
      const newUser = {
        email: formData.email.trim(),
        name: formData.name.trim(),
        role: formData.role,
        permissions: ROLE_PERMISSIONS[formData.role],
        isActive: true
      };
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess?.(newUser);
      
      // Reset form
      setFormData({
        email: '',
        name: '',
        role: 'creator',
        sendEmail: true
      });
      
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
        email: userToEdit?.email || '',
        name: userToEdit?.name || '',
        role: (userToEdit?.role || 'creator') as UserRole,
        sendEmail: true
      });
      onClose();
    }
  };

  const roleConfig = getRoleConfig(formData.role);
  const RoleIcon = roleConfig.icon;
  const permissions = getRolePermissions(formData.role);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>{isEdit ? 'Modifier l\'utilisateur' : 'Inviter un membre'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Modifiez les informations de cet utilisateur.'
              : 'Envoyez une invitation à un nouvel utilisateur pour rejoindre votre équipe.'
            }
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
            <Label htmlFor="name" className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Nom complet</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jean Dupont"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Manager
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="creator">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-green-100 text-green-800 border-green-200"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Créateur
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-gray-100 text-gray-800 border-gray-200"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Observateur
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {roleConfig.description}
            </p>
          </div>
          
          {/* Aperçu des permissions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Permissions du rôle</Label>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {permissions.map((permission) => (
                <div key={permission.key} className="flex items-center space-x-2">
                  {permission.hasPermission ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={cn(
                    "text-sm",
                    permission.hasPermission ? "text-green-700" : "text-gray-500"
                  )}>
                    {permission.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {!isEdit && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendEmail: !!checked }))}
                disabled={isSubmitting}
              />
              <Label htmlFor="sendEmail" className="text-sm">
                Envoyer un email d'invitation
              </Label>
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
              disabled={!formData.email.trim() || !formData.name.trim() || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? 'Envoi...' : (isEdit ? 'Enregistrer' : 'Inviter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserInviteModal;
