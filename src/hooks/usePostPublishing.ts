/**
 * Hook pour gérer la publication de posts via Upload Post API
 */

import { useState, useCallback } from 'react';
import { publishContent, determineMediaType, buildPlatformSpecificParams } from '@/services/uploadPostApi';

interface PublishParams {
  type: 'immediate' | 'scheduled' | 'approval';
  captions: { [platform: string]: string };
  accounts: string[];
  images: string[];
  video?: string;
  scheduledDateTime?: Date;
  author?: string;
  authorId?: string;
  profile_username: string; // Username Upload Post
}

interface UsePostPublishingResult {
  isPublishing: boolean;
  publishPost: (params: PublishParams) => Promise<{
    success: boolean;
    request_id?: string;
    job_id?: string;
    error?: string;
  }>;
}

export const usePostPublishing = (): UsePostPublishingResult => {
  const [isPublishing, setIsPublishing] = useState(false);

  const publishPost = useCallback(async (params: PublishParams) => {
    setIsPublishing(true);

    try {
      // Déterminer le type de média
      const mediaType = determineMediaType({
        photos: params.images,
        video: params.video
      });

      // Construire les paramètres spécifiques aux plateformes
      const platformSpecificParams = buildPlatformSpecificParams(
        params.accounts,
        params.captions
      );

      // Préparer le titre principal (première caption disponible)
      const title = params.captions[Object.keys(params.captions)[0]] || '';

      // Construire les paramètres de publication
      const publishParams = {
        profile_username: params.profile_username,
        platforms: params.accounts,
        title,
        media_type: mediaType,
        ...(params.images.length > 0 && { photos: params.images }),
        ...(params.video && { video: params.video }),
        ...(params.type === 'scheduled' && params.scheduledDateTime && {
          scheduled_date: params.scheduledDateTime.toISOString()
        }),
        platform_specific_params: platformSpecificParams
      };

      console.log('Publishing with params:', publishParams);

      // Appeler le service de publication
      const response = await publishContent(publishParams);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la publication');
      }

      // Retourner le résultat avec request_id ou job_id
      return {
        success: true,
        request_id: response.data?.request_id,
        job_id: response.data?.job_id
      };
    } catch (error) {
      console.error('Erreur publication:', error);
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
    publishPost
  };
};

// Helper pour calculer le slot temporel
export const calculateTimeSlot = (date: Date): number => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  return hour * 60 + minute; // Convertir en minutes depuis minuit
};
