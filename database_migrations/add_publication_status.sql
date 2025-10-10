-- Migration: Add publication_status column to posts table
-- This column will track the publication status separately from the general status

-- Add publication_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'publication_status'
    ) THEN
        ALTER TABLE posts 
        ADD COLUMN publication_status VARCHAR(20) DEFAULT 'scheduled';
        
        -- Add constraint for valid values
        ALTER TABLE posts 
        ADD CONSTRAINT check_publication_status 
        CHECK (publication_status IN ('scheduled', 'published', 'failed'));
        
        -- Update existing records based on current status
        UPDATE posts 
        SET publication_status = CASE 
            WHEN status = 'published' THEN 'published'
            WHEN status = 'failed' THEN 'failed'
            ELSE 'scheduled'
        END;
        
        -- Add index for better query performance
        CREATE INDEX idx_posts_publication_status ON posts(publication_status);
        
        RAISE NOTICE 'Column publication_status added successfully';
    ELSE
        RAISE NOTICE 'Column publication_status already exists';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN posts.publication_status IS 'Tracks the publication status: scheduled, published, or failed';
