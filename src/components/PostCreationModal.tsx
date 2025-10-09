import React, { useState, useEffect, memo, useCallback } from 'react';
import { X, Upload, Image as ImageIcon, Calendar, Clock, TrendingUp, Lightbulb, Hash, Copy, Plus, Briefcase, Smile, Zap, DollarSign, BookOpen, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FacebookPreview, TwitterPreview, InstagramPreview, LinkedInPreview, TikTokPreview, YouTubePreview } from './PreviewModal';
import { useBestTime, useEngagementChart } from '@/hooks/useBestTime';
import { useHashtagSuggestions, useHashtagSets } from '@/hooks/useHashtagStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ConnectedAccountsSelector from './ConnectedAccountsSelector';
import { PLATFORMS, getPlatformConfig } from '@/config/platforms';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (postData: any) => void;
  selectedDay?: string;
  initialData?: any;
  isEditing?: boolean;
}

// Configuration des webhooks IA
const AI_WEBHOOKS = {
  simple: 'https://malick000.app.n8n.cloud/webhook/ai-simple',
  edit: 'https://malick000.app.n8n.cloud/webhook/ai-edit', 
  combine: 'https://malick000.app.n8n.cloud/webhook/ai-combine',
  ugc: 'https://malick000.app.n8n.cloud/webhook/ai-ugc'
};

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

  // Configuration des tones de voix
  const toneOptions = [
    { 
      id: 'professional', 
      label: '💼 Professionnel', 
      description: 'Formel et expert',
      icon: Briefcase,
      color: 'text-blue-600'
    },
    { 
      id: 'casual', 
      label: '😊 Décontracté', 
      description: 'Décontracté et amical',
      icon: Smile,
      color: 'text-green-600'
    },
    { 
      id: 'inspiring', 
      label: '⚡ Inspirant', 
      description: 'Motivant et énergique',
      icon: Zap,
      color: 'text-yellow-600'
    },
    { 
      id: 'sales', 
      label: '💰 Vendeur', 
      description: 'Persuasif et commercial',
      icon: DollarSign,
      color: 'text-red-600'
    },
    { 
      id: 'storytelling', 
      label: '📖 Storytelling', 
      description: 'Narratif et captivant',
      icon: BookOpen,
      color: 'text-purple-600'
    },
    { 
      id: 'automatic', 
      label: '🎭 Automatique', 
      description: 'Laisse l\'IA choisir',
      icon: Sparkles,
      color: 'text-gray-600'
    }
  ];


  // Types pour la génération IA
  const aiGenerationTypes = [
    { id: 'simple', name: 'Génération simple', description: 'Créer une image à partir d\'un prompt', requiresImages: 0 },
    { id: 'edit', name: 'Édition d\'image', description: 'Modifier une image existante', requiresImages: 1 },
    { id: 'combine', name: 'Combinaison', description: 'Combiner deux images', requiresImages: 2 },
    { id: 'ugc', name: 'UGC', description: 'Contenu généré par utilisateur', requiresImages: 1 }
  ];

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
                  {toneOptions.map((tone) => {
                    const IconComponent = tone.icon;
                    return (
                      <SelectItem key={tone.id} value={tone.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${tone.color}`} />
                          <span>{tone.label}</span>
                          <span className="text-xs text-gray-500 ml-auto">{tone.description}</span>
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

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Images (optionnel)
            </label>
            
            {/* Onglets Upload/IA */}
            <div className="flex mb-4 border-b border-gray-200">
              <button
                onClick={() => setMediaSource('upload')}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  mediaSource === 'upload' 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Upload d'images
              </button>
              <button
                onClick={() => setMediaSource('ai')}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  mediaSource === 'ai' 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Générer avec IA
              </button>
            </div>

            {/* Contenu Upload */}
            {mediaSource === 'upload' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {selectedImages.length < 4 && (
                      <div className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center h-24">
                        <span className="text-gray-500 text-xs">+ Ajouter</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Cliquer pour ajouter des images</p>
                    <p className="text-xs text-gray-500">Jusqu'à 4 images</p>
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
                      onClick={() => setAiGenerationType(type.id as any)}
                      className={cn(
                        "p-3 text-left border rounded-lg transition-colors",
                        aiGenerationType === type.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="font-medium text-sm">{type.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{type.description}</div>
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
                    onChange={(e) => setAiPrompt(e.target.value)}
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {(aiGenerationType === 'combine' ? aiSourceImages.length < 2 : aiSourceImages.length < 1) && (
                              <div className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center h-24">
                                <span className="text-gray-500 text-xs">
                                  + Ajouter {aiGenerationType === 'combine' ? 'image' : 'image'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">Cliquez pour sélectionner {aiGenerationType === 'combine' ? '2 images' : '1 image'}</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Bouton de génération */}
                <Button
                  onClick={handleAiImageGeneration}
                  disabled={isGeneratingImage || (aiGenerationType !== 'simple' && aiSourceImages.length === 0)}
                  className="w-full"
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                            onClick={() => handleAddGeneratedImage(image)}
                            className="absolute inset-0 bg-blue-500 bg-opacity-0 hover:bg-opacity-20 text-white flex items-center justify-center text-xs transition-all"
                          >
                            <span className="bg-blue-500 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100">
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

          {/* Comptes connectés - Nouveau sélecteur */}
          <div className="mb-6">
            <ConnectedAccountsSelector 
              selectedAccounts={selectedAccounts}
              onAccountsChange={setSelectedAccounts}
            />
          </div>

          {/* Meilleurs moments - Affiché seulement si un compte est sélectionné */}
          {selectedAccounts.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">💡 Meilleur moment</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Recommandé
                </Badge>
              </div>
              
              <div className="space-y-3">
                {/* Moment recommandé */}
                {bestTimeRecommendation ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {format(bestTimeRecommendation.recommended, 'EEEE dd/MM à HH:mm', { locale: fr })}
                        </p>
                        <p className="text-sm text-gray-600">{bestTimeRecommendation.reason}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleUseBestTime(bestTimeRecommendation.recommended)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Utiliser ce créneau
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Mardi 15/01 à 18:00
                        </p>
                        <p className="text-sm text-gray-600">Moment optimal général pour {selectedPlatforms[0]}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const defaultDate = new Date();
                        defaultDate.setDate(defaultDate.getDate() + 1);
                        defaultDate.setHours(18, 0, 0, 0);
                        handleUseBestTime(defaultDate);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Utiliser ce créneau
                    </Button>
            </div>
                )}
            
                {/* Alternatives */}
                {bestTimeRecommendation ? (
                  bestTimeRecommendation.alternatives.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Ou essayez :</p>
                      <div className="flex gap-2 flex-wrap">
                        {bestTimeRecommendation.alternatives.map((alt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseAlternativeTime(alt)}
                            className="text-xs border-yellow-200 text-yellow-800 hover:bg-yellow-50"
                          >
                            {format(alt, 'EEEE HH:mm', { locale: fr })}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Ou essayez :</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const altDate1 = new Date();
                          altDate1.setDate(altDate1.getDate() + 2);
                          altDate1.setHours(14, 0, 0, 0);
                          handleUseAlternativeTime(altDate1);
                        }}
                        className="text-xs border-yellow-200 text-yellow-800 hover:bg-yellow-50"
                      >
                        Jeudi 14h
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const altDate2 = new Date();
                          altDate2.setDate(altDate2.getDate() + 4);
                          altDate2.setHours(19, 0, 0, 0);
                          handleUseAlternativeTime(altDate2);
                        }}
                        className="text-xs border-yellow-200 text-yellow-800 hover:bg-yellow-50"
                      >
                        Vendredi 19h
                      </Button>
                    </div>
                  </div>
                )}

                {/* Graphique d'engagement */}
                {engagementChartData.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Engagement par heure</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={engagementChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="engagement" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hashtags suggérés - Affiché seulement si une plateforme est sélectionnée */}
          {selectedPlatforms.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">🏷️ Hashtags suggérés</h3>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  IA
                </Badge>
          </div>

              <div className="space-y-4">
                {/* Top 5 hashtags du moment */}
                {hashtagSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Top 5 du moment</p>
                    <div className="flex flex-wrap gap-2">
                      {hashtagSuggestions.slice(0, 5).map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddHashtag(suggestion.hashtag)}
                          className="text-xs border-purple-200 text-purple-800 hover:bg-purple-50"
                        >
                          {suggestion.hashtag}
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {suggestion.expectedEngagement.toFixed(1)}%
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sets de hashtags */}
                {hashtagSets.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Utiliser un set</p>
                    <div className="flex gap-2">
                      <Select value={selectedHashtagSet} onValueChange={setSelectedHashtagSet}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Sélectionner un set" />
                        </SelectTrigger>
                        <SelectContent>
                          {hashtagSets.map((set) => (
                            <SelectItem key={set.id} value={set.id}>
                              {set.name} ({set.hashtags.length} hashtags)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleUseHashtagSet(selectedHashtagSet)}
                        disabled={!selectedHashtagSet}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                )}

                {/* Suggestions intelligentes */}
                {hashtagSuggestions.length > 5 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Plus de suggestions</p>
                    <div className="flex flex-wrap gap-2">
                      {hashtagSuggestions.slice(5, 10).map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddHashtag(suggestion.hashtag)}
                          className="text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          {suggestion.hashtag}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-complétion */}
                <div className="text-xs text-gray-600">
                  💡 Tapez # pour voir l'auto-complétion des hashtags
                </div>
              </div>
            </div>
          )}

          {/* Auteur et Campagne - DÉPLACÉ ICI */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Auteur</label>
              <Input value="Postelma" readOnly className="bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Campagne (optionnel)</label>
              <Input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="Nom de la campagne"
              />
            </div>
          </div>

          {/* Options de publication */}
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium">Options de publication</label>
              
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="publishType"
                    value="now"
                    checked={publishType === 'now'}
                    onChange={(e) => setPublishType('now')}
                    className="w-4 h-4"
                  />
                  <span>Publier immédiatement</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="publishType"
                    value="scheduled"
                    checked={publishType === 'scheduled'}
                    onChange={(e) => setPublishType('scheduled')}
                    className="w-4 h-4"
                  />
                  <span>Programmer la publication</span>
                </label>
              </div>
            </div>

            {/* Section date/heure conditionnelle */}
            {publishType === 'scheduled' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={scheduledDateTime ? format(scheduledDateTime, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      // Préserver l'heure existante ou utiliser l'heure actuelle
                      const currentTime = scheduledDateTime || new Date();
                      newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                      setScheduledDateTime(newDate);
                    }}
                    className="w-full p-2 border rounded"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Heure</label>
                  <input
                    type="time"
                    value={scheduledDateTime ? format(scheduledDateTime, 'HH:mm') : ''}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = scheduledDateTime ? new Date(scheduledDateTime) : new Date();
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setScheduledDateTime(newDate);
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}


            {/* Boutons d'action */}
            <div className="space-y-3">
              {/* Bouton Publier - avec restrictions par rôle */}
              <Button 
                onClick={publishPosts}
                disabled={
                  selectedAccounts.length === 0 || 
                  isPublishing || 
                  (publishType === 'scheduled' && !scheduledDateTime)
                }
                className={cn(
                  "w-full font-semibold py-3",
                  hasPermission('canPublish') 
                    ? (publishType === 'now' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-blue-500 hover:bg-blue-600')
                    : (publishType === 'now' 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-orange-500 hover:bg-orange-600')
                )}
              >
                {isPublishing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {publishType === 'now' ? 'Publication...' : 'Programmation...'}
                  </div>
                ) : (
                  hasPermission('canPublish') 
                    ? (publishType === 'now' ? 'Publier maintenant' : 'Programmer la publication')
                    : (publishType === 'now' ? 'Soumettre pour approbation' : 'Programmer pour approbation')
                )}
            </Button>
              
              {/* Bouton Régénérer les captions - visible seulement si des captions ont été générées */}
              {generatedCaptions && (
            <Button 
                  onClick={() => setGeneratedCaptions(null)}
                  variant="outline"
                  className="w-full"
            >
                  Régénérer les captions
            </Button>
              )}
            </div>
          </div>
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