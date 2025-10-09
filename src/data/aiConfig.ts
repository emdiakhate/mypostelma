/**
 * Configuration pour l'intégration IA
 * Centralise les webhooks et configurations liés à l'IA
 */

// Configuration des webhooks IA pour n8n
export const AI_WEBHOOKS = {
  simple: 'https://malick000.app.n8n.cloud/webhook/ai-simple',
  edit: 'https://malick000.app.n8n.cloud/webhook/ai-edit', 
  combine: 'https://malick000.app.n8n.cloud/webhook/ai-combine',
  ugc: 'https://malick000.app.n8n.cloud/webhook/ai-ugc',
  captions: 'https://n8n.srv837294.hstgr.cloud/webhook/captions',
  publish: 'https://n8n.srv837294.hstgr.cloud/webhook/publish'
} as const;

// Types de génération IA disponibles
export const AI_GENERATION_TYPES = [
  { 
    id: 'simple' as const, 
    name: 'Génération simple', 
    description: 'Créer une image à partir d\'un prompt', 
    requiresImages: 0 
  },
  { 
    id: 'edit' as const, 
    name: 'Édition d\'image', 
    description: 'Modifier une image existante', 
    requiresImages: 1 
  },
  { 
    id: 'combine' as const, 
    name: 'Combinaison', 
    description: 'Combiner deux images', 
    requiresImages: 2 
  },
  { 
    id: 'ugc' as const, 
    name: 'UGC', 
    description: 'Contenu généré par utilisateur', 
    requiresImages: 1 
  }
] as const;

export type AiGenerationType = typeof AI_GENERATION_TYPES[number]['id'];
