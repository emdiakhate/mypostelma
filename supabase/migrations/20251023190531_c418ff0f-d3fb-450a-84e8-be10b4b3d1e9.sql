-- Ajouter les politiques RLS pour la table posts
-- Les utilisateurs peuvent voir tous les posts publiés et leurs propres posts
CREATE POLICY "Users can view published posts and own posts"
ON public.posts
FOR SELECT
TO authenticated
USING (
  status = 'published' OR 
  author_id = auth.uid()
);

-- Les utilisateurs peuvent créer leurs propres posts
CREATE POLICY "Users can create their own posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Les utilisateurs peuvent modifier leurs propres posts
CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Les utilisateurs peuvent supprimer leurs propres posts
CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- Ajouter les politiques RLS pour la table post_analytics
-- Les utilisateurs peuvent voir les analytics de leurs propres posts
CREATE POLICY "Users can view analytics of their own posts"
ON public.post_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_analytics.post_id
    AND posts.author_id = auth.uid()
  )
);

-- Les analytics sont créées automatiquement par le système
CREATE POLICY "System can create analytics"
ON public.post_analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Les analytics peuvent être mises à jour pour les posts de l'utilisateur
CREATE POLICY "Users can update analytics of their own posts"
ON public.post_analytics
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_analytics.post_id
    AND posts.author_id = auth.uid()
  )
);