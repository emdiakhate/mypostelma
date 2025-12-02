-- Migration: Add Upload Post tracking columns to posts table
-- This migration adds columns to track Upload Post API job_id and request_id

-- Add job_id column for scheduled posts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts'
        AND column_name = 'upload_post_job_id'
    ) THEN
        ALTER TABLE posts
        ADD COLUMN upload_post_job_id VARCHAR(255);

        CREATE INDEX idx_posts_upload_post_job_id ON posts(upload_post_job_id);

        RAISE NOTICE 'Column upload_post_job_id added successfully';
    ELSE
        RAISE NOTICE 'Column upload_post_job_id already exists';
    END IF;
END $$;

-- Add request_id column for async uploads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts'
        AND column_name = 'upload_post_request_id'
    ) THEN
        ALTER TABLE posts
        ADD COLUMN upload_post_request_id VARCHAR(255);

        CREATE INDEX idx_posts_upload_post_request_id ON posts(upload_post_request_id);

        RAISE NOTICE 'Column upload_post_request_id added successfully';
    ELSE
        RAISE NOTICE 'Column upload_post_request_id already exists';
    END IF;
END $$;

-- Add upload_post_status column to track publication status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts'
        AND column_name = 'upload_post_status'
    ) THEN
        ALTER TABLE posts
        ADD COLUMN upload_post_status VARCHAR(50);

        -- Add constraint for valid values
        ALTER TABLE posts
        ADD CONSTRAINT check_upload_post_status
        CHECK (upload_post_status IN ('pending', 'in_progress', 'completed', 'failed', 'scheduled'));

        CREATE INDEX idx_posts_upload_post_status ON posts(upload_post_status);

        RAISE NOTICE 'Column upload_post_status added successfully';
    ELSE
        RAISE NOTICE 'Column upload_post_status already exists';
    END IF;
END $$;

-- Add upload_post_results column to store platform-specific results
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts'
        AND column_name = 'upload_post_results'
    ) THEN
        ALTER TABLE posts
        ADD COLUMN upload_post_results JSONB;

        RAISE NOTICE 'Column upload_post_results added successfully';
    ELSE
        RAISE NOTICE 'Column upload_post_results already exists';
    END IF;
END $$;

-- Add comments to the columns
COMMENT ON COLUMN posts.upload_post_job_id IS 'Upload Post API job ID for scheduled posts';
COMMENT ON COLUMN posts.upload_post_request_id IS 'Upload Post API request ID for async uploads';
COMMENT ON COLUMN posts.upload_post_status IS 'Upload Post publication status: pending, in_progress, completed, failed, or scheduled';
COMMENT ON COLUMN posts.upload_post_results IS 'JSON object containing platform-specific publication results from Upload Post API';
