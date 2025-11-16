# 📋 Résumé des modifications - Analyse de Sentiment Utilisateur

## 🎯 Objectif
Ajouter une fonctionnalité d'analyse de sentiment pour les posts de l'utilisateur (similaire à celle des concurrents), avec analyse automatique hebdomadaire pour réduire les coûts API.

---

## ✅ Ce qui a été implémenté

### 1. **Base de données** (3 migrations à exécuter)

#### Migration 1: `20251116120000_add_user_sentiment_analysis.sql`
Crée les tables pour stocker l'analyse de sentiment:
- **`user_sentiment_statistics`**: Statistiques hebdomadaires agrégées par utilisateur
  - Score moyen de sentiment, distribution (positif/neutre/négatif)
  - Top mots-clés, taux d'engagement
  - Calculées chaque semaine (lundi 6h)

- **`user_post_comments`**: Commentaires individuels analysés
  - Texte du commentaire, auteur
  - Score de sentiment (-1 à 1), label (positif/neutre/négatif)
  - Explication du sentiment, mots-clés extraits

- **Colonnes ajoutées à `posts`**:
  - `last_sentiment_analysis_at`: Date dernière analyse
  - `sentiment_score`: Score global du post
  - `sentiment_label`: Label (positif/neutre/négatif)
  - `comments_sentiment_count`: Nombre de commentaires analysés

#### Migration 2: `20251116130000_setup_sentiment_cron_job.sql`
Configure le cron job pour l'analyse automatique:
- Active extensions `pg_cron` et `http`
- Crée fonction `trigger_weekly_sentiment_analysis()`
- Schedule: **chaque lundi à 6h UTC**

---

### 2. **Edge Function** (déjà déployée)

#### `analyze-user-sentiment/index.ts`
Fonction Supabase Edge qui:
1. Récupère les posts de la semaine précédente (Instagram + Facebook uniquement)
2. Scrape les commentaires via Apify (max 50 par post, min 5 pour analyser)
3. Analyse le sentiment avec OpenAI GPT-4o-mini en batch
4. Stocke les résultats dans les tables
5. Calcule les statistiques hebdomadaires

**Coût estimé**: ~$0.81/mois par utilisateur actif

---

### 3. **Interface utilisateur**

#### Nouveaux composants créés:

**`src/components/dashboard/UserSentimentWidget.tsx`**
Widget Dashboard affichant:
- Score de sentiment global avec badge coloré
- Distribution des sentiments (barres de progression + pie chart)
- Top mots-clés en badges
- Meilleurs/pires posts de la semaine
- Tendance sur 4 semaines (bar chart)

**`src/components/PostCommentsModal.tsx`**
Modal pour afficher les commentaires d'un post avec:
- Liste des commentaires triés par sentiment
- Badges colorés (vert=positif, gris=neutre, rouge=négatif)
- Statistiques: moyenne, distribution
- Mots-clés extraits

#### Composants modifiés:

**`src/pages/Dashboard.tsx`**
- Ajout du `UserSentimentWidget` dans la grille

**`src/components/PublicationCard.tsx`**
- Badge sentiment en haut à droite de chaque post
- Section "Analyse de sentiment" avec:
  - Date de dernière analyse
  - Nombre de commentaires analysés
  - Bouton "Voir les commentaires" → ouvre `PostCommentsModal`

**`src/types/Post.ts`**
- Ajout des champs sentiment au type `Post`

---

## 🚀 Actions requises par Lovable

### ⚠️ IMPORTANT: Migrations à exécuter

**Étape 1**: Exécuter les migrations SQL dans l'ordre
```bash
# Via Supabase Dashboard → SQL Editor
# Ou via CLI:
supabase db push
```

Les 2 migrations à appliquer:
1. `supabase/migrations/20251116120000_add_user_sentiment_analysis.sql`
2. `supabase/migrations/20251116130000_setup_sentiment_cron_job.sql`

**Étape 2**: Configurer le cron job (configuration manuelle requise)

Deux options:

#### Option A: Via Supabase Dashboard (Recommandé)
1. Aller dans **Database** → **Cron Jobs**
2. Créer un nouveau cron job:
   - **Name**: `weekly-user-sentiment-analysis`
   - **Schedule**: `0 6 * * 1` (chaque lundi 6h UTC)
   - **Query**:
   ```sql
   SELECT net.http_post(
     url := 'https://[PROJECT_REF].supabase.co/functions/v1/analyze-user-sentiment',
     headers := jsonb_build_object(
       'Authorization',
       'Bearer [SERVICE_ROLE_KEY]'
     ),
     body := '{}'::jsonb
   ) AS request_id;
   ```
   - Remplacer `[PROJECT_REF]` par la référence du projet
   - Remplacer `[SERVICE_ROLE_KEY]` par la clé service_role (Project Settings → API)

#### Option B: Via SQL Editor
```sql
SELECT cron.schedule(
  'weekly-user-sentiment-analysis',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/analyze-user-sentiment',
    headers := jsonb_build_object('Authorization', 'Bearer [SERVICE_ROLE_KEY]'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

📖 **Guide complet**: Voir `docs/SENTIMENT_CRON_SETUP.md`

---

## 🧪 Tests à effectuer

### 1. Vérifier les migrations
```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_sentiment_statistics', 'user_post_comments');

-- Vérifier les colonnes ajoutées à posts
SELECT column_name FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name LIKE '%sentiment%';
```

### 2. Tester l'edge function manuellement (optionnel)
```bash
# Via curl (remplacer les valeurs)
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/analyze-user-sentiment' \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

Ou via SQL:
```sql
SELECT net.http_post(
  url := 'https://[PROJECT_REF].supabase.co/functions/v1/analyze-user-sentiment',
  headers := jsonb_build_object('Authorization', 'Bearer [SERVICE_ROLE_KEY]'),
  body := '{}'::jsonb
);
```

### 3. Vérifier l'affichage UI
- [ ] Dashboard affiche le widget `UserSentimentWidget`
- [ ] Page "Mes Publications" affiche les badges sentiment sur les posts
- [ ] Cliquer sur "Voir les commentaires" ouvre la modal
- [ ] La modal affiche les commentaires avec leurs sentiments

### 4. Vérifier le cron job
```sql
-- Voir les cron jobs configurés
SELECT * FROM cron.job WHERE jobname = 'weekly-user-sentiment-analysis';

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-user-sentiment-analysis')
ORDER BY start_time DESC
LIMIT 5;
```

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers
```
supabase/migrations/
  └── 20251116120000_add_user_sentiment_analysis.sql       [MIGRATION À EXÉCUTER]
  └── 20251116130000_setup_sentiment_cron_job.sql          [MIGRATION À EXÉCUTER]

supabase/functions/analyze-user-sentiment/
  └── index.ts                                              [Edge function]

src/components/
  └── PostCommentsModal.tsx                                 [Nouveau composant]
  └── dashboard/UserSentimentWidget.tsx                     [Nouveau composant]

docs/
  └── SENTIMENT_CRON_SETUP.md                              [Documentation cron]
```

### Fichiers modifiés
```
src/pages/Dashboard.tsx                    [+ Import et widget]
src/components/PublicationCard.tsx         [+ Badge et modal]
src/types/Post.ts                          [+ Champs sentiment]
```

---

## 🔑 Variables d'environnement requises

**Pour l'edge function** `analyze-user-sentiment`:
- ✅ `SUPABASE_URL` (déjà configuré)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (déjà configuré)
- ⚠️ `APIFY_TOKEN` - Token API Apify pour scraping
- ⚠️ `OPENAI_API_KEY` - Clé API OpenAI pour analyse sentiment

**Vérifier dans Supabase Dashboard** → **Edge Functions** → **analyze-user-sentiment** → **Settings**

Si manquantes, les ajouter:
```bash
supabase secrets set APIFY_TOKEN=your_apify_token
supabase secrets set OPENAI_API_KEY=your_openai_key
```

---

## 📊 Schéma de fonctionnement

```
┌─────────────────────────────────────────────┐
│  CHAQUE LUNDI 6H UTC (Cron Job)             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Edge Function: analyze-user-sentiment      │
│  1. Récupère posts semaine dernière         │
│  2. Scrape commentaires (Apify)             │
│  3. Analyse sentiment (OpenAI)              │
│  4. Stocke résultats                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Base de données Supabase                   │
│  • user_post_comments                       │
│  • user_sentiment_statistics                │
│  • posts (colonnes sentiment mises à jour)  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Interface utilisateur                      │
│  • Dashboard: UserSentimentWidget           │
│  • Publications: Badges + Modal             │
└─────────────────────────────────────────────┘
```

---

## ⏭️ Fonctionnalités futures (V2)

Phase 6 non implémentée (optionnelle):
- [ ] Bouton "Analyser maintenant" pour analyse manuelle d'un post
- [ ] Notifications email quand analyse terminée
- [ ] Export des résultats en CSV/PDF
- [ ] Comparaison avec concurrents
- [ ] Analyse TikTok (quand disponible)

---

## 💡 Notes importantes

1. **Coûts API**:
   - Analyse hebdomadaire au lieu de temps réel = économie importante
   - ~$0.81/mois par utilisateur actif
   - Skip posts avec <5 commentaires
   - Limite 50 commentaires/post

2. **Plateformes supportées**:
   - ✅ Instagram
   - ✅ Facebook
   - ❌ TikTok (scraping pas encore fonctionnel)
   - ❌ LinkedIn/Twitter (non prioritaires)

3. **Timezone**:
   - Cron job en UTC
   - 6h UTC = 7h Paris (hiver) ou 8h Paris (été)

4. **Sécurité**:
   - Ne JAMAIS commiter `service_role_key` dans Git
   - RLS policies activées sur toutes les tables
   - Edge function utilise `service_role` pour accès complet

---

## ❓ Support

Pour questions ou problèmes:
- Documentation cron: `docs/SENTIMENT_CRON_SETUP.md`
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Créé par**: Claude Code
**Date**: 2025-11-16
**Branches**: `claude/update-tiktok-scraper-edge-01D58kGPG3xccRc1fSFfiATS`
