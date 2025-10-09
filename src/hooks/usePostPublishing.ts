/**
 * Hook pour gérer la publication de posts
 */

import { useState, useCallback } from 'react';
import { AI_WEBHOOKS } from '@/data/aiConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PublishParams {
  type: 'immediate' | 'scheduled' | 'approval';
  captions: { [platform: string]: string };
  accounts: string[];
  images: string[];
  scheduledDateTime?: Date;
  author?: string;
  authorId?: string;
}

interface UsePostPublishingResult {
  isPublishing: boolean;
  publishPost: (params: PublishParams) => Promise<void>;
}

export const usePostPublishing = (): UsePostPublishingResult => {
  const [isPublishing, setIsPublishing] = useState(false);

  const publishPost = useCallback(async (params: PublishParams) => {
    setIsPublishing(true);
    
    try {
      const payload = {
        captions: params.captions,
        accounts: params.accounts,
        images: params.images,
        type: params.type,
        ...(params.type === 'scheduled' && params.scheduledDateTime && {
          scheduledDateTime: params.scheduledDateTime.toISOString()
        }),
        ...(params.type === 'approval' && {
          author: params.author,
          authorId: params.authorId
        })
      };

      const response = await fetch(AI_WEBHOOKS.publish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la publication');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur publication:', error);
      throw error;
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
