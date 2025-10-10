/**
 * Configuration des webhooks N8N
 * URLs des endpoints pour l'intégration avec les workflows d'automatisation
 */

export const WEBHOOK_URLS = {
  // Génération de captions IA
  CAPTIONS: 'https://n8n.srv837294.hstgr.cloud/webhook/captions',
  
  // Scrapping de leads
  SCRAPPING: 'https://n8n.srv837294.hstgr.cloud/webhook/scrapping',
  
  // Publication de posts
  PUBLISH: 'https://n8n.srv837294.hstgr.cloud/webhook/publish',
  
  // Programmation de posts
  SCHEDULE: 'https://n8n.srv837294.hstgr.cloud/webhook/schedule'
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
        ...options.headers,
      },
      body: JSON.stringify(payload),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Webhook call error:', error);
    throw error;
  }
}
