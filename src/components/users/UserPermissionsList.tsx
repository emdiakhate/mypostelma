/**
 * Composant pour afficher les permissions d'un utilisateur
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React from 'react';
import { UserPermissions } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Send, 
  Calendar, 
  Trash2, 
  Users, 
  Settings, 
  BarChart3, 
  CheckSquare, 
  CreditCard 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserPermissionsListProps {
  permissions: UserPermissions;
  showLabels?: boolean;
  className?: string;
}

const UserPermissionsList: React.FC<UserPermissionsListProps> = ({
  permissions,
  showLabels = true,
  className
}) => {
  const permissionItems = [
    {
      key: 'canPublish' as keyof UserPermissions,
      label: 'Publier du contenu',
      icon: Send,
      description: 'Peut publier des posts immédiatement'
    },
    {
      key: 'canSchedule' as keyof UserPermissions,
      label: 'Programmer du contenu',
      icon: Calendar,
      description: 'Peut programmer des posts pour plus tard'
    },
    {
      key: 'canDelete' as keyof UserPermissions,
      label: 'Supprimer du contenu',
      icon: Trash2,
      description: 'Peut supprimer des posts'
    },
    {
      key: 'canManageUsers' as keyof UserPermissions,
      label: 'Gérer l\'équipe',
      icon: Users,
      description: 'Peut inviter et gérer les utilisateurs'
    },
    {
      key: 'canManageAccounts' as keyof UserPermissions,
      label: 'Gérer les comptes',
      icon: Settings,
      description: 'Peut connecter/déconnecter les comptes sociaux'
    },
    {
      key: 'canViewAnalytics' as keyof UserPermissions,
      label: 'Voir les analytics',
      icon: BarChart3,
      description: 'Peut consulter les statistiques'
    },
    {
      key: 'canApproveContent' as keyof UserPermissions,
      label: 'Approuver le contenu',
      icon: CheckSquare,
      description: 'Peut approuver le contenu en attente'
    },
    {
      key: 'canManageBilling' as keyof UserPermissions,
      label: 'Gérer la facturation',
      icon: CreditCard,
      description: 'Peut gérer l\'abonnement et la facturation'
    }
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Permissions
        </h4>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {permissionItems.map((item) => {
          const hasPermission = permissions[item.key];
          const Icon = item.icon;
          
          return (
            <div
              key={item.key}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                hasPermission
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex-shrink-0">
                {hasPermission ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <Icon className={cn(
                    "w-4 h-4",
                    hasPermission ? "text-green-600" : "text-gray-400"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    hasPermission ? "text-green-900" : "text-gray-500"
                  )}>
                    {item.label}
                  </span>
                </div>
                
                <p className={cn(
                  "text-xs mt-1",
                  hasPermission ? "text-green-700" : "text-gray-500"
                )}>
                  {item.description}
                </p>
              </div>
              
              <Badge
                variant={hasPermission ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  hasPermission
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                )}
              >
                {hasPermission ? 'Oui' : 'Non'}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserPermissionsList;
