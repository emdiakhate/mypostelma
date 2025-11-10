import React from 'react';
import { X, Calendar, Clock, User, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PostPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    image?: string;
    images?: string[];
    author: string;
    createdAt: string;
    scheduledDate?: string;
    platforms: string[];
    status: 'draft' | 'scheduled' | 'published' | 'failed';
  };
}

const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  isOpen,
  onClose,
  post
}) => {
  if (!isOpen) return null;

  const platformIcons = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    x: '🐦',
    linkedin: '💼',
    tiktok: '🎵',
    youtube: '📺'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'scheduled': return 'Programmé';
      case 'failed': return 'Échec';
      default: return 'Brouillon';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Aperçu de la publication</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
            </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Post Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="font-medium text-gray-900">{post.author}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Créé le {format(new Date(post.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                  </div>
                  {post.scheduledDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Publié le {format(new Date(post.scheduledDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge className={getStatusColor(post.status)}>
                {getStatusText(post.status)}
              </Badge>
            </div>

            {/* Platforms */}
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Plateformes :</span>
              <div className="flex gap-1">
                {post.platforms.map((platform) => (
                  <span key={platform} className="text-lg" title={platform}>
                    {platformIcons[platform as keyof typeof platformIcons]}
              </span>
                ))}
            </div>
          </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-gray-900 leading-relaxed">{post.content}</p>
          </div>

          {/* Image */}
          {(post.image || (post.images && post.images.length > 0)) && (
              <div className="mb-4">
                <img 
                  src={post.image || post.images?.[0]} 
                  alt="Post content" 
                  className="w-full max-w-md rounded-lg"
                />
              </div>
            )}
            </div>

          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              {/* Facebook-style preview */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{post.author}</h4>
                    <div className="text-sm text-gray-500">2h</div>
                  </div>
              </div>
                
                <p className="text-gray-900 mb-4 leading-relaxed">{post.content}</p>
                
                {(post.image || (post.images && post.images.length > 0)) && (
                  <div className="mb-4">
                    <img 
                      src={post.image || post.images?.[0]} 
                      alt="Post content"
                      className="w-full rounded-lg"
                    />
            </div>
          )}

                <div className="flex items-center gap-4 text-gray-600">
                  <button className="flex items-center gap-2 hover:text-blue-600">
                    <span>👍</span>
                    <span className="text-sm">J'aime</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-600">
                    <span>💬</span>
                    <span className="text-sm">Commenter</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-600">
                    <span>📤</span>
                    <span className="text-sm">Partager</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostPreviewModal;