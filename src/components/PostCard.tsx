import React, { memo } from 'react';
import { Post, SocialPlatform } from '@/types/Post';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Eye, Edit, Copy, Trash2, User, CheckCircle2 } from 'lucide-react';
import { useImageLoader } from '@/hooks/useImageLoader';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        "bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-move flex flex-col w-full",
        isDragging && "opacity-75 transform rotate-1 shadow-lg"
      )}
    >
      {/* Header: Time, platforms, and status badge */}
      <div className="flex items-center justify-between p-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {formatTime(post.scheduledTime)}
          </span>
          {post.status === 'published' && (
            <Badge variant="default" className="h-5 px-2 text-[10px] bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Publié
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {post.platforms.map((platform) => {
            const config = getPlatformConfig(platform);
            return (
              <div
                key={platform}
                className={cn(
                  "w-6 h-6 rounded flex items-center justify-center",
                  config.bgClass,
                  config.textClass
                )}
              >
                <SocialIcon platform={platform} className="w-3.5 h-3.5" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground truncate font-medium">{post.author}</span>
        </div>

        {/* Content - exactly 2 lines */}
        <p className="text-sm text-foreground mb-3 line-clamp-2 leading-snug flex-shrink-0">
          {post.content}
        </p>

        {/* Image - Optimisée avec useImageLoader */}
        {(post.image || post.images?.[0]) && (
          <div className="mb-3 flex-shrink-0">
            <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center bg-destructive/10 text-destructive text-xs">
                  Image non disponible
                </div>
              ) : (
                <img 
                  src={imageUrl} 
                  alt="Post content" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              {(post.images?.length ?? 0) > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  +{(post.images?.length ?? 1) - 1}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.(post);
            }}
            className="h-8 px-2 hover:bg-primary/10 hover:text-primary"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          {canEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(post);
              }}
              className="h-8 px-2 hover:bg-green-500/10 hover:text-green-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-8 px-2 opacity-50 cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Vous n'avez pas la permission d'éditer
              </TooltipContent>
            </Tooltip>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(post);
            }}
            className="h-8 px-2 hover:bg-orange-500/10 hover:text-orange-600"
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          {canDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
                  onDelete?.(post);
                }
              }}
              className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-8 px-2 opacity-50 cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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