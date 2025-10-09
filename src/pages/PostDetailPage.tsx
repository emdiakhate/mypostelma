import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Eye, Copy, Trash2, Calendar, User, Globe } from 'lucide-react';
import { Post } from '@/types/Post';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Composant PostDetailPage - Page de détail d'un post
 * Affiche les informations complètes d'un post avec actions
 * Route: /post/:id
 */
const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation de chargement des données du post
  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        
        // Simulation d'un appel API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Données mockées pour la démonstration
        const mockPost: Post = {
          id: id || '1',
          content: 'Voici un exemple de contenu de post pour démontrer les fonctionnalités de Postelma. Ce post contient du texte et une image pour illustrer l\'interface utilisateur.',
          author: 'Postelma Team',
          image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500&h=300&fit=crop',
          scheduledTime: new Date('2024-01-15T14:30:00'),
          platforms: ['facebook', 'twitter', 'instagram'],
          status: 'scheduled',
          dayColumn: 'lundi',
          timeSlot: 14
        };
        
        setPost(mockPost);
      } catch (err) {
        setError('Erreur lors du chargement du post');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPost();
    }
  }, [id]);

  const handleEdit = () => {
    // Navigation vers l'édition du post
    navigate(`/post/${id}/edit`);
  };

  const handleDuplicate = () => {
    // Logique de duplication
    console.log('Dupliquer le post:', id);
  };

  const handleDelete = () => {
    // Logique de suppression
    console.log('Supprimer le post:', id);
    navigate('/');
  };

  const handlePreview = () => {
    // Logique d'aperçu
    console.log('Aperçu du post:', id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error || 'Post non trouvé'}</p>
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

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
      default: return 'Inconnu';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Détail du Post
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(post.status)}>
                {getStatusText(post.status)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenu du post */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contenu du Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image */}
                {post.image && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={post.image} 
                      alt="Post content" 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}
                
                {/* Texte du post */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations et actions */}
          <div className="space-y-6">
            {/* Informations du post */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Date de publication</p>
                    <p className="font-medium">
                      {format(post.scheduledTime, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Auteur</p>
                    <p className="font-medium">{post.author}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Plateformes</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.platforms.map((platform) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={handlePreview}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
                
                <Button 
                  onClick={handleEdit}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                
                <Button 
                  onClick={handleDuplicate}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Dupliquer
                </Button>
                
                <Button 
                  onClick={handleDelete}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
