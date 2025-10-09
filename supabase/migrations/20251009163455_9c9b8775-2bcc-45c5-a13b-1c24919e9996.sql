-- Créer le bucket pour les archives média
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-archives',
  'media-archives',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
);

-- Table pour tracker les médias archivés
CREATE TABLE IF NOT EXISTS public.media_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  source TEXT NOT NULL CHECK (source IN ('uploaded', 'ai-generated')),
  file_size BIGINT,
  dimensions TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.media_archives ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own media
CREATE POLICY "Users can view their own media"
  ON public.media_archives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media"
  ON public.media_archives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media"
  ON public.media_archives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON public.media_archives FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for media-archives bucket
CREATE POLICY "Users can view their own media files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-archives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own media files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media-archives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own media files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media-archives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media-archives' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_media_archives_updated_at
  BEFORE UPDATE ON public.media_archives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();