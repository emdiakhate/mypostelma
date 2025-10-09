import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Eye, 
  Clock, 
  User, 
  Calendar,
  Filter,
  CheckCheck,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Données mockées
const mockPendingPosts = [
  {
    id: '1',
    content: 'Découvrez notre nouvelle collection automne-hiver 2025 avec des designs innovants et des matières durables.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    author: 'Marie Dubois',
    createdAt: '2025-10-02T10:30:00',
    scheduledDate: '2025-10-05T14:00:00',
    platforms: ['facebook', 'instagram', 'linkedin'],
    status: 'pending' as const
  },
  {
    id: '2',
    content: 'Offre spéciale : -30% sur tous nos produits jusqu\'à la fin du mois. Profitez-en maintenant !',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop',
    author: 'Jean Martin',
    createdAt: '2025-10-02T11:15:00',
    scheduledDate: '2025-10-06T10:00:00',
    platforms: ['twitter', 'facebook'],
    status: 'pending' as const
  },
  {
    id: '3',
    content: 'Nouvelle étude : 85% de nos clients sont satisfaits de nos services. Merci pour votre confiance !',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
    author: 'Sophie Laurent',
    createdAt: '2025-10-02T14:20:00',
    scheduledDate: '2025-10-07T09:00:00',
    platforms: ['linkedin', 'twitter'],
    status: 'approved' as const
  },
  {
    id: '4',
    content: 'Rejoignez notre webinar gratuit sur les stratégies de marketing digital moderne. Places limitées !',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    author: 'Pierre Moreau',
    createdAt: '2025-10-02T16:45:00',
    scheduledDate: '2025-10-08T11:00:00',
    platforms: ['linkedin', 'facebook'],
    status: 'pending' as const
  },
  {
    id: '5',
    content: 'Témoignage client : "Un service exceptionnel qui a transformé notre approche marketing."',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    author: 'Claire Bernard',
    createdAt: '2025-10-03T08:30:00',
    scheduledDate: '2025-10-09T15:00:00',
    platforms: ['instagram', 'facebook'],
    status: 'pending' as const
  }
];

// Types
interface PendingPost {
  id: string;
  content: string;
  image: string;
  author: string;
  createdAt: string;
  scheduledDate: string;
  platforms: string[];
  status: 'pending' | 'approved' | 'rejected';
}

// Composant PendingPostCard
const PendingPostCard: React.FC<{
  post: PendingPost;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
}> = ({ post, onApprove, onReject, onEdit, onPreview }) => {
  const platformIcons = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    linkedin: '💼',
    tiktok: '🎵'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-l-yellow-500';
      case 'approved': return 'border-l-green-500';
      case 'rejected': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' };
      case 'approved': return { text: 'Validé', color: 'bg-green-100 text-green-800' };
      case 'rejected': return { text: 'Rejeté', color: 'bg-red-100 text-red-800' };
      default: return { text: 'Inconnu', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusBadge = getStatusBadge(post.status);

  return (
    <div className={cn(
      "bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all duration-200",
      getStatusColor(post.status)
    )}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={post.image} 
              alt="Post" 
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">{post.author}</span>
                <Badge className={statusBadge.color}>
                  {statusBadge.text}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Créé le {format(new Date(post.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Publié le {format(new Date(post.scheduledDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-900 leading-relaxed">{post.content}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Plateformes :</span>
            <div className="flex gap-1">
              {post.platforms.map((platform) => (
                <span key={platform} className="text-lg" title={platform}>
                  {platformIcons[platform as keyof typeof platformIcons]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(post.id)}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(post.id)}
              className="flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Modifier
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(post.id)}
              className="flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Rejeter
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove(post.id)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Valider
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant RejectModal
const RejectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  postId: string;
}> = ({ isOpen, onClose, onConfirm, postId }) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Rejeter la publication</h3>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motif du rejet
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Expliquez pourquoi cette publication est rejetée..."
            className="min-h-20"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Confirmer le rejet
          </Button>
        </div>
      </div>
    </div>
  );
};

// Composant QueueFilters
const QueueFilters: React.FC<{
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  totalCount: number;
}> = ({ activeFilter, onFilterChange, totalCount }) => {
  const filters = [
    { id: 'all', label: 'Tous', count: totalCount },
    { id: 'pending', label: 'À valider', count: totalCount },
    { id: 'rejected', label: 'Rejetés', count: 0 }
  ];

  return (
    <div className="flex items-center gap-4">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeFilter === filter.id
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Filter className="w-4 h-4" />
          {filter.label}
          <Badge variant="secondary" className="text-xs">
            {filter.count}
          </Badge>
        </button>
      ))}
    </div>
  );
};

// Page principale QueuePage
const QueuePage: React.FC = () => {
  const [posts, setPosts] = useState<PendingPost[]>(mockPendingPosts);
  const [activeFilter, setActiveFilter] = useState('all');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  const filteredPosts = posts.filter(post => {
    if (activeFilter === 'all') return true;
    return post.status === activeFilter;
  });

  const handleApprove = (id: string) => {
    setPosts(prev => prev.filter(post => post.id !== id));
  };

  const handleReject = (id: string) => {
    setSelectedPostId(id);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = (reason: string) => {
    setPosts(prev => prev.map(post => 
      post.id === selectedPostId 
        ? { ...post, status: 'rejected' as const }
        : post
    ));
  };

  const handleEdit = (id: string) => {
    // Ouvrir le modal d'édition
    console.log('Edit post:', id);
  };

  const handlePreview = (id: string) => {
    // Ouvrir le modal d'aperçu
    console.log('Preview post:', id);
  };

  const handleApproveAll = () => {
    setPosts([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">File d'attente</h1>
              <p className="text-gray-600 mt-1">
                {posts.length} publication{posts.length > 1 ? 's' : ''} en attente
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleApproveAll}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                disabled={posts.length === 0}
              >
                <CheckCheck className="w-4 h-4" />
                Tout valider
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <QueueFilters 
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            totalCount={posts.length}
          />
        </div>

        {/* Liste des posts */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <CheckCircle className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune publication en attente
              </h3>
              <p className="text-gray-600">
                Toutes les publications ont été traitées.
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PendingPostCard
                key={post.id}
                post={post}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
                onPreview={handlePreview}
              />
            ))
          )}
        </div>

        {/* Modal de rejet */}
        <RejectModal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          onConfirm={handleConfirmReject}
          postId={selectedPostId}
        />
      </div>
    </div>
  );
};

export default QueuePage;
