/**
 * Hook pour gérer la publication de posts via Upload-Post API
 */

import { useState, useCallback } from 'react';
import { publishContent, determineMediaType } from '@/services/uploadPostApi';
import { supabase } from '@/integrations/supabase/client';

interface PublishParams {
  accountId: string;
  platform: string;
  message: string;
  images?: string[];
  video?: string;
}

interface UsePostPublishingResult {
  isPublishing: boolean;
  publishPost: (params: PublishParams) => Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }>;
  publishToMultipleAccounts: (accounts: { accountId: string; platform: string }[], message: string, images?: string[], video?: string) => Promise<{
    results: { accountId: string; platform: string; success: boolean; postId?: string; error?: string }[];
  }>;
}

export const usePostPublishing = (): UsePostPublishingResult => {
  const [isPublishing, setIsPublishing] = useState(false);

  const publishPost = useCallback(async (params: PublishParams) => {
    try {
      console.log('Publishing via Upload-Post:', params);

      // Récupérer le profil Upload-Post de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('upload_post_username')
        .eq('id', user.id)
        .single();

      if (!profile?.upload_post_username) {
        throw new Error('Profil Upload-Post non configuré. Veuillez connecter vos comptes sociaux.');
      }

      const mediaType = determineMediaType({
        photos: params.images,
        video: params.video
      });

      const response = await publishContent({
        profile_username: profile.upload_post_username,
        platforms: [params.platform],
        title: params.message,
        media_type: mediaType,
        photos: params.images,
        video: params.video
      });

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la publication');
      }

      return {
        success: true,
        postId: response.data?.request_id || response.data?.job_id
      };
    } catch (error) {
      console.error('Erreur publication Upload-Post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, []);

  const publishToMultipleAccounts = useCallback(async (
    accounts: { accountId: string; platform: string }[],
    message: string,
    images?: string[],
    video?: string
  ) => {
    setIsPublishing(true);

    try {
      // Récupérer le profil Upload-Post de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('upload_post_username')
        .eq('id', user.id)
        .single();

      if (!profile?.upload_post_username) {
        setIsPublishing(false);
        return {
          results: accounts.map(account => ({
            accountId: account.accountId,
            platform: account.platform,
            success: false,
            error: 'Profil Upload-Post non configuré. Veuillez connecter vos comptes sociaux.'
          }))
        };
      }

      // Extraire les plateformes uniques
      const platforms = [...new Set(accounts.map(a => a.platform))];

      const mediaType = determineMediaType({
        photos: images,
        video: video
      });

      // Publier vers toutes les plateformes en une seule requête
      const response = await publishContent({
        profile_username: profile.upload_post_username,
        platforms: platforms,
        title: message,
        media_type: mediaType,
        photos: images,
        video: video
      });

      if (!response.success) {
        setIsPublishing(false);
        return {
          results: accounts.map(account => ({
            accountId: account.accountId,
            platform: account.platform,
            success: false,
            error: response.error || 'Erreur lors de la publication'
          }))
        };
      }

      // Retourner le succès pour tous les comptes
      const results = accounts.map(account => ({
        accountId: account.accountId,
        platform: account.platform,
        success: true,
        postId: response.data?.request_id || response.data?.job_id
      }));

      setIsPublishing(false);
      return { results };
    } catch (error) {
      console.error('Erreur publication:', error);
      setIsPublishing(false);
      return {
        results: accounts.map(account => ({
          accountId: account.accountId,
          platform: account.platform,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }))
      };
    }
  }, []);

  return {
    isPublishing,
    publishPost,
    publishToMultipleAccounts
  };
};

// Helper pour calculer le slot temporel
export const calculateTimeSlot = (date: Date): number => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  return hour * 60 + minute;
};
