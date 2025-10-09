/**
 * Composant UserCard pour afficher un membre de l'équipe
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React from 'react';
import { User, UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
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
  Activity,
  Crown,
  Shield,
  Pencil,
  Eye
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
  const { currentUser, hasPermission, isRole } = useAuth();

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Propriétaire',
          icon: Crown,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconClassName: 'text-yellow-600'
        };
      case 'manager':
        return {
          label: 'Manager',
          icon: Shield,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          iconClassName: 'text-blue-600'
        };
      case 'creator':
        return {
          label: 'Créateur',
          icon: Pencil,
          className: 'bg-green-100 text-green-800 border-green-200',
          iconClassName: 'text-green-600'
        };
      case 'viewer':
        return {
          label: 'Observateur',
          icon: Eye,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          iconClassName: 'text-gray-600'
        };
      default:
        return {
          label: role,
          icon: Shield,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          iconClassName: 'text-gray-600'
        };
    }
  };

  const getStatusIcon = () => {
    if (user.isActive) {
      return <UserCheck className="w-4 h-4 text-green-500" />;
    }
    return <UserX className="w-4 h-4 text-red-500" />;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `Membre depuis ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Membre depuis ${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Membre depuis ${years} an${years > 1 ? 's' : ''}`;
    }
  };

  const canEdit = hasPermission('canManageUsers') && user.id !== currentUser?.id;
  const canDelete = hasPermission('canManageUsers') && user.role !== 'owner' && user.id !== currentUser?.id;
  const canChangeRole = hasPermission('canManageUsers') && user.role !== 'owner' && user.id !== currentUser?.id;

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.icon;

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
            
            <p className="text-sm text-gray-600 mb-3">{user.email}</p>
            
            <div className="flex items-center space-x-2 mb-3">
              <Badge 
                variant="outline" 
                className={cn("text-xs font-medium", roleConfig.className)}
              >
                <RoleIcon className={cn("w-3 h-3 mr-1", roleConfig.iconClassName)} />
                {roleConfig.label}
              </Badge>
              
              <Badge 
                variant={user.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {user.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            
            <div className="text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>{formatDate(user.createdAt)}</span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center space-x-1 mt-1">
                  <span>Dernière connexion: {new Intl.DateTimeFormat('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(user.lastLogin)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {(canEdit || canDelete || canChangeRole) && (
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
              
              <DropdownMenuItem onClick={() => console.log('Voir activité:', user.id)}>
                <Activity className="w-4 h-4 mr-2" />
                Voir l'activité
              </DropdownMenuItem>
              
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
              
              {canDelete && (
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
