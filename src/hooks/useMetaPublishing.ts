/**
 * Hook pour gérer la publication de posts via l'API Meta (Facebook/Instagram)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PublishParams {
  platform: 'facebook' | 'instagram';
  accountId: string;
  message: string;
  mediaUrls?: string[];
  mediaType?: 'photo' | 'video' | 'text';
}

interface UseMetaPublishingResult {
  isPublishing: boolean;
  publishToMeta: (params: PublishParams) => Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }>;
}

export const useMetaPublishing = (): UseMetaPublishingResult => {
  const [isPublishing, setIsPublishing] = useState(false);

  const publishToMeta = useCallback(async (params: PublishParams) => {
    setIsPublishing(true);

    try {
      console.log('Publishing to Meta:', params);

      const { data, error } = await supabase.functions.invoke('meta-publish', {
        body: {
          platform: params.platform,
          account_id: params.accountId,
          message: params.message,
          media_urls: params.mediaUrls,
          media_type: params.mediaType,
        }
      });

      if (error) {
        console.error('Meta publish error:', error);
        throw new Error(error.message || 'Erreur lors de la publication');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la publication');
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
    } finally {
      setIsPublishing(false);
    }
  }, []);

  return {
    isPublishing,
    publishToMeta
  };
};
