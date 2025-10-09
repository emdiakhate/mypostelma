/**
 * Hook pour gérer la génération d'images par IA
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AI_GENERATION_TYPES, AiGenerationType } from '@/data/aiConfig';

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

      // Validation pour le prompt (sauf UGC et edit)
      if (type !== 'ugc' && type !== 'edit' && !prompt.trim()) {
        throw new Error('Veuillez saisir un prompt pour la génération');
      }

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: prompt || 'Generate a professional social media image',
          type, 
          sourceImages 
        }
      });

      if (error) throw error;
      
      if (data?.imageUrl) {
        setGeneratedImages(prev => [...prev, data.imageUrl]);
      } else {
        throw new Error('Aucune image générée');
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
