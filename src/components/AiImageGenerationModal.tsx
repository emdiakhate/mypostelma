/**
 * Modal réutilisable pour la génération d'images avec IA
 * Utilisé dans PostCreationModal et ArchivesPage
 */

import React, { useState, useCallback } from 'react';
import { X, Sparkles, Wand2, Edit, Layers, Users, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { WEBHOOK_URLS, callWebhook, AiEditCombineWebhookPayload, AiImageGenerationResponse, checkImageLoad } from '@/config/webhooks';
import { toast } from 'sonner';

interface AiImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseImage: (imageUrl: string) => void;
}

type GenerationType = 'simple' | 'edit';

const aiGenerationTypes = [
  { 
    id: 'simple', 
    name: 'Génération simple', 
    description: 'Créer une image à partir d\'un prompt', 
    icon: Wand2,
    requiresImages: 0 
  },
  { 
    id: 'edit', 
    name: 'Édition d\'image', 
    description: 'Modifier ou combiner des images', 
    icon: Edit,
    requiresImages: 1,
    allowMultiple: true
  }
];

const AiImageGenerationModal: React.FC<AiImageGenerationModalProps> = ({
  isOpen,
  onClose,
  onUseImage
}) => {
  const [aiGenerationType, setAiGenerationType] = useState<GenerationType>('simple');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSourceImages, setAiSourceImages] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleAiSourceImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target?.result as string);
          if (newImages.length === files.length) {
            setAiSourceImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const removeAiSourceImage = useCallback((index: number) => {
    setAiSourceImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error('Veuillez saisir un prompt pour la génération');
      return;
    }
    
    const selectedType = aiGenerationTypes.find(t => t.id === aiGenerationType);
    if (selectedType && selectedType.requiresImages > 0 && aiSourceImages.length < selectedType.requiresImages) {
      toast.error(`Veuillez ajouter au moins ${selectedType.requiresImages} image${selectedType.requiresImages > 1 ? 's' : ''}`);
      return;
    }
    
    if (isGeneratingImage) return;
    
    setIsGeneratingImage(true);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('fal-image-generation', {
        body: {
          prompt: aiPrompt,
          image_urls: aiGenerationType === 'edit' ? aiSourceImages : null,
          type: aiGenerationType
        }
      });
      
      if (error) throw error;
      
      if (!data.success || !data.imageUrl) {
        throw new Error('Échec de la génération d\'image');
      }
      
      setGeneratedImages(prev => [...prev, data.imageUrl]);
      toast.success('Image générée avec succès !');
      
    } catch (error) {
      console.error('Erreur génération image:', error);
      toast.error('Erreur lors de la génération de l\'image');
    } finally {
      setIsGeneratingImage(false);
    }
  }, [aiGenerationType, aiPrompt, aiSourceImages, isGeneratingImage]);

  const handleUseGeneratedImage = useCallback((imageUrl: string) => {
    onUseImage(imageUrl);
    setGeneratedImages([]);
    setAiPrompt('');
    setAiSourceImages([]);
    onClose();
  }, [onUseImage, onClose]);

  if (!isOpen) return null;

  const selectedType = aiGenerationTypes.find(t => t.id === aiGenerationType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Générer avec IA</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Types de génération */}
            <div>
              <label className="block text-sm font-medium mb-3">Type de génération</label>
              <div className="grid grid-cols-2 gap-3">
                {aiGenerationTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setAiGenerationType(type.id as GenerationType);
                        setAiSourceImages([]);
                        setGeneratedImages([]);
                      }}
                      className={cn(
                        "p-4 text-left border rounded-lg transition-all",
                        aiGenerationType === type.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <div className="font-medium text-sm">{type.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={
                  aiGenerationType === 'edit'
                    ? "Décrivez les modifications à apporter ou comment combiner les images..."
                    : "Décrivez l'image que vous voulez générer..."
                }
                className="min-h-24 resize-none"
              />
            </div>

            {/* Upload d'images sources */}
            {selectedType && selectedType.requiresImages > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Images sources (une ou plusieurs)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAiSourceImageUpload}
                    multiple
                    className="hidden"
                    id="ai-source-upload"
                  />
                  <label htmlFor="ai-source-upload" className="cursor-pointer block">
                    {aiSourceImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {aiSourceImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={image} 
                              alt={`Source ${index + 1}`} 
                              className="w-full h-32 object-cover rounded border"
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                removeAiSourceImage(index);
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <div className="border-2 border-dashed border-border rounded flex items-center justify-center h-32">
                          <span className="text-muted-foreground text-xs">+ Ajouter</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-foreground">
                          Cliquez pour sélectionner une ou plusieurs images
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG ou WEBP
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Bouton de génération */}
            <Button
              onClick={handleGenerateImage}
              disabled={
                isGeneratingImage || 
                (selectedType && selectedType.requiresImages > 0 && aiSourceImages.length < selectedType.requiresImages)
              }
              className="w-full"
              size="lg"
            >
              {isGeneratingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer l'image
                </>
              )}
            </Button>

            {/* Images générées */}
            {generatedImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Images générées</label>
                <div className="grid grid-cols-2 gap-3">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Générée ${index + 1}`} 
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                        <Button
                          onClick={() => handleUseGeneratedImage(image)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          size="sm"
                        >
                          Utiliser cette image
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiImageGenerationModal;
