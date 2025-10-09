/**
 * Hook pour gérer l'équipe depuis Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/user';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

interface UseTeamResult {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateMemberRole: (userId: string, role: UserRole) => Promise<void>;
}

export const useTeam = (): UseTeamResult => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les profils avec leurs rôles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Récupérer tous les rôles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combiner les données
      const teamMembers: TeamMember[] = profiles.map(profile => {
        const roleData = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: roleData?.role as UserRole || 'viewer',
          isActive: profile.is_active,
          createdAt: profile.created_at,
          lastLogin: profile.last_login,
          avatar: profile.avatar
        };
      });

      setMembers(teamMembers);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMemberRole = useCallback(async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;

      // Recharger les membres
      await fetchMembers();
    } catch (err) {
      console.error('Error updating role:', err);
      throw err;
    }
  }, [fetchMembers]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    updateMemberRole
  };
};
