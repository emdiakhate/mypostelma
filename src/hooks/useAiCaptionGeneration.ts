/**
 * Hook pour gérer la génération de captions par IA
 */

import { useState, useCallback } from 'react';
import { AI_WEBHOOKS } from '@/data/aiConfig';

interface GeneratedCaptions {
  [platform: string]: string;
}

interface UseAiCaptionGenerationResult {
  isGenerating: boolean;
  generatedCaptions: GeneratedCaptions | null;
  generateCaptions: (params: {
    content: string;
    tone: string;
    platform: string;
    campaign?: string;
  }) => Promise<void>;
  clearCaptions: () => void;
}

export const useAiCaptionGeneration = (): UseAiCaptionGenerationResult => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaptions | null>(null);

  const generateCaptions = useCallback(async ({ 
    content, 
    tone, 
    platform,
    campaign = 'Postelma'
  }: {
    content: string;
    tone: string;
    platform: string;
    campaign?: string;
  }) => {
    if (!content.trim()) {
      throw new Error('Veuillez saisir du contenu pour votre publication.');
    }

    setIsGenerating(true);
    
    try {
      const payload = {
        prompt: content,
        tone,
        platform,
        context: {
          product: campaign,
          target: 'audience générale'
        }
      };

      const response = await fetch(AI_WEBHOOKS.captions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedCaptions(result.captions);
      } else {
        throw new Error('Erreur lors de la génération des captions');
      }
    } catch (error) {
      console.error('Erreur génération captions:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearCaptions = useCallback(() => {
    setGeneratedCaptions(null);
  }, []);

  return {
    isGenerating,
    generatedCaptions,
    generateCaptions,
    clearCaptions
  };
};
