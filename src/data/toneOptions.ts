/**
 * Configuration des tons de voix pour la génération de contenu
 */

import { Briefcase, Smile, Zap, DollarSign, BookOpen, Sparkles, LucideIcon } from 'lucide-react';

export interface ToneOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { 
    id: 'professional', 
    label: '💼 Professionnel', 
    description: 'Formel et expert',
    icon: Briefcase,
    color: 'text-blue-600'
  },
  { 
    id: 'casual', 
    label: '😊 Décontracté', 
    description: 'Décontracté et amical',
    icon: Smile,
    color: 'text-green-600'
  },
  { 
    id: 'inspiring', 
    label: '⚡ Inspirant', 
    description: 'Motivant et énergique',
    icon: Zap,
    color: 'text-yellow-600'
  },
  { 
    id: 'sales', 
    label: '💰 Vendeur', 
    description: 'Persuasif et commercial',
    icon: DollarSign,
    color: 'text-red-600'
  },
  { 
    id: 'storytelling', 
    label: '📖 Storytelling', 
    description: 'Narratif et captivant',
    icon: BookOpen,
    color: 'text-purple-600'
  },
  { 
    id: 'automatic', 
    label: '🎭 Automatique', 
    description: 'Laisse l\'IA choisir',
    icon: Sparkles,
    color: 'text-gray-600'
  }
] as const;

export type ToneId = typeof TONE_OPTIONS[number]['id'];

// Helper pour récupérer un tone par ID
export const getToneById = (id: string): ToneOption | undefined => {
  return TONE_OPTIONS.find(tone => tone.id === id);
};
