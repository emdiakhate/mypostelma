import React, { useState, useEffect, memo, useCallback } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FacebookPreview, TwitterPreview, InstagramPreview, LinkedInPreview, TikTokPreview, YouTubePreview } from './PreviewModal';
import { useBestTime, useEngagementChart } from '@/hooks/useBestTime';
import { useHashtagSuggestions, useHashtagSets } from '@/hooks/useHashtagStats';
import { useAiImageGeneration } from '@/hooks/useAiImageGeneration';
import { useAiCaptionGeneration } from '@/hooks/useAiCaptionGeneration';
import { usePostPublishing, calculateTimeSlot } from '@/hooks/usePostPublishing';
import ConnectedAccountsSelector from './ConnectedAccountsSelector';
import { PLATFORMS } from '@/config/platforms';
import { TONE_OPTIONS } from '@/data/toneOptions';
import MediaUploadSection from './post-creation/MediaUploadSection';
import BestTimeSection from './post-creation/BestTimeSection';
import HashtagSection from './post-creation/HashtagSection';
import PublishOptionsSection from './post-creation/PublishOptionsSection';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (postData: any) => void;
  selectedDay?: string;
  initialData?: any;
  isEditing?: boolean;
}


// Sous-composant mémorisé pour la sélection des plateformes
// Évite les re-rendus inutiles lors des changements d'autres états
const PlatformSelector = memo<{
  selectedPlatforms: string[];
  onPlatformChange: (platforms: string[]) => void;
}>(({ selectedPlatforms, onPlatformChange }) => {
  const handlePlatformToggle = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onPlatformChange(selectedPlatforms.filter(p => p !== platformId));
    } else {
      onPlatformChange([...selectedPlatforms, platformId]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Plateformes</label>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => handlePlatformToggle(platform.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              platform.bgClass,
              platform.textClass,
              selectedPlatforms.includes(platform.id) 
                ? "ring-2 ring-offset-2 ring-primary" 
                : "opacity-70 hover:opacity-100"
            )}
          >
            {platform.name}
          </button>
        ))}
      </div>
    </div>
  );
});

// Sous-composant mémorisé pour la section d'aperçu
// Optimise les performances de l'aperçu qui se re-rend souvent
const PreviewSection = memo<{
  selectedPlatforms: string[];
  activePreview: string;
  onPreviewChange: (platform: string) => void;
  content: string;
  selectedImages: string[];
  generatedCaptions: any;
}>(({ selectedPlatforms, activePreview, onPreviewChange, content, selectedImages, generatedCaptions }) => {

  const renderPreview = () => {
    const currentCaption = generatedCaptions?.[activePreview as keyof typeof generatedCaptions];
    const displayContent = currentCaption || content || 'Votre contenu apparaîtra ici...';
    const profilePicture = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face';
    
    const previewProps = {
      content: displayContent,
      image: selectedImages[0] || '',
      author: 'Postelma',
      profilePicture,
      timestamp: '2h'
    };

    switch (activePreview) {
      case 'facebook':
        return <FacebookPreview {...previewProps} />;
      case 'twitter':
        return <TwitterPreview {...previewProps} />;
      case 'instagram':
        return <InstagramPreview {...previewProps} />;
      case 'linkedin':
        return <LinkedInPreview {...previewProps} />;
      case 'tiktok':
        return <TikTokPreview {...previewProps} />;
      case 'youtube':
        return <YouTubePreview {...previewProps} />;
      default:
        return <InstagramPreview {...previewProps} />;
    }
  };

  return (
    <div className="w-1/2 bg-gray-50 p-6 border-l">
      <h3 className="text-lg font-semibold mb-4">Aperçu</h3>
      
      {/* Platform Tabs */}
      {selectedPlatforms.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2">
            {PLATFORMS
              .filter(p => selectedPlatforms.includes(p.id))
              .map((platform) => (
                <Button
                  key={platform.id}
                  variant={activePreview === platform.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPreviewChange(platform.id)}
                  className={cn(
                    "text-xs flex-1 relative"
                  )}
                >
                  {platform.name}
                  {generatedCaptions?.[platform.id as keyof typeof generatedCaptions] && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </Button>
              ))}
          </div>
        </div>
      )}

      {/* Preview Content */}
      {selectedPlatforms.length > 0 ? (
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          <div className="scale-[0.9] origin-top-left">
            {renderPreview()}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>Sélectionnez au moins une plateforme pour voir l'aperçu</p>
        </div>
      )}
    </div>
  );
});

const PostCreationModal: React.FC<PostCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDay, 
  initialData, 
  isEditing = false 
}) => {
  const { hasPermission, currentUser } = useAuth();
  const [content, setContent] = useState(initialData?.content || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialData?.platforms || ['instagram']);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(initialData?.accounts || []);
  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.image || null);
  const [selectedImages, setSelectedImages] = useState<string[]>(
    initialData?.images || (initialData?.image ? [initialData.image] : [])
  );
  const [activePreview, setActivePreview] = useState('instagram');
  const [author, setAuthor] = useState('Postelma');
  const [campaign, setCampaign] = useState(initialData?.campaign || '');
  const [generatedCaptions, setGeneratedCaptions] = useState(initialData?.captions || null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishType, setPublishType] = useState<'now' | 'scheduled'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);

  // Nouveaux états pour la génération IA
  const [mediaSource, setMediaSource] = useState<'upload' | 'ai'>('upload');
  const [aiGenerationType, setAiGenerationType] = useState<'simple' | 'edit' | 'combine' | 'ugc'>('simple');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiSourceImages, setAiSourceImages] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Hooks pour l'analyse des meilleurs moments
  const bestTimeRecommendation = useBestTime(selectedPlatforms[0] as any, []);
  const engagementChartData = useEngagementChart(selectedPlatforms[0] as any, []);

  // Hooks pour les hashtags
  const hashtagSuggestions = useHashtagSuggestions(content, selectedPlatforms[0] as any, []);
  const { hashtagSets } = useHashtagSets();
  
  // États pour les hashtags
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [selectedHashtagSet, setSelectedHashtagSet] = useState<string>('');

  // États pour le tone de voix
  const [selectedTone, setSelectedTone] = useState<string>('automatic');

  // Synchroniser selectedAccounts avec selectedPlatforms pour l'aperçu
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      // Convertir les IDs de comptes en plateformes
      const platforms = selectedAccounts.map(accountId => {
        // Pour l'instant, on utilise directement les IDs comme plateformes
        // Dans une vraie implémentation, on récupérerait la plateforme depuis les données du compte
        return accountId;
      });
      setSelectedPlatforms(platforms);
    } else {
      // Si aucun compte sélectionné, réinitialiser à Instagram par défaut
      setSelectedPlatforms(['instagram']);
    }
  }, [selectedAccounts]);

  // Effet pour charger les données initiales en mode édition
  useEffect(() => {
    if (isEditing && initialData) {
      // Charger l'image si elle existe
      if (initialData.image && !selectedImages.includes(initialData.image)) {
        setSelectedImages([initialData.image]);
      }
      // Charger les images multiples si elles existent
      if (initialData.images && initialData.images.length > 0) {
        setSelectedImages(initialData.images);
      }
    }
  }, [isEditing, initialData, selectedImages]);


  // Callbacks optimisés avec useCallback pour éviter les re-rendus inutiles
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).slice(0, 4 - selectedImages.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
          newImages.push(e.target?.result as string);
          if (newImages.length === Math.min(files.length, 4 - selectedImages.length)) {
            setSelectedImages(prev => [...prev, ...newImages]);
            setSelectedImage(newImages[0] || null);
          }
      };
      reader.readAsDataURL(file);
      });
    }
  }, [selectedImages.length]);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImages.length > 1) {
      setSelectedImage(selectedImages[index === 0 ? 1 : 0] || null);
    } else {
      setSelectedImage(null);
    }
  }, [selectedImages]);

  // Callbacks optimisés pour les plateformes et l'aperçu
  const handlePlatformChange = useCallback((platforms: string[]) => {
    setSelectedPlatforms(platforms);
    // Mettre à jour l'aperçu actif si la plateforme sélectionnée n'est plus disponible
    if (platforms.length > 0 && !platforms.includes(activePreview)) {
      setActivePreview(platforms[0]);
    }
  }, [activePreview]);

  const handlePreviewChange = useCallback((platform: string) => {
    setActivePreview(platform);
  }, []);

  // Fonctions pour les meilleurs moments
  const handleUseBestTime = useCallback((date: Date) => {
    setScheduledDateTime(date);
  }, []);

  const handleUseAlternativeTime = useCallback((date: Date) => {
    setScheduledDateTime(date);
  }, []);

  // Fonctions pour les hashtags
  const handleAddHashtag = useCallback((hashtag: string) => {
    const hashtagWithHash = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    setContent(prev => prev + (prev.endsWith(' ') ? '' : ' ') + hashtagWithHash + ' ');
  }, []);

  const handleUseHashtagSet = useCallback((setId: string) => {
    const selectedSet = hashtagSets.find(set => set.id === setId);
    if (selectedSet) {
      const hashtagsString = selectedSet.hashtags.join(' ');
      setContent(prev => prev + (prev.endsWith(' ') ? '' : ' ') + hashtagsString + ' ');
    }
  }, [hashtagSets]);

  const handleCopyHashtag = useCallback((hashtag: string) => {
    navigator.clipboard.writeText(hashtag);
  }, []);

  // Fonctions pour la génération IA
  const handleAiSourceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const removeAiSourceImage = (index: number) => {
    setAiSourceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiImageGeneration = async () => {
    setIsGeneratingImage(true);
    
    try {
      const currentType = aiGenerationTypes.find(t => t.id === aiGenerationType);
      if (!currentType) return;

      // Validation pour les types qui nécessitent des images
      if (currentType.requiresImages > 0 && aiSourceImages.length < currentType.requiresImages) {
        alert(`Ce type de génération nécessite ${currentType.requiresImages} image(s)`);
        return;
      }

      // Validation pour le prompt (sauf UGC)
      if (aiGenerationType !== 'ugc' && !aiPrompt.trim()) {
        alert('Veuillez saisir un prompt pour la génération');
        return;
      }

      const webhookUrl = AI_WEBHOOKS[aiGenerationType];
      const payload = {
        prompt: aiPrompt,
        images: aiSourceImages,
        type: aiGenerationType
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
          alert('Erreur lors de la génération: ' + (data.message || 'Erreur inconnue'));
        }
      } else {
        alert('Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Erreur génération IA:', error);
      alert('Erreur lors de la génération');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAddGeneratedImage = (imageUrl: string) => {
    setSelectedImages([imageUrl]);
    setSelectedImage(imageUrl);
    setMediaSource('upload'); // Retourner à l'onglet upload
  };

  // Fonction pour calculer le slot temporel
  const calculateTimeSlot = (date: Date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    return hour * 60 + minute; // Convertir en minutes depuis minuit
  };

  // Fonction pour générer les captions
  const generateCaptions = async () => {
    if (!content.trim()) {
      alert('Veuillez saisir du contenu pour votre publication.');
      return;
    }

    setIsGeneratingCaptions(true);
    
    try {
      // Préparer le payload avec le tone de voix
      const payload = {
        prompt: content,
        tone: selectedTone,
        platform: selectedPlatforms[0] || 'instagram',
        context: {
          product: campaign || 'Postelma',
          target: 'audience générale'
        }
      };

      const response = await fetch('https://malick000.app.n8n.cloud/webhook/postelma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedCaptions(result.captions);
      }
    } catch (error) {
      console.error('Erreur génération:', error);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // Fonction pour publier
  const publishPosts = async () => {
    if (!generatedCaptions || selectedAccounts.length === 0) return;
    
    setIsPublishing(true);
    
    try {
      if (publishType === 'now') {
        // Vérifier les permissions pour la publication
        if (hasPermission('canPublish')) {
          // Publication immédiate via N8N
          const publishData = {
            captions: generatedCaptions,
            accounts: selectedAccounts, // Utiliser les comptes sélectionnés
            images: selectedImages,
            type: 'immediate'
          };

          const response = await fetch('https://malick000.app.n8n.cloud/webhook/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(publishData),
          });

          if (response.ok) {
            alert('Publications envoyées avec succès !');
            onClose();
          } else {
            alert('Erreur lors de la publication');
          }
        } else {
          // Soumission pour approbation (Creator)
          const approvalData = {
            captions: generatedCaptions,
            accounts: selectedAccounts, // Utiliser les comptes sélectionnés
            images: selectedImages,
            type: 'approval',
            author: currentUser?.name,
            authorId: currentUser?.id
          };

          // TODO: Envoyer à la queue d'approbation
          console.log('Soumission pour approbation:', approvalData);
          alert('Contenu soumis pour approbation !');
          onClose();
        }
      } else {
        // Publication programmée via N8N avec date
        const publishData = {
          captions: generatedCaptions,
          accounts: selectedAccounts, // Utiliser les comptes sélectionnés
          images: selectedImages,
          type: 'scheduled',
          scheduledDateTime: scheduledDateTime?.toISOString()
        };

        const response = await fetch('https://malick000.app.n8n.cloud/webhook/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(publishData),
        });

        if (response.ok) {
          // Ajout au calendrier local aussi
          const scheduledPost = {
            id: isEditing ? initialData?.id : `post-${Date.now()}`,
            content: generatedCaptions[selectedPlatforms[0]] || content,
            platforms: selectedPlatforms,
            image: selectedImages[0],
            scheduledTime: scheduledDateTime,
            dayColumn: scheduledDateTime ? format(scheduledDateTime, 'EEEE', { locale: fr }).toLowerCase() : selectedDay || 'monday',
            timeSlot: scheduledDateTime ? calculateTimeSlot(scheduledDateTime) : 0,
            status: 'scheduled',
            captions: generatedCaptions
          };

          // Callback pour ajouter au calendrier
          onSave(scheduledPost);
          alert('Post programmé avec succès !');
    onClose();
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
    // Update active preview logic
    if (!selectedPlatforms.includes(platformId)) {
      setActivePreview(platformId);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        
        {/* Left Panel - Form */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Modifier la publication' : 'Créer une nouvelle publication'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Contenu de la publication
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez votre message..."
              className="min-h-24 resize-none"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {content.length}/2200 caractères
            </div>
            
            {/* Tone de voix */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Tone de voix</label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((tone) => {
                    const IconComponent = tone.icon;
                    return (
                      <SelectItem key={tone.id} value={tone.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${tone.color}`} />
                          <span>{tone.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{tone.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            
            {/* Bouton Générer les captions IA */}
            <div className="mt-4">
              <Button
                onClick={generateCaptions}
                disabled={isGeneratingCaptions}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {isGeneratingCaptions ? 'Génération...' : 'Générer les captions IA'}
              </Button>
            </div>
          </div>

          {/* Section Média */}
          <MediaUploadSection 
            mediaSource={mediaSource}
            onMediaSourceChange={setMediaSource}
            selectedImages={selectedImages}
            onImagesChange={setSelectedImages}
            aiGenerationType={aiGenerationType}
            onAiGenerationTypeChange={setAiGenerationType}
            aiPrompt={aiPrompt}
            onAiPromptChange={setAiPrompt}
            aiSourceImages={aiSourceImages}
            onAiSourceImagesChange={setAiSourceImages}
            generatedImages={generatedImages}
            isGeneratingImage={isGeneratingImage}
            onGenerateImage={handleAiImageGeneration}
            onUseGeneratedImage={handleAddGeneratedImage}
          />

          {/* Comptes connectés - Nouveau sélecteur */}
          <div className="mb-6">
            <ConnectedAccountsSelector 
              selectedAccounts={selectedAccounts}
              onAccountsChange={setSelectedAccounts}
            />
          </div>

          {/* Section Meilleurs moments */}
          {selectedAccounts.length > 0 && (
            <BestTimeSection 
              bestTimeRecommendation={bestTimeRecommendation}
              engagementChartData={engagementChartData}
              onUseBestTime={handleUseBestTime}
              onUseAlternativeTime={handleUseAlternativeTime}
              selectedPlatforms={selectedPlatforms}
            />
          )}

          {/* Section Hashtags */}
          {selectedPlatforms.length > 0 && (
            <HashtagSection 
              hashtagSuggestions={hashtagSuggestions}
              hashtagSets={hashtagSets}
              selectedHashtagSet={selectedHashtagSet}
              onHashtagSetChange={setSelectedHashtagSet}
              onAddHashtag={handleAddHashtag}
              onUseHashtagSet={handleUseHashtagSet}
            />
          )}

          {/* Section Options de publication */}
          <PublishOptionsSection 
            publishType={publishType}
            onPublishTypeChange={setPublishType}
            scheduledDateTime={scheduledDateTime}
            onScheduledDateTimeChange={setScheduledDateTime}
            campaign={campaign}
            onCampaignChange={setCampaign}
            generatedCaptions={generatedCaptions}
            onRegenerateCaptions={() => setGeneratedCaptions(null)}
            onPublish={publishPosts}
            isPublishing={isPublishing}
            hasPublishPermission={hasPermission('canPublish')}
            selectedAccountsCount={selectedAccounts.length}
          />
        </div>

        {/* Right Panel - Preview - Composant mémorisé */}
        <PreviewSection 
          selectedPlatforms={selectedPlatforms}
          activePreview={activePreview}
          onPreviewChange={handlePreviewChange}
          content={content}
          selectedImages={selectedImages}
          generatedCaptions={generatedCaptions}
        />
      </div>
    </div>
  );
};

export default PostCreationModal;