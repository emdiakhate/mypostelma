-- Create posts-media bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts-media', 'posts-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated uploads to posts-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to posts-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on posts-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access to posts-media" ON storage.objects;

-- Allow anyone to read from posts-media (public bucket)
CREATE POLICY "Allow public read access to posts-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts-media');

-- Allow authenticated users to upload to posts-media
CREATE POLICY "Allow authenticated uploads to posts-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts-media');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated delete on posts-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts-media');

-- Allow service role full access (for edge functions)
CREATE POLICY "Allow service role full access to posts-media"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'posts-media')
WITH CHECK (bucket_id = 'posts-media');