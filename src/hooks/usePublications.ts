import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/Post';
import { enrichPostsWithDefaults, mockPublicationsData } from '@/data/mockPublicationsData';
import { samplePosts } from '@/data/sampleData';
import { startOfWeek, addDays } from 'date-fns';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePublications() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Utiliser les données mockées enrichies
      const enrichedPosts = enrichPostsWithDefaults(mockPublicationsData);

      // Ajouter les samplePosts recadrés sur la semaine en cours
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Lundi
      console.log('🗓️ Week start (Monday):', weekStart);
      
      const dayIndexMap: Record<string, number> = {
        'lundi': 0,
        'mardi': 1,
        'mercredi': 2,
        'jeudi': 3,
        'vendredi': 4,
        'samedi': 5,
        'dimanche': 6,
      };

      const adjustedSamplePosts: Post[] = samplePosts.map((post) => {
        const originalTime = new Date(post.scheduledTime);
        const dayIndex = dayIndexMap[post.dayColumn || 'lundi'] ?? 0;
        const targetDate = addDays(weekStart, dayIndex);
        const scheduledTime = new Date(targetDate);
        scheduledTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);

        console.log(`📅 Post ${post.id} (${post.dayColumn}):`, {
          original: post.scheduledTime,
          adjusted: scheduledTime,
          dayIndex
        });

        return {
          ...post,
          scheduledTime,
        } as Post;
      });

      console.log('📊 Total posts:', {
        mockPublications: enrichedPosts.length,
        samplePosts: adjustedSamplePosts.length,
        total: enrichedPosts.length + adjustedSamplePosts.length
      });

      // Afficher les posts même si l'utilisateur n'est pas connecté (mode démo)
      setPosts([...enrichedPosts, ...adjustedSamplePosts]);
    } catch (err) {
      setError(err as Error);
      toast.error('Erreur lors du chargement des publications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = useCallback(async (post: Partial<Post>) => {
    if (!user) {
      toast.error('Vous devez être connecté pour créer un post');
      return;
    }

    try {
      const newPost: Post = {
        id: `pub-${Date.now()}`,
        content: post.content || '',
        scheduledTime: post.scheduledTime || new Date(),
        platforms: post.platforms || [],
        status: post.status || 'draft',
        images: post.images || [],
        author: user.email || 'Utilisateur',
        dayColumn: post.dayColumn || 'lundi',
        timeSlot: post.timeSlot || 9,
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0
        }
      };
      
      setPosts(prev => [...prev, newPost]);
      toast.success('Publication créée avec succès');
      return newPost;
    } catch (err) {
      toast.error('Erreur lors de la création de la publication');
      throw err;
    }
  }, [user]);

  const updatePost = useCallback(async (id: string, updates: Partial<Post>) => {
    try {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('Publication mise à jour avec succès');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour de la publication');
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    try {
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Publication supprimée avec succès');
    } catch (err) {
      toast.error('Erreur lors de la suppression de la publication');
      throw err;
    }
  }, []);

  const refetch = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    refetch,
  };
}
