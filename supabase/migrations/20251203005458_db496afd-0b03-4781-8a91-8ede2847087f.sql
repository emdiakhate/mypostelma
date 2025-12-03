-- Add Upload Post tracking columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS upload_post_status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS upload_post_job_id text,
ADD COLUMN IF NOT EXISTS upload_post_results jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS upload_post_error text;

-- Add index for faster queries on upload_post_status
CREATE INDEX IF NOT EXISTS idx_posts_upload_post_status ON public.posts(upload_post_status);

-- Add comment for documentation
COMMENT ON COLUMN public.posts.upload_post_status IS 'Status of the post in Upload Post: draft, pending, in_progress, scheduled, published, failed';
COMMENT ON COLUMN public.posts.upload_post_job_id IS 'Upload Post job ID for async tracking';
COMMENT ON COLUMN public.posts.upload_post_results IS 'Results from Upload Post API per platform';
COMMENT ON COLUMN public.posts.upload_post_error IS 'Error message if publication failed';