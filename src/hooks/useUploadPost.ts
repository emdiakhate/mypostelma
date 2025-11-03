/**
 * Hook personnalisé pour gérer Upload-Post
 * Charge automatiquement le profil et les comptes connectés
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UploadPostService } from '@/services/uploadPost.service';
import type { 
  UploadPostProfile, 
  ConnectedAccount, 
  SocialAccountDetails,
  ConnectUrlOptions 
} from '@/types/uploadPost.types';

interface UseUploadPostReturn {
  profile: UploadPostProfile | null;
  connectedAccounts: ConnectedAccount[];
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  connectAccounts: (options?: ConnectUrlOptions) => Promise<void>;
}

export function useUploadPost(): UseUploadPostReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UploadPostProfile | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser le nom de l'utilisateur au lieu de son ID
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || user.id;
      const data = await UploadPostService.getUserProfile(userName);
      setProfile(data.profile);
      
      // Extraire les comptes connectés
      const accounts: ConnectedAccount[] = Object.entries(data.profile.social_accounts)
        .filter(([_, value]) => value && typeof value === 'object')
        .map(([platform, details]) => ({
          platform: platform as ConnectedAccount['platform'],
          display_name: (details as SocialAccountDetails).display_name || '',
          social_images: (details as SocialAccountDetails).social_images,
          username: (details as SocialAccountDetails).username
        }));
      
      setConnectedAccounts(accounts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Error fetching Upload-Post profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectAccounts = async (options?: ConnectUrlOptions) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser le nom de l'utilisateur au lieu de son ID
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || user.id;
      const { access_url } = await UploadPostService.generateConnectUrl(userName, options);
      window.location.href = access_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate connect URL';
      setError(errorMessage);
      console.error('Error generating connect URL:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  return {
    profile,
    connectedAccounts,
    loading,
    error,
    refreshProfile: fetchProfile,
    connectAccounts
  };
}
