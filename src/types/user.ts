/**
 * Types et interfaces pour la gestion des utilisateurs et rôles
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

export type UserRole = 'manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  permissions: UserPermissions;
  isActive: boolean;
  lastLogin?: Date;
}

export interface UserPermissions {
  canPublish: boolean;          // Publier des posts
  canSchedule: boolean;         // Programmer des posts
  canDelete: boolean;           // Supprimer des posts
  canManageUsers: boolean;      // Gérer l'équipe
  canManageAccounts: boolean;   // Connecter/déconnecter comptes sociaux
  canViewAnalytics: boolean;    // Voir les analytics
  canApproveContent: boolean;   // Approuver queue
  canManageBilling: boolean;    // Gérer abonnement
  canManageSettings?: boolean;  // Gérer les paramètres
  canCreateContent?: boolean;   // Créer du contenu
  canModerate?: boolean;        // Modérer le contenu
  canManageTeams?: boolean;     // Gérer les équipes
  canViewReports?: boolean;     // Voir les rapports
}

// Permissions par rôle (hardcodé pour MVP)
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  manager: {
    canPublish: true,
    canSchedule: true,
    canDelete: true,
    canManageUsers: true,
    canManageAccounts: true,
    canViewAnalytics: true,
    canApproveContent: true,
    canManageBilling: true
  }
};

// Types pour la gestion d'équipe
export interface TeamMember extends User {
  invitedBy?: string;
  invitedAt?: Date;
  status: 'active' | 'pending' | 'suspended';
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
}

// Types pour les actions utilisateur
export interface UserAction {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Types pour les statistiques utilisateur
export interface UserStats {
  userId: string;
  postsCreated: number;
  postsPublished: number;
  postsScheduled: number;
  postsDeleted: number;
  lastActivity: Date;
  totalEngagement: number;
}

// Helper types pour les formulaires
export interface CreateUserData {
  email: string;
  name: string;
  role: UserRole;
  sendInvitation?: boolean;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface InviteUserData {
  email: string;
  role: UserRole;
  message?: string;
}

// Types pour les filtres et recherche
export interface UserFilters {
  role?: UserRole;
  status?: 'active' | 'pending' | 'suspended';
  search?: string;
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
}

// Types pour les permissions contextuelles
export interface PermissionContext {
  resource?: string;
  resourceId?: string;
  action?: string;
}

// Types pour les logs d'audit
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}
