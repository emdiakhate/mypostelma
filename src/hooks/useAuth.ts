import { useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '@/types/user';

// Interface pour le hook d'authentification
interface UseAuthReturn {
  user: User | null;
  currentUser: User | null; // Alias pour compatibilité
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isRole: (role: UserRole) => boolean;
  loading: boolean;
  role: UserRole;
  permissions: UserPermissions;
  isOwner: boolean;
  isManager: boolean;
  isCreator: boolean;
  isViewer: boolean;
  isAdmin: boolean; // Alias pour owner/manager
  canAccess: (resource: string, action?: string) => boolean;
}

// Hook d'authentification simple
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('postelma_current_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        localStorage.removeItem('postelma_current_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('postelma_current_user', JSON.stringify(userData));
  };

  // Fonction de déconnexion
  const logout = () => {
    setUser(null);
    localStorage.removeItem('postelma_current_user');
  };

  // Vérifier les permissions
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!user) return false;
    
    // Vérifier les permissions basées sur le rôle
    const rolePermissions: Record<UserRole, UserPermissions> = {
      owner: {
        canPublish: true,
        canSchedule: true,
        canDelete: true,
        canManageUsers: true,
        canManageAccounts: true,
        canViewAnalytics: true,
        canApproveContent: true,
        canManageBilling: true
      },
      manager: {
        canPublish: true,
        canSchedule: true,
        canDelete: true,
        canManageUsers: true,
        canManageAccounts: true,
        canViewAnalytics: true,
        canApproveContent: true,
        canManageBilling: false
      },
      creator: {
        canPublish: false,
        canSchedule: true,
        canDelete: false,
        canManageUsers: false,
        canManageAccounts: false,
        canViewAnalytics: true,
        canApproveContent: false,
        canManageBilling: false
      },
      viewer: {
        canPublish: false,
        canSchedule: false,
        canDelete: false,
        canManageUsers: false,
        canManageAccounts: false,
        canViewAnalytics: true,
        canApproveContent: false,
        canManageBilling: false
      }
    };

    return rolePermissions[user.role]?.[permission] || false;
  };

  // Vérifier le rôle
  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  // Helper pour vérifier l'accès à une ressource
  const canAccess = (resource: string, action: string = 'view'): boolean => {
    if (!user) return false;
    
    // Logique d'accès personnalisée selon le rôle
    const roleAccess = {
      owner: true, // Accès total
      manager: true, // Accès quasi-total
      creator: action === 'view' || action === 'create', // Lecture et création seulement
      viewer: action === 'view' // Lecture seule
    };

    return roleAccess[user.role] || false;
  };

  // Calculer les propriétés dérivées
  const currentRole: UserRole = user?.role || 'viewer';
  const currentPermissions: UserPermissions = user?.permissions || {
    canPublish: false,
    canSchedule: false,
    canDelete: false,
    canManageUsers: false,
    canManageAccounts: false,
    canViewAnalytics: false,
    canApproveContent: false,
    canManageBilling: false
  };

  return {
    user,
    currentUser: user, // Alias pour compatibilité
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    isRole,
    loading,
    role: currentRole,
    permissions: currentPermissions,
    isOwner: currentRole === 'owner',
    isManager: currentRole === 'manager',
    isCreator: currentRole === 'creator',
    isViewer: currentRole === 'viewer',
    isAdmin: currentRole === 'owner' || currentRole === 'manager', // Maintenant exporté
    canAccess
  };
};

export default useAuth;