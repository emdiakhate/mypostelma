import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types
interface PendingPost {
  id: string;
  content: string;
  image: string;
  author: string;
  createdAt: string;
  scheduledDate: string | null;
  platforms: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
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
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <img 
              src={post.image} 
              alt="Post" 
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">{post.author}</span>
                <Badge className={statusBadge.color}>
                  {statusBadge.text}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Créé le {format(new Date(post.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Publié le {format(new Date(post.scheduledDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-900 leading-relaxed line-clamp-3 md:line-clamp-none">{post.content}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 flex-shrink-0">Plateformes:</span>
            <div className="flex gap-1 flex-wrap">
              {post.platforms.map((platform) => (
                <span key={platform} className="text-lg" title={platform}>
                  {platformIcons[platform as keyof typeof platformIcons]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(post.id)}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Aperçu</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(post.id)}
              className="flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(post.id)}
              className="flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Rejeter</span>
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove(post.id)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Valider</span>
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
    <div className="flex flex-wrap items-center gap-2 md:gap-4">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors",
            activeFilter === filter.id
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Filter className="w-3 h-3 md:w-4 md:h-4" />
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
  const { hasPermission, isManager, isOwner } = useAuth();
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  // Charger les posts en attente depuis Supabase
  useEffect(() => {
    loadPosts();
    
    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: 'status=in.(pending,rejected)'
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts: PendingPost[] = (data || []).map((post: any) => ({
        id: post.id,
        content: post.content || '',
        image: post.images?.[0] || '',
        author: post.profiles?.name || 'Utilisateur inconnu',
        createdAt: post.created_at,
        scheduledDate: post.scheduled_time,
        platforms: post.platforms || [],
        status: 'pending' as const,
        rejection_reason: post.rejection_reason
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
      toast.error('Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (activeFilter === 'all') return true;
      return post.status === activeFilter;
    });
  }, [posts, activeFilter]);

  const handleApprove = async (id: string) => {
    if (!isManager && !isOwner) {
      toast.error('Vous n\'avez pas les permissions pour valider des posts');
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'scheduled' as const,
          rejection_reason: null 
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Post validé avec succès');
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation du post');
    }
  };

  const handleReject = (id: string) => {
    setSelectedPostId(id);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!isManager && !isOwner) {
      toast.error('Vous n\'avez pas les permissions pour rejeter des posts');
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'pending' as const,
          rejection_reason: reason 
        })
        .eq('id', selectedPostId);

      if (error) throw error;

      toast.success('Post rejeté');
      await loadPosts();
      setActiveFilter('rejected');
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast.error('Erreur lors du rejet du post');
    }
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PendingPost | null>(null);

  const handleEdit = (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post) {
      setEditingPost(post);
      setEditModalOpen(true);
    }
  };

  const handlePreview = (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post) {
      setEditingPost(post);
      setPreviewModalOpen(true);
    }
  };

  const handleSaveEdit = async (updatedPost: PendingPost) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          content: updatedPost.content,
          images: [updatedPost.image]
        })
        .eq('id', updatedPost.id);

      if (error) throw error;

      toast.success('Post modifié avec succès');
      setEditModalOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification du post');
    }
  };

  const handleApproveAll = async () => {
    if (!isManager && !isOwner) {
      toast.error('Vous n\'avez pas les permissions pour cette action');
      return;
    }

    const pendingPosts = posts.filter(p => p.status === 'pending');
    if (pendingPosts.length === 0) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'scheduled', rejection_reason: null })
        .in('id', pendingPosts.map(p => p.id));

      if (error) throw error;

      toast.success(`${pendingPosts.length} posts validés`);
      setPosts(prev => prev.filter(p => p.status !== 'pending'));
    } catch (error) {
      console.error('Erreur lors de la validation groupée:', error);
      toast.error('Erreur lors de la validation groupée');
    }
  };

  if (!hasPermission('canApproveContent')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès refusé</h3>
          <p className="text-gray-600">
            Vous n'avez pas les permissions pour accéder à la file d'attente.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">File d'attente</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {posts.length} publication{posts.length > 1 ? 's' : ''} en attente
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                onClick={handleApproveAll}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-sm md:text-base"
                disabled={posts.length === 0}
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Tout valider</span>
                <span className="sm:hidden">Valider</span>
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

        {/* Modal d'aperçu */}
        {editingPost && previewModalOpen && (
          <QueuePostPreviewModal
            isOpen={previewModalOpen}
            onClose={() => {
              setPreviewModalOpen(false);
              setEditingPost(null);
            }}
            post={editingPost}
          />
        )}

        {/* Modal d'édition */}
        {editingPost && editModalOpen && (
          <QueuePostEditModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditingPost(null);
            }}
            post={editingPost}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
};

// Composant QueuePostPreviewModal
const QueuePostPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  post: PendingPost;
}> = ({ isOpen, onClose, post }) => {
  if (!isOpen) return null;

  const platformIcons = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    linkedin: '💼',
    tiktok: '🎵'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Aperçu de la publication</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Image */}
            <div className="rounded-lg overflow-hidden">
              <img 
                src={post.image} 
                alt="Preview" 
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Contenu */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Métadonnées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Auteur: {post.author}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Publié le: {format(new Date(post.scheduledDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
              </div>
            </div>

            {/* Plateformes */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Plateformes:</span>
              <div className="flex gap-2">
                {post.platforms.map((platform) => (
                  <span key={platform} className="text-2xl" title={platform}>
                    {platformIcons[platform as keyof typeof platformIcons]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant QueuePostEditModal
const QueuePostEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  post: PendingPost;
  onSave: (post: PendingPost) => void;
}> = ({ isOpen, onClose, post, onSave }) => {
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedImage, setEditedImage] = useState(post.image);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...post,
      content: editedContent,
      image: editedImage
    });
  };

  const platformIcons = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    linkedin: '💼',
    tiktok: '🎵'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Modifier la publication</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de l'image
              </label>
              <input
                type="text"
                value={editedImage}
                onChange={(e) => setEditedImage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {editedImage && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  <img 
                    src={editedImage} 
                    alt="Preview" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Contenu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu de la publication
              </label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-32"
                placeholder="Écrivez votre contenu ici..."
              />
            </div>

            {/* Métadonnées non éditables */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Auteur: {post.author}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Publié le: {format(new Date(post.scheduledDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Plateformes:</span>
                <div className="flex gap-1">
                  {post.platforms.map((platform) => (
                    <span key={platform} className="text-lg" title={platform}>
                      {platformIcons[platform as keyof typeof platformIcons]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueuePage;
