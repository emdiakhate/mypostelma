import React, { memo, useCallback } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MediaUploadSectionProps {
  mediaSource: 'upload' | 'ai';
  onMediaSourceChange: (source: 'upload' | 'ai') => void;
  selectedImages: string[];
  onImagesChange: (images: string[]) => void;
  aiGenerationType: 'simple' | 'edit' | 'combine' | 'ugc';
  onAiGenerationTypeChange: (type: 'simple' | 'edit' | 'combine' | 'ugc') => void;
  aiPrompt: string;
  onAiPromptChange: (prompt: string) => void;
  aiSourceImages: string[];
  onAiSourceImagesChange: (images: string[]) => void;
  generatedImages: string[];
  isGeneratingImage: boolean;
  onGenerateImage: () => void;
  onUseGeneratedImage: (imageUrl: string) => void;
}

const aiGenerationTypes = [
  { id: 'simple', name: 'Génération simple', description: 'Créer une image à partir d\'un prompt', requiresImages: 0 },
  { id: 'edit', name: 'Édition d\'image', description: 'Modifier une image existante', requiresImages: 1 },
  { id: 'combine', name: 'Combinaison', description: 'Combiner deux images', requiresImages: 2 },
  { id: 'ugc', name: 'UGC', description: 'Contenu généré par utilisateur', requiresImages: 1 }
];

const MediaUploadSection: React.FC<MediaUploadSectionProps> = memo(({
  mediaSource,
  onMediaSourceChange,
  selectedImages,
  onImagesChange,
  aiGenerationType,
  onAiGenerationTypeChange,
  aiPrompt,
  onAiPromptChange,
  aiSourceImages,
  onAiSourceImagesChange,
  generatedImages,
  isGeneratingImage,
  onGenerateImage,
  onUseGeneratedImage
}) => {
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).slice(0, 4 - selectedImages.length).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target?.result as string);
          if (newImages.length === Math.min(files.length, 4 - selectedImages.length)) {
            onImagesChange([...selectedImages, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, [selectedImages, onImagesChange]);

  const removeImage = useCallback((index: number) => {
    onImagesChange(selectedImages.filter((_, i) => i !== index));
  }, [selectedImages, onImagesChange]);

  const handleAiSourceImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target?.result as string);
          if (newImages.length === files.length) {
            onAiSourceImagesChange([...aiSourceImages, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, [aiSourceImages, onAiSourceImagesChange]);

  const removeAiSourceImage = useCallback((index: number) => {
    onAiSourceImagesChange(aiSourceImages.filter((_, i) => i !== index));
  }, [aiSourceImages, onAiSourceImagesChange]);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        Images (optionnel)
      </label>
      
      {/* Onglets Upload/IA */}
      <div className="flex mb-4 border-b border-border">
        <button
          onClick={() => onMediaSourceChange('upload')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            mediaSource === 'upload' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Upload d'images
        </button>
        <button
          onClick={() => onMediaSourceChange('ai')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            mediaSource === 'ai' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Générer avec IA
        </button>
      </div>

      {/* Contenu Upload */}
      {mediaSource === 'upload' && (
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            multiple
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer block">
            {selectedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={image} 
                      alt={`Image ${index + 1}`} 
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeImage(index);
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {selectedImages.length < 4 && (
                  <div className="border-2 border-dashed border-border rounded flex items-center justify-center h-24">
                    <span className="text-muted-foreground text-xs">+ Ajouter</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-foreground">Cliquer pour ajouter des images</p>
                <p className="text-xs text-muted-foreground">Jusqu'à 4 images</p>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Contenu Génération IA */}
      {mediaSource === 'ai' && (
        <div className="space-y-4">
          {/* Types de génération IA */}
          <div className="grid grid-cols-2 gap-3">
            {aiGenerationTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => onAiGenerationTypeChange(type.id as any)}
                className={cn(
                  "p-3 text-left border rounded-lg transition-colors",
                  aiGenerationType === type.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium text-sm">{type.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
              </button>
            ))}
          </div>

          {/* Prompt pour l'IA */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Prompt {aiGenerationType === 'ugc' ? '(optionnel)' : ''}
            </label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => onAiPromptChange(e.target.value)}
              placeholder={aiGenerationType === 'ugc' 
                ? "Décrivez le contenu souhaité (optionnel)..." 
                : "Décrivez l'image que vous voulez générer..."
              }
              className="min-h-20"
            />
          </div>

          {/* Upload d'images sources pour édition/combinaison */}
          {(aiGenerationType === 'edit' || aiGenerationType === 'combine' || aiGenerationType === 'ugc') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Images sources {aiGenerationType === 'combine' ? '(2 images requises)' : '(1 image requise)'}
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAiSourceImageUpload}
                  multiple={aiGenerationType === 'combine'}
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
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            onClick={() => removeAiSourceImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {(aiGenerationType === 'combine' ? aiSourceImages.length < 2 : aiSourceImages.length < 1) && (
                        <div className="border-2 border-dashed border-border rounded flex items-center justify-center h-24">
                          <span className="text-muted-foreground text-xs">
                            + Ajouter {aiGenerationType === 'combine' ? 'image' : 'image'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-foreground mb-2">Cliquez pour sélectionner {aiGenerationType === 'combine' ? '2 images' : '1 image'}</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Bouton de génération */}
          <Button
            onClick={onGenerateImage}
            disabled={isGeneratingImage || (aiGenerationType !== 'simple' && aiSourceImages.length === 0)}
            className="w-full"
          >
            {isGeneratingImage ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                Génération en cours...
              </>
            ) : (
              `Générer ${aiGenerationType === 'simple' ? 'une image' : aiGenerationType === 'combine' ? 'une combinaison' : 'une édition'}`
            )}
          </Button>

          {/* Images générées */}
          {generatedImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Images générées</label>
              <div className="grid grid-cols-2 gap-2">
                {generatedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={image} 
                      alt={`Générée ${index + 1}`} 
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      onClick={() => onUseGeneratedImage(image)}
                      className="absolute inset-0 bg-primary/0 hover:bg-primary/20 text-primary-foreground flex items-center justify-center text-xs transition-all"
                    >
                      <span className="bg-primary px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100">
                        Utiliser
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MediaUploadSection.displayName = 'MediaUploadSection';

export default MediaUploadSection;
