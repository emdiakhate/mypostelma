/**
 * Hook pour gérer la génération de captions par IA
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase.functions.invoke('generate-captions', {
        body: { 
          content, 
          tone, 
          platforms: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'],
          campaign 
        }
      });

      if (error) throw error;
      
      if (data?.captions) {
        setGeneratedCaptions(data.captions);
      } else {
        throw new Error('Aucune caption générée');
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
