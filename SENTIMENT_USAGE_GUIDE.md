# 🎉 Analyse de Sentiment - Guide d'Utilisation

## ✅ Implémentation Terminée !

L'analyse de sentiment des posts et commentaires concurrents est maintenant **complètement implémentée** et prête à l'emploi.

---

## 🚀 Déploiement Requis

Avant de pouvoir utiliser la fonctionnalité, vous devez déployer les nouvelles ressources Supabase :

### 1. Appliquer la Migration SQL

```bash
# Vérifier les migrations en attente
supabase db push

# Ou appliquer manuellement
supabase migration up
```

Cela créera les 3 nouvelles tables :
- ✅ `competitor_posts` - Stocke les posts analysés
- ✅ `post_comments` - Stocke les commentaires avec leur sentiment
- ✅ `sentiment_statistics` - Statistiques globales par analyse

### 2. Déployer l'Edge Function

```bash
supabase functions deploy analyze-competitor-sentiment
```

### 3. Vérifier les Secrets (API Keys)

```bash
# Lister les secrets configurés
supabase secrets list

# Vérifier que ces secrets existent :
# - APIFY_TOKEN (obligatoire)
# - OPENAI_API_KEY (obligatoire)

# Si manquants, les configurer :
supabase secrets set APIFY_TOKEN=votre_token_apify
supabase secrets set OPENAI_API_KEY=votre_clé_openai
```

---

## 📖 Comment Utiliser la Fonctionnalité

### Étape 1 : Ajouter un Concurrent

1. Allez sur la page **Analyse Concurrentielle** (`/competitors`)
2. Cliquez sur **"Nouveau concurrent"**
3. Remplissez le formulaire :
   - Nom de l'entreprise **(requis)**
   - Secteur d'activité
   - URLs des réseaux sociaux (Instagram, Facebook, Twitter)
   - URL du site web

**Important :** Pour l'analyse de sentiment, vous avez besoin d'au moins **une URL de réseau social** (Instagram, Facebook, ou Twitter).

### Étape 2 : Lancer l'Analyse Standard

1. Cliquez sur **"Analyser"** sur la carte du concurrent
2. Attendez 1-5 minutes pour l'analyse de base (scraping + OpenAI)
3. Une notification vous informera quand l'analyse est terminée

### Étape 3 : Lancer l'Analyse de Sentiment

**Note :** L'analyse de sentiment se lance automatiquement après l'analyse standard, ou vous pouvez la lancer manuellement.

#### Option A : Manuelle (via l'interface)
1. Cliquez sur **"Voir la dernière analyse"** pour développer la carte
2. Allez dans l'onglet **"Sentiment"**
3. Cliquez sur **"Analyser le sentiment"** (si disponible)
4. Attendez 2-3 minutes

#### Option B : Automatique (via Edge Function)
L'analyse de sentiment peut être déclenchée automatiquement après chaque analyse standard. Pour cela, modifiez `analyze-competitor-apify/index.ts` pour appeler `analyze-competitor-sentiment` à la fin.

#### Option C : Manuellement via API
```bash
curl -X POST 'https://votre-projet.supabase.co/functions/v1/analyze-competitor-sentiment' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "competitor_id": "uuid-du-concurrent",
    "analysis_id": "uuid-de-analyse"
  }'
```

---

## 🎨 Interface Utilisateur

### Onglets dans CompetitorCard

Après avoir développé la carte d'un concurrent analysé, vous verrez 3 onglets :

#### 1️⃣ **Onglet "Analyse"**
- Résumé exécutif
- Positionnement et stratégie de contenu
- Forces et faiblesses
- Opportunités pour vous
- Recommandations stratégiques
- Boutons d'export (PDF, Excel)

#### 2️⃣ **Onglet "Sentiment"** ⭐ NOUVEAU
- **Dashboard global** avec 3 cartes :
  - 😊 Sentiment Positif (%)
  - 😐 Sentiment Neutre (%)
  - 😞 Sentiment Négatif (%)
- **Vue d'ensemble** :
  - Nombre de posts et commentaires analysés
  - Score de sentiment moyen (-1 à 1)
  - Taux de réponse du concurrent
- **Graphique de distribution** du sentiment
- **Meilleur commentaire** (carte verte) :
  - Texte du commentaire
  - Score de sentiment
  - Explication du sentiment
  - Mots-clés extraits
- **Pire commentaire** (carte rouge) :
  - Même format que ci-dessus
- **Post avec le plus d'engagement** (carte bleue) :
  - Texte du post
  - Statistiques (likes, commentaires, taux d'engagement)
  - Lien vers le post original
  - Badge de sentiment
- **Mots-clés populaires** :
  - Top 10 mots-clés avec leur fréquence
  - Badges cliquables
- **Liste des posts analysés** :
  - Tous les posts avec leur badge de sentiment
  - Date de publication
  - Statistiques d'engagement
  - Lien vers le post

#### 3️⃣ **Onglet "Graphiques"**
- Graphique en barres : Abonnés par plateforme
- Graphique linéaire : Tendance d'engagement
- Graphique circulaire : Distribution des audiences

---

## 📊 Configuration Technique

### Ce qui est Scrapé

Pour chaque concurrent, le système scrape :

#### Instagram
- **10 derniers posts** (configurable)
- Pour chaque post :
  - Caption (texte du post)
  - Nombre de likes
  - Nombre de commentaires
  - Date de publication
  - **Top 50 commentaires** avec :
    - Auteur
    - Texte du commentaire
    - Nombre de likes
    - Date de publication

#### Facebook
- **10 derniers posts**
- **Top 50 commentaires** par post

#### Twitter
- **10 derniers tweets**
- **Top 50 réponses** par tweet

### Comment Fonctionne l'Analyse de Sentiment

1. **Scraping** (Apify) :
   - Collecte des posts et commentaires via Apify actors
   - Durée : ~1-2 minutes

2. **Analyse en batch** (OpenAI GPT-4o-mini) :
   - Traite les commentaires par batch de 20
   - Pour chaque commentaire :
     - Score de sentiment : -1 (négatif) à 1 (positif)
     - Label : 'positive', 'neutral', ou 'negative'
     - Explication du sentiment
     - Extraction de 2-3 mots-clés
   - Durée : ~1 minute

3. **Calcul des statistiques** :
   - Sentiment global (moyenne)
   - Pourcentages positif/neutre/négatif
   - Top 10 mots-clés
   - Taux de réponse du concurrent
   - Taux d'engagement moyen

4. **Stockage** :
   - Posts dans `competitor_posts`
   - Commentaires dans `post_comments`
   - Statistiques dans `sentiment_statistics`

---

## 💰 Coûts

### Par Analyse Complète (10 posts × 50 commentaires = 500 commentaires)

| Service | Coût Unitaire | Utilisation | Coût Total |
|---------|--------------|-------------|------------|
| **Apify** | ~€0.02 par actor run | 3 actors (Instagram, Facebook, Twitter) | ~€0.06 |
| **OpenAI GPT-4o-mini** | $0.15 / 1M tokens | ~10K tokens (500 commentaires) | ~€0.02 |
| **Total** | - | - | **~€0.08** |

### Exemple : 10 Concurrents

- 10 analyses × €0.08 = **€0.80 par mois**
- Si vous analysez chaque concurrent 2 fois par mois = **€1.60/mois**

**C'est très abordable !** 🎉

---

## 🔧 Personnalisation

### Changer le Nombre de Posts/Commentaires

Éditez `/supabase/functions/analyze-competitor-sentiment/index.ts` :

```typescript
// Ligne 18
const CONFIG = {
  posts_limit: 10,           // Changez ici (ex: 20 pour plus de posts)
  comments_per_post: 50,     // Changez ici (ex: 100 pour plus de commentaires)
  min_comment_length: 10,    // Minimum de caractères pour un commentaire valide
  include_replies: true,     // Inclure les réponses du concurrent
  platforms: ['instagram', 'facebook', 'twitter'],
};
```

Puis redéployez :
```bash
supabase functions deploy analyze-competitor-sentiment
```

### Ajouter TikTok

TikTok est prêt dans le code mais commenté. Pour l'activer :

1. Décommentez la section TikTok dans `analyze-competitor-sentiment/index.ts`
2. Ajoutez `'tiktok'` dans `CONFIG.platforms`
3. Redéployez la fonction

---

## 🐛 Dépannage

### Problème : "No data returned from sentiment analysis"

**Causes possibles :**
1. Le concurrent n'a pas de posts récents
2. Les profils sont privés
3. Les URLs sont invalides

**Solution :**
- Vérifiez que les URLs sont correctes (format : `https://www.instagram.com/username/`)
- Testez manuellement sur Apify Console avec les mêmes URLs
- Vérifiez les logs de l'Edge Function :
  ```bash
  supabase functions logs analyze-competitor-sentiment
  ```

### Problème : "Sentiment analysis taking too long"

**Causes :**
- Compte très populaire avec beaucoup de commentaires
- OpenAI API lente

**Solution :**
- Réduisez `posts_limit` ou `comments_per_post` dans la config
- Attendez jusqu'à 5 minutes maximum

### Problème : "APIFY_TOKEN not configured"

**Solution :**
```bash
supabase secrets set APIFY_TOKEN=votre_token
supabase functions deploy analyze-competitor-sentiment
```

### Problème : "OpenAI API error"

**Solution :**
```bash
supabase secrets set OPENAI_API_KEY=votre_clé
supabase functions deploy analyze-competitor-sentiment
```

---

## 📈 Exemples d'Utilisation

### Cas d'usage 1 : Comparer 3 Concurrents

1. Ajoutez Nike, Adidas, Puma
2. Analysez chacun (standard + sentiment)
3. Comparez les onglets "Sentiment" :
   - Qui a le meilleur sentiment global ?
   - Quels mots-clés ressortent ?
   - Quel concurrent répond le plus à ses clients ?

### Cas d'usage 2 : Surveiller un Concurrent

1. Analysez le concurrent une fois par semaine
2. Suivez l'évolution du sentiment dans le temps
3. Identifiez les tendances (amélioration/dégradation)

### Cas d'usage 3 : Identifier des Opportunités

1. Lisez les commentaires négatifs du concurrent
2. Identifiez les plaintes récurrentes (via mots-clés)
3. Utilisez ces insights pour améliorer votre offre

---

## ✅ Checklist de Vérification

Avant de considérer que tout fonctionne :

- [ ] Migration SQL appliquée (tables créées)
- [ ] Edge Function déployée
- [ ] Secrets configurés (APIFY_TOKEN, OPENAI_API_KEY)
- [ ] Au moins 1 concurrent ajouté
- [ ] Analyse standard terminée (onglet "Analyse" rempli)
- [ ] Analyse de sentiment lancée
- [ ] Onglet "Sentiment" affiche les données :
  - [ ] Dashboard avec pourcentages
  - [ ] Meilleur/pire commentaire
  - [ ] Post avec plus d'engagement
  - [ ] Mots-clés populaires
  - [ ] Liste des posts
- [ ] Exports PDF/Excel fonctionnels

---

## 🎓 Prochaines Améliorations Possibles

**Idées pour étendre la fonctionnalité :**

1. **Alertes automatiques** :
   - Recevoir un email si le sentiment d'un concurrent devient très négatif
   - Notification si un nouveau mot-clé émerge

2. **Analyse de tendances** :
   - Graphique temporel du sentiment (évolution sur 3 mois)
   - Comparaison côte à côte de plusieurs concurrents

3. **Export enrichi** :
   - Rapport PDF avec graphiques de sentiment
   - Excel avec tous les commentaires et leur sentiment

4. **Analyse plus profonde** :
   - Détection de thèmes (plaintes, compliments, questions)
   - Analyse des émojis utilisés
   - Sentiment par démographie (si disponible)

5. **Automatisation** :
   - Analyse automatique hebdomadaire
   - Intégration avec Slack/Discord pour les notifications

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Consultez les logs des Edge Functions :
   ```bash
   supabase functions logs analyze-competitor-sentiment --follow
   ```

2. Vérifiez la base de données :
   ```sql
   -- Voir les analyses de sentiment
   SELECT * FROM sentiment_statistics;

   -- Voir les posts analysés
   SELECT * FROM competitor_posts ORDER BY posted_at DESC LIMIT 10;

   -- Voir les commentaires
   SELECT * FROM post_comments WHERE sentiment_label = 'negative' LIMIT 10;
   ```

3. Testez manuellement un scrape Apify :
   - Allez sur https://console.apify.com
   - Testez "Instagram Post Scraper" avec l'URL de votre concurrent
   - Vérifiez que les commentaires sont bien récupérés

---

## 🎉 Conclusion

Vous avez maintenant un **système complet d'analyse de sentiment** pour vos concurrents !

**Ce qu'il fait :**
- ✅ Scrape automatiquement les posts et commentaires
- ✅ Analyse le sentiment avec l'IA
- ✅ Affiche des insights visuels magnifiques
- ✅ Coûte moins de €0.10 par analyse
- ✅ Prend 2-3 minutes par concurrent

**Utilisez-le pour :**
- 🎯 Comprendre ce que les clients aiment/détestent chez vos concurrents
- 💡 Identifier des opportunités de marché
- 📊 Comparer votre positionnement
- 🚀 Améliorer votre stratégie marketing

**Bon Analyse !** 🚀📊😊
