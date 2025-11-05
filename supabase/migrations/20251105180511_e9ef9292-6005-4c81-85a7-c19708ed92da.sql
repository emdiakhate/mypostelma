-- Create table for user custom hashtags
CREATE TABLE IF NOT EXISTS public.user_custom_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain VARCHAR(50) NOT NULL,
  hashtag VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_hashtag UNIQUE(user_id, hashtag)
);

-- Enable RLS
ALTER TABLE public.user_custom_hashtags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own hashtags"
  ON public.user_custom_hashtags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hashtags"
  ON public.user_custom_hashtags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hashtags"
  ON public.user_custom_hashtags
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hashtags"
  ON public.user_custom_hashtags
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_custom_hashtags ON public.user_custom_hashtags(user_id, domain);
CREATE INDEX idx_hashtag_usage ON public.user_custom_hashtags(user_id, usage_count DESC);