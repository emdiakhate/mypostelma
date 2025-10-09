import React, { memo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageLoader } from '@/hooks/useImageLoader';

// Interface pour les props des composants de prévisualisation
interface PreviewProps {
  content: string;
  image: string;
  author: string;
  profilePicture: string;
  timestamp?: string;
}

// Composant d'image optimisé pour les prévisualisations
// Utilise useImageLoader pour une gestion optimisée des images
const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}> = ({ src, alt, className = "", fallback }) => {
  const { imageUrl, isLoading, error } = useImageLoader(src);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return fallback || (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500 text-sm`}>
        Image non disponible
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      onError={(e) => {
        console.warn('Erreur de chargement de l\'image:', error);
      }}
    />
  );
};

// Comparateur personnalisé pour les composants de prévisualisation
// Optimise les re-rendus en comparant les props essentielles
const arePreviewPropsEqual = (prevProps: PreviewProps, nextProps: PreviewProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.image === nextProps.image &&
    prevProps.author === nextProps.author &&
    prevProps.profilePicture === nextProps.profilePicture &&
    prevProps.timestamp === nextProps.timestamp
  );
};

// Composant FacebookPreview mémorisé
// Évite les re-rendus inutiles lors des changements de contenu
export const FacebookPreview: React.FC<PreviewProps> = memo(({ 
  content, 
  image, 
  author, 
  profilePicture, 
  timestamp = "2h" 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg max-w-md mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <OptimizedImage 
            src={profilePicture} 
            alt={author}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{author}</h3>
              <span className="text-blue-600 text-sm">✓</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>{timestamp}</span>
              <span>•</span>
              <span>🌍</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-900 mb-4 leading-relaxed">{content}</p>
        
        {image && (
          <div className="mb-4">
            <OptimizedImage 
              src={image} 
              alt="Post content"
              className="w-full rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
              <span>👍</span>
              <span className="text-sm">J'aime</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
              <span>💬</span>
              <span className="text-sm">Commenter</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
              <span>📤</span>
              <span className="text-sm">Partager</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, arePreviewPropsEqual);

// Composant TwitterPreview mémorisé
// Optimise les performances pour les aperçus Twitter
export const TwitterPreview: React.FC<PreviewProps> = memo(({ 
  content, 
  image, 
  author, 
  profilePicture, 
  timestamp = "3m" 
}) => {
  return (
    <div className="bg-black text-white rounded-2xl max-w-md mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <img 
          src={profilePicture} 
          alt={author}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white">{author}</h3>
            <span className="text-blue-400 text-sm">✓</span>
            <span className="text-gray-400 text-sm">@{author.toLowerCase().replace(' ', '')}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400 text-sm">{timestamp}</span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-300">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-white leading-relaxed">
          {content.split(' ').map((word, index) => {
            if (word.startsWith('@') || word.startsWith('#')) {
              return <span key={index} className="text-blue-400">{word} </span>;
            }
            return <span key={index}>{word} </span>;
          })}
        </p>
        
        {image && (
          <div className="mt-3">
            <OptimizedImage 
              src={image} 
              alt="Post content"
              className="w-full rounded-2xl"
            />
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              0:06
            </div>
          </div>
        )}
      </div>

      {/* Source */}
      <div className="text-sm text-gray-400 mb-4">
        From Esteban Navarro Soriano
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-gray-400">
        <button className="flex items-center gap-2 hover:text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm">12</span>
        </button>
        <button className="flex items-center gap-2 hover:text-green-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">8</span>
        </button>
        <button className="flex items-center gap-2 hover:text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm">24</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </button>
      </div>
    </div>
  );
}, arePreviewPropsEqual);

// Composant InstagramPreview
// Composant InstagramPreview mémorisé
// Optimise les performances pour les aperçus Instagram
export const InstagramPreview: React.FC<PreviewProps> = memo(({ 
  content, 
  image, 
  author, 
  profilePicture, 
  timestamp = "2h" 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg max-w-sm mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <OptimizedImage 
            src={profilePicture} 
            alt={author}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{author}</h3>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image */}
      {image && (
        <div className="aspect-square">
          <OptimizedImage 
            src={image} 
            alt="Post content"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button className="text-gray-600 hover:text-red-500">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
        
        <div className="text-sm text-gray-900 font-semibold mb-2">
          1,234 mentions J'aime
        </div>
        
        <div className="text-sm text-gray-900">
          <span className="font-semibold">{author}</span> {content}
        </div>
      </div>
    </div>
  );
}, arePreviewPropsEqual);

// Composant LinkedInPreview
// Composant LinkedInPreview mémorisé
// Optimise les performances pour les aperçus LinkedIn
export const LinkedInPreview: React.FC<PreviewProps> = memo(({ 
  content, 
  image, 
  author, 
  profilePicture, 
  timestamp = "2h" 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg max-w-md mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <OptimizedImage 
            src={profilePicture} 
            alt={author}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{author}</h3>
              <span className="text-blue-600 text-sm">✓</span>
            </div>
            <div className="text-sm text-gray-600">Développeur Full Stack</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>{timestamp}</span>
              <span>•</span>
              <span>🌍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-900 mb-4 leading-relaxed">{content}</p>
        
        {image && (
          <div className="mb-4">
            <OptimizedImage 
              src={image} 
              alt="Post content"
              className="w-full rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
              <span>👍</span>
              <span className="text-sm">J'aime</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
              <span>💬</span>
              <span className="text-sm">Commenter</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
              <span>📤</span>
              <span className="text-sm">Partager</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, arePreviewPropsEqual);

// Composant TikTokPreview
// Composant TikTokPreview mémorisé
// Optimise les performances pour les aperçus TikTok
export const TikTokPreview: React.FC<PreviewProps> = memo(({ 
  content, 
  image, 
  author, 
  profilePicture, 
  timestamp = "2h" 
}) => {
  return (
    <div className="bg-black text-white rounded-lg max-w-sm mx-auto aspect-[9/16] relative overflow-hidden">
      {/* Video/Image */}
      {image && (
        <div className="absolute inset-0">
          <OptimizedImage 
            src={image} 
            alt="Post content"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-2 mb-2">
          <OptimizedImage 
            src={profilePicture} 
            alt={author}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-semibold text-white">{author}</span>
          <span className="text-sm text-gray-300">Now</span>
        </div>
        <p className="text-white text-sm leading-relaxed">{content}</p>
      </div>

      {/* Side Actions */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-2xl">❤️</span>
          </div>
          <span className="text-xs text-white">1.2k</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <span className="text-xs text-white">89</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-2xl">➡️</span>
          </div>
          <span className="text-xs text-white">45</span>
        </button>
      </div>
    </div>
  );
}, arePreviewPropsEqual);

// Composant YouTubePreview
// Composant YouTubePreview mémorisé
// Optimise les performances pour les aperçus YouTube
export const YouTubePreview: React.FC<PreviewProps> = memo(({ 
  content, 
  image, 
  author, 
  profilePicture, 
  timestamp = "2h" 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg max-w-md mx-auto">
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-t-lg">
        {image && (
          <OptimizedImage 
            src={image} 
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          0:06
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <OptimizedImage 
            src={profilePicture} 
            alt={author}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">YouTube video post</h3>
            <p className="text-sm text-gray-600 mb-2">{author}</p>
            <p className="text-sm text-gray-900 leading-relaxed">{content}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Public</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">Catégorie</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, arePreviewPropsEqual);

// Interface pour le composant principal PreviewModal
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  image: string;
  author: string;
  profilePicture: string;
  selectedPlatforms: string[];
}

// Comparateur personnalisé pour PreviewModal
// Évite les re-rendus inutiles du modal principal
const areModalPropsEqual = (prevProps: PreviewModalProps, nextProps: PreviewModalProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.content === nextProps.content &&
    prevProps.image === nextProps.image &&
    prevProps.author === nextProps.author &&
    prevProps.profilePicture === nextProps.profilePicture &&
    JSON.stringify(prevProps.selectedPlatforms) === JSON.stringify(nextProps.selectedPlatforms) &&
    prevProps.onClose === nextProps.onClose
  );
};

// Composant principal PreviewModal mémorisé
// Optimise les performances du modal de prévisualisation
const PreviewModal: React.FC<PreviewModalProps> = memo(({ 
  isOpen, 
  onClose, 
  content, 
  image, 
  author, 
  profilePicture, 
  selectedPlatforms 
}) => {
  if (!isOpen) return null;

  const renderPreview = (platform: string) => {
    const props = { content, image, author, profilePicture };
    
    switch (platform) {
      case 'facebook':
        return <FacebookPreview {...props} />;
      case 'twitter':
        return <TwitterPreview {...props} />;
      case 'instagram':
        return <InstagramPreview {...props} />;
      case 'linkedin':
        return <LinkedInPreview {...props} />;
      case 'tiktok':
        return <TikTokPreview {...props} />;
      case 'youtube':
        return <YouTubePreview {...props} />;
      default:
        return <FacebookPreview {...props} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Aperçu avancé (toutes plateformes)</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedPlatforms.map((platform) => (
              <div key={platform} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 capitalize">
                  {platform === 'twitter' ? 'X (Twitter)' : platform}
                </h3>
                {renderPreview(platform)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}, areModalPropsEqual);

// Export du composant mémorisé
export default PreviewModal;
