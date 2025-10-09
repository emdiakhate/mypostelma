/**
 * Hooks personnalisés pour la gestion des permissions
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import { useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { UserRole, UserPermissions, ROLE_PERMISSIONS } from '@/types/user';

/**
 * Hook principal pour les permissions
 */
export const usePermissions = () => {
  const { currentUser, hasPermission, canAccess } = useUser();

  const permissions = useMemo(() => {
    if (!currentUser) {
      return {
        isAuthenticated: false,
        role: null,
        permissions: null,
        isOwner: false,
        isManager: false,
        isCreator: false,
        isViewer: false,
      };
    }

    return {
      isAuthenticated: true,
      role: currentUser.role,
      permissions: currentUser.permissions,
      isOwner: currentUser.role === 'owner',
      isManager: currentUser.role === 'manager',
      isCreator: currentUser.role === 'creator',
      isViewer: currentUser.role === 'viewer',
    };
  }, [currentUser]);

  return {
    ...permissions,
    hasPermission,
    canAccess,
    currentUser,
    isAdmin: currentUser?.role === 'owner' || currentUser?.role === 'manager',
  };
};

/**
 * Hook pour vérifier des permissions spécifiques
 */
export const usePermissionCheck = () => {
  const { hasPermission } = useUser();

  return {
    canPublish: () => hasPermission('canPublish'),
    canSchedule: () => hasPermission('canSchedule'),
    canDelete: () => hasPermission('canDelete'),
    canManageUsers: () => hasPermission('canManageUsers'),
    canManageAccounts: () => hasPermission('canManageAccounts'),
    canViewAnalytics: () => hasPermission('canViewAnalytics'),
    canApproveContent: () => hasPermission('canApproveContent'),
    canManageBilling: () => hasPermission('canManageBilling'),
  };
};

/**
 * Hook pour les permissions de contenu
 */
export const useContentPermissions = () => {
  const { hasPermission, currentUser } = useUser();

  return {
    canCreatePost: hasPermission('canPublish'),
    canSchedulePost: hasPermission('canSchedule'),
    canDeletePost: hasPermission('canDelete'),
    canApprovePost: hasPermission('canApproveContent'),
    canEditPost: (postAuthorId?: string) => {
      // Un utilisateur peut éditer ses propres posts ou s'il a les permissions
      if (!currentUser) return false;
      if (hasPermission('canDelete')) return true;
      return postAuthorId === currentUser.id;
    },
    canViewPost: () => true, // Tous les utilisateurs peuvent voir les posts
  };
};

/**
 * Hook pour les permissions d'administration
 */
export const useAdminPermissions = () => {
  const { hasPermission, currentUser } = useUser();

  return {
    canManageTeam: hasPermission('canManageUsers'),
    canManageBilling: hasPermission('canManageBilling'),
    canManageAccounts: hasPermission('canManageAccounts'),
    canViewAllAnalytics: hasPermission('canViewAnalytics'),
    canApproveAllContent: hasPermission('canApproveContent'),
    isAdmin: currentUser?.role === 'owner' || currentUser?.role === 'manager',
    isOwner: currentUser?.role === 'owner',
  };
};

/**
 * Hook pour les permissions de navigation
 */
export const useNavigationPermissions = () => {
  const { hasPermission, currentUser } = useUser();

  const navigationItems = useMemo(() => {
    const items = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        visible: true,
        permission: null,
      },
      {
        id: 'calendar',
        label: 'Calendrier',
        path: '/calendar',
        visible: hasPermission('canSchedule') || hasPermission('canPublish'),
        permission: 'canSchedule',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        visible: hasPermission('canViewAnalytics'),
        permission: 'canViewAnalytics',
      },
      {
        id: 'hashtags',
        label: 'Hashtags',
        path: '/hashtags',
        visible: hasPermission('canViewAnalytics'),
        permission: 'canViewAnalytics',
      },
      {
        id: 'queue',
        label: 'File d\'attente',
        path: '/queue',
        visible: hasPermission('canApproveContent'),
        permission: 'canApproveContent',
      },
      {
        id: 'archives',
        label: 'Archives',
        path: '/archives',
        visible: hasPermission('canPublish') || hasPermission('canSchedule'),
        permission: 'canPublish',
      },
      {
        id: 'competitors',
        label: 'Concurrents',
        path: '/competitors',
        visible: hasPermission('canViewAnalytics'),
        permission: 'canViewAnalytics',
      },
      {
        id: 'users',
        label: 'Utilisateurs',
        path: '/users',
        visible: hasPermission('canManageUsers'),
        permission: 'canManageUsers',
      },
      {
        id: 'settings',
        label: 'Paramètres',
        path: '/settings',
        visible: hasPermission('canManageBilling') || hasPermission('canManageAccounts'),
        permission: 'canManageBilling',
      },
    ];

    return items.filter(item => item.visible);
  }, [hasPermission]);

  return {
    navigationItems,
    canAccessUsers: hasPermission('canManageUsers'),
    canAccessSettings: hasPermission('canManageBilling') || hasPermission('canManageAccounts'),
  };
};

/**
 * Hook pour les permissions de rôles
 */
export const useRolePermissions = () => {
  const { currentUser } = useUser();

  const canChangeRole = (targetRole: UserRole, targetUserId: string) => {
    if (!currentUser) return false;
    
    // Un owner peut changer tous les rôles
    if (currentUser.role === 'owner') return true;
    
    // Un manager peut créer des creators et viewers
    if (currentUser.role === 'manager') {
      return targetRole === 'creator' || targetRole === 'viewer';
    }
    
    // Les autres rôles ne peuvent pas changer de rôles
    return false;
  };

  const canRemoveUser = (targetUserId: string) => {
    if (!currentUser) return false;
    
    // Un owner peut supprimer tous les utilisateurs sauf lui-même
    if (currentUser.role === 'owner') {
      return currentUser.id !== targetUserId;
    }
    
    // Un manager peut supprimer des creators et viewers
    if (currentUser.role === 'manager') {
      const targetUser = { role: 'creator' }; // TODO: Récupérer le vrai utilisateur
      return targetUser.role === 'creator' || targetUser.role === 'viewer';
    }
    
    return false;
  };

  const availableRoles = useMemo(() => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case 'owner':
        return ['owner', 'manager', 'creator', 'viewer'];
      case 'manager':
        return ['creator', 'viewer'];
      default:
        return [];
    }
  }, [currentUser]);

  return {
    canChangeRole,
    canRemoveUser,
    availableRoles,
    currentUserRole: currentUser?.role,
  };
};

/**
 * Hook pour les permissions de ressources
 */
export const useResourcePermissions = () => {
  const { canAccess, currentUser } = useUser();

  const canAccessResource = (resource: string, action?: string) => {
    return canAccess(resource, action);
  };

  const canEditResource = (resource: string, resourceOwnerId?: string) => {
    if (!currentUser) return false;
    
    // Vérifier les permissions générales
    if (!canAccess(resource, 'edit')) return false;
    
    // Vérifier si c'est le propriétaire de la ressource
    if (resourceOwnerId && resourceOwnerId === currentUser.id) return true;
    
    // Vérifier les permissions d'administration
    return currentUser.role === 'owner' || currentUser.role === 'manager';
  };

  const canDeleteResource = (resource: string, resourceOwnerId?: string) => {
    if (!currentUser) return false;
    
    // Vérifier les permissions générales
    if (!canAccess(resource, 'delete')) return false;
    
    // Vérifier si c'est le propriétaire de la ressource
    if (resourceOwnerId && resourceOwnerId === currentUser.id) return true;
    
    // Vérifier les permissions d'administration
    return currentUser.role === 'owner' || currentUser.role === 'manager';
  };

  return {
    canAccessResource,
    canEditResource,
    canDeleteResource,
  };
};

/**
 * Hook pour les permissions de contenu spécifiques
 */
export const usePostPermissions = (post?: { authorId?: string; status?: string }) => {
  const { hasPermission, currentUser } = useUser();

  const canEditPost = () => {
    if (!currentUser || !post) return false;
    
    // Vérifier les permissions générales
    if (!hasPermission('canPublish') && !hasPermission('canSchedule')) return false;
    
    // Vérifier si c'est l'auteur du post
    if (post.authorId && post.authorId === currentUser.id) return true;
    
    // Vérifier les permissions d'administration
    return currentUser.role === 'owner' || currentUser.role === 'manager';
  };

  const canDeletePost = () => {
    if (!currentUser || !post) return false;
    
    // Vérifier les permissions générales
    if (!hasPermission('canDelete')) return false;
    
    // Vérifier si c'est l'auteur du post
    if (post.authorId && post.authorId === currentUser.id) return true;
    
    // Vérifier les permissions d'administration
    return currentUser.role === 'owner' || currentUser.role === 'manager';
  };

  const canApprovePost = () => {
    if (!currentUser) return false;
    return hasPermission('canApproveContent');
  };

  const canSchedulePost = () => {
    if (!currentUser) return false;
    return hasPermission('canSchedule');
  };

  return {
    canEditPost: canEditPost(),
    canDeletePost: canDeletePost(),
    canApprovePost: canApprovePost(),
    canSchedulePost: canSchedulePost(),
  };
};
