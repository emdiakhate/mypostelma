/**
 * Hook pour gérer l'authentification et les permissions
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, UserPermissions } from '@/types/user';
import { toast } from 'sonner';

// Permissions par rôle
const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
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

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isRole: (role: UserRole) => boolean;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Charge user depuis localStorage au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('postelma_current_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Convertir les dates string en Date objects
        const parsedUser: User = {
          ...user,
          createdAt: new Date(user.createdAt),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
        };
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        localStorage.removeItem('postelma_current_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('postelma_current_user', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('postelma_current_user');
    navigate('/login');
    toast.info('Déconnexion réussie');
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    const permissions = ROLE_PERMISSIONS[currentUser.role];
    return permissions[permission];
  };

  const isRole = (role: UserRole): boolean => {
    return currentUser?.role === role;
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    hasPermission,
    isRole,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
