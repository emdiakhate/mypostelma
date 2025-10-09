
-- Ajouter une colonne rejection_reason pour stocker le motif de rejet
ALTER TABLE posts 
ADD COLUMN rejection_reason TEXT;

-- Créer un index pour optimiser les requêtes des posts en attente
CREATE INDEX idx_posts_status_creator ON posts(status, author_id);
