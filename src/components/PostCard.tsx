import React, { memo } from 'react';
import { Post, SocialPlatform } from '@/types/Post';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Eye, Edit, Copy, Trash2, User } from 'lucide-react';
import { useImageLoader } from '@/hooks/useImageLoader';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { SocialIcon } from '@/config/socialIcons';
import { getPlatformConfig } from '@/config/platforms';

interface PostCardProps {
  post: Post;
  isDragging?: boolean;
  onPreview?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDuplicate?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

// Comparateur personnalisé pour React.memo
// Évite les re-rendus inutiles quand les props n'ont pas changé
const arePropsEqual = (prevProps: PostCardProps, nextProps: PostCardProps) => {
  // Comparaison des props primitives
  if (prevProps.isDragging !== nextProps.isDragging) return false;
  
  // Comparaison de l'objet post (structure complexe)
  const prevPost = prevProps.post;
  const nextPost = nextProps.post;
  
  return (
    prevPost.id === nextPost.id &&
    prevPost.content === nextPost.content &&
    prevPost.author === nextPost.author &&
    prevPost.image === nextPost.image &&
    prevPost.scheduledTime.getTime() === nextPost.scheduledTime.getTime() &&
    JSON.stringify(prevPost.platforms) === JSON.stringify(nextPost.platforms) &&
    prevPost.status === nextPost.status &&
    // Les fonctions de callback sont comparées par référence
    prevProps.onPreview === nextProps.onPreview &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDuplicate === nextProps.onDuplicate &&
    prevProps.onDelete === nextProps.onDelete
  );
};

const PostCard: React.FC<PostCardProps> = memo(({ 
  post, 
  isDragging = false,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete 
}) => {
  // Utilisation du hook personnalisé pour gérer l'image
  const { imageUrl, isLoading, error } = useImageLoader(post.image);
  
  // Debug: afficher les informations de l'image
  console.log('PostCard Debug:', {
    postId: post.id,
    postImage: post.image,
    imageUrl,
    isLoading,
    error,
    hasImage: !!post.image,
    imageType: post.image ? typeof post.image : 'undefined',
    imageLength: post.image ? post.image.length : 0
  });
  
  // Vérification des permissions
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('canPublish');
  const canDelete = hasPermission('canDelete');

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: fr });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-move flex flex-col h-[220px] w-full",
        isDragging && "opacity-75 transform rotate-1 shadow-lg"
      )}
    >
      {/* Header: Time and platforms */}
      <div className="flex items-center justify-between p-2 pb-1">
        <span className="text-xs font-medium text-foreground">
            {formatTime(post.scheduledTime)}
          </span>
        
        <div className="flex items-center gap-1">
          {post.platforms.map((platform) => {
            const config = getPlatformConfig(platform);
            return (
              <div
                key={platform}
                className={cn(
                  "w-5 h-5 rounded flex items-center justify-center",
                  config.bgClass,
                  config.textClass
                )}
              >
                <SocialIcon platform={platform} className="w-3 h-3" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-2 flex-1 flex flex-col">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-gray-600">👤</span>
          </div>
          <span className="text-[10px] text-muted-foreground truncate">{post.author}</span>
        </div>

        {/* Content - exactly 2 lines */}
        <p className="text-xs text-foreground mb-3 line-clamp-2 leading-tight flex-shrink-0">
          {post.content}
        </p>

        {/* Image - Optimisée avec useImageLoader */}
        <div className="mb-2 max-h-[70px] overflow-hidden">
          {post.image && (
            <div className="relative w-full h-[70px] rounded-md overflow-hidden bg-muted">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500 text-xs">
                  Erreur image
                </div>
              ) : imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Post content" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.warn('Erreur de chargement de l\'image:', error);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
                  Image non disponible
                </div>
              )}
              {post.platforms.length > 1 && (
                <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                  +{post.platforms.length - 1}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {/* Aperçu - toujours disponible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.(post);
            }}
            className="p-1.5 rounded hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title="Aperçu"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          
          {/* Éditer - restriction par rôle */}
          {canEdit ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(post);
              }}
              className="p-1.5 rounded hover:bg-green-100 hover:text-green-600 transition-colors"
              title="Éditer"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled
                  className="p-1.5 rounded opacity-50 cursor-not-allowed"
                  title="Éditer"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Vous n'avez pas la permission d'éditer
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Dupliquer - toujours disponible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(post);
            }}
            className="p-1.5 rounded hover:bg-orange-100 hover:text-orange-600 transition-colors"
            title="Dupliquer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          
          {/* Supprimer - restriction par rôle */}
          {canDelete ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
                  onDelete?.(post);
                }
              }}
              className="p-1.5 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled
                  className="p-1.5 rounded opacity-50 cursor-not-allowed"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Vous n'avez pas la permission de supprimer
              </TooltipContent>
            </Tooltip>
          )}
        </div>

       
      </div>
    </div>
  );
}, arePropsEqual);

// Export du composant mémorisé
export default PostCard;