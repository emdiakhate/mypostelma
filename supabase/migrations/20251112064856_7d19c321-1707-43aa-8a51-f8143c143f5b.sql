-- Créer la table des concurrents
CREATE TABLE public.competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  social_media JSONB DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}'::text[],
  metrics JSONB DEFAULT '{}'::jsonb,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual'
);

-- Activer Row Level Security
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour competitors
CREATE POLICY "Users can view their own competitors" 
ON public.competitors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitors" 
ON public.competitors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitors" 
ON public.competitors 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitors" 
ON public.competitors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_competitors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competitors_updated_at
BEFORE UPDATE ON public.competitors
FOR EACH ROW
EXECUTE FUNCTION update_competitors_updated_at();