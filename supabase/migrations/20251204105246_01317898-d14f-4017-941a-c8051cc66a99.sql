-- Create storage bucket for inbox attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('inbox-attachments', 'inbox-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload inbox attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inbox-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to view their own attachments
CREATE POLICY "Users can view their inbox attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inbox-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can view attachments (needed for sharing in messages)
CREATE POLICY "Public can view inbox attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'inbox-attachments');

-- Policy: Allow users to delete their own attachments
CREATE POLICY "Users can delete their inbox attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inbox-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);