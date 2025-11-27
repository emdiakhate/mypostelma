# Architecture de la Base de Données - PostElma

## Vue d'ensemble
Cette base de données Supabase supporte une plateforme complète de gestion des réseaux sociaux avec CRM intégré, analyse de concurrence, boîte de réception unifiée, et gestion d'équipe.

---

## 1. GESTION DES UTILISATEURS

### `profiles`
Table principale des profils utilisateurs avec quotas et paramètres.

**Colonnes:**
- `id` (uuid, PK) - Référence à auth.users
- `email` (text) - Email de l'utilisateur
- `name` (text) - Nom complet
- `avatar` (text) - URL de l'avatar
- `upload_post_username` (text) - Nom d'utilisateur Upload-Post
- `beta_user` (boolean) - Statut utilisateur beta
- `is_active` (boolean) - Compte actif
- `posts_unlimited` (boolean) - Publications illimitées
- `ai_image_generation_count/limit` (integer) - Quota images IA
- `ai_video_generation_count/limit` (integer) - Quota vidéos IA
- `lead_generation_count/limit` (integer) - Quota génération leads
- `quota_reset_date` (timestamp) - Date de réinitialisation quotas
- `created_at`, `last_login` (timestamp)

**Politiques RLS:**
- Lecture publique (utilisateurs actifs uniquement)
- Mise à jour: propriétaire uniquement
- Insertion/Suppression: bloquée (gérée par trigger)

**Trigger:** `handle_new_user()` - Création automatique du profil à l'inscription

### `user_roles`
Gestion des rôles utilisateurs (architecture sécurisée).

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `role` (enum: admin, manager, moderator, user)

**Fonction:** `has_role(user_id, role)` - Vérification sécurisée des rôles

### `subscriptions`
Gestion des abonnements utilisateurs.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `plan_type` (text) - Type d'abonnement
- `status` (text) - Statut abonnement
- `beta_user` (boolean)
- `trial_ends_at` (timestamp)
- `created_at`, `updated_at` (timestamp)

---

## 2. GESTION DES PUBLICATIONS

### `posts`
Publications créées par les utilisateurs.

**Colonnes:**
- `id` (uuid, PK)
- `author_id` (uuid, FK → profiles)
- `content` (text) - Contenu textuel
- `captions` (jsonb) - Légendes par plateforme
- `images` (text[]) - URLs des images
- `video`, `video_thumbnail` (text) - Vidéo et miniature
- `platforms` (text[]) - Plateformes cibles
- `accounts` (text[]) - Comptes sociaux liés
- `status` (enum) - draft, scheduled, published, failed
- `campaign`, `campaign_color` (text) - Campagne associée
- `scheduled_time`, `published_at` (timestamp)
- `day_column` (text), `time_slot` (integer) - Planification calendrier
- `sentiment_label`, `sentiment_score` (text/float) - Analyse sentiment
- `comments_sentiment_count` (integer)
- `rejection_reason` (text)
- `created_at`, `updated_at` (timestamp)

**Politiques RLS:**
- CRUD complet pour le propriétaire (author_id)

### `post_analytics`
Statistiques des publications.

**Colonnes:**
- `id` (uuid, PK)
- `post_id` (uuid, FK → posts)
- `likes`, `comments`, `shares`, `views`, `reach` (integer)
- `updated_at` (timestamp)

### `user_post_comments`
Commentaires sur les publications des utilisateurs.

**Colonnes:**
- `id` (uuid, PK)
- `post_id` (uuid, FK → posts)
- `author_username`, `comment_text`, `comment_url` (text)
- `author_is_verified` (boolean)
- `comment_likes` (integer)
- `posted_at`, `scraped_at` (timestamp)
- `sentiment_label`, `sentiment_score`, `sentiment_explanation` (text/float)
- `keywords` (text[])
- `is_user_reply` (boolean)

### `user_sentiment_statistics`
Statistiques d'analyse de sentiment hebdomadaires.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `week_start_date`, `week_end_date` (date)
- `total_posts`, `total_comments` (integer)
- `avg_sentiment_score` (float)
- `positive_count`, `neutral_count`, `negative_count` (integer)
- `positive_percentage`, `neutral_percentage`, `negative_percentage` (float)
- `top_keywords` (jsonb)
- `response_rate`, `avg_engagement_rate` (float)
- `analyzed_at`, `created_at` (timestamp)

---

## 3. ANALYSE DE LA CONCURRENCE

### `competitors`
Profils des concurrents suivis.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `name`, `industry`, `description` (text)
- `website_url` (text)
- `instagram_url`, `instagram_followers` (text)
- `facebook_url`, `facebook_likes` (text)
- `linkedin_url`, `linkedin_followers` (text)
- `twitter_url`, `tiktok_url`, `youtube_url` (text)
- `analysis_count` (integer)
- `added_at`, `last_analyzed_at` (timestamp)

**Politiques RLS:**
- CRUD complet pour le propriétaire

### `competitor_analysis`
Analyses IA détaillées des concurrents.

**Colonnes:**
- `id` (uuid, PK)
- `competitor_id` (uuid, FK → competitors)
- `analyzed_at` (timestamp)
- `version`, `tokens_used` (integer)
- `analysis_cost` (float)
- **Données par plateforme (JSONB):**
  - `instagram_data`, `facebook_data`, `linkedin_data`
  - `twitter_data`, `tiktok_data`, `website_data`
- **Analyse structurée (JSONB):**
  - `context_objectives` - Contexte et objectifs
  - `brand_identity` - Identité de marque
  - `offering_positioning` - Offre et positionnement
  - `digital_presence` - Présence digitale
  - `swot` - Forces, faiblesses, opportunités, menaces
  - `competitive_analysis` - Analyse concurrentielle
  - `insights_recommendations` - Insights et recommandations
- **Texte simple:**
  - `positioning`, `content_strategy`, `tone`, `target_audience`
  - `summary`, `recommendations`, `social_media_presence`
  - `estimated_budget`
  - `strengths`, `weaknesses`, `opportunities_for_us` (text[])
  - `key_differentiators` (text[])
- `raw_data`, `metadata` (jsonb)

**Trigger:** `update_competitor_analysis_count()` - Incrémente compteur d'analyses

### `competitor_posts`
Posts scrappés des concurrents.

**Colonnes:**
- `id` (uuid, PK)
- `competitor_id` (uuid, FK → competitors)
- `analysis_id` (uuid, FK → competitor_analysis)
- `platform` (text)
- `caption`, `post_url` (text)
- `media_urls` (text[])
- `hashtags` (text[])
- `likes`, `comments`, `shares`, `views`, `comments_count` (integer)
- `engagement_rate` (float)
- `content_type`, `detected_tone` (text)
- `sentiment_label`, `sentiment_score` (text/float)
- `posted_at`, `scraped_at` (timestamp)
- `raw_data` (jsonb)

**Trigger:** `calculate_engagement_rate()` - Calcul automatique taux engagement

### `post_comments`
Commentaires sur les posts des concurrents.

**Colonnes:**
- `id` (uuid, PK)
- `post_id` (uuid, FK → competitor_posts)
- `author_username`, `comment_text`, `comment_url` (text)
- `author_is_verified` (boolean)
- `comment_likes` (integer)
- `posted_at`, `scraped_at` (timestamp)
- `sentiment_label`, `sentiment_score`, `sentiment_explanation` (text/float)
- `keywords` (text[])
- `is_competitor_reply` (boolean)

### `competitor_metrics_history`
Historique des métriques concurrents.

**Colonnes:**
- `id` (uuid, PK)
- `competitor_id` (uuid, FK → competitors)
- `instagram_followers`, `instagram_following`, `instagram_posts_count` (integer)
- `facebook_likes`, `linkedin_followers`, `linkedin_employees` (integer)
- `avg_likes`, `avg_comments`, `avg_engagement_rate` (float)
- `posts_last_7_days`, `posts_last_30_days` (integer)
- `recorded_at` (timestamp)

### `sentiment_statistics`
Statistiques de sentiment agrégées par concurrent.

**Colonnes:**
- `id` (uuid, PK)
- `competitor_id` (uuid, FK → competitors)
- `analysis_id` (uuid, FK → competitor_analysis)
- `total_posts`, `total_comments` (integer)
- `avg_sentiment_score` (float)
- `positive_count`, `neutral_count`, `negative_count` (integer)
- `positive_percentage`, `neutral_percentage`, `negative_percentage` (float)
- `top_keywords` (jsonb)
- `response_rate`, `avg_engagement_rate` (float)
- `analyzed_at`, `created_at` (timestamp)

---

## 4. MON ENTREPRISE & ANALYSE COMPARATIVE

### `my_business`
Profil de l'entreprise de l'utilisateur.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `business_name`, `industry`, `description` (text)
- `website_url` (text)
- URLs et followers réseaux sociaux (même structure que competitors)
- `last_analyzed_at`, `created_at`, `updated_at` (timestamp)

### `my_business_analysis`
Analyses IA de l'entreprise utilisateur.

**Colonnes:**
- `id` (uuid, PK)
- `business_id` (uuid, FK → my_business)
- `analyzed_at` (timestamp)
- `version` (integer)
- **Structure identique à competitor_analysis (JSONB):**
  - `context_objectives`, `brand_identity`, `offering_positioning`
  - `digital_presence`, `swot`, `competitive_analysis`
  - `insights_recommendations`
- `raw_data`, `metadata` (jsonb)

### `comparative_analysis`
Comparaisons business vs concurrents.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `my_business_id` (uuid, FK → my_business)
- `competitor_ids` (uuid[]) - Liste des concurrents comparés
- `analysis_date` (timestamp)
- `overall_comparison` (jsonb) - Comparaison globale
- `domain_comparisons` (jsonb) - Comparaisons par domaine
- `personalized_recommendations` (jsonb)
- `data_insights` (jsonb)

---

## 5. CRM & GESTION DES LEADS

### `crm_sectors`
Secteurs d'activité CRM.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `name`, `description` (text)
- `color`, `icon` (text)
- `created_at`, `updated_at` (timestamp)

### `crm_segments`
Segments dans les secteurs.

**Colonnes:**
- `id` (uuid, PK)
- `sector_id` (uuid, FK → crm_sectors)
- `name`, `description` (text)
- `created_at`, `updated_at` (timestamp)

### `crm_tags`
Tags pour catégoriser les leads.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `sector_id` (uuid, FK → crm_sectors, nullable)
- `name`, `category` (text)
- `created_at` (timestamp)

### `leads`
Base de données des prospects.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `sector_id`, `segment_id` (uuid, FK, nullable)
- `name`, `category` (text)
- `address`, `city`, `postal_code` (text)
- `phone`, `email`, `website`, `whatsapp` (text)
- `google_maps_url`, `image_url` (text)
- `google_rating` (numeric), `google_reviews_count` (integer)
- `business_hours` (jsonb)
- `social_media` (jsonb) - Liens réseaux sociaux
- `metrics` (jsonb) - Métriques personnalisées
- `status` (enum) - new, contacted, interested, client, lost
- `score` (integer) - Score de qualification
- `tags` (text[])
- `notes` (text)
- `source` (text) - manual, api, import, etc.
- `added_at`, `last_contacted_at` (timestamp)
- `created_at`, `updated_at` (timestamp)

### `crm_campaigns`
Campagnes marketing/communication.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `name`, `description` (text)
- `channel` (text) - email, sms, whatsapp, etc.
- `subject`, `message` (text)
- `status` (text) - draft, scheduled, sending, completed
- **Ciblage:**
  - `target_sector_ids`, `target_segment_ids` (uuid[])
  - `target_tags`, `target_status`, `target_cities` (text[])
- **Statistiques:**
  - `total_leads`, `sent_count`, `delivered_count` (integer)
  - `read_count`, `replied_count`, `failed_count` (integer)
- `scheduled_at`, `sent_at`, `completed_at` (timestamp)
- `created_at`, `updated_at` (timestamp)

### `crm_lead_interactions`
Historique des interactions avec leads.

**Colonnes:**
- `id` (uuid, PK)
- `lead_id` (uuid, FK → leads)
- `campaign_id` (uuid, FK → crm_campaigns, nullable)
- `user_id` (uuid, FK → profiles)
- `type` (text) - email, call, meeting, note, etc.
- `channel` (text)
- `subject`, `content` (text)
- `status` (text)
- `metadata` (jsonb)
- `created_at` (timestamp)

### `crm_tasks`
Tâches CRM.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `lead_id` (uuid, FK → leads, nullable)
- `assigned_to` (uuid, FK → profiles, nullable)
- `title`, `description` (text)
- `type` (text) - call, email, meeting, follow_up
- `priority` (text) - low, medium, high
- `status` (text) - pending, in_progress, completed, cancelled
- `due_date`, `completed_at` (timestamp)
- `created_at`, `updated_at` (timestamp)

---

## 6. BOÎTE DE RÉCEPTION UNIFIÉE

### `connected_accounts`
Comptes connectés (Gmail, Outlook, Telegram, WhatsApp).

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `platform` (text) - gmail, outlook, telegram, whatsapp_twilio
- `platform_account_id` (text) - ID unique de la plateforme
- `account_name`, `avatar_url` (text)
- `status` (text) - active, error, disconnected
- `error_message` (text)
- `access_token`, `refresh_token` (text) - OAuth tokens
- `token_expires_at` (timestamp)
- `config` (jsonb) - Configuration spécifique plateforme
- `messages_sent`, `messages_received` (integer)
- `connected_at`, `last_sync_at`, `updated_at` (timestamp)

**Contrainte:** UNIQUE(user_id, platform, platform_account_id)

**Trigger:** `update_connected_account_message_counts()` - Incrémente compteurs messages

### `conversations`
Conversations avec contacts externes.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `connected_account_id` (uuid, FK → connected_accounts, nullable)
- `platform` (text)
- `platform_conversation_id` (text) - ID unique conversation plateforme
- **Participant:**
  - `participant_id`, `participant_name` (text)
  - `participant_username`, `participant_avatar_url` (text)
- `status` (text) - unread, read, archived, resolved
- `tags` (text[])
- `notes` (text)
- `sentiment` (text) - positive, neutral, negative
- `assigned_to` (uuid, FK → profiles, nullable)
- `assigned_at` (timestamp)
- `last_message_at`, `created_at`, `updated_at` (timestamp)

**Contrainte:** UNIQUE(user_id, platform, platform_conversation_id)

**Realtime activée:** Mises à jour en temps réel

### `messages`
Messages dans les conversations.

**Colonnes:**
- `id` (uuid, PK)
- `conversation_id` (uuid, FK → conversations)
- `platform_message_id` (text, nullable) - ID unique message plateforme
- `direction` (text) - incoming, outgoing
- `sender_id`, `sender_name`, `sender_username` (text)
- `text_content` (text)
- `message_type` (text) - text, image, video, audio, file
- `media_type`, `media_url` (text)
- `is_read`, `is_starred` (boolean)
- `sent_at`, `created_at` (timestamp)

**Realtime activée:** Mises à jour en temps réel

### `quick_replies`
Réponses rapides prédéfinies.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `title`, `content` (text)
- `usage_count` (integer)
- `created_at`, `updated_at` (timestamp)

**Fonction:** `increment_quick_reply_usage(reply_id)` - Incrémente compteur usage

### `webhook_logs`
Logs des webhooks entrants.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `platform` (text)
- `event_type` (text)
- `payload` (jsonb)
- `status` (text) - success, error
- `error_message` (text)
- `created_at` (timestamp)

---

## 7. GESTION D'ÉQUIPE & ROUTAGE IA

### `teams`
Équipes pour organiser les membres.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles) - Propriétaire
- `name` (varchar)
- `description` (text)
- `color` (varchar) - Couleur hex (#FF5733)
- `member_count`, `conversation_count` (integer)
- `created_at`, `updated_at` (timestamp)

**Triggers:**
- `update_team_timestamp()` - MAJ updated_at
- `update_team_member_count()` - Gère member_count
- `update_team_conversation_count()` - Gère conversation_count

### `team_members`
Membres d'équipe avec invitations.

**Colonnes:**
- `id` (uuid, PK)
- `team_id` (uuid, FK → teams)
- `user_id` (uuid, FK → profiles, nullable) - NULL si non accepté
- `email` (text)
- `role` (text) - admin, member
- `status` (text) - pending, accepted, declined
- `invited_by` (uuid, FK → profiles)
- `invited_at`, `accepted_at` (timestamp)
- `created_at` (timestamp)

**Contrainte:** UNIQUE(team_id, email)

### `conversation_teams`
Assignation conversations → équipes (routage).

**Colonnes:**
- `id` (uuid, PK)
- `conversation_id` (uuid, FK → conversations)
- `team_id` (uuid, FK → teams)
- `auto_assigned` (boolean) - Assigné par IA?
- `confidence_score` (float) - Score confiance IA (0-1)
- `ai_reasoning` (text) - Justification IA
- `assigned_by` (uuid, FK → profiles, nullable)
- `assigned_at` (timestamp)

### `message_ai_analysis`
Analyses IA des messages pour routage.

**Colonnes:**
- `id` (uuid, PK)
- `message_id` (uuid, FK → messages)
- `conversation_id` (uuid, FK → conversations)
- `analyzed_content` (text)
- `detected_intent`, `detected_language` (text)
- `suggested_team_ids` (uuid[])
- `confidence_scores` (jsonb) - {team_id: score}
- `model_used` (text)
- `tokens_used`, `processing_time_ms` (integer)
- `analyzed_at` (timestamp)

---

## 8. MÉDIAS

### `media_archives`
Archives des médias uploadés/générés.

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `title` (text)
- `file_path`, `file_type` (text)
- `file_size` (bigint)
- `dimensions` (text) - Ex: "1080x1080"
- `source` (text) - upload, ai-generated, imported
- `created_at`, `updated_at` (timestamp)

---

## 9. VUES UTILES

### `competitor_latest_analysis`
Dernière analyse de chaque concurrent avec infos essentielles.

### `competitor_comparison`
Vue comparaison rapide des métriques clés concurrents.

### `competitor_recent_activity`
Activité récente (posts derniers 30j) des concurrents.

### `my_business_latest_analysis`
Dernière analyse du business utilisateur avec données complètes.

### `conversations_with_last_message`
Conversations enrichies avec dernier message et compteur non-lus.

### `conversations_with_teams`
Conversations avec équipes assignées et détails.

### `teams_with_stats`
Équipes avec statistiques (membres actifs, conversations assignées).

### `connected_accounts_with_stats`
Comptes connectés avec stats conversations (actives, non-lues).

### `inbox_stats`
Statistiques globales inbox par utilisateur.

### `crm_leads_by_sector`
Agrégation leads par secteur avec statistiques détaillées.

---

## 10. FONCTIONS PRINCIPALES

### Gestion Utilisateurs
- `handle_new_user()` - Création profil et rôle à l'inscription
- `generate_upload_post_username()` - Génération username Upload-Post
- `initialize_beta_quotas()` - Init quotas beta
- `get_user_quotas(user_id)` - Récupération quotas
- `increment_ai_image_generation(user_id)` - Incrémente quota images
- `increment_ai_video_generation(user_id)` - Incrémente quota vidéos
- `increment_lead_generation(user_id)` - Incrémente quota leads
- `reset_user_quotas(user_id)` - Réinitialisation quotas
- `has_role(user_id, role)` - Vérification rôle sécurisée

### Timestamps
- `update_updated_at_column()` - MAJ automatique updated_at
- `update_competitors_updated_at()` - MAJ timestamp competitors
- `update_connected_account_timestamp()` - MAJ timestamp comptes connectés
- `update_conversation_timestamp()` - MAJ timestamp conversations
- `update_team_timestamp()` - MAJ timestamp équipes

### Compteurs
- `update_competitor_analysis_count()` - Incrémente analyses concurrent
- `update_team_member_count()` - Gère compteur membres équipe
- `update_team_conversation_count()` - Gère compteur conversations équipe
- `update_connected_account_message_counts()` - Incrémente messages compte
- `increment_quick_reply_usage(reply_id)` - Incrémente usage réponse rapide

### Calculs
- `calculate_engagement_rate()` - Calcul taux engagement automatique

---

## 11. ENUMS

- `app_role`: admin, manager, moderator, user
- `lead_status`: new, contacted, interested, client, lost
- `post_status`: draft, scheduled, published, failed

---

## 12. POLITIQUES DE SÉCURITÉ (RLS)

**Principe général:** Chaque utilisateur ne peut accéder qu'à ses propres données via `auth.uid() = user_id`.

**Exceptions notables:**
- `profiles`: Lecture publique (utilisateurs actifs), pas de suppression directe
- Tables analysis/posts concurrents: Service role peut insérer (via Edge Functions)
- Tables équipes: Membres peuvent consulter équipes auxquelles ils appartiennent
- Conversations: Assignées à l'utilisateur ou à son équipe

---

## 13. STOCKAGE (Storage Buckets)

### `media-archives` (Public)
Stockage des médias uploadés/générés par utilisateurs.

### `avatars` (Public)
Photos de profil utilisateurs.

---

## Architecture Globale

Cette base de données supporte:
1. **Gestion multi-utilisateurs** avec rôles et quotas
2. **Publication multi-plateforme** avec planification et analytics
3. **Veille concurrentielle** complète (scraping, analyse IA, comparaison)
4. **CRM intégré** (leads, segmentation, campagnes, interactions)
5. **Inbox unifiée** (Gmail, Outlook, Telegram, WhatsApp)
6. **Routage IA** des conversations vers équipes
7. **Génération contenu IA** (images, vidéos) avec quotas
8. **Stockage média** centralisé

Toutes les tables principales ont:
- RLS activée pour sécurité multi-tenant
- Timestamps automatiques (created_at, updated_at)
- Relations FK avec cascade appropriées
- Indexes sur colonnes fréquemment requêtées
