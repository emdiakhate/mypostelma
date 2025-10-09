/**
 * Composant UserCard pour afficher un utilisateur
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React from 'react';
import { User, UserRole } from '@/types/user';
import { usePermissions, useRolePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Mail, 
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  onSuspend?: (userId: string) => void;
  onActivate?: (userId: string) => void;
  onRoleChange?: (userId: string, role: UserRole) => void;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onSuspend,
  onActivate,
  onRoleChange,
  className
}) => {
  const { canChangeRole, canRemoveUser, availableRoles } = useRolePermissions();
  const { isAdmin } = usePermissions();

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

  const getStatusIcon = () => {
    if (user.isActive) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow",
      !user.isActive && "opacity-60",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {user.name}
              </h3>
              {getStatusIcon()}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{user.email}</p>
            
            <div className="flex items-center space-x-2 mb-3">
              <Badge 
                variant="outline" 
                className={cn("text-xs font-medium", getRoleColor(user.role))}
              >
                <Shield className="w-3 h-3 mr-1" />
                {getRoleLabel(user.role)}
              </Badge>
              
              <Badge 
                variant={user.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {user.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Créé le {formatDate(user.createdAt)}</span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Dernière connexion: {formatDate(user.lastLogin)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit?.(user)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              
              {availableRoles.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  {availableRoles
                    .filter(role => role !== user.role)
                    .map(role => (
                      <DropdownMenuItem 
                        key={role}
                        onClick={() => onRoleChange?.(user.id, role as UserRole)}
                        disabled={!canChangeRole(role as UserRole, user.id)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Changer en {getRoleLabel(role as UserRole)}
                      </DropdownMenuItem>
                    ))}
                </>
              )}
              
              <DropdownMenuSeparator />
              
              {user.isActive ? (
                <DropdownMenuItem 
                  onClick={() => onSuspend?.(user.id)}
                  className="text-orange-600"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Suspendre
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => onActivate?.(user.id)}
                  className="text-green-600"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Activer
                </DropdownMenuItem>
              )}
              
              {canRemoveUser(user.id) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(user.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default UserCard;
