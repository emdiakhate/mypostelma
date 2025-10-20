-- Ajouter le support des vidéos dans la table posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_thumbnail TEXT;

-- Ajouter un commentaire pour documenter les colonnes
COMMENT ON COLUMN posts.video IS 'URL de la vidéo du post';
COMMENT ON COLUMN posts.video_thumbnail IS 'URL de la miniature de la vidéo';