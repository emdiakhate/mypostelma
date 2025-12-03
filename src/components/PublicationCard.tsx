import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Eye, Pencil, Copy, Trash2, MoreVertical,
  Instagram, Facebook, Linkedin, Twitter, Youtube, Music,
  CalendarIcon, FileText, Heart, MessageCircle, Share2,
  SmilePlus, Meh, Frown, ExternalLink, AlertCircle, CheckCircle
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
import { getDefaultImage } from '@/data/mockPublicationsData';
import { PostCommentsModal } from './PostCommentsModal';

interface PublicationCardProps {
  post: Post;
  onView?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDuplicate?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

export default function PublicationCard({ post, onView, onEdit, onDuplicate, onDelete }: PublicationCardProps) {
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Garantir qu'il y a toujours une image
  const displayImage = (post.images && post.images.length > 0)
    ? post.images[0]
    : post.image
    ? post.image
    : getDefaultImage(0); // Image de fallback

  // Garantir qu'il y a toujours des stats
  const stats = post.engagement || {
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0,
    engagement: 0
  };

  // Get sentiment badge configuration
  const getSentimentBadge = () => {
    if (!post.sentiment_label) return null;

    const sentimentConfigs = {
      positive: {
        icon: SmilePlus,
        label: 'Positif',
        className: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600'
      },
      neutral: {
        icon: Meh,
        label: 'Neutre',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconColor: 'text-yellow-600'
      },
      negative: {
        icon: Frown,
        label: 'Négatif',
        className: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-600'
      }
    };

    const config = sentimentConfigs[post.sentiment_label];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1 px-2 py-1 border`}>
        <Icon className={`w-3 h-3 ${config.iconColor}`} />
        <span className="text-xs">{config.label}</span>
      </Badge>
    );
  };

  const getStatusConfig = () => {
    const now = new Date();
    const scheduledTime = new Date(post.scheduledTime);

    const statusConfigs = {
      published: {
        label: 'Publié',
        className: 'bg-green-100 text-green-800',
        dot: 'bg-green-500'
      },
      completed: {
        label: 'Publié',
        className: 'bg-green-100 text-green-800',
        dot: 'bg-green-500'
      },
      scheduled: {
        label: 'Programmé',
        className: 'bg-blue-100 text-blue-800',
        dot: 'bg-blue-500'
      },
      pending: {
        label: 'En cours',
        className: 'bg-yellow-100 text-yellow-800',
        dot: 'bg-yellow-500'
      },
      in_progress: {
        label: 'En cours',
        className: 'bg-yellow-100 text-yellow-800',
        dot: 'bg-yellow-500'
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

    // Priorité 1: Utiliser le statut Upload Post s'il existe
    if (post.upload_post_status) {
      return statusConfigs[post.upload_post_status] || statusConfigs.pending;
    }

    // Priorité 2: Utiliser le statut général
    if (post.status === 'failed') {
      return statusConfigs.failed;
    }

    if (post.status === 'published') {
      return statusConfigs.published;
    }

    if (post.status === 'draft') {
      return statusConfigs.draft;
    }

    // Si le post est programmé (scheduled/pending) et la date est dans le futur -> "Programmé"
    if ((post.status === 'scheduled' || post.status === 'pending') && scheduledTime > now) {
      return statusConfigs.scheduled;
    }

    // Si le post est programmé (scheduled/pending) mais la date est passée -> "Publié"
    if ((post.status === 'scheduled' || post.status === 'pending') && scheduledTime <= now) {
      return statusConfigs.published;
    }

    // Par défaut, si la date est dans le futur -> "Programmé", sinon "Publié"
    return scheduledTime > now ? statusConfigs.scheduled : statusConfigs.published;
  };

  const config = getStatusConfig();

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
        <img
          src={displayImage}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            // Image de fallback en cas d'erreur de chargement
            e.currentTarget.src = getDefaultImage(0);
          }}
        />

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

        {/* Badge sentiment en haut à droite */}
        {post.sentiment_label && (
          <div className="absolute top-3 right-3">
            {getSentimentBadge()}
          </div>
        )}

        {/* Indicateur d'images multiples en haut à droite (décalé si sentiment) */}
        {post.images && post.images.length > 1 && (
          <div className={`absolute ${post.sentiment_label ? 'top-12' : 'top-3'} right-3`}>
            <div className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-xs font-medium text-white">
              +{post.images.length - 1}
            </div>
          </div>
        )}

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

        {/* Stats - TOUJOURS AFFICHÉES */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Total Engagements</span>
            <span className="text-sm font-bold">{(stats.likes || 0) + (stats.comments || 0) + (stats.shares || 0)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Likes</span>
              <span className="font-medium">{stats.likes || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Commentaires</span>
              <span className="font-medium">{stats.comments || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Partages</span>
              <span className="font-medium">{stats.shares || 0}</span>
            </div>
          </div>

          {/* Publication Results */}
          {post.upload_post_results && Object.keys(post.upload_post_results).length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs font-semibold mb-2">Résultats de publication</div>
              <div className="space-y-1.5">
                {Object.entries(post.upload_post_results).map(([platform, result]: [string, any]) => {
                  const platformInfo = platformIcons[platform];
                  const Icon = platformInfo?.icon || Music;
                  const iconColor = platformInfo?.color || 'text-gray-500';

                  return (
                    <div key={platform} className="flex items-center justify-between text-xs bg-gray-50 rounded p-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3 h-3 ${iconColor}`} />
                        <span className="capitalize">{platform}</span>
                      </div>
                      {result.success ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          {result.url && (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600" title={result.error || 'Erreur inconnue'}>
                          <AlertCircle className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{result.error || 'Échec'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sentiment Analysis Info */}
          {post.last_sentiment_analysis_at && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Sentiment analysé
                </span>
                <span className="text-muted-foreground">
                  {post.comments_sentiment_count || 0} commentaires
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.last_sentiment_analysis_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCommentsModal(true);
                  }}
                >
                  Voir les commentaires
                </Button>
              </div>
            </div>
          )}
        </div>


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

      {/* Comments Modal */}
      <PostCommentsModal
        open={showCommentsModal}
        onOpenChange={setShowCommentsModal}
        postId={post.id}
        postCaption={post.content || ''}
      />
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