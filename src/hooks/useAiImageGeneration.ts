/**
 * Hook pour gérer la génération d'images par IA
 */

import { useState, useCallback } from 'react';
import { AI_WEBHOOKS, AI_GENERATION_TYPES, AiGenerationType } from '@/data/aiConfig';

interface UseAiImageGenerationResult {
  isGenerating: boolean;
  generatedImages: string[];
  generateImage: (params: {
    type: AiGenerationType;
    prompt: string;
    sourceImages?: string[];
  }) => Promise<void>;
  clearGeneratedImages: () => void;
}

export const useAiImageGeneration = (): UseAiImageGenerationResult => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const generateImage = useCallback(async ({ 
    type, 
    prompt, 
    sourceImages = [] 
  }: {
    type: AiGenerationType;
    prompt: string;
    sourceImages?: string[];
  }) => {
    setIsGenerating(true);
    
    try {
      const typeConfig = AI_GENERATION_TYPES.find(t => t.id === type);
      if (!typeConfig) {
        throw new Error('Type de génération invalide');
      }

      // Validation pour les types qui nécessitent des images
      if (typeConfig.requiresImages > 0 && sourceImages.length < typeConfig.requiresImages) {
        throw new Error(`Ce type de génération nécessite ${typeConfig.requiresImages} image(s)`);
      }

      // Validation pour le prompt (sauf UGC)
      if (type !== 'ugc' && !prompt.trim()) {
        throw new Error('Veuillez saisir un prompt pour la génération');
      }

      const webhookUrl = AI_WEBHOOKS[type];
      const payload = {
        prompt,
        images: sourceImages,
        type
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.imageUrl) {
          setGeneratedImages(prev => [...prev, data.imageUrl]);
        } else {
          throw new Error(data.message || 'Erreur inconnue');
        }
      } else {
        throw new Error('Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Erreur génération IA:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearGeneratedImages = useCallback(() => {
    setGeneratedImages([]);
  }, []);

  return {
    isGenerating,
    generatedImages,
    generateImage,
    clearGeneratedImages
  };
};
