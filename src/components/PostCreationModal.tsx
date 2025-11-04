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
import { usePostPublishing, calculateTimeSlot } from '@/hooks/usePostPublishing';
import ConnectedAccountsSelector from './ConnectedAccountsSelector';
import { PLATFORMS } from '@/config/platforms';
import { TONE_OPTIONS } from '@/data/toneOptions';
import { WEBHOOK_URLS, callWebhook, CaptionsWebhookPayload, PublishWebhookPayload, AiEditCombineWebhookPayload, AiUgcWebhookPayload, AiImageGenerationResponse, checkImageLoad, testWebhookConnectivity } from '@/config/webhooks';
import { toast } from 'sonner';
import MediaUploadSection from './post-creation/MediaUploadSection';
import BestTimeSection from './post-creation/BestTimeSection';
import HashtagSection from './post-creation/HashtagSection';
import PublishOptionsSection from './post-creation/PublishOptionsSection';
import VoiceRecorderButton from './VoiceRecorderButton';
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
  generatedCaptions: Record<string, string> | null;
}

const PreviewSection = memo<PreviewSectionProps>(({ 
  selectedPlatforms, 
  activePreview, 
  onPreviewChange, 
  content, 
  selectedImages, 
  generatedCaptions 
}) => {
  const { currentUser } = useAuth();
  const [profileName, setProfileName] = useState('Postelma');
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
        setProfileName(data.name);
        setProfileAvatar(data.avatar);
      }
    };

    loadProfile();
  }, [currentUser]);

  const renderPreview = () => {
    const currentCaption = generatedCaptions?.[activePreview as keyof typeof generatedCaptions];
    const displayContent = currentCaption || content || 'Votre contenu apparaîtra ici...';
    const profilePicture = profileAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face';
    
    const previewProps = {
      content: displayContent,
      image: selectedImages.length > 0 ? selectedImages : '',
      author: profileName,
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
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    initialData?.accounts || initialData?.platforms || []
  );
  const [selectedImages, setSelectedImages] = useState<string[]>(
    initialData?.images || (initialData?.image ? [initialData.image] : [])
  );
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

  // États pour la génération IA
  const [mediaSource, setMediaSource] = useState<'upload' | 'ai'>('upload');
  const [aiGenerationType, setAiGenerationType] = useState<'simple' | 'edit' | 'combine' | 'ugc'>('simple');
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
  

  // Hooks pour l'analyse
  const bestTimeRecommendation = useBestTime(selectedPlatforms[0] as any, []);
  const engagementChartData = useEngagementChart(selectedPlatforms[0] as any, []);
  const hashtagSuggestions = useHashtagSuggestions(content, selectedPlatforms[0] as any, []);
  const { hashtagSets } = useHashtagSets();
  const { isPublishing, publishPost } = usePostPublishing();

  // États pour la génération d'images (désactivé - utiliser n8n)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // États pour les captions (désactivé - utiliser n8n)
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<any>(null);
  
  // État local pour la publication
  const [isPublishingLocal, setIsPublishingLocal] = useState(false);

  // Synchroniser selectedAccounts avec selectedPlatforms
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      const platforms = selectedAccounts.map(accountId => accountId);
      setSelectedPlatforms(platforms);
    } else {
      setSelectedPlatforms(['instagram']);
    }
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
    if (aiGenerationType === 'edit' || aiGenerationType === 'combine') {
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
        console.log('Génération déjà en cours, appel ignoré');
        return;
      }
      
      setIsGeneratingImage(true);
      try {
        // Tester la connectivité du webhook avant l'appel
        const isWebhookAccessible = await testWebhookConnectivity(WEBHOOK_URLS.AI_EDIT_COMBINE);
        if (!isWebhookAccessible) {
          toast.error('Le service de génération IA n\'est pas accessible. Veuillez réessayer plus tard.');
          setIsGeneratingImage(false);
          return;
        }
        
        const payload: AiEditCombineWebhookPayload = {
          type: aiGenerationType,
          prompt: aiPrompt,
          sourceImages: aiSourceImages,
          options: {
            style: 'realistic',
            intensity: 0.8,
            quality: 'high'
          }
        };
        
        console.log('AI Generation payload:', payload);
        
        const rawResponse = await callWebhook<AiImageGenerationResponse | AiImageGenerationResponse[]>(WEBHOOK_URLS.AI_EDIT_COMBINE, payload);
        
        console.log('Raw webhook response:', rawResponse);
        console.log('Is array?', Array.isArray(rawResponse));
        
        // Le webhook peut retourner un tableau ou un objet simple
        const response = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;
        
        console.log('Processed response:', response);
        console.log('Response keys:', response ? Object.keys(response) : 'null');
        
        if (response && response.success) {
          console.log('N8N Response received:', response);
          console.log('imageUrl:', response.imageUrl);
          console.log('driveFileId:', response.driveFileId);
          console.log('driveLink:', response.driveLink);
          
          // Prioriser imageUrl (base64) car elle est directement utilisable
          let imageUrl = response.imageUrl;
          
          // Si pas d'imageUrl, essayer avec le Drive link
          if (!imageUrl && response.driveFileId) {
            imageUrl = `https://drive.google.com/uc?export=view&id=${response.driveFileId}`;
            console.log('Using Drive URL:', imageUrl);
          } else if (!imageUrl && response.driveLink) {
            const driveIdMatch = response.driveLink.match(/\/d\/([^/]+)/);
            if (driveIdMatch) {
              imageUrl = `https://drive.google.com/uc?export=view&id=${driveIdMatch[1]}`;
              console.log('Extracted Drive URL:', imageUrl);
            }
          }
          
          if (imageUrl) {
            console.log('Final image URL:', imageUrl.substring(0, 100) + '...');
            
            // Pour les images base64, pas besoin de vérifier le chargement
            if (imageUrl.startsWith('data:image')) {
              setGeneratedImages([imageUrl]);
              toast.success('Image générée avec succès !');
            } else {
              // Pour les URLs externes, vérifier le chargement
              const imageLoads = await checkImageLoad(imageUrl, 3, 2000);
              
              if (imageLoads) {
                setGeneratedImages([imageUrl]);
                toast.success('Image générée avec succès !');
              } else {
                toast.error('L\'image générée n\'est pas encore accessible. Veuillez réessayer dans quelques secondes.');
                console.error('Image failed to load:', imageUrl);
              }
            }
          } else {
            console.error('No valid image URL found in response:', response);
            toast.error('Aucune URL d\'image trouvée dans la réponse');
          }
        } else {
          console.error('Invalid response from N8N:', response);
          toast.error(response?.error || 'Aucune image générée');
        }
      } catch (error) {
        console.error('Erreur génération IA:', error);
        toast.error('Erreur lors de la génération d\'images');
      } finally {
        setIsGeneratingImage(false);
      }
    } else if (aiGenerationType === 'ugc') {
      // Utiliser le webhook N8N pour la génération UGC
      if (!aiPrompt.trim()) {
        toast.error('Veuillez saisir un prompt pour la génération UGC');
        return;
      }
      
      if (aiSourceImages.length === 0) {
        toast.error('Veuillez ajouter des images sources');
        return;
      }
      
      setIsGeneratingImage(true);
      try {
        const payload: AiUgcWebhookPayload = {
          type: 'ugc',
          prompt: aiPrompt,
          sourceImages: aiSourceImages,
          options: {
            style: 'realistic',
            quality: 'high',
            aspectRatio: '1:1'
          }
        };
        
        console.log('AI UGC Generation payload:', payload);
        const response = await callWebhook<AiImageGenerationResponse>(WEBHOOK_URLS.AI_UGC, payload);
        
        if (response && response.success && response.imageUrl) {
          console.log('N8N UGC Response received:', response);
          
          // Vérifier que l'image se charge correctement avec retry
          const imageLoads = await checkImageLoad(response.imageUrl, 3, 2000);
          
          if (imageLoads) {
            // Utiliser l'URL directe de l'image pour l'affichage
            setGeneratedImages([response.imageUrl]);
            toast.success('Image UGC générée avec succès !');
            
            // Log des informations supplémentaires pour debug
            if (response.driveFileId) {
              console.log('Drive File ID:', response.driveFileId);
            }
            if (response.driveLink) {
              console.log('Drive Link:', response.driveLink);
            }
            if (response.thumbnailUrl) {
              console.log('Thumbnail URL:', response.thumbnailUrl);
            }
          } else {
            toast.error('L\'image UGC générée n\'est pas encore accessible. Veuillez réessayer dans quelques secondes.');
            console.error('UGC Image failed to load:', response.imageUrl);
          }
        } else {
          console.error('Invalid UGC response from N8N:', response);
          toast.error(response?.error || 'Aucune image UGC générée');
        }
      } catch (error) {
        console.error('Erreur génération UGC IA:', error);
        toast.error('Erreur lors de la génération d\'image UGC');
      } finally {
        setIsGeneratingImage(false);
      }
    } else {
      // Pour le type simple, garder l'ancien comportement
      toast.info('Génération simple non encore implémentée via webhook');
    }
  }, [aiGenerationType, aiPrompt, aiSourceImages]);

  const handleAddGeneratedImage = useCallback((imageUrl: string) => {
    setSelectedImages([imageUrl]);
    setMediaSource('upload');
  }, []);

  // Fonctions pour la génération vidéo
  const handleGenerateVideo = useCallback(async (videoUrl?: string) => {
    setIsGeneratingVideo(true);
    try {
      // La logique de génération vidéo est gérée dans MediaUploadSection
      // Cette fonction gère seulement l'état de chargement
      console.log('État de chargement vidéo activé');
      
      // Si une URL de vidéo est fournie, la sauvegarder
      if (videoUrl) {
        setGeneratedVideoUrl(videoUrl);
        console.log('URL de la vidéo sauvegardée:', videoUrl);
      }
    } catch (error) {
      console.error('Erreur génération vidéo:', error);
      toast.error('Erreur lors de la génération de la vidéo');
      setIsGeneratingVideo(false);
    }
  }, []);

  // Fonction pour arrêter le chargement vidéo
  const handleStopVideoGeneration = useCallback(() => {
    setIsGeneratingVideo(false);
  }, []);

  // Fonction pour gérer la fin de la génération vidéo
  const handleVideoGenerationComplete = useCallback(() => {
    setIsGeneratingVideo(false);
  }, []);

  // Fonction pour utiliser la vidéo générée
  const handleUseGeneratedVideo = useCallback((videoUrl: string) => {
    setGeneratedVideoUrl(videoUrl);
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
    
    setIsPublishingLocal(true);
    
    // Créer les captions finales (générées ou contenu par défaut)
    const finalCaptions = generatedCaptions || 
      selectedPlatforms.reduce((acc, platform) => {
        acc[platform] = content;
        return acc;
      }, {} as Record<string, string>);
    
    // Vérifier que les captions sont bien formatées
    console.log('Generated captions:', generatedCaptions);
    console.log('Final captions for each platform:', finalCaptions);
    
    try {
      // Appeler le webhook de publication
      const payload: PublishWebhookPayload = {
        content: finalCaptions[selectedPlatforms[0]] || content,
        media: selectedImages,
        video: generatedVideoUrl || undefined,
        platforms: selectedPlatforms,
        accounts: selectedAccounts,
        publishType: publishType,
        scheduledDate: publishType === 'scheduled' && scheduledDateTime ? scheduledDateTime.toISOString() : undefined,
        captions: finalCaptions
      };

      console.log('Webhook payload:', payload);
      console.log('Selected images:', selectedImages);
      console.log('Publish type:', publishType);
      console.log('Final captions:', finalCaptions);
      console.log('Captions being sent to N8N:', payload.captions);

      const webhookUrl = publishType === 'now' ? WEBHOOK_URLS.PUBLISH : WEBHOOK_URLS.SCHEDULE;
      console.log('Webhook URL:', webhookUrl);
      
      const response = await callWebhook(webhookUrl, payload);
      
      if (response && response.success) {
        toast.success(publishType === 'now' ? 'Publication réussie !' : 'Publication programmée !');
      } else {
        toast.error('Erreur lors de la publication');
        return;
      }
      // Si on est en mode édition
      if (isEditing) {
        if (publishType === 'now') {
          // Publier maintenant et mettre à jour le post dans le calendrier
          const publishedPost = {
            ...initialData,
            id: initialData?.id || `post-${Date.now()}`,
            content: finalCaptions[selectedPlatforms[0]] || content,
            platforms: selectedPlatforms,
            accounts: selectedAccounts,
            images: selectedImages,
            video: generatedVideoUrl || undefined,
            videoThumbnail: generatedVideoUrl || undefined,
            status: 'published' as const,
            captions: finalCaptions,
            author: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Utilisateur',
            campaign,
            campaignColor: initialData?.campaignColor
          };

          console.log('Publishing post immediately');
          onSave(publishedPost);
          toast.success('Post publié avec succès !');
          onClose();
          return;
        } else if (scheduledDateTime) {
          // Modifier la programmation
          const scheduledPost = {
            ...initialData,
            id: initialData?.id || `post-${Date.now()}`,
            content: finalCaptions[selectedPlatforms[0]] || content,
            platforms: selectedPlatforms,
            accounts: selectedAccounts,
            images: selectedImages,
            video: generatedVideoUrl || undefined,
            videoThumbnail: generatedVideoUrl || undefined,
            scheduledTime: scheduledDateTime,
            dayColumn: format(scheduledDateTime, 'EEEE', { locale: fr }).toLowerCase(),
            timeSlot: calculateTimeSlot(scheduledDateTime),
            status: 'scheduled' as const,
            captions: finalCaptions,
            author: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Utilisateur',
            campaign,
            campaignColor: initialData?.campaignColor
          };

          console.log('Updating scheduled post');
          onSave(scheduledPost);
          toast.success('Post modifié avec succès !');
          onClose();
          return;
        }
      }

      // Mode création
      if (publishType === 'now') {
        console.log('Immediate post published via webhook');
        toast.success('Publications envoyées avec succès !');
        onClose();
      } else if (scheduledDateTime) {
        console.log('Scheduled post created via webhook');

        const scheduledPost = {
          id: `post-${Date.now()}`,
          content: finalCaptions[selectedPlatforms[0]] || content,
          platforms: selectedPlatforms,
          accounts: selectedAccounts,
          images: selectedImages,
          video: generatedVideoUrl || undefined,
          videoThumbnail: generatedVideoUrl || undefined,
          scheduledTime: scheduledDateTime,
          dayColumn: format(scheduledDateTime, 'EEEE', { locale: fr }).toLowerCase(),
          timeSlot: calculateTimeSlot(scheduledDateTime),
          status: 'scheduled' as const,
          captions: finalCaptions,
          author: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Utilisateur',
          campaign,
          campaignColor: initialData?.campaignColor
        };

        console.log('Saving scheduled post:', scheduledPost);
        console.log('Post images:', scheduledPost.images);
        
        onSave(scheduledPost);
        toast.success('Post programmé avec succès !');
        onClose();
      }
    } catch (error) {
      console.error('Erreur publication:', error);
      toast.error('Erreur lors de la publication');
    } finally {
      setIsPublishingLocal(false);
    }
  }, [
    generatedCaptions, 
    selectedAccounts, 
    publishType, 
    hasPermission, 
    publishPost, 
    selectedImages, 
    onClose, 
    currentUser, 
    scheduledDateTime, 
    isEditing, 
    initialData, 
    selectedPlatforms, 
    content, 
    onSave,
    campaign
  ]);

  if (!isOpen) return null;

  return (
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Contenu de la publication
              </label>
              <VoiceRecorderButton 
                onTranscription={(text) => setContent(prev => prev + (prev ? ' ' : '') + text)}
              />
            </div>
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
              <Select value={tone} onValueChange={setTone}>
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
            </div>
            
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
          generatedCaptions={generatedCaptions}
        />
      </div>
    </div>
  );
};

export default PostCreationModal;
