/**
 * Contexte React simplifié pour la gestion des utilisateurs
 * MVP: Un seul rôle "manager" avec toutes les permissions
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, UserPermissions, ROLE_PERMISSIONS } from '@/types/user';

// Types pour le contexte
interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

interface UserContextType extends UserState {
  // Actions utilisateur
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Permissions
  hasPermission: (permission: keyof UserPermissions) => boolean;
  canAccess: (resource: string, action?: string) => boolean;
  
  // Utilitaires
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Actions pour le reducer
type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_USER'; payload: User | null };

// État initial
const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

// Reducer
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    default:
      return state;
  }
};

// Création du contexte
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider du contexte
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Charger l'utilisateur au montage
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Fonction pour charger l'utilisateur actuel
  const loadCurrentUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Remplacer par un appel API réel
      const mockUser: User = {
        id: '1',
        email: 'manager@postelma.com',
        name: 'Manager Postelma',
        role: 'manager',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        createdAt: new Date('2024-01-01'),
        permissions: ROLE_PERMISSIONS.manager,
        isActive: true,
        lastLogin: new Date()
      };
      
      dispatch({ type: 'SET_CURRENT_USER', payload: mockUser });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement de l\'utilisateur' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction de connexion
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // TODO: Implémenter l'authentification réelle
      console.log('Login attempt:', { email, password });
      
      // Simulation d'une connexion réussie
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadCurrentUser();
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de connexion' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
  };

  // Fonction pour mettre à jour le profil
  const updateProfile = async (data: Partial<User>) => {
    if (!state.currentUser) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Implémenter l'API de mise à jour
      const updatedUser = { ...state.currentUser, ...data };
      dispatch({ type: 'SET_CURRENT_USER', payload: updatedUser });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la mise à jour du profil' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour vérifier les permissions (toujours true pour manager)
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!state.currentUser) return false;
    return state.currentUser.permissions[permission];
  };

  // Fonction pour vérifier l'accès à une ressource (toujours true pour manager)
  const canAccess = (resource: string, action?: string): boolean => {
    return !!state.currentUser; // Manager a accès à tout
  };

  // Fonction pour rafraîchir l'utilisateur
  const refreshUser = async () => {
    await loadCurrentUser();
  };

  // Fonction pour effacer les erreurs
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: UserContextType = {
    ...state,
    login,
    logout,
    updateProfile,
    hasPermission,
    canAccess,
    refreshUser,
    clearError,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Hook pour vérifier les permissions (simplifié pour MVP)
export const usePermissions = () => {
  const { currentUser, hasPermission, canAccess } = useUser();
  
  return {
    currentUser,
    hasPermission,
    canAccess,
    isOwner: false,
    isManager: currentUser?.role === 'manager',
    isCreator: false,
    isViewer: false,
  };
};
