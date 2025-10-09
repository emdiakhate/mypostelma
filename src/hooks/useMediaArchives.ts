import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface MediaArchive {
  id: string;
  title: string;
  file_path: string;
  file_type: 'image' | 'video';
  source: 'uploaded' | 'ai-generated';
  file_size: number | null;
  dimensions: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  url?: string;
}

export function useMediaArchives() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('media_archives')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get public URLs for each media
      const mediaWithUrls: MediaArchive[] = await Promise.all(
        (data || []).map(async (item) => {
          const { data: { publicUrl } } = supabase.storage
            .from('media-archives')
            .getPublicUrl(item.file_path);

          return {
            id: item.id,
            title: item.title,
            file_path: item.file_path,
            file_type: item.file_type as 'image' | 'video',
            source: item.source as 'uploaded' | 'ai-generated',
            file_size: item.file_size,
            dimensions: item.dimensions,
            user_id: item.user_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            url: publicUrl
          };
        })
      );

      setMedia(mediaWithUrls);
    } catch (err) {
      console.error('Error loading media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
      toast.error('Erreur lors du chargement des médias');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const uploadMedia = useCallback(async (
    file: File,
    title: string,
    source: 'uploaded' | 'ai-generated'
  ) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('media-archives')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabase
        .from('media_archives')
        .insert({
          title,
          file_path: fileName,
          file_type: file.type.startsWith('video/') ? 'video' : 'image',
          source,
          file_size: file.size,
          user_id: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media-archives')
        .getPublicUrl(fileName);

      const newMedia: MediaArchive = {
        id: data.id,
        title: data.title,
        file_path: data.file_path,
        file_type: data.file_type as 'image' | 'video',
        source: data.source as 'uploaded' | 'ai-generated',
        file_size: data.file_size,
        dimensions: data.dimensions,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        url: publicUrl
      };
      
      setMedia(prev => [newMedia, ...prev]);
      
      toast.success('Média ajouté avec succès');
      return newMedia;
    } catch (err) {
      console.error('Error uploading media:', err);
      toast.error('Erreur lors de l\'upload');
      return null;
    }
  }, [user]);

  const updateMedia = useCallback(async (id: string, updates: { title?: string }) => {
    try {
      const { error } = await supabase
        .from('media_archives')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setMedia(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));

      toast.success('Média mis à jour');
    } catch (err) {
      console.error('Error updating media:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  }, []);

  const deleteMedia = useCallback(async (id: string) => {
    try {
      const mediaItem = media.find(m => m.id === id);
      if (!mediaItem) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media-archives')
        .remove([mediaItem.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_archives')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setMedia(prev => prev.filter(item => item.id !== id));
      toast.success('Média supprimé');
    } catch (err) {
      console.error('Error deleting media:', err);
      toast.error('Erreur lors de la suppression');
    }
  }, [media]);

  return {
    media,
    loading,
    error,
    loadMedia,
    uploadMedia,
    updateMedia,
    deleteMedia
  };
}
