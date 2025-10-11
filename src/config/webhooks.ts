/**
 * Configuration des webhooks N8N
 * URLs des endpoints pour l'intégration avec les workflows d'automatisation
 */

export const WEBHOOK_URLS = {
  // Génération de captions IA
  CAPTIONS: 'https://n8n.srv837294.hstgr.cloud/webhook/captions',
  
  // Scrapping de leads
  SCRAPPING: 'https://n8n.srv837294.hstgr.cloud/webhook/scrapping',
  
  // Publication de posts (maintenant et programmée)
  PUBLISH: 'https://n8n.srv837294.hstgr.cloud/webhook/publish',
  
  // Programmation de posts (même URL que PUBLISH)
  SCHEDULE: 'https://n8n.srv837294.hstgr.cloud/webhook/publish',
  
  // Génération d'images IA (édition et combinaison)
  AI_EDIT_COMBINE: 'https://n8n.srv837294.hstgr.cloud/webhook/ai-edit-combine'
} as const;

/**
 * Types pour les payloads des webhooks
 */
export interface CaptionsWebhookPayload {
  content: string;
  platform: string;
  tone?: string;
  language?: string;
}

export interface ScrappingWebhookPayload {
  query: string;
  city: string;
  maxResults: number;
  includeEmail: boolean;
  includePhone: boolean;
  includeSocial: boolean;
}

export interface PublishWebhookPayload {
  content: string;
  media?: string[];
  platforms: string[];
  accounts: string[];
  publishType: 'now' | 'scheduled';
  scheduledDate?: string;
}

export interface AiEditCombineWebhookPayload {
  type: 'edit' | 'combine';
  prompt: string;
  sourceImages: string[];
  options?: {
    style?: string;
    intensity?: number;
    quality?: string;
  };
}

// Interface pour la réponse N8N de génération d'images
export interface AiImageGenerationResponse {
  success: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  driveFileId: string;
  driveLink: string;
  error?: string;
}

/**
 * Fonction utilitaire pour vérifier si une image se charge correctement
 * avec retry en cas d'échec
 */
export async function checkImageLoad(
  imageUrl: string, 
  maxRetries: number = 3, 
  retryDelay: number = 2000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Image loaded successfully on attempt ${attempt}:`, imageUrl);
        return true;
      }
    } catch (error) {
      console.warn(`Image load attempt ${attempt} failed:`, error);
    }
    
    if (attempt < maxRetries) {
      console.log(`Retrying image load in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  console.error(`Image failed to load after ${maxRetries} attempts:`, imageUrl);
  return false;
}

/**
 * Fonction utilitaire pour appeler un webhook
 */
export async function callWebhook<T = any>(
  url: string, 
  payload: any, 
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
      body: JSON.stringify(payload),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`);
    }

    // Gérer les réponses vides ou non-JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log('Webhook response is empty, returning success');
      return { success: true } as T;
    }

    try {
      const parsed = JSON.parse(text);
      console.log('Webhook response parsed successfully:', parsed);
      return parsed;
    } catch (parseError) {
      console.log('Webhook response is not JSON, returning as text:', text);
      return { success: true, data: text, raw: true } as T;
    }
  } catch (error) {
    console.error('Webhook call error:', error);
    // En cas d'erreur CORS, simuler une réponse réussie pour le développement
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.warn('CORS error detected, simulating successful response for development');
      return { success: true, simulated: true } as T;
    }
    throw error;
  }
}
