import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Eye, Pencil, Copy, Trash2, MoreVertical,
  Instagram, Facebook, Linkedin, Twitter, Youtube, Music,
  CalendarIcon, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Post } from '@/types/Post';

interface PublicationCardProps {
  post: Post;
  onView?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDuplicate?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

export default function PublicationCard({ post, onView, onEdit, onDuplicate, onDelete }: PublicationCardProps) {
  const statusConfig = {
    published: { 
      label: 'Publié', 
      className: 'bg-green-100 text-green-800',
      dot: 'bg-green-500'
    },
    draft: { 
      label: 'Brouillon', 
      className: 'bg-gray-100 text-gray-800',
      dot: 'bg-gray-400'
    },
    failed: { 
      label: 'Échec', 
      className: 'bg-red-100 text-red-800',
      dot: 'bg-red-500'
    }
  };

  const config = statusConfig[post.status] || statusConfig.draft;

  const platformIcons = {
    instagram: { icon: Instagram, color: 'text-pink-500' },
    facebook: { icon: Facebook, color: 'text-blue-600' },
    linkedin: { icon: Linkedin, color: 'text-blue-700' },
    twitter: { icon: Twitter, color: 'text-black' },
    youtube: { icon: Youtube, color: 'text-red-600' },
    tiktok: { icon: Music, color: 'text-black' }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group bg-white">
      {/* Image avec overlay */}
      <div className="relative aspect-square bg-gray-100">
        {post.image ? (
          <img
            src={post.image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Badge statut en haut à gauche */}
        <div className="absolute top-3 left-3">
          <Badge className={`${config.className} flex items-center gap-1.5 px-2 py-1`}>
            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
            {config.label}
          </Badge>
        </div>

        {/* Icônes plateformes en bas à gauche */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          {post.platforms?.slice(0, 3).map((platform: string) => {
            const platformInfo = platformIcons[platform];
            if (!platformInfo) return null;
            const Icon = platformInfo.icon;
            return (
              <div
                key={platform}
                className={`w-6 h-6 rounded-full bg-white/90 flex items-center justify-center ${platformInfo.color}`}
                title={platform}
              >
                <Icon className="w-3 h-3" />
              </div>
            );
          })}
          {post.platforms?.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-xs font-medium text-gray-600">
              +{post.platforms.length - 3}
            </div>
          )}
        </div>

        {/* Actions overlay (visible au hover) */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(post);
            }}
            className="bg-white/90 hover:bg-white"
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(post);
            }}
            className="bg-white/90 hover:bg-white"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Éditer
          </Button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Caption */}
        <p className="text-sm text-gray-700 line-clamp-3 mb-3 min-h-[60px]">
          {post.content || 'Aucune légende'}
        </p>

        {/* Date et auteur */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <CalendarIcon className="w-3 h-3" />
          <span>Programmé le {formatDate(post.scheduledTime)}</span>
          <span className="ml-2">par {post.author}</span>
        </div>

        {/* Métriques d'engagement (seulement pour les posts publiés) */}
        {post.status === 'published' && (
          <div className="space-y-2 pt-3 border-t border-gray-100">
            {/* Total Engagements - Style similaire à l'image */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Engagements</span>
              <span className="text-lg font-bold text-gray-900">
                {typeof post.engagement === 'object' 
                  ? Object.values(post.engagement).reduce((a, b) => a + b, 0)
                  : 0
                }
              </span>
            </div>

            {/* Métriques détaillées - Style vertical comme dans l'image */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Likes</span>
                <span className="font-medium text-gray-900">
                  {typeof post.engagement === 'object' ? post.engagement.likes : post.likes || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Commentaires</span>
                <span className="font-medium text-gray-900">
                  {typeof post.engagement === 'object' ? post.engagement.comments : post.comments || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Partages</span>
                <span className="font-medium text-gray-900">
                  {typeof post.engagement === 'object' ? post.engagement.shares : post.shares || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions en bas */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(post);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.(post);
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit?.(post);
              }}>
                <Pencil className="w-4 h-4 mr-2" />
                Éditer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.(post);
              }}>
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(post);
                }}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

// Helper function pour formater les dates de manière sécurisée
function formatDate(dateInput: any): string {
  if (!dateInput) return 'Date inconnue';
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return format(date, 'dd MMM yyyy', { locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Date invalide';
  }
}