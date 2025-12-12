/**
 * Hook pour gérer la publication de posts via l'API Meta (Facebook/Instagram)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PublishParams {
  accountId: string; // ID de connected_accounts
  platform: 'facebook' | 'instagram';
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
      console.log('Publishing to Meta:', params);

      const mediaType = params.video ? 'video' : params.images && params.images.length > 0 ? 'photo' : 'text';

      const { data, error } = await supabase.functions.invoke('meta-publish', {
        body: {
          platform: params.platform,
          account_id: params.accountId,
          message: params.message,
          media_urls: params.images || [],
          media_type: mediaType,
        }
      });

      if (error) {
        console.error('Meta publish error:', error);
        // Try to get error details from the context
        let errorDetails = error.message || 'Erreur lors de la publication';
        if (error.context) {
          try {
            const errorBody = await error.context.json();
            console.error('Error body:', errorBody);
            errorDetails = errorBody.error || errorDetails;
            if (errorBody.hint) {
              errorDetails += `\n\n${errorBody.hint}`;
            }
          } catch (e) {
            console.error('Could not parse error body:', e);
          }
        }
        throw new Error(errorDetails);
      }

      if (data && !data.success) {
        const errorMsg = data.error || 'Erreur lors de la publication';
        const hint = data.hint ? `\n\n${data.hint}` : '';
        throw new Error(errorMsg + hint);
      }

      if (!data || !data.success) {
        throw new Error('Réponse invalide du serveur');
      }

      return {
        success: true,
        postId: data.post_id
      };
    } catch (error) {
      console.error('Erreur publication Meta:', error);
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

    const results = await Promise.all(
      accounts.map(async (account) => {
        const result = await publishPost({
          accountId: account.accountId,
          platform: account.platform as 'facebook' | 'instagram',
          message,
          images,
          video
        });

        return {
          accountId: account.accountId,
          platform: account.platform,
          ...result
        };
      })
    );

    setIsPublishing(false);

    return { results };
  }, [publishPost]);

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
  return hour * 60 + minute; // Convertir en minutes depuis minuit
};
