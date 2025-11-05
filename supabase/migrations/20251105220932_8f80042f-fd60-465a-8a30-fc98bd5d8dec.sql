-- Ajout de politiques RLS pour permettre l'upload de vidéos sources
CREATE POLICY "Users can upload to media-archives bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-archives' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own media in media-archives"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-archives' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media from media-archives"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-archives' AND
  auth.uid()::text = (storage.foldername(name))[1]
);