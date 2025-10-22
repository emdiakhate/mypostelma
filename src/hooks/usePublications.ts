import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/Post';
import { PostsService } from '@/services/posts';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePublications() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await PostsService.getPosts({
        sortBy: 'scheduled_time',
        sortOrder: 'asc'
      });
      setPosts(result.posts);
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
      const newPost = await PostsService.createPost(post, user.id);
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
      const updatedPost = await PostsService.updatePost(id, updates);
      setPosts(prev => prev.map(p => p.id === id ? updatedPost : p));
      toast.success('Publication mise à jour avec succès');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour de la publication');
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    try {
      await PostsService.deletePost(id);
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
