/**
 * Hook pour gérer la publication de posts via Upload-Post API et Meta API
 * 
 * Pour tester Meta API sur Facebook, définir USE_META_FOR_FACEBOOK = true
 */

import { useState, useCallback } from 'react';
import { publishContent, determineMediaType } from '@/services/uploadPostApi';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// CONFIGURATION: Activer Meta API pour Facebook (commenter Upload-Post)
// =============================================================================
const USE_META_FOR_FACEBOOK = true; // true = utiliser Meta API, false = utiliser Upload-Post

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
  publishToMultipleAccounts: (accounts: { accountId: string; platform: string }[], message: string, images?: string[], video?: string, firstComments?: Record<string, string>) => Promise<{
    results: { accountId: string; platform: string; success: boolean; postId?: string; error?: string }[];
  }>;
}

/**
 * Publier via l'API Meta (Facebook/Instagram)
 */
async function publishViaMeta(
  platform: 'facebook' | 'instagram',
  accountId: string,
  message: string,
  images?: string[],
  video?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    console.log(`[META] Publishing to ${platform} via Meta API...`);
    
    // Récupérer le compte connecté depuis la base de données
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('platform', platform)
      .single();
    
    if (accountError || !account) {
      console.error('[META] No connected account found for', platform);
      return {
        success: false,
        error: `Aucun compte ${platform} connecté. Veuillez connecter votre compte dans les paramètres.`
      };
    }

    // Déterminer le type de média
    let mediaType: 'text' | 'photo' | 'video' = 'text';
    if (video) {
      mediaType = 'video';
    } else if (images && images.length > 0) {
      mediaType = 'photo';
    }

    // Appeler l'edge function meta-publish
    const { data, error } = await supabase.functions.invoke('meta-publish', {
      body: {
        platform,
        account_id: account.id,
        message,
        media_urls: images || [],
        media_type: mediaType
      }
    });

    if (error) {
      console.error('[META] Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la publication Meta'
      };
    }

    if (!data?.success) {
      console.error('[META] Publish failed:', data);
      return {
        success: false,
        error: data?.error || 'Échec de la publication'
      };
    }

    console.log('[META] Publish successful:', data);
    return {
      success: true,
      postId: data.post_id
    };
  } catch (err) {
    console.error('[META] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inattendue'
    };
  }
}

export const usePostPublishing = (): UsePostPublishingResult => {
  const [isPublishing, setIsPublishing] = useState(false);

  const publishPost = useCallback(async (params: PublishParams) => {
    try {
      console.log('Publishing:', params);

      // Utiliser Meta API pour Facebook si activé
      if (USE_META_FOR_FACEBOOK && params.platform === 'facebook') {
        return await publishViaMeta('facebook', params.accountId, params.message, params.images, params.video);
      }

      // Sinon utiliser Upload-Post API
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
      console.error('Erreur publication:', error);
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
    video?: string,
    firstComments?: Record<string, string>
  ) => {
    setIsPublishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const results: { accountId: string; platform: string; success: boolean; postId?: string; error?: string }[] = [];

      // Séparer les comptes Meta (à publier via Meta API) et les autres (Upload-Post)
      const metaAccounts = USE_META_FOR_FACEBOOK 
        ? accounts.filter(a => a.platform === 'facebook')
        : [];
      const uploadPostAccounts = USE_META_FOR_FACEBOOK
        ? accounts.filter(a => a.platform !== 'facebook')
        : accounts;

      // 1. Publier via Meta API pour les comptes Facebook
      for (const account of metaAccounts) {
        console.log(`[MULTI] Publishing to ${account.platform} via Meta API...`);
        const result = await publishViaMeta(
          account.platform as 'facebook' | 'instagram',
          account.accountId,
          message,
          images,
          video
        );
        results.push({
          accountId: account.accountId,
          platform: account.platform,
          ...result
        });
      }

      // 2. Publier via Upload-Post pour les autres plateformes
      if (uploadPostAccounts.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('upload_post_username')
          .eq('id', user.id)
          .single();

        if (!profile?.upload_post_username) {
          // Ajouter une erreur pour chaque compte Upload-Post
          for (const account of uploadPostAccounts) {
            results.push({
              accountId: account.accountId,
              platform: account.platform,
              success: false,
              error: 'Profil Upload-Post non configuré. Veuillez connecter vos comptes sociaux.'
            });
          }
        } else {
          // Extraire les plateformes uniques pour Upload-Post
          const platforms = [...new Set(uploadPostAccounts.map(a => a.platform))];

          const mediaType = determineMediaType({
            photos: images,
            video: video
          });

          console.log('[MULTI] Publishing to Upload-Post platforms:', platforms);

          const response = await publishContent({
            profile_username: profile.upload_post_username,
            platforms: platforms,
            title: message,
            media_type: mediaType,
            photos: images,
            video: video,
            first_comments: firstComments
          });

          if (!response.success) {
            for (const account of uploadPostAccounts) {
              results.push({
                accountId: account.accountId,
                platform: account.platform,
                success: false,
                error: response.error || 'Erreur lors de la publication'
              });
            }
          } else {
            for (const account of uploadPostAccounts) {
              results.push({
                accountId: account.accountId,
                platform: account.platform,
                success: true,
                postId: response.data?.request_id || response.data?.job_id
              });
            }
          }
        }
      }

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
