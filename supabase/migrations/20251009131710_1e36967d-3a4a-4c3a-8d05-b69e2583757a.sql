-- ========================================
-- Phase 3 : Création des tables et RLS
-- ========================================

-- 1. Créer l'enum pour les rôles
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'creator', 'viewer');

-- 2. Créer l'enum pour les statuts de post
CREATE TYPE public.post_status AS ENUM ('pending', 'scheduled', 'published', 'failed', 'draft');

-- 3. Table profiles (liée à auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Table user_roles (CRITIQUE: rôles dans table séparée)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Table posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  accounts TEXT[] NOT NULL DEFAULT '{}',
  status post_status NOT NULL DEFAULT 'pending',
  images TEXT[] DEFAULT '{}',
  captions JSONB DEFAULT '{}',
  campaign TEXT,
  campaign_color TEXT,
  scheduled_time TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  day_column TEXT,
  time_slot INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 6. Table post_analytics
CREATE TABLE public.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Fonction de sécurité (SECURITY DEFINER)
-- ========================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ========================================
-- RLS Policies pour profiles
-- ========================================

-- Tout le monde peut voir les profils actifs
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
USING (is_active = true);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- ========================================
-- RLS Policies pour user_roles
-- ========================================

-- Seuls les owners/managers peuvent voir les rôles
CREATE POLICY "roles_select_admin"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'owner') 
  OR public.has_role(auth.uid(), 'manager')
);

-- Seuls les owners peuvent modifier les rôles
CREATE POLICY "roles_all_owner"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'owner'));

-- ========================================
-- RLS Policies pour posts
-- ========================================

-- SELECT: Creators voient leurs posts, Managers/Owners voient tout, Viewers voient published
CREATE POLICY "posts_select"
ON public.posts
FOR SELECT
USING (
  -- Creators voient leurs propres posts
  (auth.uid() = author_id AND public.has_role(auth.uid(), 'creator'))
  OR
  -- Managers/Owners voient tout
  (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'owner'))
  OR
  -- Viewers voient seulement les posts publiés
  (status = 'published' AND public.has_role(auth.uid(), 'viewer'))
);

-- INSERT: Creators, Managers, Owners peuvent créer
CREATE POLICY "posts_insert"
ON public.posts
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'creator')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'owner')
);

-- UPDATE: Creators éditent leurs posts pending/draft, Managers/Owners tout
CREATE POLICY "posts_update"
ON public.posts
FOR UPDATE
USING (
  -- Creators modifient leurs propres posts pending/draft
  (auth.uid() = author_id 
   AND public.has_role(auth.uid(), 'creator')
   AND status IN ('pending', 'draft'))
  OR
  -- Managers/Owners modifient tout
  (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'owner'))
);

-- DELETE: Seuls Managers/Owners
CREATE POLICY "posts_delete"
ON public.posts
FOR DELETE
USING (
  public.has_role(auth.uid(), 'manager') 
  OR public.has_role(auth.uid(), 'owner')
);

-- ========================================
-- RLS Policies pour post_analytics
-- ========================================

-- SELECT: Même logique que posts
CREATE POLICY "analytics_select"
ON public.post_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_analytics.post_id
    AND (
      (auth.uid() = posts.author_id AND public.has_role(auth.uid(), 'creator'))
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'owner')
      OR (posts.status = 'published' AND public.has_role(auth.uid(), 'viewer'))
    )
  )
);

-- INSERT/UPDATE: Seuls Managers/Owners
CREATE POLICY "analytics_modify"
ON public.post_analytics
FOR ALL
USING (
  public.has_role(auth.uid(), 'manager') 
  OR public.has_role(auth.uid(), 'owner')
);

-- ========================================
-- Trigger pour auto-créer profile
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- Trigger pour updated_at sur posts
-- ========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();