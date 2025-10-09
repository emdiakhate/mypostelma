/**
 * Hook pour gérer les comptes sociaux depuis Supabase
 * À implémenter quand la table sera créée
 */

import { useState, useCallback } from 'react';

export interface SocialAccountDB {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  status: 'connected' | 'reconnect_needed' | 'disconnected';
  userId: string;
  createdAt: string;
  lastSync?: string;
}

interface UseSocialAccountsDBResult {
  accounts: SocialAccountDB[];
  loading: boolean;
  error: string | null;
  connectAccount: (accountData: any) => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
  syncAccount: (accountId: string) => Promise<void>;
}

export const useSocialAccountsDB = (): UseSocialAccountsDBResult => {
  const [accounts, setAccounts] = useState<SocialAccountDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Implémenter les fonctions quand la table social_accounts sera créée
  const connectAccount = useCallback(async (accountData: any) => {
    // À implémenter
    console.log('connectAccount not implemented yet', accountData);
  }, []);

  const disconnectAccount = useCallback(async (accountId: string) => {
    // À implémenter
    console.log('disconnectAccount not implemented yet', accountId);
  }, []);

  const syncAccount = useCallback(async (accountId: string) => {
    // À implémenter
    console.log('syncAccount not implemented yet', accountId);
  }, []);

  return {
    accounts,
    loading,
    error,
    connectAccount,
    disconnectAccount,
    syncAccount
  };
};
