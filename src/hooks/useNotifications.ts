import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQuotas } from './useQuotas';

export interface Notification {
  id: string;
  type: 'quota_warning' | 'quota_limit' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Hook pour gérer les notifications de quotas
 * Affiche des alertes quand un utilisateur atteint 80% ou 100% de ses quotas
 */
export function useNotifications() {
  const { quotas } = useQuotas();

  useEffect(() => {
    if (!quotas || !quotas.beta_user) return;

    // Vérifier les quotas et afficher des notifications si nécessaire
    const checkQuotas = () => {
      // Images IA
      if (quotas.ai_images) {
        const imagePercentage = (quotas.ai_images.count / quotas.ai_images.limit) * 100;
        
        if (imagePercentage === 100) {
          toast.error('Limite de génération d\'images IA atteinte', {
            description: `Vous avez utilisé ${quotas.ai_images.count}/${quotas.ai_images.limit} générations. Contactez-nous pour augmenter votre quota.`,
            duration: 8000,
          });
        } else if (imagePercentage >= 80 && imagePercentage < 100) {
          const key = `ai_images_80_${quotas.ai_images.count}`;
          const alreadyNotified = sessionStorage.getItem(key);
          
          if (!alreadyNotified) {
            toast.warning('Attention: 80% du quota d\'images IA utilisé', {
              description: `Vous avez utilisé ${quotas.ai_images.count}/${quotas.ai_images.limit} générations (${Math.round(imagePercentage)}%).`,
              duration: 6000,
            });
            sessionStorage.setItem(key, 'true');
          }
        }
      }

      // Vidéos IA
      if (quotas.ai_videos) {
        const videoPercentage = (quotas.ai_videos.count / quotas.ai_videos.limit) * 100;
        
        if (videoPercentage === 100) {
          toast.error('Limite de génération de vidéos IA atteinte', {
            description: `Vous avez utilisé ${quotas.ai_videos.count}/${quotas.ai_videos.limit} générations. Contactez-nous pour augmenter votre quota.`,
            duration: 8000,
          });
        } else if (videoPercentage >= 80 && videoPercentage < 100) {
          const key = `ai_videos_80_${quotas.ai_videos.count}`;
          const alreadyNotified = sessionStorage.getItem(key);
          
          if (!alreadyNotified) {
            toast.warning('Attention: 80% du quota de vidéos IA utilisé', {
              description: `Vous avez utilisé ${quotas.ai_videos.count}/${quotas.ai_videos.limit} générations (${Math.round(videoPercentage)}%).`,
              duration: 6000,
            });
            sessionStorage.setItem(key, 'true');
          }
        }
      }

      // Recherches de leads
      if (quotas.lead_searches) {
        const leadPercentage = (quotas.lead_searches.count / quotas.lead_searches.limit) * 100;
        
        if (leadPercentage === 100) {
          toast.error('Limite de recherches de leads atteinte', {
            description: `Vous avez utilisé ${quotas.lead_searches.count}/${quotas.lead_searches.limit} recherches. Contactez-nous pour augmenter votre quota.`,
            duration: 8000,
          });
        } else if (leadPercentage >= 80 && leadPercentage < 100) {
          const key = `lead_searches_80_${quotas.lead_searches.count}`;
          const alreadyNotified = sessionStorage.getItem(key);
          
          if (!alreadyNotified) {
            toast.warning('Attention: 80% du quota de recherches de leads utilisé', {
              description: `Vous avez utilisé ${quotas.lead_searches.count}/${quotas.lead_searches.limit} recherches (${Math.round(leadPercentage)}%).`,
              duration: 6000,
            });
            sessionStorage.setItem(key, 'true');
          }
        }
      }
    };

    checkQuotas();
  }, [quotas]);

  return {
    // Peut être étendu avec plus de fonctionnalités
  };
}
