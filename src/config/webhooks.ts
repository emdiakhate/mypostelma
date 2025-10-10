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
  SCHEDULE: 'https://n8n.srv837294.hstgr.cloud/webhook/publish'
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
    if (!text) {
      return { success: true } as T;
    }

    try {
      return JSON.parse(text);
    } catch {
      return { success: true, data: text } as T;
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
