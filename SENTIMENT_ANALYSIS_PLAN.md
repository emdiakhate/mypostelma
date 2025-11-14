# 🎯 Plan d'Implémentation - Analyse de Sentiment des Commentaires

## 📊 Analyse du Code Actuel

### Ce qui est déjà scrapé :
```typescript
recent_posts: profile.latestPosts?.slice(0, 10).map((post: any) => ({
  caption: post.caption?.substring(0, 200),
  likes: post.likesCount,
  comments: post.commentsCount,  // ❌ JUSTE LE COUNT, pas les commentaires
  timestamp: post.timestamp,
  type: post.type,
}))
```

**Problème** : On récupère le NOMBRE de commentaires, mais pas les commentaires eux-mêmes.

---

## 🎯 Objectifs de la Fonctionnalité

L'utilisateur doit pouvoir voir :

### 📈 Vue d'Ensemble (Dashboard)
- ✅ **Sentiment global** : % Positif / Neutre / Négatif
- ✅ **Post avec le plus d'engagement** : Likes + Comments
- ✅ **Meilleur commentaire** : Le plus positif + likes
- ✅ **Pire commentaire** : Le plus négatif + contexte
- ✅ **Tendances** : Evolution du sentiment dans le temps
- ✅ **Mots-clés récurrents** : Nuage de mots des commentaires
- ✅ **Taux de réponse** : % de commentaires auxquels le concurrent répond

### 📝 Vue Détaillée par Post
- ✅ Titre/Caption du post
- ✅ Métriques (likes, comments, engagement rate)
- ✅ Sentiment dominant (emoji + %)
- ✅ Top 5 commentaires positifs
- ✅ Top 5 commentaires négatifs
- ✅ Commentaires avec le plus de likes
- ✅ Thèmes récurrents

---

## 🏗️ Architecture Proposée

### 1. **Nouvelle Edge Function** : `analyze-competitor-sentiment`

```
Input:
- competitor_id
- analysis_id
- platforms: ['instagram', 'facebook', 'twitter']
- posts_limit: 20 (configurable)
- comments_per_post: 50 (configurable)

Output:
- Sentiment analysis par post
- Meilleurs/pires commentaires
- Statistiques globales
- Stockage en base de données
```

### 2. **Nouvelles Tables Supabase**

```sql
-- Table pour les posts analysés
CREATE TABLE competitor_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES competitor_analysis(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'twitter'
  post_url TEXT,
  caption TEXT,
  likes INTEGER,
  comments_count INTEGER,
  engagement_rate DECIMAL,
  posted_at TIMESTAMP,
  sentiment_score DECIMAL, -- -1 à 1 (négatif à positif)
  sentiment_label TEXT, -- 'positive', 'neutral', 'negative'
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les commentaires analysés
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES competitor_posts(id) ON DELETE CASCADE,
  author_username TEXT,
  text TEXT,
  likes INTEGER DEFAULT 0,
  posted_at TIMESTAMP,
  sentiment_score DECIMAL, -- -1 à 1
  sentiment_label TEXT, -- 'positive', 'neutral', 'negative'
  sentiment_explanation TEXT, -- Pourquoi ce sentiment
  keywords TEXT[], -- Mots-clés extraits
  is_response_from_brand BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les statistiques globales
CREATE TABLE sentiment_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES competitor_analysis(id) ON DELETE CASCADE,
  total_posts INTEGER,
  total_comments INTEGER,
  avg_sentiment_score DECIMAL,
  positive_percentage DECIMAL,
  neutral_percentage DECIMAL,
  negative_percentage DECIMAL,
  top_keywords JSONB, -- {keyword: count}
  response_rate DECIMAL, -- % de commentaires avec réponse
  avg_engagement_rate DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **Scraping des Commentaires**

#### Instagram :
```typescript
// Utiliser apify/instagram-post-scraper pour scraper les commentaires
const results = await runApifyActor(
  'apify/instagram-post-scraper',
  {
    directUrls: postUrls, // URLs des 20 derniers posts
    resultsLimit: 20,
    maxComments: 50, // Limiter à 50 commentaires par post
  },
  apifyToken
);
```

#### Facebook :
```typescript
const results = await runApifyActor(
  'apify/facebook-posts-scraper',
  {
    startUrls: [{ url: pageUrl }],
    maxPosts: 20,
    maxComments: 50,
  },
  apifyToken
);
```

#### Twitter :
```typescript
// Les tweets sont plus courts, on peut analyser les réponses
const results = await runApifyActor(
  'apify/twitter-scraper',
  {
    handles: [username],
    maxTweets: 20,
    includeReplies: true, // Inclure les réponses = commentaires
  },
  apifyToken
);
```

---

## 🤖 Analyse de Sentiment avec OpenAI

### Stratégie :

**Option A : Analyse en Batch** (Recommandé pour le coût)
```typescript
// Analyser tous les commentaires d'un post en une seule requête
async function analyzeSentimentBatch(comments: string[], openaiKey: string) {
  const prompt = `Analyse le sentiment de ces ${comments.length} commentaires et retourne un JSON structuré :

COMMENTAIRES :
${comments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Retourne un JSON avec cette structure :
{
  "global_sentiment": "positive|neutral|negative",
  "global_score": 0.75,
  "comments": [
    {
      "index": 0,
      "sentiment": "positive",
      "score": 0.9,
      "explanation": "Client satisfait du produit",
      "keywords": ["excellent", "satisfait", "recommande"]
    },
    ...
  ],
  "summary": "Résumé global du sentiment",
  "themes": ["qualité", "prix", "service client"]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Moins de créativité = plus de cohérence
    }),
  });

  return await response.json();
}
```

**Coût estimé :**
- 20 posts × 50 commentaires = 1000 commentaires
- ~50 tokens par commentaire = 50,000 tokens input
- GPT-4o-mini : $0.15 / 1M tokens
- **Coût par analyse complète : ~$0.0075 (€0.007)**

---

## 📱 Interface Utilisateur

### 1. **Nouvel Onglet "Analyse de Sentiment"** dans CompetitorCard

```tsx
<Tabs defaultValue="analysis">
  <TabsList>
    <TabsTrigger value="analysis">Analyse Stratégique</TabsTrigger>
    <TabsTrigger value="sentiment">Analyse de Sentiment</TabsTrigger>
    <TabsTrigger value="posts">Posts Détaillés</TabsTrigger>
  </TabsList>

  <TabsContent value="sentiment">
    <SentimentAnalysisView competitor={competitor} />
  </TabsContent>
</Tabs>
```

### 2. **Composant SentimentAnalysisView**

```tsx
export function SentimentAnalysisView({ competitor }) {
  return (
    <div className="space-y-6">
      {/* Statistiques Globales */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble du sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.positive_percentage}%
              </div>
              <p className="text-sm text-muted-foreground">😊 Positif</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {stats.neutral_percentage}%
              </div>
              <p className="text-sm text-muted-foreground">😐 Neutre</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats.negative_percentage}%
              </div>
              <p className="text-sm text-muted-foreground">😞 Négatif</p>
            </div>
          </div>

          {/* Score global */}
          <div className="mt-4">
            <Progress
              value={(stats.avg_sentiment_score + 1) * 50}
              className="h-3"
            />
            <p className="text-xs text-center mt-2">
              Score moyen : {stats.avg_sentiment_score.toFixed(2)} / 1
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meilleur et Pire Commentaire */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              🏆 Meilleur Commentaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic">"{bestComment.text}"</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>👍 {bestComment.likes} likes</span>
              <span>• Score: {bestComment.sentiment_score}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              ⚠️ Pire Commentaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic">"{worstComment.text}"</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>👎 {worstComment.likes} likes</span>
              <span>• Score: {worstComment.sentiment_score}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique de tendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Évolution du sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sentimentTrend}>
              <XAxis dataKey="date" />
              <YAxis domain={[-1, 1]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Post avec le plus d'engagement */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">🚀 Post avec le plus d'engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-2">"{topPost.caption}"</p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <span className="font-semibold">❤️ {topPost.likes}</span>
              <p className="text-muted-foreground">Likes</p>
            </div>
            <div>
              <span className="font-semibold">💬 {topPost.comments_count}</span>
              <p className="text-muted-foreground">Commentaires</p>
            </div>
            <div>
              <span className="font-semibold">{topPost.engagement_rate}%</span>
              <p className="text-muted-foreground">Engagement</p>
            </div>
            <div>
              <span className="font-semibold">{topPost.sentiment_label}</span>
              <p className="text-muted-foreground">Sentiment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mots-clés récurrents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">🔑 Thèmes récurrents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map(({ keyword, count }) => (
              <Badge key={keyword} variant="secondary">
                {keyword} ({count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des posts avec sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📋 Tous les posts analysés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="border rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{post.caption}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.comments_count}</span>
                      <span>{new Date(post.posted_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <Badge variant={
                    post.sentiment_label === 'positive' ? 'default' :
                    post.sentiment_label === 'negative' ? 'destructive' :
                    'secondary'
                  }>
                    {post.sentiment_label === 'positive' ? '😊' :
                     post.sentiment_label === 'negative' ? '😞' : '😐'}
                    {' '}
                    {post.sentiment_score.toFixed(2)}
                  </Badge>
                </div>

                {/* Bouton pour voir les commentaires détaillés */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setExpandedPost(post.id)}
                >
                  Voir les {post.comments_count} commentaires
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📊 Combien de Posts/Commentaires Analyser ?

### Recommandations par Taille de Compte :

| Taille du compte | Posts | Commentaires/post | Total commentaires | Coût estimé | Temps |
|------------------|-------|-------------------|-------------------|-------------|-------|
| **Petit** (<10k) | 10 | 30 | 300 | €0.002 | 2-3 min |
| **Moyen** (10-100k) | 20 | 50 | 1,000 | €0.007 | 4-6 min |
| **Grand** (>100k) | 30 | 100 | 3,000 | €0.022 | 8-10 min |

### Configuration Recommandée (Par Défaut) :
```typescript
const DEFAULT_CONFIG = {
  posts_limit: 20, // Les 20 derniers posts
  comments_per_post: 50, // Top 50 commentaires par post
  min_comment_length: 10, // Ignorer les commentaires trop courts
  include_replies: true, // Inclure les réponses du concurrent
  platforms: ['instagram', 'facebook', 'twitter'], // Toutes les plateformes
};
```

**Justification :**
- 20 posts = ~1 mois de contenu pour la plupart des marques
- 50 commentaires = échantillon statistiquement significatif
- Total : 1,000 commentaires analysés
- Coût : ~€0.007 par analyse
- Temps : 4-6 minutes

---

## 🎛️ Paramètres Configurables

L'utilisateur pourra choisir :

```tsx
<Card>
  <CardHeader>
    <CardTitle>Lancer une analyse de sentiment</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <Label>Nombre de posts à analyser</Label>
        <Select value={postsLimit} onValueChange={setPostsLimit}>
          <SelectItem value="10">10 posts (rapide)</SelectItem>
          <SelectItem value="20">20 posts (recommandé)</SelectItem>
          <SelectItem value="30">30 posts (complet)</SelectItem>
        </Select>
      </div>

      <div>
        <Label>Commentaires par post</Label>
        <Select value={commentsLimit} onValueChange={setCommentsLimit}>
          <SelectItem value="30">30 commentaires</SelectItem>
          <SelectItem value="50">50 commentaires (recommandé)</SelectItem>
          <SelectItem value="100">100 commentaires</SelectItem>
        </Select>
      </div>

      <div>
        <Label>Plateformes à analyser</Label>
        <div className="flex gap-2 mt-2">
          <Checkbox id="instagram" checked={platforms.instagram} />
          <label htmlFor="instagram">Instagram</label>

          <Checkbox id="facebook" checked={platforms.facebook} />
          <label htmlFor="facebook">Facebook</label>

          <Checkbox id="twitter" checked={platforms.twitter} />
          <label htmlFor="twitter">Twitter</label>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Coût estimé : €{estimatedCost.toFixed(3)} • Durée : {estimatedTime} min
      </div>

      <Button onClick={handleAnalyzeSentiment} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyse en cours...' : 'Analyser le sentiment'}
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 🔄 Workflow Complet

```
1. Utilisateur clique sur "Analyser le sentiment" dans CompetitorCard
   ↓
2. Frontend appelle Edge Function analyze-competitor-sentiment
   ↓
3. Edge Function scrape les posts + commentaires (Apify)
   ↓
4. Batch analysis avec OpenAI (tous les commentaires d'un post à la fois)
   ↓
5. Stockage dans les tables competitor_posts, post_comments, sentiment_statistics
   ↓
6. Retour au frontend avec sentiment_statistics_id
   ↓
7. Frontend affiche SentimentAnalysisView avec les résultats
```

---

## 💰 Calcul des Coûts

### Par Analyse Complète (20 posts × 50 commentaires) :

| Service | Coût unitaire | Quantité | Total |
|---------|---------------|----------|-------|
| **Apify Instagram** | $0.10-0.50 | 1 run | $0.30 |
| **OpenAI GPT-4o-mini** | $0.15/1M tokens | 50k tokens | $0.0075 |
| **Total** | | | **~€0.28** |

### Avec Cache (24h) :
- Première analyse : €0.28
- Analyses suivantes (même jour) : €0 (données en cache)

---

## 🚀 Plan de Déploiement

### Phase 1 : MVP (2-3 jours)
1. ✅ Créer tables Supabase
2. ✅ Créer Edge Function analyze-competitor-sentiment
3. ✅ Intégrer scraping Apify avec commentaires
4. ✅ Implémenter analyse OpenAI batch
5. ✅ Créer composant SentimentAnalysisView basique

### Phase 2 : Amélioration (1-2 jours)
6. ✅ Ajouter graphiques de tendance
7. ✅ Ajouter filtres par plateforme
8. ✅ Ajouter export PDF des résultats
9. ✅ Ajouter comparaison entre concurrents

### Phase 3 : Optimisation (1 jour)
10. ✅ Implémenter cache 24h
11. ✅ Ajouter pagination pour les posts
12. ✅ Optimiser les coûts Apify
13. ✅ Tests avec vrais comptes

---

## 📋 Checklist d'Implémentation

- [ ] Migration SQL (tables)
- [ ] Edge Function analyze-competitor-sentiment
- [ ] Fonction scrapeCommentsApify()
- [ ] Fonction analyzeSentimentBatch()
- [ ] Service frontend sentimentAnalysis.ts
- [ ] Composant SentimentAnalysisView.tsx
- [ ] Composant PostCommentsDialog.tsx
- [ ] Intégration dans CompetitorCard avec Tabs
- [ ] Tests unitaires
- [ ] Tests avec vrais comptes Instagram/Facebook
- [ ] Documentation utilisateur

---

## 🎯 Résultat Final pour l'Utilisateur

L'utilisateur pourra :

1. ✅ **Comprendre rapidement le sentiment** sans lire 1000 commentaires
2. ✅ **Identifier les points forts** du concurrent (commentaires positifs récurrents)
3. ✅ **Détecter les problèmes** (commentaires négatifs, plaintes)
4. ✅ **Voir les tendances** (sentiment qui s'améliore/dégrade)
5. ✅ **Trouver des opportunités** (ce que les clients veulent mais n'ont pas)
6. ✅ **Comparer plusieurs concurrents** (qui a le meilleur sentiment ?)
7. ✅ **Exporter les insights** en PDF pour présentation

**Exemple de cas d'usage :**
> "Je vois que mon concurrent Nike a 85% de sentiment positif, mais beaucoup de commentaires négatifs mentionnent 'prix élevé' et 'rupture de stock'. C'est une opportunité pour moi de me positionner sur le prix et la disponibilité !"

---

Voulez-vous que je commence l'implémentation ? Par où commencer ?
1. Migration SQL ?
2. Edge Function ?
3. Composants frontend ?
