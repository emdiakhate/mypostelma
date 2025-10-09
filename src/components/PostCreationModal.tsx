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
  const [publishType, setPublishType] = useState<'now' | 'scheduled'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('automatic');
  const [selectedHashtagSet, setSelectedHashtagSet] = useState<string>('');

  // États pour la génération IA
  const [mediaSource, setMediaSource] = useState<'upload' | 'ai'>('upload');
  const [aiGenerationType, setAiGenerationType] = useState<'simple' | 'edit' | 'combine' | 'ugc'>('simple');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiSourceImages, setAiSourceImages] = useState<string[]>([]);

  // Hooks pour l'analyse
  const bestTimeRecommendation = useBestTime(selectedPlatforms[0] as any, []);
  const engagementChartData = useEngagementChart(selectedPlatforms[0] as any, []);
  const hashtagSuggestions = useHashtagSuggestions(content, selectedPlatforms[0] as any, []);
  const { hashtagSets } = useHashtagSets();
  
  // Hooks pour l'IA
  const { 
    isGenerating: isGeneratingImage, 
    generatedImages,
    generateImage 
  } = useAiImageGeneration();

  const {
    isGenerating: isGeneratingCaptions,
    generatedCaptions,
    generateCaptions: generateCaptionsHook,
    clearCaptions
  } = useAiCaptionGeneration();

  const { isPublishing, publishPost } = usePostPublishing();

  // Synchroniser selectedAccounts avec selectedPlatforms
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      const platforms = selectedAccounts.map(accountId => accountId);
      setSelectedPlatforms(platforms);
    } else {
      setSelectedPlatforms(['instagram']);
    }
  }, [selectedAccounts]);

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
    try {
      await generateImage({
        type: aiGenerationType,
        prompt: aiPrompt,
        sourceImages: aiSourceImages
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la génération');
    }
  }, [aiGenerationType, aiPrompt, aiSourceImages, generateImage]);

  const handleAddGeneratedImage = useCallback((imageUrl: string) => {
    setSelectedImages([imageUrl]);
    setMediaSource('upload');
  }, []);

  const generateCaptions = useCallback(async () => {
    try {
      await generateCaptionsHook({
        content,
        tone: selectedTone,
        platform: selectedPlatforms[0] || 'instagram',
        campaign
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la génération');
    }
  }, [content, selectedTone, selectedPlatforms, campaign, generateCaptionsHook]);

  const publishPosts = useCallback(async () => {
    if (!generatedCaptions || selectedAccounts.length === 0) return;
    
    try {
      if (publishType === 'now') {
        if (hasPermission('canPublish')) {
          await publishPost({
            type: 'immediate',
            captions: generatedCaptions,
            accounts: selectedAccounts,
            images: selectedImages
          });
          alert('Publications envoyées avec succès !');
          onClose();
        } else {
          await publishPost({
            type: 'approval',
            captions: generatedCaptions,
            accounts: selectedAccounts,
            images: selectedImages,
            author: currentUser?.user_metadata?.name || currentUser?.email || 'Unknown',
            authorId: currentUser?.id
          });
          alert('Contenu soumis pour approbation !');
          onClose();
        }
      } else if (scheduledDateTime) {
        await publishPost({
          type: 'scheduled',
          captions: generatedCaptions,
          accounts: selectedAccounts,
          images: selectedImages,
          scheduledDateTime
        });

        const scheduledPost = {
          id: isEditing && initialData?.id ? initialData.id : `post-${Date.now()}`,
          content: generatedCaptions[selectedPlatforms[0]] || content,
          platforms: selectedPlatforms,
          image: selectedImages[0],
          scheduledTime: scheduledDateTime,
          dayColumn: format(scheduledDateTime, 'EEEE', { locale: fr }).toLowerCase(),
          timeSlot: calculateTimeSlot(scheduledDateTime),
          status: 'scheduled',
          captions: generatedCaptions,
          author: currentUser?.user_metadata?.name || currentUser?.email || 'Unknown'
        };

        onSave(scheduledPost);
        alert('Post programmé avec succès !');
        onClose();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la publication');
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
    onSave
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
          />

          {/* Comptes connectés */}
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
            onRegenerateCaptions={clearCaptions}
            onPublish={publishPosts}
            isPublishing={isPublishing}
            hasPublishPermission={hasPermission('canPublish')}
            selectedAccountsCount={selectedAccounts.length}
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
