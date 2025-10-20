import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/Post';
import { PostsService, PostSearchParams } from '@/services/posts';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePosts(params?: PostSearchParams) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
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
      const result = await PostsService.getPosts(params);
      setPosts(result.posts);
      setTotal(result.total);
    } catch (err) {
      setError(err as Error);
      toast.error('Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  }, [user, JSON.stringify(params)]);

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
      toast.success('Post créé avec succès');
      return newPost;
    } catch (err) {
      toast.error('Erreur lors de la création du post');
      throw err;
    }
  }, [user]);

  const updatePost = useCallback(async (id: string, updates: Partial<Post>) => {
    try {
      const updatedPost = await PostsService.updatePost(id, updates);
      setPosts(prev => prev.map(p => p.id === id ? updatedPost : p));
      toast.success('Post mis à jour avec succès');
      return updatedPost;
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du post');
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    try {
      await PostsService.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post supprimé avec succès');
    } catch (err) {
      toast.error('Erreur lors de la suppression du post');
      throw err;
    }
  }, []);

  const publishPost = useCallback(async (id: string) => {
    try {
      const publishedPost = await PostsService.publishPost(id);
      setPosts(prev => prev.map(p => p.id === id ? publishedPost : p));
      toast.success('Post publié avec succès');
      return publishedPost;
    } catch (err) {
      toast.error('Erreur lors de la publication du post');
      throw err;
    }
  }, []);

  const refetch = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    total,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    refetch,
  };
}
