/**
 * Hook personnalisé pour gérer Upload-Post
 * Charge automatiquement le profil et les comptes connectés
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UploadPostService } from '@/services/uploadPost.service';
import { formatUsernameForUploadPost } from '@/utils/usernameFormatter';
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
      
      // Récupérer le username Upload-Post depuis le profil Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('upload_post_username')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('[useUploadPost] Error fetching profile from DB:', profileError);
        throw profileError;
      }
      
      const uploadPostUsername = profileData?.upload_post_username;
      
      if (!uploadPostUsername) {
        console.log('[useUploadPost] No Upload-Post username found in profile');
        setProfile(null);
        setConnectedAccounts([]);
        return;
      }
      
      console.log('[useUploadPost] Fetching Upload-Post profile for:', uploadPostUsername);
      const data = await UploadPostService.getUserProfile(uploadPostUsername);
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
      
      // Récupérer le username Upload-Post depuis le profil Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('upload_post_username')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profileData?.upload_post_username) {
        throw new Error('Aucun profil Upload-Post trouvé. Veuillez d\'abord créer votre profil.');
      }
      
      const uploadPostUsername = profileData.upload_post_username;
      
      console.log('[useUploadPost] Generating connect URL for:', uploadPostUsername);
      const { access_url } = await UploadPostService.generateConnectUrl(uploadPostUsername, options);
      
      console.log('[useUploadPost] Opening connect URL in new window:', access_url);
      
      // Ouvrir dans une nouvelle fenêtre au lieu de rediriger (évite les problèmes CSP)
      const connectWindow = window.open(access_url, '_blank', 'width=800,height=700,scrollbars=yes,resizable=yes');
      
      if (!connectWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre de connexion. Veuillez autoriser les popups.');
      }
      
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate connect URL';
      setError(errorMessage);
      console.error('[useUploadPost] Error generating connect URL:', err);
      setLoading(false);
      throw err;
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
