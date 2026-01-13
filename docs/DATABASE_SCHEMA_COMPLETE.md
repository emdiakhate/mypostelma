# 📊 Schéma Complet de la Base de Données PostElma

> **Date de génération**: Janvier 2026  
> **Total des tables**: 78 (dont ~15 vues)  
> **Politiques RLS**: 232

---

## 📑 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Module Utilisateurs & Authentification](#module-utilisateurs--authentification)
3. [Module CRM & Leads](#module-crm--leads)
4. [Module Marketing & Publications](#module-marketing--publications)
5. [Module Veille Concurrentielle](#module-veille-concurrentielle)
6. [Module Inbox & Messagerie](#module-inbox--messagerie)
7. [Module Vente](#module-vente)
8. [Module Comptabilité](#module-comptabilité)
9. [Module Stock & Inventaire](#module-stock--inventaire)
10. [Module Caisse POS](#module-caisse-pos)
11. [Module Équipes & Collaboration](#module-équipes--collaboration)
12. [Relations entre les tables](#relations-entre-les-tables)
13. [Diagramme ER](#diagramme-er)

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        PostElma Database                         │
├─────────────────────────────────────────────────────────────────┤
│  👤 Utilisateurs (3)    │  📧 Inbox (9)       │  💼 Vente (8)    │
│  📊 CRM (7)             │  📈 Concurrence (8) │  📒 Compta (6)   │
│  📱 Marketing (5)       │  📦 Stock (10)      │  💰 Caisse (2)   │
│  👥 Équipes (3)         │  ⚙️ Configuration (2)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Utilisateurs & Authentification

### 1. `profiles`
> Profils utilisateurs principaux

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | - | Clé primaire (lié à auth.users) |
| `email` | text | NON | - | Email de l'utilisateur |
| `name` | text | NON | - | Nom affiché |
| `avatar` | text | OUI | - | URL de l'avatar |
| `is_active` | boolean | NON | true | Compte actif |
| `beta_user` | boolean | OUI | false | Utilisateur beta |
| `lead_generation_count` | integer | OUI | 0 | Compteur leads générés |
| `lead_generation_limit` | integer | OUI | 5 | Limite leads |
| `ai_image_generation_count` | integer | OUI | 0 | Images IA générées |
| `ai_image_generation_limit` | integer | OUI | 15 | Limite images IA |
| `ai_video_generation_count` | integer | OUI | 0 | Vidéos IA générées |
| `ai_video_generation_limit` | integer | OUI | 5 | Limite vidéos IA |
| `quota_reset_date` | timestamptz | OUI | now() | Date reset quotas |
| `upload_post_username` | text | OUI | - | Nom utilisateur publications |
| `posts_unlimited` | boolean | OUI | true | Publications illimitées |
| `last_login` | timestamptz | OUI | - | Dernière connexion |
| `created_at` | timestamptz | NON | now() | Date création |

### 2. `user_roles`
> Rôles utilisateurs (RBAC)

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Référence utilisateur |
| `role` | app_role (enum) | NON | - | Rôle (admin, manager, etc.) |
| `created_at` | timestamptz | NON | now() | Date création |

### 3. `subscriptions`
> Abonnements utilisateurs

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Référence utilisateur |
| `plan_type` | text | NON | 'free' | Type plan |
| `status` | text | NON | 'active' | Statut abonnement |
| `beta_user` | boolean | OUI | false | Utilisateur beta |
| `trial_ends_at` | timestamptz | OUI | - | Fin période essai |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

---

## Module CRM & Leads

### 4. `crm_sectors`
> Secteurs d'activité

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | text | NON | - | Nom du secteur |
| `description` | text | OUI | - | Description |
| `icon` | text | OUI | - | Icône |
| `color` | text | OUI | - | Couleur hex |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 5. `crm_segments`
> Segments de marché

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `sector_id` | uuid | NON | - | FK vers crm_sectors |
| `name` | text | NON | - | Nom segment |
| `description` | text | OUI | - | Description |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 6. `crm_tags`
> Tags/étiquettes pour leads

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `sector_id` | uuid | OUI | - | FK vers crm_sectors |
| `name` | text | NON | - | Nom du tag |
| `category` | text | OUI | - | Catégorie |
| `created_at` | timestamptz | NON | now() | Date création |

### 7. `leads`
> Prospects/clients

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | text | NON | - | Nom entreprise |
| `category` | text | NON | - | Catégorie |
| `address` | text | NON | - | Adresse |
| `city` | text | NON | - | Ville |
| `postal_code` | text | OUI | - | Code postal |
| `phone` | text | OUI | - | Téléphone |
| `email` | text | OUI | - | Email |
| `website` | text | OUI | - | Site web |
| `whatsapp` | text | OUI | - | WhatsApp |
| `status` | lead_status (enum) | NON | 'new' | Statut lead |
| `score` | integer | OUI | - | Score lead |
| `sector_id` | uuid | OUI | - | FK vers crm_sectors |
| `segment_id` | uuid | OUI | - | FK vers crm_segments |
| `tags` | text[] | OUI | '{}' | Tags |
| `notes` | text | OUI | '' | Notes |
| `source` | text | NON | 'manual' | Source acquisition |
| `google_rating` | numeric | OUI | - | Note Google |
| `google_reviews_count` | integer | OUI | - | Nombre avis Google |
| `google_maps_url` | text | OUI | - | URL Google Maps |
| `image_url` | text | OUI | - | Image |
| `social_media` | jsonb | OUI | '{}' | Réseaux sociaux |
| `business_hours` | jsonb | OUI | '{}' | Horaires |
| `metrics` | jsonb | OUI | '{}' | Métriques |
| `last_contacted_at` | timestamptz | OUI | - | Dernier contact |
| `added_at` | timestamptz | NON | now() | Date ajout |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 8. `crm_campaigns`
> Campagnes marketing

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | text | NON | - | Nom campagne |
| `description` | text | OUI | - | Description |
| `channel` | text | NON | - | Canal (email, whatsapp, sms) |
| `status` | text | NON | 'draft' | Statut |
| `message` | text | NON | - | Contenu message |
| `subject` | text | OUI | - | Sujet (email) |
| `target_sector_ids` | uuid[] | OUI | - | Secteurs ciblés |
| `target_segment_ids` | uuid[] | OUI | - | Segments ciblés |
| `target_cities` | text[] | OUI | - | Villes ciblées |
| `target_tags` | text[] | OUI | - | Tags ciblés |
| `target_status` | text[] | OUI | - | Statuts ciblés |
| `total_leads` | integer | NON | 0 | Total leads |
| `sent_count` | integer | NON | 0 | Envoyés |
| `delivered_count` | integer | NON | 0 | Livrés |
| `read_count` | integer | NON | 0 | Lus |
| `replied_count` | integer | NON | 0 | Réponses |
| `failed_count` | integer | NON | 0 | Échecs |
| `scheduled_at` | timestamptz | OUI | - | Planifié pour |
| `sent_at` | timestamptz | OUI | - | Envoyé à |
| `completed_at` | timestamptz | OUI | - | Terminé à |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 9. `crm_lead_interactions`
> Historique interactions leads

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `lead_id` | uuid | NON | - | FK vers leads |
| `campaign_id` | uuid | OUI | - | FK vers crm_campaigns |
| `user_id` | uuid | NON | - | Utilisateur |
| `type` | text | NON | - | Type interaction |
| `channel` | text | OUI | - | Canal |
| `status` | text | OUI | - | Statut |
| `subject` | text | OUI | - | Sujet |
| `content` | text | OUI | - | Contenu |
| `metadata` | jsonb | OUI | '{}' | Métadonnées |
| `created_at` | timestamptz | NON | now() | Date création |

### 10. `crm_tasks`
> Tâches CRM

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `lead_id` | uuid | OUI | - | FK vers leads |
| `assigned_to` | uuid | OUI | - | Assigné à |
| `title` | text | NON | - | Titre |
| `description` | text | OUI | - | Description |
| `type` | text | NON | - | Type tâche |
| `priority` | text | NON | 'medium' | Priorité |
| `status` | text | NON | 'pending' | Statut |
| `due_date` | timestamptz | OUI | - | Date échéance |
| `completed_at` | timestamptz | OUI | - | Complété à |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 11. `communication_logs`
> Logs de communication

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `lead_id` | uuid | NON | - | FK vers leads |
| `user_id` | uuid | NON | - | Utilisateur |
| `type` | text | NON | - | Type (email, sms, whatsapp) |
| `recipient` | text | NON | - | Destinataire |
| `subject` | text | OUI | - | Sujet |
| `message` | text | NON | - | Message |
| `status` | text | NON | 'pending' | Statut |
| `provider_response` | jsonb | OUI | - | Réponse fournisseur |
| `sent_at` | timestamptz | OUI | - | Envoyé à |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

---

## Module Marketing & Publications

### 12. `posts`
> Publications réseaux sociaux

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `author_id` | uuid | NON | - | Auteur |
| `content` | text | NON | - | Contenu principal |
| `captions` | jsonb | OUI | '{}' | Captions par plateforme |
| `platforms` | text[] | NON | '{}' | Plateformes cibles |
| `accounts` | text[] | NON | '{}' | Comptes connectés |
| `images` | text[] | OUI | '{}' | URLs images |
| `video` | text | OUI | - | URL vidéo |
| `video_thumbnail` | text | OUI | - | Miniature vidéo |
| `status` | post_status (enum) | NON | 'pending' | Statut |
| `scheduled_time` | timestamptz | OUI | - | Planifié pour |
| `published_at` | timestamptz | OUI | - | Publié à |
| `campaign` | text | OUI | - | Campagne |
| `campaign_color` | text | OUI | - | Couleur campagne |
| `day_column` | text | OUI | - | Colonne calendrier |
| `time_slot` | integer | OUI | - | Slot horaire |
| `rejection_reason` | text | OUI | - | Raison rejet |
| `sentiment_score` | double | OUI | - | Score sentiment |
| `sentiment_label` | text | OUI | - | Label sentiment |
| `comments_sentiment_count` | integer | OUI | 0 | Nb commentaires analysés |
| `last_sentiment_analysis_at` | timestamp | OUI | - | Dernière analyse |
| `upload_post_status` | text | OUI | 'draft' | Statut upload |
| `upload_post_job_id` | text | OUI | - | ID job upload |
| `upload_post_error` | text | OUI | - | Erreur upload |
| `upload_post_results` | jsonb | OUI | '{}' | Résultats upload |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 13. `post_analytics`
> Analytics des publications

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `post_id` | uuid | NON | - | FK vers posts |
| `likes` | integer | OUI | 0 | Nombre likes |
| `comments` | integer | OUI | 0 | Nombre commentaires |
| `shares` | integer | OUI | 0 | Nombre partages |
| `views` | integer | OUI | 0 | Nombre vues |
| `reach` | integer | OUI | 0 | Portée |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 14. `user_post_comments`
> Commentaires sur publications utilisateur

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `post_id` | uuid | NON | - | FK vers posts |
| `comment_text` | text | NON | - | Texte commentaire |
| `author_username` | text | OUI | - | Auteur |
| `author_is_verified` | boolean | OUI | false | Vérifié |
| `comment_likes` | integer | OUI | 0 | Likes |
| `comment_url` | text | OUI | - | URL |
| `sentiment_score` | double | OUI | - | Score sentiment |
| `sentiment_label` | text | OUI | - | Label sentiment |
| `sentiment_explanation` | text | OUI | - | Explication |
| `keywords` | text[] | OUI | - | Mots-clés |
| `is_user_reply` | boolean | OUI | false | Réponse utilisateur |
| `posted_at` | timestamp | OUI | - | Date publication |
| `scraped_at` | timestamp | OUI | now() | Date scraping |
| `created_at` | timestamp | OUI | now() | Date création |

### 15. `user_sentiment_statistics`
> Statistiques sentiment utilisateur

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Utilisateur |
| `week_start_date` | date | NON | - | Début semaine |
| `week_end_date` | date | NON | - | Fin semaine |
| `total_posts` | integer | OUI | 0 | Total posts |
| `total_comments` | integer | OUI | 0 | Total commentaires |
| `avg_sentiment_score` | double | OUI | - | Score moyen |
| `positive_count` | integer | OUI | 0 | Positifs |
| `neutral_count` | integer | OUI | 0 | Neutres |
| `negative_count` | integer | OUI | 0 | Négatifs |
| `positive_percentage` | double | OUI | - | % positifs |
| `neutral_percentage` | double | OUI | - | % neutres |
| `negative_percentage` | double | OUI | - | % négatifs |
| `top_keywords` | jsonb | OUI | - | Top mots-clés |
| `response_rate` | double | OUI | 0 | Taux réponse |
| `avg_engagement_rate` | double | OUI | 0 | Engagement moyen |
| `analyzed_at` | timestamp | OUI | now() | Date analyse |
| `created_at` | timestamp | OUI | now() | Date création |

### 16. `media_archives`
> Médiathèque

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `title` | text | NON | - | Titre |
| `file_path` | text | NON | - | Chemin fichier |
| `file_type` | text | NON | - | Type MIME |
| `file_size` | bigint | OUI | - | Taille |
| `dimensions` | text | OUI | - | Dimensions |
| `source` | text | NON | - | Source (upload, ai, etc.) |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 17. `user_writing_styles`
> Styles d'écriture IA

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | varchar | NON | - | Nom du style |
| `style_description` | text | OUI | - | Description |
| `style_instructions` | text | NON | - | Instructions IA |
| `examples` | text[] | NON | - | Exemples |
| `is_active` | boolean | OUI | true | Actif |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 18. `user_custom_hashtags`
> Hashtags personnalisés

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `domain` | varchar | NON | - | Domaine |
| `hashtag` | varchar | NON | - | Hashtag |
| `usage_count` | integer | OUI | 0 | Utilisations |
| `created_at` | timestamptz | OUI | now() | Date création |

### 19. `user_templates`
> Modèles de messages

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | text | NON | - | Nom |
| `channel` | text | NON | - | Canal |
| `category` | text | NON | 'contact' | Catégorie |
| `subject` | text | OUI | - | Sujet |
| `content` | text | NON | - | Contenu |
| `is_default` | boolean | NON | false | Par défaut |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

---

## Module Veille Concurrentielle

### 20. `my_business`
> Mon entreprise

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `business_name` | text | NON | - | Nom entreprise |
| `industry` | text | OUI | - | Industrie |
| `description` | text | OUI | - | Description |
| `website_url` | text | OUI | - | Site web |
| `instagram_url` | text | OUI | - | Instagram |
| `instagram_followers` | text | OUI | - | Followers IG |
| `facebook_url` | text | OUI | - | Facebook |
| `facebook_likes` | text | OUI | - | Likes FB |
| `linkedin_url` | text | OUI | - | LinkedIn |
| `linkedin_followers` | text | OUI | - | Followers LI |
| `twitter_url` | text | OUI | - | Twitter |
| `tiktok_url` | text | OUI | - | TikTok |
| `youtube_url` | text | OUI | - | YouTube |
| `last_analyzed_at` | timestamptz | OUI | - | Dernière analyse |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 21. `my_business_analysis`
> Analyse de mon entreprise

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `business_id` | uuid | NON | - | FK vers my_business |
| `version` | integer | NON | 1 | Version analyse |
| `context_objectives` | jsonb | OUI | - | Contexte & objectifs |
| `brand_identity` | jsonb | OUI | - | Identité marque |
| `offering_positioning` | jsonb | OUI | - | Positionnement |
| `digital_presence` | jsonb | OUI | - | Présence digitale |
| `swot` | jsonb | OUI | - | Analyse SWOT |
| `competitive_analysis` | jsonb | OUI | - | Analyse concurrentielle |
| `insights_recommendations` | jsonb | OUI | - | Recommandations |
| `raw_data` | jsonb | OUI | - | Données brutes |
| `metadata` | jsonb | OUI | - | Métadonnées |
| `analyzed_at` | timestamptz | NON | now() | Date analyse |

### 22. `competitors`
> Concurrents

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | uuid_generate_v4() | Clé primaire |
| `user_id` | uuid | OUI | - | Propriétaire |
| `name` | text | NON | - | Nom concurrent |
| `industry` | text | OUI | - | Industrie |
| `description` | text | OUI | - | Description |
| `website_url` | text | OUI | - | Site web |
| `instagram_url` | text | OUI | - | Instagram |
| `instagram_followers` | text | OUI | - | Followers IG |
| `facebook_url` | text | OUI | - | Facebook |
| `facebook_likes` | text | OUI | - | Likes FB |
| `linkedin_url` | text | OUI | - | LinkedIn |
| `linkedin_followers` | text | OUI | - | Followers LI |
| `twitter_url` | text | OUI | - | Twitter |
| `tiktok_url` | text | OUI | - | TikTok |
| `youtube_url` | text | OUI | - | YouTube |
| `analysis_count` | integer | OUI | 0 | Nb analyses |
| `last_analyzed_at` | timestamptz | OUI | - | Dernière analyse |
| `added_at` | timestamptz | OUI | now() | Date ajout |

### 23. `competitor_analysis`
> Analyses des concurrents

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | uuid_generate_v4() | Clé primaire |
| `competitor_id` | uuid | OUI | - | FK vers competitors |
| `version` | integer | OUI | 1 | Version |
| `positioning` | text | OUI | - | Positionnement |
| `content_strategy` | text | OUI | - | Stratégie contenu |
| `tone` | text | OUI | - | Ton |
| `target_audience` | text | OUI | - | Cible |
| `strengths` | text[] | OUI | - | Forces |
| `weaknesses` | text[] | OUI | - | Faiblesses |
| `opportunities_for_us` | text[] | OUI | - | Opportunités |
| `key_differentiators` | text[] | OUI | - | Différenciateurs |
| `social_media_presence` | text | OUI | - | Présence sociale |
| `estimated_budget` | text | OUI | - | Budget estimé |
| `recommendations` | text | OUI | - | Recommandations |
| `summary` | text | OUI | - | Résumé |
| `instagram_data` | jsonb | OUI | - | Données Instagram |
| `facebook_data` | jsonb | OUI | - | Données Facebook |
| `linkedin_data` | jsonb | OUI | - | Données LinkedIn |
| `twitter_data` | jsonb | OUI | - | Données Twitter |
| `tiktok_data` | jsonb | OUI | - | Données TikTok |
| `website_data` | jsonb | OUI | - | Données site web |
| `context_objectives` | jsonb | OUI | - | Contexte |
| `brand_identity` | jsonb | OUI | - | Identité |
| `offering_positioning` | jsonb | OUI | - | Offre |
| `digital_presence` | jsonb | OUI | - | Présence digitale |
| `swot` | jsonb | OUI | - | SWOT |
| `competitive_analysis` | jsonb | OUI | - | Analyse |
| `insights_recommendations` | jsonb | OUI | - | Insights |
| `raw_data` | jsonb | OUI | - | Données brutes |
| `metadata` | jsonb | OUI | - | Métadonnées |
| `tokens_used` | integer | OUI | - | Tokens IA |
| `analysis_cost` | double | OUI | - | Coût |
| `analyzed_at` | timestamptz | OUI | now() | Date analyse |

### 24. `competitor_posts`
> Publications des concurrents

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | uuid_generate_v4() | Clé primaire |
| `competitor_id` | uuid | OUI | - | FK vers competitors |
| `analysis_id` | uuid | OUI | - | FK vers competitor_analysis |
| `platform` | text | NON | - | Plateforme |
| `post_url` | text | OUI | - | URL post |
| `caption` | text | OUI | - | Légende |
| `media_urls` | text[] | OUI | - | URLs médias |
| `hashtags` | text[] | OUI | - | Hashtags |
| `content_type` | text | OUI | - | Type contenu |
| `detected_tone` | text | OUI | - | Ton détecté |
| `likes` | integer | OUI | 0 | Likes |
| `comments` | integer | OUI | 0 | Commentaires |
| `comments_count` | integer | OUI | 0 | Nb commentaires |
| `shares` | integer | OUI | 0 | Partages |
| `views` | integer | OUI | 0 | Vues |
| `engagement_rate` | double | OUI | - | Taux engagement |
| `sentiment_score` | numeric | OUI | - | Score sentiment |
| `sentiment_label` | text | OUI | - | Label sentiment |
| `raw_data` | jsonb | OUI | - | Données brutes |
| `posted_at` | timestamptz | OUI | - | Date publication |
| `scraped_at` | timestamptz | OUI | now() | Date scraping |

### 25. `post_comments`
> Commentaires posts concurrents

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `post_id` | uuid | NON | - | FK vers competitor_posts |
| `comment_text` | text | NON | - | Texte |
| `author_username` | text | OUI | - | Auteur |
| `author_is_verified` | boolean | OUI | false | Vérifié |
| `comment_likes` | integer | OUI | 0 | Likes |
| `comment_url` | text | OUI | - | URL |
| `sentiment_score` | double | OUI | - | Score sentiment |
| `sentiment_label` | text | OUI | - | Label |
| `sentiment_explanation` | text | OUI | - | Explication |
| `keywords` | text[] | OUI | - | Mots-clés |
| `is_competitor_reply` | boolean | OUI | false | Réponse concurrent |
| `posted_at` | timestamptz | OUI | - | Date publication |
| `scraped_at` | timestamptz | OUI | now() | Date scraping |
| `created_at` | timestamptz | OUI | now() | Date création |

### 26. `competitor_metrics_history`
> Historique métriques concurrents

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | uuid_generate_v4() | Clé primaire |
| `competitor_id` | uuid | OUI | - | FK vers competitors |
| `instagram_followers` | integer | OUI | - | Followers IG |
| `instagram_following` | integer | OUI | - | Following IG |
| `instagram_posts_count` | integer | OUI | - | Nb posts IG |
| `facebook_likes` | integer | OUI | - | Likes FB |
| `linkedin_followers` | integer | OUI | - | Followers LI |
| `linkedin_employees` | integer | OUI | - | Employés LI |
| `avg_likes` | double | OUI | - | Likes moyens |
| `avg_comments` | double | OUI | - | Commentaires moyens |
| `avg_engagement_rate` | double | OUI | - | Engagement moyen |
| `posts_last_7_days` | integer | OUI | - | Posts 7j |
| `posts_last_30_days` | integer | OUI | - | Posts 30j |
| `recorded_at` | timestamptz | OUI | now() | Date enregistrement |

### 27. `sentiment_statistics`
> Statistiques sentiment concurrents

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `analysis_id` | uuid | NON | - | FK vers competitor_analysis |
| `competitor_id` | uuid | NON | - | FK vers competitors |
| `total_posts` | integer | NON | 0 | Total posts |
| `total_comments` | integer | NON | 0 | Total commentaires |
| `avg_sentiment_score` | double | OUI | - | Score moyen |
| `positive_count` | integer | OUI | 0 | Positifs |
| `neutral_count` | integer | OUI | 0 | Neutres |
| `negative_count` | integer | OUI | 0 | Négatifs |
| `positive_percentage` | double | OUI | - | % positifs |
| `neutral_percentage` | double | OUI | - | % neutres |
| `negative_percentage` | double | OUI | - | % négatifs |
| `top_keywords` | jsonb | OUI | '{}' | Top mots-clés |
| `response_rate` | double | OUI | 0 | Taux réponse |
| `avg_engagement_rate` | double | OUI | 0 | Engagement moyen |
| `analyzed_at` | timestamptz | OUI | now() | Date analyse |
| `created_at` | timestamptz | OUI | now() | Date création |

### 28. `comparative_analysis`
> Analyse comparative

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `my_business_id` | uuid | NON | - | FK vers my_business |
| `competitor_ids` | uuid[] | NON | - | IDs concurrents |
| `overall_comparison` | jsonb | OUI | - | Comparaison globale |
| `domain_comparisons` | jsonb | OUI | - | Par domaine |
| `personalized_recommendations` | jsonb | OUI | - | Recommandations |
| `data_insights` | jsonb | OUI | - | Insights données |
| `analysis_date` | timestamptz | NON | now() | Date analyse |

---

## Module Inbox & Messagerie

### 29. `connected_accounts`
> Comptes connectés (réseaux sociaux, email)

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `platform` | varchar | NON | - | Plateforme |
| `platform_account_id` | text | NON | - | ID compte plateforme |
| `account_name` | text | OUI | - | Nom compte |
| `avatar_url` | text | OUI | - | Avatar |
| `status` | varchar | OUI | 'active' | Statut |
| `error_message` | text | OUI | - | Message erreur |
| `access_token` | text | OUI | - | Token accès |
| `refresh_token` | text | OUI | - | Token refresh |
| `token_expires_at` | timestamptz | OUI | - | Expiration token |
| `config` | jsonb | OUI | '{}' | Configuration |
| `messages_sent` | integer | OUI | 0 | Messages envoyés |
| `messages_received` | integer | OUI | 0 | Messages reçus |
| `last_sync_at` | timestamptz | OUI | - | Dernière synchro |
| `connected_at` | timestamptz | OUI | now() | Date connexion |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 30. `conversations`
> Conversations

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `connected_account_id` | uuid | OUI | - | FK vers connected_accounts |
| `platform` | varchar | NON | - | Plateforme |
| `platform_conversation_id` | text | NON | - | ID conversation plateforme |
| `participant_id` | text | NON | - | ID participant |
| `participant_name` | text | OUI | - | Nom participant |
| `participant_username` | text | OUI | - | Username |
| `participant_avatar_url` | text | OUI | - | Avatar |
| `status` | varchar | OUI | 'unread' | Statut |
| `sentiment` | varchar | OUI | - | Sentiment |
| `tags` | text[] | OUI | '{}' | Tags |
| `notes` | text | OUI | - | Notes |
| `assigned_to` | uuid | OUI | - | Assigné à |
| `assigned_at` | timestamptz | OUI | - | Date assignation |
| `last_message_at` | timestamptz | OUI | now() | Dernier message |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 31. `messages`
> Messages

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `conversation_id` | uuid | NON | - | FK vers conversations |
| `platform_message_id` | text | OUI | - | ID message plateforme |
| `direction` | varchar | NON | - | Direction (incoming/outgoing) |
| `message_type` | varchar | OUI | 'text' | Type message |
| `text_content` | text | OUI | - | Contenu texte |
| `media_url` | text | OUI | - | URL média |
| `media_type` | text | OUI | - | Type média |
| `sender_id` | text | OUI | - | ID expéditeur |
| `sender_name` | text | OUI | - | Nom expéditeur |
| `sender_username` | text | OUI | - | Username |
| `email_subject` | text | OUI | - | Sujet email |
| `email_to` | text | OUI | - | Destinataire email |
| `email_cc` | text | OUI | - | CC email |
| `email_from` | text | OUI | - | Expéditeur email |
| `is_read` | boolean | OUI | false | Lu |
| `is_starred` | boolean | OUI | false | Favoris |
| `sent_at` | timestamptz | OUI | now() | Envoyé à |
| `created_at` | timestamptz | OUI | now() | Date création |

### 32. `message_ai_analysis`
> Analyse IA des messages

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `message_id` | uuid | NON | - | FK vers messages |
| `conversation_id` | uuid | NON | - | FK vers conversations |
| `analyzed_content` | text | OUI | - | Contenu analysé |
| `detected_intent` | varchar | OUI | - | Intention détectée |
| `detected_language` | varchar | OUI | - | Langue |
| `suggested_team_ids` | uuid[] | OUI | - | Équipes suggérées |
| `confidence_scores` | jsonb | OUI | - | Scores confiance |
| `model_used` | varchar | OUI | - | Modèle IA |
| `tokens_used` | integer | OUI | - | Tokens utilisés |
| `processing_time_ms` | integer | OUI | - | Temps traitement |
| `analyzed_at` | timestamptz | OUI | now() | Date analyse |

### 33. `quick_replies`
> Réponses rapides

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `title` | text | NON | - | Titre |
| `content` | text | NON | - | Contenu |
| `usage_count` | integer | OUI | 0 | Utilisations |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 34. `webhook_logs`
> Logs webhooks

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `connected_account_id` | uuid | OUI | - | FK vers connected_accounts |
| `platform` | varchar | NON | - | Plateforme |
| `method` | varchar | OUI | - | Méthode HTTP |
| `headers` | jsonb | OUI | - | En-têtes |
| `body` | jsonb | OUI | - | Corps requête |
| `query_params` | jsonb | OUI | - | Paramètres |
| `status_code` | integer | OUI | - | Code statut |
| `response_body` | jsonb | OUI | - | Corps réponse |
| `error_message` | text | OUI | - | Message erreur |
| `processed` | boolean | OUI | false | Traité |
| `received_at` | timestamptz | OUI | now() | Reçu à |
| `processed_at` | timestamptz | OUI | - | Traité à |

---

## Module Vente

### 35. `vente_products`
> Catalogue produits/services

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | text | NON | - | Nom produit |
| `description` | text | NON | - | Description |
| `type` | text | NON | - | Type (product/service) |
| `category` | text | NON | - | Catégorie |
| `unit` | text | NON | - | Unité |
| `price` | numeric | NON | - | Prix vente |
| `cost` | numeric | OUI | - | Coût |
| `stock` | integer | OUI | - | Stock |
| `sku` | text | OUI | - | SKU |
| `status` | text | NON | 'active' | Statut |
| `is_stockable` | boolean | OUI | true | Stockable |
| `track_inventory` | boolean | OUI | true | Suivi stock |
| `min_stock_quantity` | integer | OUI | 5 | Stock minimum |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 36. `vente_quotes`
> Devis

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `number` | text | NON | - | Numéro devis |
| `client_name` | text | NON | - | Nom client |
| `client_email` | text | NON | - | Email client |
| `client_phone` | text | OUI | - | Téléphone |
| `client_address` | text | OUI | - | Adresse |
| `status` | text | NON | 'draft' | Statut |
| `total_ht` | numeric | NON | - | Total HT |
| `total_ttc` | numeric | NON | - | Total TTC |
| `tva_rate` | numeric | NON | 0.20 | Taux TVA |
| `valid_until` | timestamptz | NON | - | Valide jusqu'à |
| `notes` | text | OUI | - | Notes |
| `sent_at` | timestamptz | OUI | - | Envoyé à |
| `accepted_at` | timestamptz | OUI | - | Accepté à |
| `rejected_at` | timestamptz | OUI | - | Rejeté à |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 37. `vente_quote_items`
> Lignes de devis

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `quote_id` | uuid | NON | - | FK vers vente_quotes |
| `product_id` | uuid | OUI | - | FK vers vente_products |
| `product_name` | text | NON | - | Nom produit |
| `description` | text | NON | - | Description |
| `quantity` | numeric | NON | - | Quantité |
| `unit_price` | numeric | NON | - | Prix unitaire |
| `total` | numeric | NON | - | Total ligne |
| `order_index` | integer | NON | 0 | Ordre |

### 38. `vente_orders`
> Commandes

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `quote_id` | uuid | OUI | - | FK vers vente_quotes |
| `caisse_id` | uuid | OUI | - | FK vers caisses_journalieres |
| `warehouse_id` | uuid | OUI | - | FK vers stock_warehouses |
| `number` | text | NON | - | Numéro commande |
| `client_name` | text | NON | - | Nom client |
| `client_email` | text | NON | - | Email |
| `client_phone` | text | OUI | - | Téléphone |
| `client_address` | text | OUI | - | Adresse |
| `shipping_address` | text | OUI | - | Adresse livraison |
| `status` | text | NON | 'pending' | Statut |
| `payment_status` | text | NON | 'pending' | Statut paiement |
| `moyen_paiement` | text | OUI | 'cash' | Moyen paiement |
| `total_ht` | numeric | NON | - | Total HT |
| `total_ttc` | numeric | NON | - | Total TTC |
| `tva_rate` | numeric | NON | 0.20 | Taux TVA |
| `tracking_number` | text | OUI | - | N° suivi |
| `notes` | text | OUI | - | Notes |
| `confirmed_at` | timestamptz | OUI | - | Confirmé à |
| `shipped_at` | timestamptz | OUI | - | Expédié à |
| `delivered_at` | timestamptz | OUI | - | Livré à |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 39. `vente_order_items`
> Lignes de commande

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `order_id` | uuid | NON | - | FK vers vente_orders |
| `product_id` | uuid | OUI | - | FK vers vente_products |
| `product_name` | text | NON | - | Nom produit |
| `description` | text | NON | - | Description |
| `quantity` | numeric | NON | - | Quantité |
| `unit_price` | numeric | NON | - | Prix unitaire |
| `total` | numeric | NON | - | Total ligne |
| `order_index` | integer | NON | 0 | Ordre |

### 40. `vente_tickets`
> Tickets support

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `order_id` | uuid | OUI | - | FK vers vente_orders |
| `number` | text | NON | - | Numéro ticket |
| `subject` | text | NON | - | Sujet |
| `description` | text | NON | - | Description |
| `client_name` | text | NON | - | Nom client |
| `client_email` | text | NON | - | Email |
| `status` | text | NON | 'open' | Statut |
| `priority` | text | NON | 'medium' | Priorité |
| `category` | text | NON | - | Catégorie |
| `assigned_to` | text | OUI | - | Assigné à |
| `resolved_at` | timestamptz | OUI | - | Résolu à |
| `closed_at` | timestamptz | OUI | - | Fermé à |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 41. `vente_ticket_responses`
> Réponses tickets

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `ticket_id` | uuid | NON | - | FK vers vente_tickets |
| `author` | text | NON | - | Auteur |
| `author_email` | text | OUI | - | Email auteur |
| `message` | text | NON | - | Message |
| `attachments` | text[] | OUI | '{}' | Pièces jointes |
| `is_staff` | boolean | NON | false | Staff/client |
| `created_at` | timestamptz | OUI | now() | Date création |

### 42. `vente_stock_items`
> Stock simplifié (ancien système)

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `product_id` | uuid | NON | - | FK vers vente_products |
| `product_name` | text | NON | - | Nom produit |
| `sku` | text | NON | - | SKU |
| `category` | text | NON | - | Catégorie |
| `location` | text | NON | - | Emplacement |
| `quantity` | integer | NON | 0 | Quantité |
| `min_quantity` | integer | NON | 0 | Quantité min |
| `last_restocked_at` | timestamptz | OUI | - | Dernier réapprovisionnement |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 43. `vente_stock_movements`
> Mouvements stock simplifié

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `stock_item_id` | uuid | NON | - | FK vers vente_stock_items |
| `order_id` | uuid | OUI | - | FK vers vente_orders |
| `type` | text | NON | - | Type mouvement |
| `quantity` | integer | NON | - | Quantité |
| `reason` | text | NON | - | Raison |
| `reference` | text | OUI | - | Référence |
| `created_by` | text | NON | - | Créé par |
| `created_at` | timestamptz | OUI | now() | Date création |

---

## Module Comptabilité

### 44. `compta_quotes`
> Devis comptabilité

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `client_id` | uuid | OUI | - | FK vers leads |
| `quote_number` | text | NON | - | Numéro devis |
| `status` | text | NON | 'draft' | Statut |
| `currency` | text | NON | 'XOF' | Devise |
| `issue_date` | date | NON | CURRENT_DATE | Date émission |
| `expiration_date` | date | NON | - | Date expiration |
| `subtotal` | numeric | NON | 0 | Sous-total |
| `tax_rate` | numeric | NON | 18.00 | Taux taxe |
| `tax_amount` | numeric | NON | 0 | Montant taxe |
| `discount_amount` | numeric | OUI | 0 | Remise |
| `total` | numeric | NON | 0 | Total |
| `notes` | text | OUI | - | Notes |
| `terms` | text | OUI | - | Conditions |
| `created_from_ocr` | boolean | OUI | false | Créé par OCR |
| `ocr_scan_id` | uuid | OUI | - | FK vers compta_ocr_scans |
| `converted_to_invoice_id` | uuid | OUI | - | FK vers compta_invoices |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 45. `compta_quote_items`
> Lignes devis comptabilité

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `quote_id` | uuid | NON | - | FK vers compta_quotes |
| `product_id` | uuid | OUI | - | FK vers vente_products |
| `description` | text | NON | - | Description |
| `quantity` | numeric | NON | 1 | Quantité |
| `unit_price` | numeric | NON | - | Prix unitaire |
| `discount_percent` | numeric | OUI | 0 | % remise |
| `discount_amount` | numeric | OUI | 0 | Montant remise |
| `tax_rate` | numeric | NON | 18.00 | Taux taxe |
| `tax_amount` | numeric | NON | 0 | Montant taxe |
| `subtotal` | numeric | NON | 0 | Sous-total |
| `total` | numeric | NON | 0 | Total |
| `line_order` | integer | NON | 0 | Ordre |
| `created_at` | timestamptz | NON | now() | Date création |

### 46. `compta_invoices`
> Factures

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `client_id` | uuid | OUI | - | FK vers leads |
| `quote_id` | uuid | OUI | - | FK vers compta_quotes |
| `invoice_number` | text | NON | - | Numéro facture |
| `status` | text | NON | 'draft' | Statut |
| `currency` | text | NON | 'XOF' | Devise |
| `issue_date` | date | NON | CURRENT_DATE | Date émission |
| `due_date` | date | NON | - | Date échéance |
| `subtotal` | numeric | NON | 0 | Sous-total |
| `tax_rate` | numeric | NON | 18.00 | Taux taxe |
| `tax_amount` | numeric | NON | 0 | Montant taxe |
| `discount_amount` | numeric | OUI | 0 | Remise |
| `total` | numeric | NON | 0 | Total |
| `amount_paid` | numeric | NON | 0 | Montant payé |
| `balance_due` | numeric | NON | 0 | Solde dû |
| `paid_at` | timestamptz | OUI | - | Payé à |
| `notes` | text | OUI | - | Notes |
| `terms` | text | OUI | - | Conditions |
| `created_from_ocr` | boolean | OUI | false | Créé par OCR |
| `ocr_scan_id` | uuid | OUI | - | FK vers compta_ocr_scans |
| `stock_impact_applied` | boolean | OUI | false | Impact stock appliqué |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 47. `compta_invoice_items`
> Lignes factures

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `invoice_id` | uuid | NON | - | FK vers compta_invoices |
| `product_id` | uuid | OUI | - | FK vers vente_products |
| `description` | text | NON | - | Description |
| `quantity` | numeric | NON | 1 | Quantité |
| `unit_price` | numeric | NON | - | Prix unitaire |
| `discount_percent` | numeric | OUI | 0 | % remise |
| `discount_amount` | numeric | OUI | 0 | Montant remise |
| `tax_rate` | numeric | NON | 18.00 | Taux taxe |
| `tax_amount` | numeric | NON | 0 | Montant taxe |
| `subtotal` | numeric | NON | 0 | Sous-total |
| `total` | numeric | NON | 0 | Total |
| `line_order` | integer | NON | 0 | Ordre |
| `created_at` | timestamptz | NON | now() | Date création |

### 48. `compta_payments`
> Paiements

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `invoice_id` | uuid | NON | - | FK vers compta_invoices |
| `amount` | numeric | NON | - | Montant |
| `payment_date` | date | NON | CURRENT_DATE | Date paiement |
| `payment_method` | text | NON | 'cash' | Moyen paiement |
| `reference` | text | OUI | - | Référence |
| `notes` | text | OUI | - | Notes |
| `created_by` | text | OUI | - | Créé par |
| `created_at` | timestamptz | NON | now() | Date création |

### 49. `compta_ocr_scans`
> Scans OCR

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `file_url` | text | NON | - | URL fichier |
| `file_name` | text | NON | - | Nom fichier |
| `file_type` | text | NON | - | Type fichier |
| `file_path` | text | OUI | - | Chemin |
| `file_size` | integer | OUI | - | Taille |
| `raw_text` | text | OUI | - | Texte brut |
| `extracted_data` | jsonb | OUI | - | Données extraites |
| `confidence_score` | numeric | OUI | - | Score confiance |
| `status` | text | NON | 'pending' | Statut |
| `error_message` | text | OUI | - | Message erreur |
| `created_quote_id` | uuid | OUI | - | FK vers compta_quotes |
| `created_invoice_id` | uuid | OUI | - | FK vers compta_invoices |
| `processed_at` | timestamptz | OUI | - | Traité à |
| `created_at` | timestamptz | NON | now() | Date création |

### 50. `invoice_reminders`
> Relances factures

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `invoice_id` | uuid | NON | - | FK vers compta_invoices |
| `reminder_type` | text | NON | - | Type relance |
| `days_overdue` | integer | NON | - | Jours de retard |
| `status` | text | NON | 'sent' | Statut |
| `error_message` | text | OUI | - | Message erreur |
| `sent_at` | timestamptz | NON | now() | Envoyé à |
| `created_at` | timestamptz | NON | now() | Date création |

---

## Module Stock & Inventaire

### 51. `stock_warehouses`
> Entrepôts/magasins

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | text | NON | - | Nom |
| `type` | text | OUI | 'WAREHOUSE' | Type (WAREHOUSE/STORE) |
| `address` | text | OUI | - | Adresse |
| `city` | text | OUI | - | Ville |
| `postal_code` | text | OUI | - | Code postal |
| `country` | text | OUI | 'Senegal' | Pays |
| `phone` | text | OUI | - | Téléphone |
| `email` | text | OUI | - | Email |
| `manager_name` | text | OUI | - | Responsable |
| `is_active` | boolean | OUI | true | Actif |
| `is_default` | boolean | OUI | false | Par défaut |
| `metadata` | jsonb | OUI | '{}' | Métadonnées |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 52. `stock_movements`
> Mouvements de stock

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `product_id` | uuid | NON | - | FK vers vente_products |
| `warehouse_id` | uuid | NON | - | FK vers stock_warehouses |
| `destination_warehouse_id` | uuid | OUI | - | FK entrepôt destination (transfert) |
| `movement_type` | text | NON | - | Type (IN/OUT/ADJUSTMENT/TRANSFER) |
| `quantity` | integer | NON | - | Quantité |
| `unit_cost` | numeric | OUI | 0 | Coût unitaire |
| `total_cost` | numeric | OUI | 0 | Coût total |
| `reference_type` | text | OUI | - | Type référence |
| `reference_id` | text | OUI | - | ID référence |
| `reason` | text | OUI | - | Raison |
| `notes` | text | OUI | - | Notes |
| `performed_by` | text | OUI | - | Effectué par |
| `movement_date` | timestamptz | OUI | now() | Date mouvement |
| `created_at` | timestamptz | OUI | now() | Date création |

### 53. `stock_adjustments`
> Ajustements de stock

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `product_id` | text | NON | - | ID produit |
| `warehouse_id` | text | NON | - | ID entrepôt |
| `adjustment_type` | text | NON | - | Type ajustement |
| `reason` | text | NON | - | Raison |
| `quantity_before` | integer | NON | - | Quantité avant |
| `quantity_change` | integer | NON | - | Changement |
| `quantity_after` | integer | NON | - | Quantité après |
| `cost_impact` | numeric | OUI | - | Impact coût |
| `notes` | text | OUI | - | Notes |
| `performed_by` | text | NON | - | Effectué par |
| `performed_at` | timestamptz | NON | now() | Date |
| `created_at` | timestamptz | NON | now() | Date création |

### 54. `stock_inventories`
> Inventaires

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `warehouse_id` | uuid | NON | - | FK vers stock_warehouses |
| `inventory_number` | text | NON | - | Numéro inventaire |
| `status` | text | NON | 'draft' | Statut |
| `inventory_date` | date | NON | CURRENT_DATE | Date inventaire |
| `counted_by` | text | OUI | - | Compté par |
| `notes` | text | OUI | - | Notes |
| `completed_at` | timestamptz | OUI | - | Terminé à |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 55. `stock_inventory_items`
> Lignes d'inventaire

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `inventory_id` | uuid | NON | - | FK vers stock_inventories |
| `product_id` | uuid | NON | - | FK vers vente_products |
| `expected_quantity` | integer | NON | 0 | Quantité attendue |
| `counted_quantity` | integer | OUI | - | Quantité comptée |
| `difference` | integer | OUI | - | Écart |
| `notes` | text | OUI | - | Notes |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 56. `stock_digital_assets`
> Actifs numériques (licences, codes)

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `product_id` | uuid | NON | - | FK vers vente_products |
| `code` | text | NON | - | Code |
| `serial_number` | text | OUI | - | Numéro série |
| `license_key` | text | OUI | - | Clé licence |
| `download_url` | text | OUI | - | URL téléchargement |
| `status` | text | OUI | 'available' | Statut |
| `assigned_to` | text | OUI | - | Assigné à |
| `assigned_at` | timestamptz | OUI | - | Date assignation |
| `expires_at` | timestamptz | OUI | - | Expiration |
| `metadata` | jsonb | OUI | '{}' | Métadonnées |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 57. `suppliers`
> Fournisseurs

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | text | NON | - | Nom |
| `company` | text | OUI | - | Entreprise |
| `email` | text | OUI | - | Email |
| `phone` | text | OUI | - | Téléphone |
| `address` | text | OUI | - | Adresse |
| `city` | text | OUI | - | Ville |
| `country` | text | OUI | 'Sénégal' | Pays |
| `tax_number` | text | OUI | - | N° fiscal |
| `payment_terms` | text | OUI | - | Conditions paiement |
| `bank_account` | text | OUI | - | Compte bancaire |
| `notes` | text | OUI | - | Notes |
| `is_active` | boolean | OUI | true | Actif |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 58. `product_suppliers`
> Liaison produits-fournisseurs

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `product_id` | text | NON | - | ID produit |
| `supplier_id` | uuid | NON | - | FK vers suppliers |
| `supplier_sku` | text | OUI | - | SKU fournisseur |
| `purchase_price` | numeric | OUI | - | Prix achat |
| `lead_time_days` | integer | OUI | - | Délai livraison |
| `min_order_quantity` | integer | OUI | 1 | Quantité min commande |
| `is_preferred` | boolean | OUI | false | Fournisseur préféré |
| `notes` | text | OUI | - | Notes |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 59. `purchase_orders`
> Commandes d'achat

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `supplier_id` | uuid | NON | - | FK vers suppliers |
| `warehouse_id` | uuid | OUI | - | FK vers stock_warehouses |
| `order_number` | text | NON | - | Numéro commande |
| `status` | text | NON | 'draft' | Statut |
| `order_date` | date | NON | CURRENT_DATE | Date commande |
| `expected_delivery_date` | date | OUI | - | Livraison prévue |
| `actual_delivery_date` | date | OUI | - | Livraison réelle |
| `subtotal` | numeric | OUI | 0 | Sous-total |
| `tax_rate` | numeric | OUI | 0 | Taux taxe |
| `tax_amount` | numeric | OUI | 0 | Montant taxe |
| `shipping_cost` | numeric | OUI | 0 | Frais livraison |
| `total` | numeric | OUI | 0 | Total |
| `amount_paid` | numeric | OUI | 0 | Montant payé |
| `payment_status` | text | OUI | 'unpaid' | Statut paiement |
| `notes` | text | OUI | - | Notes |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

### 60. `purchase_order_items`
> Lignes commandes achat

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `purchase_order_id` | uuid | NON | - | FK vers purchase_orders |
| `product_id` | uuid | NON | - | FK vers vente_products |
| `quantity` | integer | NON | - | Quantité |
| `unit_price` | numeric | NON | - | Prix unitaire |
| `tax_rate` | numeric | OUI | 0 | Taux taxe |
| `discount_percent` | numeric | OUI | 0 | % remise |
| `subtotal` | numeric | NON | - | Sous-total |
| `total` | numeric | NON | - | Total |
| `quantity_received` | integer | OUI | 0 | Quantité reçue |
| `created_at` | timestamptz | NON | now() | Date création |

---

## Module Caisse POS

### 61. `caisses_journalieres`
> Caisses journalières

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `warehouse_id` | uuid | OUI | - | FK vers stock_warehouses |
| `date` | date | NON | - | Date |
| `statut` | text | OUI | 'ouverte' | Statut |
| `solde_ouverture` | numeric | OUI | 0 | Solde ouverture |
| `solde_cloture` | numeric | OUI | - | Solde clôture |
| `solde_theorique` | numeric | OUI | 0 | Solde théorique |
| `ecart` | numeric | OUI | - | Écart |
| `heure_ouverture` | timestamptz | OUI | - | Heure ouverture |
| `heure_cloture` | timestamptz | OUI | - | Heure clôture |
| `ouvert_par` | uuid | OUI | - | Ouvert par |
| `cloture_par` | uuid | OUI | - | Clôturé par |
| `notes_ouverture` | text | OUI | - | Notes ouverture |
| `notes_cloture` | text | OUI | - | Notes clôture |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 62. `mouvements_caisse`
> Mouvements de caisse

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `caisse_id` | uuid | NON | - | FK vers caisses_journalieres |
| `user_id` | uuid | NON | - | Utilisateur |
| `type` | text | NON | - | Type (vente/entree/sortie) |
| `montant` | numeric | NON | - | Montant |
| `moyen_paiement` | text | NON | - | Moyen paiement |
| `reference_type` | text | OUI | - | Type référence |
| `reference_id` | uuid | OUI | - | ID référence |
| `description` | text | OUI | - | Description |
| `created_at` | timestamptz | OUI | now() | Date création |

---

## Module Équipes & Collaboration

### 63. `teams`
> Équipes

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `name` | varchar | NON | - | Nom équipe |
| `description` | text | OUI | - | Description |
| `color` | varchar | NON | - | Couleur |
| `member_count` | integer | OUI | 0 | Nb membres |
| `conversation_count` | integer | OUI | 0 | Nb conversations |
| `created_at` | timestamptz | OUI | now() | Date création |
| `updated_at` | timestamptz | OUI | now() | Dernière mise à jour |

### 64. `team_members`
> Membres d'équipe

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `team_id` | uuid | NON | - | FK vers teams |
| `user_id` | uuid | OUI | - | FK vers profiles |
| `email` | varchar | NON | - | Email |
| `role` | varchar | OUI | 'member' | Rôle |
| `status` | varchar | OUI | 'pending' | Statut |
| `invitation_token` | text | OUI | - | Token invitation |
| `token_expires_at` | timestamptz | OUI | - | Expiration token |
| `invited_by` | uuid | NON | - | Invité par |
| `invited_at` | timestamptz | OUI | now() | Date invitation |
| `accepted_at` | timestamptz | OUI | - | Date acceptation |
| `created_at` | timestamptz | OUI | now() | Date création |

### 65. `conversation_teams`
> Assignation conversations-équipes

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `conversation_id` | uuid | NON | - | FK vers conversations |
| `team_id` | uuid | NON | - | FK vers teams |
| `auto_assigned` | boolean | OUI | true | Assignation auto |
| `confidence_score` | numeric | OUI | - | Score confiance |
| `ai_reasoning` | text | OUI | - | Raisonnement IA |
| `assigned_by` | uuid | OUI | - | Assigné par |
| `assigned_at` | timestamptz | OUI | now() | Date assignation |

---

## Configuration

### 66. `company_settings`
> Paramètres entreprise

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | uuid | NON | gen_random_uuid() | Clé primaire |
| `user_id` | uuid | NON | - | Propriétaire |
| `company_name` | text | OUI | - | Nom entreprise |
| `address` | text | OUI | - | Adresse |
| `city` | text | OUI | - | Ville |
| `postal_code` | text | OUI | - | Code postal |
| `country` | text | OUI | 'France' | Pays |
| `phone` | text | OUI | - | Téléphone |
| `email` | text | OUI | - | Email |
| `website` | text | OUI | - | Site web |
| `siret` | text | OUI | - | SIRET |
| `tva_number` | text | OUI | - | N° TVA |
| `logo_url` | text | OUI | - | URL logo |
| `signature_url` | text | OUI | - | URL signature |
| `bank_name` | text | OUI | - | Nom banque |
| `bank_iban` | text | OUI | - | IBAN |
| `bank_bic` | text | OUI | - | BIC |
| `default_payment_terms` | text | OUI | 'Paiement à 30 jours' | Conditions paiement |
| `default_notes` | text | OUI | - | Notes par défaut |
| `invoice_prefix` | text | OUI | 'FAC' | Préfixe factures |
| `quote_prefix` | text | OUI | 'DEV' | Préfixe devis |
| `default_invoice_template` | text | OUI | 'classic' | Modèle facture |
| `default_quote_template` | text | OUI | 'classic' | Modèle devis |
| `created_at` | timestamptz | NON | now() | Date création |
| `updated_at` | timestamptz | NON | now() | Dernière mise à jour |

---

## Vues (Views)

Les vues suivantes sont disponibles pour simplifier les requêtes :

| Vue | Description |
|-----|-------------|
| `competitor_latest_analysis` | Dernière analyse de chaque concurrent |
| `competitor_comparison` | Comparaison des métriques concurrents |
| `competitor_recent_activity` | Activité récente des concurrents (30 jours) |
| `my_business_latest_analysis` | Dernière analyse de mon entreprise |
| `conversations_with_last_message` | Conversations avec dernier message |
| `conversations_with_teams` | Conversations avec équipes assignées |
| `connected_accounts_safe` | Comptes connectés (sans tokens) |
| `connected_accounts_with_stats` | Comptes avec statistiques |
| `teams_with_stats` | Équipes avec statistiques |
| `crm_leads_by_sector` | Leads groupés par secteur |
| `inbox_stats` | Statistiques boîte de réception |
| `stock_levels` | Niveaux de stock par entrepôt |

---

## Diagramme ER

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DIAGRAMME ER SIMPLIFIÉ                          │
└─────────────────────────────────────────────────────────────────────────────┘

                                    UTILISATEURS
                                    ┌─────────┐
                                    │profiles │
                                    │    ↑    │
                            ┌───────┼─user_id─┼───────┐
                            │       │         │       │
                            │       └────┬────┘       │
                            │            │            │
                ┌───────────┴───┐    ┌───┴───┐    ┌───┴───────────┐
                │  user_roles   │    │subscr.│    │company_settings│
                └───────────────┘    └───────┘    └───────────────┘

                                      CRM
        ┌────────────┐      ┌────────────┐      ┌────────────┐
        │crm_sectors │──┬───│crm_segments│      │  crm_tags  │
        └─────┬──────┘  │   └────────────┘      └─────┬──────┘
              │         │                             │
              └─────────┼─────────────────────────────┘
                        │
                        ▼
                 ┌────────────┐
                 │   leads    │◄──────────────────────────────┐
                 └─────┬──────┘                               │
                       │                                      │
           ┌───────────┼───────────┐                          │
           ▼           ▼           ▼                          │
    ┌────────────┐ ┌────────────┐ ┌────────────┐              │
    │crm_tasks   │ │crm_campaign│ │crm_interact│              │
    └────────────┘ └────────────┘ └────────────┘              │
                                                              │
                              VENTE / COMPTA                  │
    ┌────────────┐    ┌────────────┐    ┌────────────┐        │
    │vente_prod. │◄───│vente_quotes│    │compta_quote│───────►│
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘        │
          │                 │                 │               │
          │    ┌────────────┘                 │               │
          │    ▼                              ▼               │
          │ ┌────────────┐    ┌────────────┐ ┌────────────┐   │
          │ │vente_orders│    │compta_inv. │◄│compta_items│   │
          │ └─────┬──────┘    └─────┬──────┘ └────────────┘   │
          │       │                 │                         │
          │       │                 ▼                         │
          │       │           ┌────────────┐                  │
          │       │           │compta_pay. │                  │
          │       │           └────────────┘                  │
          │       │                                           │
          │       │           STOCK                           │
          │       ▼                                           │
          │  ┌────────────┐    ┌────────────┐                 │
          └─►│stock_movem.│◄───│stock_wareh.│                 │
             └────────────┘    └─────┬──────┘                 │
                                     │                        │
                               ┌─────┴─────┐                  │
                               ▼           ▼                  │
                        ┌────────────┐ ┌────────────┐         │
                        │stock_inven.│ │caisse_jour.│         │
                        └────────────┘ └─────┬──────┘         │
                                             │                │
                                             ▼                │
                                       ┌────────────┐         │
                                       │mouv_caisse │         │
                                       └────────────┘         │
                                                              │
                              CONCURRENCE                     │
    ┌────────────┐    ┌────────────┐    ┌────────────┐        │
    │competitors │───►│comp_analys.│───►│comp_posts  │        │
    └─────┬──────┘    └────────────┘    └─────┬──────┘        │
          │                                   │               │
          └────────────────┐                  ▼               │
                           ▼           ┌────────────┐         │
                    ┌────────────┐     │post_comment│         │
                    │comp_metric.│     └────────────┘         │
                    └────────────┘                            │
                                                              │
    ┌────────────┐    ┌────────────┐                          │
    │my_business │───►│my_bus_anal.│                          │
    └────────────┘    └────────────┘                          │
                                                              │
                              INBOX                           │
    ┌────────────┐    ┌────────────┐    ┌────────────┐        │
    │conn_accoun.│───►│conversatio.│───►│  messages  │        │
    └────────────┘    └─────┬──────┘    └────────────┘        │
                            │                                 │
                            ▼                                 │
                     ┌────────────┐    ┌────────────┐         │
                     │conv_teams  │◄───│   teams    │         │
                     └────────────┘    └─────┬──────┘         │
                                             │                │
                                             ▼                │
                                       ┌────────────┐         │
                                       │team_member.│         │
                                       └────────────┘         │
                                                              │
                            MARKETING                         │
    ┌────────────┐    ┌────────────┐    ┌────────────┐        │
    │   posts    │───►│post_analyt.│    │media_arch. │        │
    └─────┬──────┘    └────────────┘    └────────────┘        │
          │                                                   │
          ▼                                                   │
    ┌────────────┐                                            │
    │user_post_c.│                                            │
    └────────────┘                                            │
```

---

## Notes Importantes

1. **Row Level Security (RLS)**: 232 politiques RLS sont en place pour sécuriser l'accès aux données par utilisateur
2. **Multi-tenant**: Chaque table principale a une colonne `user_id` pour l'isolation des données
3. **Timestamps automatiques**: La plupart des tables ont `created_at` et `updated_at`
4. **UUID**: Toutes les clés primaires utilisent `uuid` avec `gen_random_uuid()`
5. **Devise par défaut**: XOF (Franc CFA) pour le Sénégal

---

*Document généré automatiquement - PostElma v2.0*
