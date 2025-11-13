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
        .select('upload_post_username, name')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('[useUploadPost] Error fetching profile from DB:', profileError);
        throw profileError;
      }
      
      let uploadPostUsername = profileData?.upload_post_username;
      
      // Si pas de username, créer le profil Upload-Post automatiquement
      if (!uploadPostUsername) {
        console.log('[useUploadPost] No upload_post_username found, creating Upload-Post profile automatically');
        
        // Générer le username depuis le nom de l'utilisateur
        const baseName = (profileData?.name || 'user')
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9_@-]/g, '_');
        const userId = user.id.substring(0, 8);
        uploadPostUsername = `${baseName}_${userId}`;
        
        try {
          // Créer le profil dans Upload-Post
          await UploadPostService.createUserProfile(uploadPostUsername);
          console.log('[useUploadPost] Upload-Post profile created automatically:', uploadPostUsername);
          
          // Sauvegarder le username dans le profil Supabase
          await supabase
            .from('profiles')
            .update({ upload_post_username: uploadPostUsername })
            .eq('id', user.id);
        } catch (createError) {
          console.error('[useUploadPost] Error creating Upload-Post profile:', createError);
          setProfile(null);
          setConnectedAccounts([]);
          return;
        }
      }
      
      console.log('[useUploadPost] Fetching Upload-Post profile for:', uploadPostUsername);
      
      try {
        const data = await UploadPostService.getUserProfile(uploadPostUsername);
        
        // L'API retourne un double nesting: data.profile.profile
        const actualProfile = (data.profile as any)?.profile || data.profile;
        console.log('[useUploadPost] Profile fetched successfully:', actualProfile);
        setProfile(actualProfile);
        
        // Extraire les comptes connectés
        if (actualProfile?.social_accounts) {
          const accounts: ConnectedAccount[] = Object.entries(actualProfile.social_accounts)
            .filter(([_, value]) => value && typeof value === 'object')
            .map(([platform, details]) => ({
              platform: platform as ConnectedAccount['platform'],
              display_name: (details as SocialAccountDetails).display_name || '',
              social_images: (details as SocialAccountDetails).social_images,
              username: (details as SocialAccountDetails).username
            }));
          
          console.log('[useUploadPost] Connected accounts:', accounts);
          setConnectedAccounts(accounts);
        } else {
          setConnectedAccounts([]);
        }
      } catch (fetchError: any) {
        console.error('[useUploadPost] Error fetching Upload-Post profile:', fetchError);
        
        // Vérifier si c'est une erreur 404 / Profile not found
        const isProfileNotFound = 
          fetchError?.message?.includes('Profile not found') ||
          fetchError?.message?.includes('404') ||
          String(fetchError).includes('Profile not found');
        
        if (isProfileNotFound) {
          console.log('[useUploadPost] Profile not found in Upload-Post (404), creating it now');
          
          try {
            // Créer le profil
            await UploadPostService.createUserProfile(uploadPostUsername);
            console.log('[useUploadPost] Upload-Post profile created successfully:', uploadPostUsername);
            
            // Réessayer de récupérer le profil après création
            const retryData = await UploadPostService.getUserProfile(uploadPostUsername);
            const retryProfile = (retryData.profile as any)?.profile || retryData.profile;
            console.log('[useUploadPost] Profile fetched after creation:', retryProfile);
            setProfile(retryProfile);
            setConnectedAccounts([]);
          } catch (retryError) {
            console.error('[useUploadPost] Error creating/fetching profile after 404:', retryError);
            setProfile(null);
            setConnectedAccounts([]);
          }
        } else {
          console.error('[useUploadPost] Unexpected error fetching profile:', fetchError);
          setProfile(null);
          setConnectedAccounts([]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('[useUploadPost] Error fetching Upload-Post profile:', err);
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
        .select('upload_post_username, name')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        throw new Error('Erreur lors de la récupération du profil utilisateur.');
      }
      
      let uploadPostUsername = profileData?.upload_post_username;
      
      // Si pas de username, créer le profil Upload-Post
      if (!uploadPostUsername) {
        console.log('[useUploadPost] No upload_post_username found, creating Upload-Post profile');
        
        // Générer le username depuis le nom de l'utilisateur (même logique que le trigger)
        const baseName = (profileData?.name || 'user')
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9_@-]/g, '_');
        const userId = user.id.substring(0, 8);
        uploadPostUsername = `${baseName}_${userId}`;
        
        try {
          // Créer le profil dans Upload-Post
          await UploadPostService.createUserProfile(uploadPostUsername);
          console.log('[useUploadPost] Upload-Post profile created:', uploadPostUsername);
          
          // Sauvegarder le username dans le profil Supabase
          await supabase
            .from('profiles')
            .update({ upload_post_username: uploadPostUsername })
            .eq('id', user.id);
        } catch (createError) {
          // Si le profil existe déjà dans Upload-Post, on continue
          console.log('[useUploadPost] Profile may already exist in Upload-Post:', createError);
          
          // Sauvegarder quand même le username dans le profil Supabase
          await supabase
            .from('profiles')
            .update({ upload_post_username: uploadPostUsername })
            .eq('id', user.id);
        }
      }
      
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
