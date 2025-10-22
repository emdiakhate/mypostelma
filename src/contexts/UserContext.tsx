/**
 * Contexte React simplifié pour la gestion des utilisateurs
 * Utilise Supabase Auth via useAuth hook
 */

import { createContext, useContext, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

interface UserContextType {
  user: SupabaseUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  return (
    <UserContext.Provider value={{ user: auth.user, loading: auth.loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;
