/**
 * Composant Badge pour afficher le rôle d'un utilisateur
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React from 'react';
import { UserRole } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserRoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Propriétaire',
          icon: Crown,
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
          iconClassName: 'text-red-600'
        };
      case 'manager':
        return {
          label: 'Manager',
          icon: Shield,
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
          iconClassName: 'text-blue-600'
        };
      case 'creator':
        return {
          label: 'Créateur',
          icon: Users,
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
          iconClassName: 'text-green-600'
        };
      case 'viewer':
        return {
          label: 'Observateur',
          icon: Eye,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
          iconClassName: 'text-gray-600'
        };
      default:
        return {
          label: role,
          icon: Shield,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
          iconClassName: 'text-gray-600'
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'md':
        return 'text-sm px-3 py-1';
      case 'lg':
        return 'text-base px-4 py-2';
      default:
        return 'text-sm px-3 py-1';
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center space-x-1 font-medium transition-colors',
        config.className,
        getSizeClasses(size),
        className
      )}
    >
      {showIcon && (
        <Icon className={cn('w-3 h-3', config.iconClassName)} />
      )}
      <span>{config.label}</span>
    </Badge>
  );
};

export default UserRoleBadge;
