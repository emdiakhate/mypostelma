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

// Platform icons mapping
const PlatformIcons = {
  twitter: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  instagram: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162-6.162s2.759-6.163 6.162-6.163 6.162 2.759 6.162 6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  facebook: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  linkedin: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  youtube: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <polygon points="10,8 16,12 10,16"/>
    </svg>
  ),
  tiktok: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
};

const platformColors: Record<SocialPlatform, string> = {
  twitter: 'bg-[#1DA1F2] text-white',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  facebook: 'bg-[#1877F2] text-white',
  linkedin: 'bg-[#0A66C2] text-white',
  youtube: 'bg-[#FF0000] text-white',
  tiktok: 'bg-black text-white',
};

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
            const PlatformIcon = PlatformIcons[platform];
            return (
                <div
                key={platform}
                  className={cn(
                  "w-5 h-5 rounded flex items-center justify-center",
                    platformColors[platform]
                  )}
                >
                  <PlatformIcon />
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
          {imageUrl && (
            <div className="relative w-full h-[70px] rounded-md overflow-hidden bg-muted">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500 text-xs">
                  Erreur image
      </div>
              ) : (
          <img 
                  src={imageUrl} 
            alt="Post content" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.warn('Erreur de chargement de l\'image:', error);
                  }}
          />
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