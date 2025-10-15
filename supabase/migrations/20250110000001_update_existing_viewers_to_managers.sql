-- Mettre à jour les utilisateurs existants qui ont le rôle 'viewer' vers 'manager'
-- pour donner un accès plus complet aux utilisateurs existants

UPDATE public.user_roles 
SET role = 'manager' 
WHERE role = 'viewer';
