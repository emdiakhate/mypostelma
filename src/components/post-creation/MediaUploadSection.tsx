import React, { memo, useCallback } from 'react';
import { Upload, ImageIcon, Video, ImagePlus, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Fonction pour générer une miniature vidéo
const generateVideoThumbnail = (file: File, callback: (thumbnail: string) => void) => {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  video.addEventListener('loadedmetadata', () => {
    // Prendre une capture à 1 seconde ou au milieu de la vidéo
    const time = Math.min(1, video.duration / 2);
    video.currentTime = time;
  });
  
  video.addEventListener('seeked', () => {
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertir en base64
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      callback(thumbnail);
    }
  });
  
  video.src = URL.createObjectURL(file);
  video.load();
};

interface MediaUploadSectionProps {
  mediaSource: 'upload' | 'ai';
  onMediaSourceChange: (source: 'upload' | 'ai') => void;
  selectedImages: string[];
  onImagesChange: (images: string[]) => void;
  aiGenerationType: 'simple' | 'edit';
  onAiGenerationTypeChange: (type: 'simple' | 'edit') => void;
  aiPrompt: string;
  onAiPromptChange: (prompt: string) => void;
  aiSourceImages: string[];
  onAiSourceImagesChange: (images: string[]) => void;
  generatedImages: string[];
  isGeneratingImage: boolean;
  onGenerateImage: () => void;
  onUseGeneratedImage: (imageUrl: string) => void;
  // Nouveaux props pour la génération vidéo
  videoMode?: 'image-to-video' | 'text-to-video' | null;
  onVideoModeChange?: (mode: 'image-to-video' | 'text-to-video' | null) => void;
  videoPrompt?: string;
  onVideoPromptChange?: (prompt: string) => void;
  textVideoPrompt?: string;
  onTextVideoPromptChange?: (prompt: string) => void;
  videoDuration?: string;
  onVideoDurationChange?: (duration: string) => void;
  textVideoDuration?: string;
  onTextVideoDurationChange?: (duration: string) => void;
  videoStyle?: string;
  onVideoStyleChange?: (style: string) => void;
  videoImage?: File | null;
  onVideoImageChange?: (file: File | null) => void;
  isGeneratingVideo?: boolean;
  onGenerateVideo?: (videoUrl?: string) => void;
  generatedVideoUrl?: string | null;
  onUseGeneratedVideo?: (videoUrl: string) => void;
}

const aiGenerationTypes = [
  { id: 'simple', name: 'Génération simple', description: 'Créer une image à partir d\'un prompt', requiresImages: 0 },
  { id: 'edit', name: 'Édition d\'image', description: 'Modifier ou combiner une ou plusieurs images', requiresImages: 1 }
];

const videoGenerationTypes = [
  { 
    id: 'image-to-video', 
    name: 'Image + Prompt → Vidéo', 
    description: 'Animer une image avec un prompt de mouvement',
    icon: ImagePlus,
    requiresImage: true
  },
  { 
    id: 'text-to-video', 
    name: 'Prompt → Vidéo', 
    description: 'Créer une vidéo uniquement à partir d\'un prompt',
    icon: Wand2,
    requiresImage: false
  }
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
  onUseGeneratedImage,
  // Nouveaux props pour la génération vidéo
  videoMode,
  onVideoModeChange,
  videoPrompt,
  onVideoPromptChange,
  textVideoPrompt,
  onTextVideoPromptChange,
  videoDuration,
  onVideoDurationChange,
  textVideoDuration,
  onTextVideoDurationChange,
  videoStyle,
  onVideoStyleChange,
  videoImage,
  onVideoImageChange,
  isGeneratingVideo,
  onGenerateVideo,
  generatedVideoUrl,
  onUseGeneratedVideo
}) => {
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newMedia: string[] = [];
      Array.from(files).slice(0, 4 - selectedImages.length).forEach(file => {
        // Vérifier le type de fichier
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          toast.error(`${file.name} n'est ni une image ni une vidéo`);
          return;
        }

        // Limites de taille
        const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB vidéo, 10MB image
        if (file.size > maxSize) {
          toast.error(`${file.name} est trop volumineux (max ${isVideo ? '100' : '10'}MB)`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newMedia.push(result);
          
          // Si c'est une vidéo, générer une miniature
          if (isVideo) {
            generateVideoThumbnail(file, (thumbnail) => {
              // Ajouter la miniature à la liste des médias
              newMedia.push(thumbnail);
              if (newMedia.length === Math.min(files.length, 4 - selectedImages.length)) {
                onImagesChange([...selectedImages, ...newMedia]);
              }
            });
          } else {
            if (newMedia.length === Math.min(files.length, 4 - selectedImages.length)) {
              onImagesChange([...selectedImages, ...newMedia]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, [selectedImages, onImagesChange]);

  const removeImage = useCallback((index: number) => {
    onImagesChange(selectedImages.filter((_, i) => i !== index));
  }, [selectedImages, onImagesChange]);

  const handleVideoImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onVideoImageChange) {
      onVideoImageChange(file);
    }
  }, [onVideoImageChange]);

  const handleGenerateVideo = useCallback(async () => {
    if (isGeneratingVideo) return;
    
    if (onGenerateVideo) {
      onGenerateVideo();
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      let imageUrl = null;
      
      // Si mode image-to-video, uploader l'image vers Supabase Storage
      if (videoMode === 'image-to-video' && videoImage) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        
        const fileName = `${user.id}/video-source-${Date.now()}.${videoImage.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media-archives')
          .upload(fileName, videoImage);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('media-archives')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }
      
      const { data, error } = await supabase.functions.invoke('fal-video-generation', {
        body: {
          mode: videoMode,
          prompt: videoMode === 'image-to-video' ? videoPrompt : textVideoPrompt,
          image_url: imageUrl,
          duration: parseInt(videoMode === 'image-to-video' ? videoDuration || '5' : textVideoDuration || '5')
        }
      });
      
      if (error) throw error;
      
      if (!data.success || !data.videoUrl) {
        throw new Error('Échec de la génération vidéo');
      }
      
      // Arrêter le chargement en appelant onGenerateVideo avec l'URL
      if (onGenerateVideo) {
        onGenerateVideo(data.videoUrl);
      }
      
      toast.success('Vidéo générée avec succès !');
      
    } catch (error) {
      console.error('Erreur génération vidéo:', error);
      toast.error('Erreur lors de la génération de la vidéo');
      // Arrêter le chargement en cas d'erreur
      if (onGenerateVideo) {
        onGenerateVideo();
      }
    }
  }, [videoMode, videoImage, videoPrompt, textVideoPrompt, videoDuration, textVideoDuration, onGenerateVideo]);

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
        Médias (optionnel)
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
          Upload de médias
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
            accept="image/*,video/*"
            onChange={handleImageUpload}
            multiple
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer block">
            {selectedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedImages.map((media, index) => {
                  const isVideo = media.startsWith('data:video/');
                  return (
                  <div key={index} className="relative group">
                      {isVideo ? (
                        <video
                          src={media}
                          className="w-full h-24 object-cover rounded border"
                          controls
                        />
                      ) : (
                        <img 
                          src={media} 
                          alt={`Media ${index + 1}`} 
                      className="w-full h-24 object-cover rounded border"
                    />
                      )}
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
                  );
                })}
                {selectedImages.length < 4 && (
                  <div className="border-2 border-dashed border-border rounded flex items-center justify-center h-24">
                    <span className="text-muted-foreground text-xs">+ Ajouter</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center gap-2 mb-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground">Cliquer pour ajouter des médias</p>
                <p className="text-xs text-muted-foreground">Images (max 10MB) et vidéos (max 100MB)</p>
                <p className="text-xs text-muted-foreground">Jusqu'à 4 fichiers</p>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Contenu Génération IA avec sous-onglets */}
      {mediaSource === 'ai' && (
        <Tabs defaultValue="image-ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="image-ai" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image IA
            </TabsTrigger>
            <TabsTrigger value="video-ai" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Vidéo IA
            </TabsTrigger>
          </TabsList>
          
          {/* Contenu Image IA */}
          <TabsContent value="image-ai">
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
                  Prompt
                </label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => onAiPromptChange(e.target.value)}
                  placeholder="Décrivez l'image que vous voulez générer..."
                  className="min-h-20"
                />
              </div>

              {/* Upload d'images sources pour édition/combinaison */}
              {aiGenerationType === 'edit' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Images sources (au moins 1 image)
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
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-foreground mb-2">Cliquez pour sélectionner une ou plusieurs images</p>
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
                  `Générer ${aiGenerationType === 'simple' ? 'une image' : 'une édition'}`
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
          </TabsContent>
          
          {/* Contenu Vidéo IA */}
          <TabsContent value="video-ai">
            <div className="space-y-6">
              {/* Types de génération vidéo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoGenerationTypes.map((type) => {
                  const IconComponent = type.icon;
                  // Sélectionner par défaut "Image + Prompt → Vidéo"
                  if (videoMode === null && type.id === 'image-to-video' && onVideoModeChange) {
                    setTimeout(() => onVideoModeChange('image-to-video'), 0);
                  }
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => onVideoModeChange?.(type.id as 'image-to-video' | 'text-to-video')}
                      className={cn(
                        "p-4 text-left border rounded-lg transition-all",
                        videoMode === type.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary"
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
              
              {/* Interface selon le mode sélectionné */}
              {videoMode === 'image-to-video' && (
                <div className="space-y-4">
                  {/* Upload de l'image */}
                  <div>
                    <Label>Image de départ</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="video-image-upload"
                        onChange={handleVideoImageUpload}
                      />
                      <label htmlFor="video-image-upload" className="cursor-pointer block">
                        {videoImage ? (
                          <div className="relative group">
                            <img 
                              src={URL.createObjectURL(videoImage)} 
                              alt="Image sélectionnée" 
                              className="w-full h-32 object-cover rounded border"
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                onVideoImageChange?.(null);
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-foreground mb-2">Cliquez pour sélectionner une image</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  {/* Prompt de mouvement */}
                  <div>
                    <Label htmlFor="video-prompt">Prompt de mouvement</Label>
                    <Textarea
                      id="video-prompt"
                      placeholder="Décrivez le mouvement souhaité (ex: La caméra zoome lentement vers l'avant...)"
                      value={videoPrompt || ''}
                      onChange={(e) => onVideoPromptChange?.(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Durée de la vidéo */}
                  <div>
                    <Label htmlFor="video-duration">Durée de la vidéo</Label>
                    <Select value={videoDuration || '5'} onValueChange={onVideoDurationChange}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner la durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 secondes</SelectItem>
                        <SelectItem value="5">5 secondes</SelectItem>
                        <SelectItem value="10">10 secondes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {videoMode === 'text-to-video' && (
                <div className="space-y-4">
                  {/* Prompt vidéo */}
                  <div>
                    <Label htmlFor="text-video-prompt">Prompt de la vidéo</Label>
                    <Textarea
                      id="text-video-prompt"
                      placeholder="Décrivez la vidéo que vous voulez créer (ex: Un coucher de soleil sur une plage tropicale avec des vagues...)"
                      value={textVideoPrompt || ''}
                      onChange={(e) => onTextVideoPromptChange?.(e.target.value)}
                      rows={5}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Durée de la vidéo */}
                  <div>
                    <Label htmlFor="text-video-duration">Durée de la vidéo</Label>
                    <Select value={textVideoDuration || '5'} onValueChange={onTextVideoDurationChange}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner la durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 secondes</SelectItem>
                        <SelectItem value="5">5 secondes</SelectItem>
                        <SelectItem value="10">10 secondes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Style de vidéo (optionnel) */}
                  <div>
                    <Label htmlFor="video-style">Style de vidéo (optionnel)</Label>
                    <Select value={videoStyle || 'realistic'} onValueChange={onVideoStyleChange}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner un style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Réaliste</SelectItem>
                        <SelectItem value="cinematic">Cinématique</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="3d">3D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Bouton générer vidéo */}
              {videoMode && (
                <Button 
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo || (videoMode === 'image-to-video' && !videoImage) || (videoMode === 'text-to-video' && !textVideoPrompt)}
                  className="w-full"
                  size="lg"
                >
                  {isGeneratingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Générer la vidéo
                    </>
                  )}
                </Button>
              )}
              
              {/* Preview de la vidéo générée */}
              {generatedVideoUrl && (
                <div className="mt-6">
                  <Label>Vidéo générée</Label>
                  <div className="mt-2 rounded-lg overflow-hidden bg-muted">
                    <video
                      src={generatedVideoUrl}
                      controls
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                  <Button
                    onClick={() => onUseGeneratedVideo?.(generatedVideoUrl)}
                    className="w-full mt-2"
                  >
                    Utiliser cette vidéo
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
});

MediaUploadSection.displayName = 'MediaUploadSection';

export default MediaUploadSection;
