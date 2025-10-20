-- Mettre à jour les dates des posts pour la semaine du 20-27 octobre 2025

-- Dimanche 26 octobre
UPDATE posts SET scheduled_time = '2025-10-26 10:00:00+00' WHERE day_column = 'dimanche' AND content LIKE '%Espresso Signature%';
UPDATE posts SET scheduled_time = '2025-10-26 14:30:00+00' WHERE day_column = 'dimanche' AND content LIKE '%grains 100% bio%';
UPDATE posts SET scheduled_time = '2025-10-26 18:00:00+00' WHERE day_column = 'dimanche' AND content LIKE '%Cappuccino crémeux%';

-- Lundi 20 octobre  
UPDATE posts SET scheduled_time = '2025-10-20 09:00:00+00' WHERE day_column = 'lundi' AND content LIKE '%Lundi motivant%';
UPDATE posts SET scheduled_time = '2025-10-20 13:15:00+00' WHERE day_column = 'lundi' AND content LIKE '%art du café%';
UPDATE posts SET scheduled_time = '2025-10-20 16:45:00+00' WHERE day_column = 'lundi' AND content LIKE '%histoire fascinante%';

-- Mardi 21 octobre
UPDATE posts SET scheduled_time = '2025-10-21 11:30:00+00' WHERE day_column = 'mardi' AND content LIKE '%Cold Brew%';
UPDATE posts SET scheduled_time = '2025-10-21 14:00:00+00' WHERE day_column = 'mardi' AND content LIKE '%Merci pour votre confiance%';
UPDATE posts SET scheduled_time = '2025-10-21 17:30:00+00' WHERE day_column = 'mardi' AND content LIKE '%équipe de baristas%';

-- Mercredi 22 octobre
UPDATE posts SET scheduled_time = '2025-10-22 10:15:00+00' WHERE day_column = 'mercredi' AND content LIKE '%top 10 des meilleurs%';
UPDATE posts SET scheduled_time = '2025-10-22 12:30:00+00' WHERE day_column = 'mercredi' AND content LIKE '%Americano signature%';
UPDATE posts SET scheduled_time = '2025-10-22 15:45:00+00' WHERE day_column = 'mercredi' AND content LIKE '%Livraison express%';

-- Jeudi 23 octobre
UPDATE posts SET scheduled_time = '2025-10-23 09:30:00+00' WHERE day_column = 'jeudi' AND content LIKE '%nouvelle collection%';
UPDATE posts SET scheduled_time = '2025-10-23 13:00:00+00' WHERE day_column = 'jeudi' AND content LIKE '%Café glacé au caramel%';
UPDATE posts SET scheduled_time = '2025-10-23 16:30:00+00' WHERE day_column = 'jeudi' AND content LIKE '%allié énergie%';

-- Vendredi 24 octobre
UPDATE posts SET scheduled_time = '2025-10-24 10:00:00+00' WHERE day_column = 'vendredi' AND content LIKE '%C''est vendredi%';
UPDATE posts SET scheduled_time = '2025-10-24 14:15:00+00' WHERE day_column = 'vendredi' AND content LIKE '%Pack découverte famille%';
UPDATE posts SET scheduled_time = '2025-10-24 18:00:00+00' WHERE day_column = 'vendredi' AND content LIKE '%Bon weekend%';

-- Samedi 25 octobre
UPDATE posts SET scheduled_time = '2025-10-25 11:00:00+00' WHERE day_column = 'samedi' AND content LIKE '%Bon samedi%';
UPDATE posts SET scheduled_time = '2025-10-25 15:30:00+00' WHERE day_column = 'samedi' AND content LIKE '%Service client%';