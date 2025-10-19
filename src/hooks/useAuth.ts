import { useState, useEffect, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, UserPermissions, ROLE_PERMISSIONS } from '@/types/user';
import { assignDefaultRole, ensureCorrectRole, upgradeViewersToManagers } from '@/utils/roleManager';

interface UseAuthReturn {
  user: SupabaseUser | null;
  currentUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isRole: (role: UserRole) => boolean;
  canAccess: (resource: string, action?: string) => boolean;
  role: UserRole | null;
  permissions: UserPermissions;
  isOwner: boolean;
  isManager: boolean;
  isCreator: boolean;
  isViewer: boolean;
  isAdmin: boolean;
  userRole: UserRole | null;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger le rôle de l'utilisateur depuis la BDD - NEVER use localStorage for security-critical data
  const loadUserRole = useCallback(async (userId: string) => {
    try {
      // Always load role from database - never trust client-side storage
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading user role:', error);
        return null;
      }

      const currentRole = data?.role as UserRole || null;
      
      // Vérifier et corriger le rôle si nécessaire
      if (!currentRole || currentRole === 'viewer') {
        const correctedRole = await ensureCorrectRole(userId, currentRole);
        return correctedRole;
      }
      
      return currentRole;
      
    } catch (error) {
      console.error('Error in loadUserRole:', error);
      return null;
    }
  }, []);

  // Setup auth listener et vérifier session existante
  useEffect(() => {
    // Mettre à jour les utilisateurs existants au démarrage
    upgradeViewersToManagers();
    
    // Setup listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Charger le rôle après avoir mis à jour l'état
        if (currentSession?.user) {
          setTimeout(() => {
            loadUserRole(currentSession.user.id).then(role => {
              setUserRole(role);
              setLoading(false);
            });
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        loadUserRole(currentSession.user.id).then(role => {
          setUserRole(role);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserRole]);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  }, []);

  // Permission checks basés sur le rôle de la BDD
  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    if (!userRole) return false;
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return rolePermissions[permission];
  }, [userRole]);

  // Role check
  const isRole = useCallback((role: UserRole): boolean => {
    return userRole === role;
  }, [userRole]);

  // Resource access control
  const canAccess = useCallback((resource: string, action?: string): boolean => {
    if (!userRole) return false;

    const accessRules: Record<string, Record<UserRole, boolean>> = {
      dashboard: { owner: true, manager: true, creator: true, viewer: true },
      calendar: { owner: true, manager: true, creator: true, viewer: true },
      publications: { owner: true, manager: true, creator: true, viewer: true },
      analytics: { owner: true, manager: true, creator: true, viewer: true },
      queue: { owner: true, manager: true, creator: false, viewer: false },
      team: { owner: true, manager: true, creator: false, viewer: false },
      'social-accounts': { owner: true, manager: true, creator: false, viewer: false },
      settings: { owner: true, manager: false, creator: false, viewer: false },
    };

    return accessRules[resource]?.[userRole] ?? false;
  }, [userRole]);

  // Derived properties
  const currentPermissions: UserPermissions = userRole 
    ? ROLE_PERMISSIONS[userRole] 
    : {
        canPublish: false,
        canSchedule: false,
        canDelete: false,
        canManageUsers: false,
        canManageAccounts: false,
        canViewAnalytics: false,
        canApproveContent: false,
        canManageBilling: false
      };

  const isOwner = userRole === 'owner';
  const isManager = userRole === 'manager';
  const isCreator = userRole === 'creator';
  const isViewer = userRole === 'viewer';
  const isAdmin = isOwner || isManager;

  return {
    user,
    currentUser: user,
    session,
    isAuthenticated: !!user && !!session,
    loading,
    logout,
    hasPermission,
    isRole,
    canAccess,
    role: userRole,
    permissions: currentPermissions,
    isOwner,
    isManager,
    isCreator,
    isViewer,
    isAdmin,
    userRole,
  };
};

export default useAuth;
