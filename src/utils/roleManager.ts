/**
 * Utilitaire pour gérer les rôles utilisateur
 * Gère la logique de rôle par défaut côté client
 */

import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/user';

/**
 * Assigne un rôle par défaut à un nouvel utilisateur
 * Premier utilisateur = 'owner', autres = 'manager'
 * Utilise une approche simplifiée pour éviter les problèmes RLS
 */
export const assignDefaultRole = async (userId: string): Promise<UserRole> => {
  try {
    // Vérifier s'il y a déjà des utilisateurs
    const { data: existingUsers, error: countError } = await supabase
      .from('user_roles')
      .select('user_id')
      .limit(1);

    if (countError) {
      console.error('Error checking existing users:', countError);
      return 'manager'; // Par défaut manager en cas d'erreur
    }

    // Si aucun utilisateur n'existe, c'est le premier = owner
    // Sinon = manager
    const isFirstUser = !existingUsers || existingUsers.length === 0;
    const defaultRole: UserRole = isFirstUser ? 'owner' : 'manager';

    // Essayer d'insérer le rôle dans la base de données
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: defaultRole
      });

    if (insertError) {
      console.error('Could not insert role in database:', insertError);
      return defaultRole;
    }

    return defaultRole;

  } catch (error) {
    console.error('Error in assignDefaultRole:', error);
    return 'manager'; // Fallback
  }
};

/**
 * Met à jour les utilisateurs existants de 'viewer' vers 'manager'
 * Utilise une approche côté client pour éviter les problèmes RLS
 */
export const upgradeViewersToManagers = async (): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: 'manager' })
      .eq('role', 'viewer');

    if (error) {
      console.error('Could not upgrade viewers:', error);
    }
  } catch (error) {
    console.error('Error in upgradeViewersToManagers:', error);
  }
};

/**
 * Vérifie et corrige le rôle d'un utilisateur si nécessaire
 */
export const ensureCorrectRole = async (userId: string, currentRole: UserRole | null): Promise<UserRole> => {
  // Si l'utilisateur n'a pas de rôle ou a le rôle 'viewer', le corriger
  if (!currentRole || currentRole === 'viewer') {
    const correctedRole = await assignDefaultRole(userId);
    return correctedRole;
  }
  
  return currentRole;
};
