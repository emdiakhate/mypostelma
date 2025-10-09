/**
 * Contexte React pour la gestion des utilisateurs et permissions
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, UserRole, UserPermissions, TeamMember, Invitation, ROLE_PERMISSIONS } from '@/types/user';

// Types pour le contexte
interface UserState {
  currentUser: User | null;
  teamMembers: TeamMember[];
  invitations: Invitation[];
  isLoading: boolean;
  error: string | null;
}

interface UserContextType extends UserState {
  // Actions utilisateur
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Gestion d'équipe
  inviteUser: (email: string, role: UserRole, message?: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  
  // Gestion des invitations
  acceptInvitation: (token: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  
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
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_TEAM_MEMBERS'; payload: TeamMember[] }
  | { type: 'SET_INVITATIONS'; payload: Invitation[] }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: { id: string; updates: Partial<TeamMember> } }
  | { type: 'REMOVE_TEAM_MEMBER'; payload: string }
  | { type: 'ADD_INVITATION'; payload: Invitation }
  | { type: 'UPDATE_INVITATION'; payload: { id: string; updates: Partial<Invitation> } }
  | { type: 'REMOVE_INVITATION'; payload: string };

// État initial
const initialState: UserState = {
  currentUser: null,
  teamMembers: [],
  invitations: [],
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
    
    case 'SET_TEAM_MEMBERS':
      return { ...state, teamMembers: action.payload };
    
    case 'SET_INVITATIONS':
      return { ...state, invitations: action.payload };
    
    case 'ADD_TEAM_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.payload] };
    
    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.map(member =>
          member.id === action.payload.id
            ? { ...member, ...action.payload.updates }
            : member
        )
      };
    
    case 'REMOVE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.filter(member => member.id !== action.payload)
      };
    
    case 'ADD_INVITATION':
      return { ...state, invitations: [...state.invitations, action.payload] };
    
    case 'UPDATE_INVITATION':
      return {
        ...state,
        invitations: state.invitations.map(invitation =>
          invitation.id === action.payload.id
            ? { ...invitation, ...action.payload.updates }
            : invitation
        )
      };
    
    case 'REMOVE_INVITATION':
      return {
        ...state,
        invitations: state.invitations.filter(invitation => invitation.id !== action.payload)
      };
    
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
        email: 'admin@postelma.com',
        name: 'Admin Postelma',
        role: 'owner',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        createdAt: new Date('2024-01-01'),
        permissions: ROLE_PERMISSIONS.owner,
        isActive: true,
        lastLogin: new Date()
      };
      
      dispatch({ type: 'SET_CURRENT_USER', payload: mockUser });
      
      // Charger l'équipe
      await loadTeamMembers();
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement de l\'utilisateur' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour charger les membres de l'équipe
  const loadTeamMembers = async () => {
    try {
      // TODO: Remplacer par un appel API réel
      const mockTeamMembers: TeamMember[] = [
        {
          id: '2',
          email: 'manager@postelma.com',
          name: 'Manager Postelma',
          role: 'manager',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          createdAt: new Date('2024-01-15'),
          permissions: ROLE_PERMISSIONS.manager,
          isActive: true,
          lastLogin: new Date(),
          status: 'active'
        },
        {
          id: '3',
          email: 'creator@postelma.com',
          name: 'Creator Postelma',
          role: 'creator',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
          createdAt: new Date('2024-02-01'),
          permissions: ROLE_PERMISSIONS.creator,
          isActive: true,
          lastLogin: new Date(),
          status: 'active'
        }
      ];
      
      dispatch({ type: 'SET_TEAM_MEMBERS', payload: mockTeamMembers });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe:', error);
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
    dispatch({ type: 'SET_TEAM_MEMBERS', payload: [] });
    dispatch({ type: 'SET_INVITATIONS', payload: [] });
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

  // Fonction pour inviter un utilisateur
  const inviteUser = async (email: string, role: UserRole, message?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Implémenter l'API d'invitation
      const invitation: Invitation = {
        id: Date.now().toString(),
        email,
        role,
        invitedBy: state.currentUser?.id || '',
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        status: 'pending',
        token: Math.random().toString(36).substring(2, 15)
      };
      
      dispatch({ type: 'ADD_INVITATION', payload: invitation });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de l\'invitation' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour mettre à jour le rôle d'un utilisateur
  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Implémenter l'API de mise à jour du rôle
      const permissions = ROLE_PERMISSIONS[role];
      
      dispatch({
        type: 'UPDATE_TEAM_MEMBER',
        payload: {
          id: userId,
          updates: { role, permissions }
        }
      });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la mise à jour du rôle' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour supprimer un utilisateur
  const removeUser = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Implémenter l'API de suppression
      dispatch({ type: 'REMOVE_TEAM_MEMBER', payload: userId });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la suppression de l\'utilisateur' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour suspendre un utilisateur
  const suspendUser = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      dispatch({
        type: 'UPDATE_TEAM_MEMBER',
        payload: {
          id: userId,
          updates: { isActive: false, status: 'suspended' }
        }
      });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la suspension de l\'utilisateur' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour activer un utilisateur
  const activateUser = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      dispatch({
        type: 'UPDATE_TEAM_MEMBER',
        payload: {
          id: userId,
          updates: { isActive: true, status: 'active' }
        }
      });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de l\'activation de l\'utilisateur' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour accepter une invitation
  const acceptInvitation = async (token: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Implémenter l'API d'acceptation d'invitation
      console.log('Accepting invitation with token:', token);
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de l\'acceptation de l\'invitation' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour annuler une invitation
  const cancelInvitation = async (invitationId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      dispatch({ type: 'REMOVE_INVITATION', payload: invitationId });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de l\'annulation de l\'invitation' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour renvoyer une invitation
  const resendInvitation = async (invitationId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Implémenter l'API de renvoi d'invitation
      console.log('Resending invitation:', invitationId);
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du renvoi de l\'invitation' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fonction pour vérifier les permissions
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!state.currentUser) return false;
    return state.currentUser.permissions[permission];
  };

  // Fonction pour vérifier l'accès à une ressource
  const canAccess = (resource: string, action?: string): boolean => {
    if (!state.currentUser) return false;
    
    // Logique de vérification d'accès basée sur le rôle et la ressource
    const role = state.currentUser.role;
    
    switch (resource) {
      case 'users':
        return hasPermission('canManageUsers');
      case 'analytics':
        return hasPermission('canViewAnalytics');
      case 'billing':
        return hasPermission('canManageBilling');
      case 'posts':
        return hasPermission('canPublish') || hasPermission('canSchedule');
      default:
        return true;
    }
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
    inviteUser,
    updateUserRole,
    removeUser,
    suspendUser,
    activateUser,
    acceptInvitation,
    cancelInvitation,
    resendInvitation,
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

// Hook pour vérifier les permissions
export const usePermissions = () => {
  const { currentUser, hasPermission, canAccess } = useUser();
  
  return {
    currentUser,
    hasPermission,
    canAccess,
    isOwner: currentUser?.role === 'owner',
    isManager: currentUser?.role === 'manager',
    isCreator: currentUser?.role === 'creator',
    isViewer: currentUser?.role === 'viewer',
  };
};
