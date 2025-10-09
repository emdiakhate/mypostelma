import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  Trash2, 
  Edit3, 
  MoreVertical,
  Play,
  Image as ImageIcon,
  Sparkles,
  Calendar,
  Upload,
  X,
  Wand2,
  Edit,
  Layers,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PostCreationModal from '@/components/PostCreationModal';

// Types
interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title: string;
  createdAt: string;
  source: 'uploaded' | 'ai-generated';
  size?: string;
  dimensions?: string;
}

// Données mockées
const mockArchiveMedia: MediaItem[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop',
    title: 'Assorted Coffee',
    createdAt: '2025-10-02T10:30:00',
    source: 'uploaded',
    size: '2.3 MB',
    dimensions: '1920x1080'
  },
  {
    id: '2',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
    title: 'Making an Espresso',
    createdAt: '2025-10-01T14:20:00',
    source: 'uploaded',
    size: '15.2 MB',
    dimensions: '1920x1080'
  },
  {
    id: '3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
    title: 'Latte Art',
    createdAt: '2025-09-30T09:15:00',
    source: 'ai-generated',
    size: '1.8 MB',
    dimensions: '1024x1024'
  },
  {
    id: '4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop',
    title: 'Coffee Beans',
    createdAt: '2025-09-29T16:45:00',
    source: 'uploaded',
    size: '3.1 MB',
    dimensions: '2048x1536'
  },
  {
    id: '5',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    title: 'Coffee Shop Interior',
    createdAt: '2025-09-28T11:30:00',
    source: 'uploaded',
    size: '22.5 MB',
    dimensions: '1920x1080'
  },
  {
    id: '6',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
    title: 'Coffee Cup',
    createdAt: '2025-09-27T13:20:00',
    source: 'ai-generated',
    size: '2.1 MB',
    dimensions: '1024x1024'
  }
];

// Composant MediaCard
const MediaCard: React.FC<{
  media: MediaItem;
  onUse: (media: MediaItem) => void;
  onPreview: (media: MediaItem) => void;
  onRename: (media: MediaItem) => void;
  onDownload: (media: MediaItem) => void;
  onDelete: (media: MediaItem) => void;
}> = ({ media, onUse, onPreview, onRename, onDownload, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onPreview(media)}
    >
      {/* Image/Video Thumbnail */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {media.type === 'video' ? (
          <div className="relative w-full h-full">
            <img 
              src={media.thumbnail || media.url} 
              alt={media.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 rounded-full p-3">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <img 
            src={media.url} 
            alt={media.title}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs",
              media.type === 'video' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            )}
          >
            {media.type === 'video' ? '▶️' : '📷'}
          </Badge>
        </div>

        {/* Source Badge */}
        <div className="absolute top-2 right-2">
          <Badge 
            variant="secondary"
            className={cn(
              "text-xs",
              media.source === 'ai-generated' 
                ? "bg-purple-100 text-purple-700" 
                : "bg-green-100 text-green-700"
            )}
          >
            {media.source === 'ai-generated' ? '🤖 IA' : '📤 Upload'}
          </Badge>
        </div>

        {/* Hover Overlay */}
        {showActions && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onUse(media);
              }}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              Utiliser
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm truncate mb-1">
          {media.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{format(new Date(media.createdAt), 'dd/MM/yyyy', { locale: fr })}</span>
          <div className="flex items-center gap-1">
            <MoreVertical 
              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                // Menu contextuel
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Page principale ArchivesPage
const ArchivesPage: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>(mockArchiveMedia);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  
  // États pour le modal IA
  const [selectedAiType, setSelectedAiType] = useState<'simple' | 'edit' | 'combine' | 'ugc'>('simple');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSourceImages, setAiSourceImages] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // États pour l'upload de fichiers
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // États pour le modal "Créer un post"
  const [showPostCreationModal, setShowPostCreationModal] = useState(false);
  const [selectedMediaForPost, setSelectedMediaForPost] = useState<MediaItem | null>(null);

  // Fonctions pour l'upload de fichiers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSaveUploadedFiles = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      // Simulation de l'upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Créer de nouveaux éléments média à partir des fichiers uploadés
      const newMediaItems: MediaItem[] = uploadedFiles.map((file, index) => {
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        
        return {
          id: `upload-${Date.now()}-${index}`,
          type: isVideo ? 'video' : 'image',
          url: url,
          thumbnail: isVideo ? url : undefined,
          title: file.name.replace(/\.[^/.]+$/, ""), // Retirer l'extension
          createdAt: new Date().toISOString(),
          source: 'uploaded',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          dimensions: isVideo ? '1920x1080' : '1920x1080' // Dimensions par défaut
        };
      });
      
      // Ajouter les nouveaux éléments à la liste
      setMedia(prev => [...newMediaItems, ...prev]);
      
      // Réinitialiser l'upload
      setUploadedFiles([]);
      setShowUploadModal(false);
      
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };


  // Fonction pour fermer le modal de création de post
  const handleClosePostCreation = () => {
    setShowPostCreationModal(false);
    setSelectedMediaForPost(null);
  };

  // Fonction pour sauvegarder un post (simulation)
  const handleSavePost = (postData: any) => {
    console.log('Post sauvegardé:', postData);
    // Ici, vous pouvez ajouter la logique pour sauvegarder le post
    handleClosePostCreation();
  };

  // Fonctions pour le modal IA
  const handleAiGenerationTypeChange = (type: 'simple' | 'edit' | 'combine' | 'ugc') => {
    setSelectedAiType(type);
    setAiSourceImages([]);
    setGeneratedImages([]);
  };

  const handleAiSourceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setAiSourceImages(prev => [...prev, ...newImages]);
    }
  };

  const handleAiImageGeneration = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingImage(true);
    try {
      // Simulation de génération d'image
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ajouter une image générée simulée
      const newImage = `https://images.unsplash.com/photo-${Date.now()}?w=400&h=400&fit=crop`;
      setGeneratedImages(prev => [...prev, newImage]);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAddGeneratedImage = (imageUrl: string) => {
    const newMediaItem: MediaItem = {
      id: `ai-${Date.now()}`,
      type: 'image',
      url: imageUrl,
      title: `Image IA - ${aiPrompt.substring(0, 30)}...`,
      createdAt: new Date().toISOString(),
      source: 'ai-generated',
      size: '2.1 MB',
      dimensions: '1024x1024'
    };
    
    setMedia(prev => [newMediaItem, ...prev]);
    setGeneratedImages([]);
    setAiPrompt('');
    setAiModalOpen(false);
  };

  // Filtrage et tri
  const filteredMedia = useMemo(() => {
    let filtered = media;

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [media, filterType, searchTerm, sortBy]);

  const handleUseMedia = (media: MediaItem) => {
    setSelectedMediaForPost(media);
    setShowPostCreationModal(true);
  };

  const handlePreviewMedia = (media: MediaItem) => {
    console.log('Aperçu média:', media);
  };

  const handleRenameMedia = (media: MediaItem) => {
    const newTitle = prompt('Nouveau nom:', media.title);
    if (newTitle && newTitle.trim()) {
      setMedia(prev => prev.map(item => 
        item.id === media.id ? { ...item, title: newTitle.trim() } : item
      ));
    }
  };

  const handleDownloadMedia = (media: MediaItem) => {
    // Simulation de téléchargement
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.title;
    link.click();
  };

  const handleDeleteMedia = (media: MediaItem) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
      setMedia(prev => prev.filter(item => item.id !== media.id));
    }
  };

  const handleSaveToArchive = (imageUrl: string, title: string) => {
    const newMedia: MediaItem = {
      id: Date.now().toString(),
      type: 'image',
      url: imageUrl,
      title,
      createdAt: new Date().toISOString(),
      source: 'ai-generated',
      size: '2.1 MB',
      dimensions: '1024x1024'
    };
    setMedia(prev => [newMedia, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Archives</h1>
              <p className="text-gray-600 mt-1">
                {filteredMedia.length} média{filteredMedia.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setAiModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Générer avec IA
              </Button>
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="w-4 h-4" />
                Ajouter un média
              </Button>
            </div>
          </div>

          {/* Modal Générer avec IA */}
          <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Générer avec IA
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Types de génération */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={selectedAiType === 'simple' ? 'default' : 'outline'}
                    onClick={() => handleAiGenerationTypeChange('simple')}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Wand2 className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium">Génération simple</div>
                      <div className="text-sm text-gray-500">Créer une image à partir d'un prompt</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={selectedAiType === 'edit' ? 'default' : 'outline'}
                    onClick={() => handleAiGenerationTypeChange('edit')}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Edit className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium">Édition d'image</div>
                      <div className="text-sm text-gray-500">Modifier une image existante</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={selectedAiType === 'combine' ? 'default' : 'outline'}
                    onClick={() => handleAiGenerationTypeChange('combine')}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Layers className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium">Combinaison</div>
                      <div className="text-sm text-gray-500">Combiner deux images</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={selectedAiType === 'ugc' ? 'default' : 'outline'}
                    onClick={() => handleAiGenerationTypeChange('ugc')}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Users className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium">UGC</div>
                      <div className="text-sm text-gray-500">Contenu généré par utilisateur</div>
                    </div>
                  </Button>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prompt</label>
                  <Textarea
                    placeholder="Décrivez l'image que vous voulez générer..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Upload d'images pour édition/combinaison */}
                {(selectedAiType === 'edit' || selectedAiType === 'combine') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Images sources</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleAiSourceImageUpload}
                        className="hidden"
                        id="ai-source-upload"
                      />
                      <label
                        htmlFor="ai-source-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Cliquez pour ajouter des images</span>
                      </label>
                    </div>
                    
                    {/* Aperçu des images uploadées */}
                    {aiSourceImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {aiSourceImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Source ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 w-6 h-6 p-0"
                              onClick={() => setAiSourceImages(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton de génération */}
                <Button
                  onClick={handleAiImageGeneration}
                  disabled={!aiPrompt.trim() || isGeneratingImage}
                  className="w-full"
                >
                  {isGeneratingImage ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Génération en cours...
                    </div>
                  ) : (
                    'Générer une image'
                  )}
                </Button>

                {/* Images générées */}
                {generatedImages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Images générées</label>
                    <div className="grid grid-cols-2 gap-4">
                      {generatedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Générée ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleAddGeneratedImage(image)}
                            >
                              Sauvegarder
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Upload de fichiers */}
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Ajouter un média
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Zone de drop */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900">
                        Glissez-déposez vos fichiers ici
                      </p>
                      <p className="text-sm text-gray-500">
                        ou cliquez pour sélectionner des fichiers
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Formats supportés: JPG, PNG, GIF, MP4, MOV, AVI
                      </p>
                    </div>
                  </label>
                </div>

                {/* Aperçu des fichiers sélectionnés */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      Fichiers sélectionnés ({uploadedFiles.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            {file.type.startsWith('video/') ? (
                              <Play className="w-8 h-8 text-blue-500" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-green-500" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-6 h-6 p-0"
                              onClick={() => removeUploadedFile(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadedFiles([]);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveUploadedFiles}
                    disabled={uploadedFiles.length === 0 || isUploading}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Upload en cours...
                      </div>
                    ) : (
                      `Sauvegarder ${uploadedFiles.length} fichier${uploadedFiles.length > 1 ? 's' : ''}`
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Filtres et recherche */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Filtres type */}
              <div className="flex items-center gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={filterType === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('image')}
                >
                  Photos
                </Button>
                <Button
                  variant={filterType === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('video')}
                >
                  Vidéos
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Tri */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="newest">Date de création: Plus récent au plus ancien</option>
                <option value="oldest">Date de création: Plus ancien au plus récent</option>
              </select>

              {/* Vue */}
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Grille de médias */}
        {filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ImageIcon className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun média trouvé
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Essayez avec d\'autres mots-clés.' : 'Commencez par ajouter des médias.'}
            </p>
          </div>
        ) : (
          <div className={cn(
            "gap-4",
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
              : "space-y-4"
          )}>
            {filteredMedia.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onUse={handleUseMedia}
                onPreview={handlePreviewMedia}
                onRename={handleRenameMedia}
                onDownload={handleDownloadMedia}
                onDelete={handleDeleteMedia}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Créer un post */}
      {showPostCreationModal && selectedMediaForPost && (
        <PostCreationModal
          isOpen={showPostCreationModal}
          onClose={handleClosePostCreation}
          onSave={handleSavePost}
          initialData={{
            content: '',
            platforms: ['instagram'],
            scheduledTime: new Date(),
            image: selectedMediaForPost.url,
            imageFile: null // On peut ajouter la logique pour convertir l'URL en File si nécessaire
          }}
        />
      )}
    </div>
  );
};

export default ArchivesPage;
