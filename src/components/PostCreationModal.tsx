import React, { useState, useEffect, memo, useCallback } from 'react';
import { X, Sparkles, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useQuotas } from '@/hooks/useQuotas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FacebookPreview, TwitterPreview, InstagramPreview, LinkedInPreview, TikTokPreview, YouTubePreview } from './PreviewModal';
import { useBestTime, useEngagementChart } from '@/hooks/useBestTime';
import { useHashtagSuggestions, useHashtagSets } from '@/hooks/useHashtagStats';
import { usePostPublishing, calculateTimeSlot } from '@/hooks/usePostPublishing';
import ConnectedAccountsSelector from './ConnectedAccountsSelector';
import { PLATFORMS } from '@/config/platforms';
import { TONE_OPTIONS } from '@/data/toneOptions';
import { WEBHOOK_URLS, callWebhook, CaptionsWebhookPayload, AiEditCombineWebhookPayload, AiUgcWebhookPayload, AiImageGenerationResponse, checkImageLoad, testWebhookConnectivity } from '@/config/webhooks';
import { toast } from 'sonner';
import MediaUploadSection from './post-creation/MediaUploadSection';
import BestTimeSection from './post-creation/BestTimeSection';
import HashtagSection from './post-creation/HashtagSection';
import PublishOptionsSection from './post-creation/PublishOptionsSection';
import VoiceRecorderButton from './VoiceRecorderButton';
import { CreatePersonalToneModal } from './CreatePersonalToneModal';
import { usePersonalTones } from '@/hooks/usePersonalTones';
import { supabase } from '@/integrations/supabase/client';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (postData: any) => void;
  selectedDay?: string;
  initialData?: any;
  isEditing?: boolean;
}

interface PreviewSectionProps {
  selectedPlatforms: string[];
  activePreview: string;
  onPreviewChange: (platform: string) => void;
  content: string;
  selectedImages: string[];
  selectedVideo: string | null;
  generatedCaptions: Record<string, string> | null;
  firstComments: Record<string, string>;
  onFirstCommentChange: (platform: string, comment: string) => void;
}

const PreviewSection = memo<PreviewSectionProps>(({ 
  selectedPlatforms, 
  activePreview, 
  onPreviewChange, 
  content, 
  selectedImages,
  selectedVideo,
  generatedCaptions,
  firstComments,
  onFirstCommentChange
}) => {
  const { currentUser } = useAuth();
  const [profileName, setProfileName] = useState(currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Utilisateur');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  // Charger les données du profil
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      const { data } = await supabase
        .from('profiles')
        .select('name, avatar')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        // Priorité : nom du profil > nom du user metadata > email
        const userName = data.name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Utilisateur';
        setProfileName(userName);
        setProfileAvatar(data.avatar);
      } else {
        // Fallback si pas de profil trouvé
        const userName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Utilisateur';
        setProfileName(userName);
      }
    };

    loadProfile();
  }, [currentUser]);

  const renderPreview = () => {
    const currentCaption = generatedCaptions?.[activePreview as keyof typeof generatedCaptions];
    const displayContent = currentCaption || content || 'Votre contenu apparaîtra ici...';
    // Utiliser l'avatar de l'utilisateur ou un avatar par défaut
    const profilePicture = profileAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profileName}`;
    
    const previewProps = {
      content: displayContent,
      image: selectedVideo || (selectedImages.length > 0 ? selectedImages : ''),
      author: profileName,
      profilePicture,
      timestamp: '2h',
      isVideo: !!selectedVideo
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
                  className="text-xs flex-1 relative"
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

      {selectedPlatforms.length > 0 ? (
        <div className="h-[calc(100vh-250px)] overflow-y-auto">
          <div className="scale-[0.9] origin-top-left">
            {renderPreview()}
          </div>
          
          {/* Section Premier Commentaire */}
          <div className="mt-4 p-3 bg-white border rounded-lg">
            <label className="block text-sm font-medium mb-2">
              💬 Premier commentaire ({PLATFORMS.find(p => p.id === activePreview)?.name || activePreview})
            </label>
            <Textarea
              value={firstComments[activePreview] || ''}
              onChange={(e) => onFirstCommentChange(activePreview, e.target.value)}
              placeholder="Ajoutez un premier commentaire pour ce réseau (optionnel)..."
              className="min-h-16 resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ce commentaire sera automatiquement publié en réponse à votre post
            </p>
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
  const { quotas, canUseQuota, getQuotaErrorMessage, refetch: refetchQuotas } = useQuotas();
  const [content, setContent] = useState(initialData?.content || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialData?.platforms || ['instagram']);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    initialData?.accounts || initialData?.platforms || []
  );
  const [selectedImages, setSelectedImages] = useState<string[]>(
    initialData?.images || (initialData?.image ? [initialData.image] : [])
  );
  const [selectedVideo, setSelectedVideo] = useState<string | null>(initialData?.video || null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(initialData?.video_thumbnail || null);
  const [activePreview, setActivePreview] = useState('instagram');
  const [campaign, setCampaign] = useState(initialData?.campaign || '');
  const [publishType, setPublishType] = useState<'now' | 'scheduled'>(
    isEditing && initialData?.scheduledTime ? 'scheduled' : 'now'
  );
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(
    isEditing && initialData?.scheduledTime 
      ? new Date(initialData.scheduledTime)
      : null
  );
  const [tone, setTone] = useState<string>('automatic');
  const [selectedHashtagSet, setSelectedHashtagSet] = useState<string>('');
  const [isCreateToneOpen, setIsCreateToneOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('mode-beaute');
  
  // Extract hashtags from content for tracking
  const selectedHashtags = content.match(/#\w+/g) || [];

  // Personal tones hook
  const { personalTones } = usePersonalTones();
  
  // État pour stocker les infos des comptes sélectionnés (pour la publication Meta)
  const [selectedAccountsInfo, setSelectedAccountsInfo] = useState<{ accountId: string; platform: string }[]>([]);

  // États pour la génération IA
  const [mediaSource, setMediaSource] = useState<'upload' | 'ai'>('upload');
  const [aiGenerationType, setAiGenerationType] = useState<'simple' | 'edit'>('simple');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiSourceImages, setAiSourceImages] = useState<string[]>([]);

  // États pour la génération vidéo
  const [videoMode, setVideoMode] = useState<'image-to-video' | 'text-to-video' | null>(null);
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [textVideoPrompt, setTextVideoPrompt] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<string>('5');
  const [textVideoDuration, setTextVideoDuration] = useState<string>('5');
  const [videoStyle, setVideoStyle] = useState<string>('realistic');
  const [videoImage, setVideoImage] = useState<File | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  // État pour les premiers commentaires par plateforme
  const [firstComments, setFirstComments] = useState<Record<string, string>>({});

  // Récupérer les images depuis localStorage au montage du composant
  useEffect(() => {
    const savedImages = localStorage.getItem('studioGeneratedImages');
    if (savedImages && !initialData) {
      try {
        const images = JSON.parse(savedImages);
        if (Array.isArray(images) && images.length > 0) {
          setSelectedImages(images);
          localStorage.removeItem('studioGeneratedImages');
          toast.success(`${images.length} image(s) du studio importée(s) automatiquement`);
        }
      } catch (error) {
        console.error('Erreur lors du parsing des images:', error);
      }
    }
  }, [initialData]);
  

  // Hooks pour l'analyse
  const bestTimeRecommendation = useBestTime(selectedPlatforms[0] as any, []);
  const engagementChartData = useEngagementChart(selectedPlatforms[0] as any, []);
  const hashtagSuggestions = useHashtagSuggestions(content, selectedPlatforms[0] as any, []);
  const { hashtagSets } = useHashtagSets();
  const { isPublishing, publishToMultipleAccounts } = usePostPublishing();

  // États pour la génération d'images (désactivé - utiliser n8n)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // États pour les captions (désactivé - utiliser n8n)
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<any>(null);
  
  // État local pour la publication
  const [isPublishingLocal, setIsPublishingLocal] = useState(false);

  // Synchroniser les plateformes sélectionnées avec les comptes (Upload-Post)
  useEffect(() => {
    if (selectedAccounts.length === 0) {
      setSelectedAccountsInfo([]);
      setSelectedPlatforms(['instagram']);
      return;
    }

    // Les selectedAccounts sont maintenant des IDs de plateforme (instagram, facebook, etc.)
    setSelectedAccountsInfo(selectedAccounts.map(platformId => ({ 
      accountId: platformId, 
      platform: platformId 
    })));
    setSelectedPlatforms(selectedAccounts);
  }, [selectedAccounts]);

  // Charger la vidéo lors de l'édition
  useEffect(() => {
    if (isEditing && initialData?.video) {
      setGeneratedVideoUrl(initialData.video);
    }
  }, [isEditing, initialData?.video]);

  // Callbacks
  const handlePreviewChange = useCallback((platform: string) => {
    setActivePreview(platform);
  }, []);

  const handleUseBestTime = useCallback((date: Date) => {
    setScheduledDateTime(date);
  }, []);

  const handleUseAlternativeTime = useCallback((date: Date) => {
    setScheduledDateTime(date);
  }, []);

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

  const handleAiImageGeneration = useCallback(async () => {
    // Vérifier les quotas AVANT d'appeler l'Edge Function
    if (!canUseQuota('ai_images')) {
      toast.error(getQuotaErrorMessage('ai_images'), {
        description: 'Consultez vos quotas dans la sidebar.',
        duration: 6000,
      });
      return;
    }

    if (aiGenerationType === 'edit') {
      // Utiliser le webhook N8N pour l'édition et la combinaison
      if (!aiPrompt.trim()) {
        toast.error('Veuillez saisir un prompt pour la génération');
        return;
      }

      if (aiSourceImages.length === 0) {
        toast.error('Veuillez ajouter des images sources');
        return;
      }

      // Empêcher les appels multiples
      if (isGeneratingImage) {
        return;
      }

      setIsGeneratingImage(true);
      try {
        const { supabase } = await import('@/integrations/supabase/client');


        const { data, error } = await supabase.functions.invoke('fal-image-generation', {
          body: {
            prompt: aiPrompt,
            type: 'edit',
            image_urls: aiSourceImages
          }
        });

        if (error) {
          console.error('Erreur edge function:', error);
          // Vérifier si c'est une erreur 429 (quota dépassé)
          if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            toast.error('Quota d\'images IA dépassé', {
              description: 'Vous avez atteint votre limite mensuelle. Consultez vos quotas dans la sidebar.',
              duration: 6000,
            });
            await refetchQuotas(); // Rafraîchir les quotas
            return;
          }
          throw error;
        }


        if (data && data.success && data.imageUrl) {
          setGeneratedImages([data.imageUrl]);
          toast.success('Image générée avec succès !');
          await refetchQuotas(); // Rafraîchir les quotas après succès
        } else {
          console.error('Réponse invalide de FAL.ai:', data);
          toast.error(data?.error || 'Échec de la génération d\'image');
        }
      } catch (error: any) {
        console.error('Erreur génération IA:', error);
        if (error.message?.includes('Quota exceeded')) {
          toast.error('Quota d\'images IA dépassé', {
            description: 'Vous avez atteint votre limite mensuelle.',
            duration: 6000,
          });
          await refetchQuotas();
        } else {
          toast.error('Erreur lors de la génération d\'images');
        }
      } finally {
        setIsGeneratingImage(false);
      }
    } else if (aiGenerationType === 'simple') {
      // Génération simple avec FAL.ai
      if (!aiPrompt.trim()) {
        toast.error('Veuillez saisir un prompt pour la génération');
        return;
      }

      if (isGeneratingImage) {
        
        return;
      }

      setIsGeneratingImage(true);
      try {
        

        const { data, error } = await supabase.functions.invoke('fal-image-generation', {
          body: {
            prompt: aiPrompt,
            type: 'simple'
          }
        });

        if (error) {
          console.error('Erreur edge function:', error);
          // Vérifier si c'est une erreur 429 (quota dépassé)
          if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            toast.error('Quota d\'images IA dépassé', {
              description: 'Vous avez atteint votre limite mensuelle. Consultez vos quotas dans la sidebar.',
              duration: 6000,
            });
            await refetchQuotas(); // Rafraîchir les quotas
            return;
          }
          throw error;
        }

        

        if (data && data.success && data.imageUrl) {
          setGeneratedImages([data.imageUrl]);
          toast.success('Image générée avec succès !');
          await refetchQuotas(); // Rafraîchir les quotas après succès
        } else {
          console.error('Réponse invalide de FAL.ai:', data);
          
          // Vérifier si c'est une erreur de quota dans la réponse
          const dataError = data?.error || '';
          if (dataError.includes('Quota') || dataError.includes('quota') || dataError.includes('exceeded')) {
            toast.error('❌ Quota de génération épuisé. Veuillez réessayer plus tard.');
          } else {
            toast.error(dataError || 'Échec de la génération');
          }
        }
      } catch (error: any) {
        console.error('Erreur génération simple IA:', error);
        if (error.message?.includes('Quota exceeded')) {
          toast.error('Quota d\'images IA dépassé', {
            description: 'Vous avez atteint votre limite mensuelle.',
            duration: 6000,
          });
          await refetchQuotas();
        } else {
          toast.error('Erreur lors de la génération d\'image');
        }
      } finally {
        setIsGeneratingImage(false);
      }
    }
  }, [aiGenerationType, aiPrompt, aiSourceImages, canUseQuota, getQuotaErrorMessage, refetchQuotas]);

  const handleAddGeneratedImage = useCallback((imageUrl: string) => {
    setSelectedImages([imageUrl]);
    setMediaSource('upload');
  }, []);

  // Fonctions pour la génération vidéo
  const handleGenerateVideo = useCallback(async (videoUrl?: string) => {
    if (videoUrl) {
      // Si une URL de vidéo est fournie, arrêter le chargement et sauvegarder
      setGeneratedVideoUrl(videoUrl);
      setIsGeneratingVideo(false);
      
    } else {
      // Activer le chargement
      setIsGeneratingVideo(true);
      
    }
  }, []);

  // Fonction pour arrêter le chargement vidéo et mettre à jour l'URL
  const handleStopVideoGeneration = useCallback((videoUrl?: string) => {
    setIsGeneratingVideo(false);
    if (videoUrl) {
      setGeneratedVideoUrl(videoUrl);
    }
  }, []);

  // Fonction pour gérer la fin de la génération vidéo
  const handleVideoGenerationComplete = useCallback(() => {
    setIsGeneratingVideo(false);
  }, []);

  // Fonction pour utiliser la vidéo générée
  const handleUseGeneratedVideo = useCallback((videoUrl: string) => {
    setGeneratedVideoUrl(videoUrl);
    setIsGeneratingVideo(false);
    setMediaSource('upload');
    toast.success('Vidéo ajoutée au post !');
  }, []);

  const generateCaptions = useCallback(async () => {
    if (!content.trim()) {
      toast.error('Veuillez saisir du contenu avant de générer les captions');
      return;
    }

    setIsGeneratingCaptions(true);
    
    try {
      const payload: CaptionsWebhookPayload = {
        content: content,
        platform: selectedPlatforms.join(','),
        tone: tone,
        language: 'fr'
      };

      const response = await callWebhook(WEBHOOK_URLS.CAPTIONS, payload);
      
      if (response && response.captions) {
        setGeneratedCaptions(response.captions);
        toast.success('Captions générées avec succès !');
      } else {
        toast.error('Erreur lors de la génération des captions');
      }
    } catch (error) {
      console.error('Erreur génération captions:', error);
      toast.error('Erreur lors de la génération des captions');
    } finally {
      setIsGeneratingCaptions(false);
    }
  }, [content, selectedPlatforms, tone]);

  const clearCaptions = useCallback(() => {
    setGeneratedCaptions(null);
  }, []);

  const publishPosts = useCallback(async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Veuillez sélectionner au moins un compte');
      return;
    }

    if (!currentUser?.id) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    // Vérifier si Instagram est sélectionné sans image
    const hasInstagram = selectedAccountsInfo.some(a => a.platform === 'instagram');
    if (hasInstagram && selectedImages.length === 0) {
      toast.error('Instagram nécessite au moins une image pour publier');
      return;
    }

    setIsPublishingLocal(true);

    // Le message à publier
    const message = generatedCaptions?.[selectedPlatforms[0]] || content;

    try {
      // Publier via l'API Upload-Post avec premiers commentaires
      const { results } = await publishToMultipleAccounts(
        selectedAccountsInfo,
        message,
        selectedImages,
        generatedVideoUrl || undefined,
        firstComments
      );

      // Vérifier les résultats
      const successCount = results.filter(r => r.success).length;
      const failedResults = results.filter(r => !r.success);

      if (successCount > 0) {
        toast.success(`Publication réussie sur ${successCount} compte(s) !`);
      }

      if (failedResults.length > 0) {
        failedResults.forEach(r => {
          toast.error(`Erreur ${r.platform}: ${r.error}`);
        });
      }

      if (successCount === 0) {
        return;
      }

      // Créer les captions finales
      const finalCaptions = generatedCaptions ||
        selectedPlatforms.reduce((acc, platform) => {
          acc[platform] = content;
          return acc;
        }, {} as Record<string, string>);

      // Mode création - sauvegarder le post
      const now = new Date();
      const publishedPost = {
        id: `post-${Date.now()}`,
        content: message,
        platforms: selectedPlatforms,
        accounts: selectedAccounts,
        images: selectedImages,
        video: generatedVideoUrl || undefined,
        videoThumbnail: generatedVideoUrl || undefined,
        scheduledTime: now,
        dayColumn: format(now, 'EEEE', { locale: fr }).toLowerCase(),
        timeSlot: calculateTimeSlot(now),
        status: 'published' as const,
        captions: finalCaptions,
        author: currentUser?.user_metadata?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Utilisateur',
        campaign,
        campaignColor: initialData?.campaignColor,
        published_at: now.toISOString()
      };

      onSave(publishedPost);
      onClose();
    } catch (error) {
      console.error('Erreur publication:', error);
      toast.error('Erreur lors de la publication');
    } finally {
      setIsPublishingLocal(false);
    }
  }, [
    generatedCaptions, 
    selectedAccounts,
    selectedAccountsInfo,
    publishToMultipleAccounts, 
    selectedImages, 
    onClose, 
    currentUser, 
    selectedPlatforms, 
    content, 
    onSave,
    campaign,
    generatedVideoUrl,
    initialData,
    firstComments
  ]);

  if (!isOpen) return null;

  return (
    <>
      <CreatePersonalToneModal 
        open={isCreateToneOpen}
        onOpenChange={setIsCreateToneOpen}
      />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
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
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez votre message..."
                className="min-h-24 resize-none pr-10"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute bottom-2 right-2">
                      <VoiceRecorderButton 
                        onTranscription={(text) => setContent(prev => prev + (prev ? ' ' : '') + text)}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dicter votre message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {content.length}/2200 caractères
            </div>
            
            {/* Tone de voix */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Tone de voix</label>
              <Select value={tone} onValueChange={(value) => {
                if (value === 'create-personal') {
                  setIsCreateToneOpen(true);
                } else {
                  setTone(value);
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((toneOption) => {
                    const IconComponent = toneOption.icon;
                    return (
                      <SelectItem key={toneOption.id} value={toneOption.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${toneOption.color}`} />
                          <span>{toneOption.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{toneOption.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                  
                  {personalTones.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      {personalTones.map((personalTone) => (
                        <SelectItem key={personalTone.id} value={personalTone.id}>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-gradient bg-gradient-to-r from-primary to-purple-600" />
                            <span>{personalTone.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">Ton personnel</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  <Separator className="my-2" />
                  <SelectItem value="create-personal">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4" />
                      <span>➕ Créer mon ton personnel</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Bouton Adapter aux réseaux */}
            <div className="mt-4">
              <Button
                onClick={generateCaptions}
                disabled={isGeneratingCaptions}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {isGeneratingCaptions ? 'Adaptation...' : 'Adapter aux réseaux'}
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
            // Nouveaux props pour la génération vidéo
            videoMode={videoMode}
            onVideoModeChange={setVideoMode}
            videoPrompt={videoPrompt}
            onVideoPromptChange={setVideoPrompt}
            textVideoPrompt={textVideoPrompt}
            onTextVideoPromptChange={setTextVideoPrompt}
            videoDuration={videoDuration}
            onVideoDurationChange={setVideoDuration}
            textVideoDuration={textVideoDuration}
            onTextVideoDurationChange={setTextVideoDuration}
            videoStyle={videoStyle}
            onVideoStyleChange={setVideoStyle}
            videoImage={videoImage}
            onVideoImageChange={setVideoImage}
            isGeneratingVideo={isGeneratingVideo}
            onGenerateVideo={handleGenerateVideo}
            generatedVideoUrl={generatedVideoUrl}
            onUseGeneratedVideo={handleUseGeneratedVideo}
          />

          {/* Comptes connectés */}
          <div className="mb-6">
            <ConnectedAccountsSelector 
              selectedAccounts={selectedAccounts}
              onAccountsChange={setSelectedAccounts}
              mediaFile={videoImage}
              videoUrl={generatedVideoUrl}
            />
          </div>

          {/* Section Hashtags */}
          {selectedPlatforms.length > 0 && (
            <HashtagSection 
              selectedDomain={selectedDomain}
              onDomainChange={setSelectedDomain}
              onAddHashtag={handleAddHashtag}
              selectedHashtags={selectedHashtags}
            />
          )}

          {/* Section Meilleurs moments */}
          {selectedAccounts.length > 0 && (
            <BestTimeSection 
              onUseBestTime={handleUseBestTime}
              selectedPlatforms={selectedPlatforms}
              selectedDomain={selectedDomain}
            />
          )}

          {/* Section Options de publication */}
          <PublishOptionsSection
            publishType={publishType}
            onPublishTypeChange={setPublishType}
            scheduledDateTime={scheduledDateTime}
            onScheduledDateTimeChange={setScheduledDateTime}
            generatedCaptions={generatedCaptions}
            onRegenerateCaptions={clearCaptions}
            onPublish={publishPosts}
            isPublishing={isPublishingLocal}
            hasPublishPermission={true}
            selectedAccountsCount={selectedAccounts.length}
            isEditing={isEditing}
          />
        </div>

        <PreviewSection 
          selectedPlatforms={selectedPlatforms}
          activePreview={activePreview}
          onPreviewChange={handlePreviewChange}
          content={content}
          selectedImages={selectedImages}
          selectedVideo={generatedVideoUrl}
          generatedCaptions={generatedCaptions}
          firstComments={firstComments}
          onFirstCommentChange={(platform, comment) => setFirstComments(prev => ({ ...prev, [platform]: comment }))}
        />
      </div>
    </div>
    </>
  );
};

export default PostCreationModal;
