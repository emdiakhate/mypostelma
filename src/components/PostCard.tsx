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
  // Gestion des médias (images et vidéos)
  const firstImage = post.images?.[0] || post.image;
  const videoUrl = post.video;
  const videoThumbnail = post.videoThumbnail;
  
  // Détecter si le premier média est une vidéo (base64 video)
  const isFirstMediaVideo = firstImage?.startsWith('data:video/');
  
  // Pour les vidéos, on utilise la miniature si disponible, sinon on affiche directement la vidéo
  // Pour les images, on utilise useImageLoader
  const hasVideo = !!videoUrl || isFirstMediaVideo;
  const hasVideoThumbnail = !!videoThumbnail;
  const hasImage = !!firstImage && !isFirstMediaVideo;
  
  // Déterminer l'URL du média à charger
  // Pour les vidéos avec miniature, utiliser la miniature
  // Pour les images, utiliser l'image
  // Pour les vidéos sans miniature, ne pas utiliser useImageLoader
  const mediaUrl = hasVideo && hasVideoThumbnail ? videoThumbnail : firstImage;
  
  const { imageUrl, isLoading, error } = useImageLoader(mediaUrl);
  
  // Debug logs
  console.log('PostCard Debug:', {
    postId: post.id,
    hasVideo,
    hasVideoThumbnail,
    hasImage,
    isFirstMediaVideo,
    videoUrl: videoUrl?.substring(0, 50) + '...',
    videoThumbnail: videoThumbnail?.substring(0, 50) + '...',
    firstImage: firstImage?.substring(0, 50) + '...',
    mediaUrl: mediaUrl?.substring(0, 50) + '...',
    imageUrl: imageUrl?.substring(0, 50) + '...',
    isLoading,
    error
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

  // Fonction pour déterminer le statut du badge
  const getStatusBadge = () => {
    const now = new Date();
    const scheduledTime = new Date(post.scheduledTime);
    
    // Si le post est programmé et dans le futur -> "En cours"
    if (scheduledTime > now) {
      return {
        text: 'En cours',
        className: 'bg-yellow-500 text-white'
      };
    }
    
    // Si le post a été publié avec succès
    if (post.status === 'published') {
      return {
        text: 'Publié',
        className: 'bg-green-500 text-white'
      };
    }
    
    // Si la publication a échoué
    if (post.status === 'failed') {
      return {
        text: 'Échec',
        className: 'bg-red-500 text-white'
      };
    }
    
    // Statut par défaut (draft, etc.)
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-move flex flex-col h-[235px] w-full relative group",
        isDragging && "opacity-75 transform rotate-1 shadow-lg"
      )}
    >
      {/* Header: Time and platforms */}
      <div className="flex items-center justify-between p-2 pb-1">
        <span className="text-xs font-medium text-foreground">
            {formatTime(post.scheduledTime)}
          </span>
        
        <div className="flex items-center gap-1">
          {post.platforms.slice(0, 2).map((platform) => {
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
          {post.platforms.length > 2 && (
            <div className="w-5 h-5 rounded bg-gray-600 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                +{post.platforms.length - 2}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-2 flex-1 flex flex-col">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          {post.authorAvatar ? (
            <img 
              src={post.authorAvatar} 
              alt={post.author}
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] text-white font-semibold">
                {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
          <span className="text-[10px] text-foreground font-medium truncate">{post.author}</span>
        </div>

        {/* Badge de statut */}
        {statusBadge && (
          <div className="mb-2">
            <div className={cn(
              "inline-block px-1 py-0.5 text-[8px] font-medium rounded-full",
              statusBadge.className
            )}>
              {statusBadge.text}
            </div>
          </div>
        )}

        {/* Content - exactly 2 lines */}
        <p className="text-xs text-foreground mb-3 line-clamp-2 leading-tight flex-shrink-0">
          {post.content}
        </p>

        {/* Image ou Vidéo - Optimisée avec useImageLoader */}
        <div className="mb-2 max-h-[70px] overflow-hidden">
          {(hasImage || hasVideo) && (
            <div className="relative w-full h-[70px] rounded-md overflow-hidden bg-muted">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500 text-xs">
                  Erreur média
                </div>
              ) : hasVideo && !hasVideoThumbnail ? (
                // Vidéo sans miniature - afficher directement la vidéo avec icône play
                <>
                  <video 
                    src={isFirstMediaVideo ? firstImage : videoUrl} 
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (imageUrl || (hasVideo && hasVideoThumbnail)) ? (
                <>
                  <img 
                    src={imageUrl} 
                    alt="Post content" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.warn('Erreur de chargement du média:', imageUrl);
                    }}
                  />
                  {hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
                  {hasVideo ? 'Vidéo' : 'Image non disponible'}
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