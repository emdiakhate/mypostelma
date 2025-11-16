# Configuration du Cron Job pour l'Analyse de Sentiment

Ce document explique comment configurer l'analyse de sentiment automatique hebdomadaire.

## 📋 Vue d'ensemble

- **Fréquence**: Chaque lundi à 6h00 UTC
- **Fonction**: `analyze-user-sentiment` Edge Function
- **Cible**: Tous les utilisateurs ayant des posts de la semaine précédente
- **Plateformes**: Instagram + Facebook uniquement

## 🚀 Méthode 1: Configuration via Supabase Dashboard (Recommandé)

### Étape 1: Accéder aux Cron Jobs
1. Ouvrir le [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller à **Database** → **Cron Jobs** (dans le menu latéral)

### Étape 2: Créer le Cron Job
1. Cliquer sur **"Create a new cron job"**
2. Remplir les champs:
   - **Name**: `weekly-user-sentiment-analysis`
   - **Schedule**: `0 6 * * 1` (Chaque lundi à 6h UTC)
   - **Query**: Utiliser la requête ci-dessous

```sql
SELECT net.http_post(
  url := 'https://[VOTRE_PROJECT_REF].supabase.co/functions/v1/analyze-user-sentiment',
  headers := jsonb_build_object(
    'Authorization',
    'Bearer [VOTRE_SERVICE_ROLE_KEY]'
  ),
  body := '{}'::jsonb
) AS request_id;
```

### Étape 3: Obtenir vos identifiants
1. **Project URL**:
   - Aller à **Project Settings** → **API**
   - Copier **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - Extraire la référence du projet (ex: `abcdefgh`)

2. **Service Role Key**:
   - Dans la même page **Project Settings** → **API**
   - Copier **service_role** key (sous "Project API keys")
   - ⚠️ **ATTENTION**: Ne jamais exposer cette clé publiquement

### Étape 4: Remplacer les valeurs
Dans la requête SQL ci-dessus, remplacer:
- `[VOTRE_PROJECT_REF]` → Ex: `abcdefgh`
- `[VOTRE_SERVICE_ROLE_KEY]` → La clé service_role copiée

### Étape 5: Sauvegarder
1. Cliquer sur **"Create cron job"**
2. Vérifier que le job apparaît dans la liste avec le statut "Active"

---

## 🛠️ Méthode 2: Configuration via SQL (Avancé)

### Prérequis
Les extensions doivent être activées (déjà fait dans la migration):
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

### Créer le Cron Job
```sql
SELECT cron.schedule(
  'weekly-user-sentiment-analysis',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://[VOTRE_PROJECT_REF].supabase.co/functions/v1/analyze-user-sentiment',
    headers := jsonb_build_object('Authorization', 'Bearer [VOTRE_SERVICE_ROLE_KEY]'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 📊 Vérification et Monitoring

### Vérifier que le cron job est actif
```sql
SELECT * FROM cron.job WHERE jobname = 'weekly-user-sentiment-analysis';
```

### Voir l'historique d'exécution
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-user-sentiment-analysis')
ORDER BY start_time DESC
LIMIT 10;
```

### Vérifier les statistiques générées
```sql
SELECT
  user_id,
  week_start_date,
  week_end_date,
  total_posts,
  total_comments,
  avg_sentiment_score,
  analyzed_at
FROM user_sentiment_statistics
ORDER BY analyzed_at DESC
LIMIT 10;
```

---

## 🔧 Gestion du Cron Job

### Désactiver temporairement
```sql
SELECT cron.unschedule('weekly-user-sentiment-analysis');
```

### Réactiver
```sql
-- Recréer le job avec la même configuration
SELECT cron.schedule(
  'weekly-user-sentiment-analysis',
  '0 6 * * 1',
  $$ [VOTRE REQUÊTE ICI] $$
);
```

### Tester manuellement (sans attendre lundi)
```sql
-- Appeler directement la fonction
SELECT net.http_post(
  url := 'https://[VOTRE_PROJECT_REF].supabase.co/functions/v1/analyze-user-sentiment',
  headers := jsonb_build_object('Authorization', 'Bearer [VOTRE_SERVICE_ROLE_KEY]'),
  body := '{}'::jsonb
);
```

---

## 📅 Format Cron Expliqué

Format: `minute hour day month weekday`

Notre schedule: `0 6 * * 1`
- `0` = minute 0
- `6` = 6h du matin
- `*` = tous les jours du mois
- `*` = tous les mois
- `1` = lundi (0=dimanche, 1=lundi, ..., 6=samedi)

### Exemples d'autres schedules
```
0 6 * * 1     # Chaque lundi à 6h (actuel)
0 6 * * 1,3,5 # Lundi, mercredi, vendredi à 6h
0 */12 * * *  # Toutes les 12 heures
30 8 * * *    # Tous les jours à 8h30
0 0 1 * *     # Le 1er de chaque mois à minuit
```

---

## 🔍 Troubleshooting

### Le cron job ne s'exécute pas
1. Vérifier que les extensions `pg_cron` et `http` sont activées
2. Vérifier que le job est bien dans la liste: `SELECT * FROM cron.job;`
3. Vérifier les logs d'erreur: `SELECT * FROM cron.job_run_details;`

### Erreur d'authentification
- Vérifier que la `service_role_key` est correcte
- S'assurer d'utiliser `service_role` et non `anon` key

### Edge function timeout
- Les edge functions ont un timeout de 60 secondes par défaut
- Pour analyser beaucoup d'utilisateurs, l'edge function traite en batch
- Vérifier les logs de l'edge function dans Supabase Dashboard → Edge Functions

### Fuseau horaire
- Les cron jobs Supabase utilisent **UTC** par défaut
- 6h UTC = 7h Paris (hiver) ou 8h Paris (été)
- Ajuster l'heure si nécessaire pour votre timezone

---

## 💰 Estimation des coûts

Pour un utilisateur moyen avec 10 posts/semaine:
- **Apify**: ~$0.50/mois
- **OpenAI**: ~$0.31/mois
- **Total**: ~$0.81/mois par utilisateur

L'analyse hebdomadaire permet de réduire les coûts vs temps réel.

---

## 📝 Notes importantes

1. ⚠️ Ne JAMAIS commiter la `service_role_key` dans Git
2. La migration active les extensions mais ne crée pas le cron job automatiquement
3. Configuration manuelle requise via Dashboard ou SQL
4. Les statistiques sont stockées dans `user_sentiment_statistics`
5. Les commentaires analysés sont dans `user_post_comments`
6. Les posts sont mis à jour avec `sentiment_score` et `sentiment_label`

---

## 🎯 Prochaines étapes

Après configuration du cron job:
1. Tester manuellement avec la requête HTTP POST
2. Vérifier que les données apparaissent dans les tables
3. Vérifier l'affichage dans le Dashboard
4. Attendre le premier lundi pour validation automatique

---

Pour toute question ou problème, consulter:
- [Supabase Cron Jobs Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
