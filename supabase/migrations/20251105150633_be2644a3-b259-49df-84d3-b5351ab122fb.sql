-- Create table for user writing styles
CREATE TABLE IF NOT EXISTS public.user_writing_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  style_description TEXT,
  style_instructions TEXT NOT NULL,
  examples TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.user_writing_styles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own writing styles"
  ON public.user_writing_styles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own writing styles"
  ON public.user_writing_styles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own writing styles"
  ON public.user_writing_styles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own writing styles"
  ON public.user_writing_styles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_writing_styles_updated_at
  BEFORE UPDATE ON public.user_writing_styles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_user_writing_styles_user_id ON public.user_writing_styles(user_id);
CREATE INDEX idx_user_writing_styles_active ON public.user_writing_styles(user_id, is_active) WHERE is_active = true;