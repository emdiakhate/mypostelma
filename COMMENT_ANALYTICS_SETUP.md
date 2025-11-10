# Setup - Analyse des Commentaires

## 📦 Workflow N8N Importé

**Fichier**: `n8n-workflow-scrape-comments.json`

---

## 🗄️ Schema Supabase

Créez cette table dans Supabase:

```sql
-- Table pour stocker les commentaires scrapés
CREATE TABLE post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'linkedin', 'twitter'
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Sentiment analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_confidence FLOAT CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 1),
  emotion TEXT, -- 'joy', 'anger', 'sadness', 'fear', 'surprise'
  keywords JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key (optionnel si vous avez une table posts)
  -- FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_platform ON post_comments(platform);
CREATE INDEX idx_post_comments_sentiment ON post_comments(sentiment);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at DESC);

-- Vue pour analytics rapides
CREATE VIEW comment_analytics AS
SELECT
  post_id,
  platform,
  COUNT(*) as total_comments,
  COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
  COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count,
  ROUND(AVG(sentiment_confidence)::numeric, 2) as avg_confidence,
  ARRAY_AGG(DISTINCT emotion) FILTER (WHERE emotion IS NOT NULL) as emotions,
  MIN(created_at) as first_comment_at,
  MAX(created_at) as last_comment_at
FROM post_comments
GROUP BY post_id, platform;
```

---

## ⚙️ Configuration N8N

### 1. Installer Puppeteer dans N8N

Sur votre serveur N8N (srv837294.hstgr.cloud):

```bash
# SSH dans le serveur
ssh root@srv837294.hstgr.cloud

# Installer Puppeteer et dépendances
npm install puppeteer

# Installer Chrome/Chromium
apt-get update
apt-get install -y \
  chromium \
  chromium-driver \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils
```

### 2. Importer le Workflow

1. Connectez-vous à N8N: `https://n8n.srv837294.hstgr.cloud`
2. Allez dans **Workflows** → **Import from File**
3. Uploadez `n8n-workflow-scrape-comments.json`
4. Le workflow s'appellera "Postelma - Scrape Comments & Sentiment Analysis"

### 3. Configurer les Credentials

**OpenAI API**:
1. Allez dans **Credentials** → **Create New**
2. Type: **OpenAI API**
3. Nom: "OpenAI API"
4. API Key: Votre clé OpenAI (https://platform.openai.com/api-keys)
5. Save

**Supabase API**:
1. Credentials → Create New
2. Type: **Supabase**
3. Nom: "Supabase API"
4. Host: `https://qltfylleiwjvtngmsdyg.supabase.co`
5. Service Role Key: Votre Supabase `service_role_key` (Settings → API)
6. Save

### 4. Activer le Workflow

1. Ouvrez le workflow importé
2. Cliquez sur le node **"OpenAI Sentiment Analysis"**
3. Sélectionnez votre credential OpenAI
4. Cliquez sur le node **"Insert to Supabase"**
5. Sélectionnez votre credential Supabase
6. Cliquez sur **"Active"** en haut à droite
7. Le workflow est maintenant actif!

---

## 🚀 Utilisation depuis Votre App

### URL du Webhook

Après activation, N8N vous donne l'URL du webhook:

```
https://n8n.srv837294.hstgr.cloud/webhook/scrape-comments
```

### Appel depuis React

```typescript
// services/commentAnalytics.ts
export const scrapeComments = async (
  postId: string,
  platform: string,
  postUrl: string,
  userId: string
) => {
  const response = await fetch('https://n8n.srv837294.hstgr.cloud/webhook/scrape-comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_id: postId,
      platform: platform, // 'facebook', 'instagram', 'linkedin'
      post_url: postUrl,
      user_id: userId
    })
  });

  const result = await response.json();
  return result;
};

// Exemple d'utilisation
const result = await scrapeComments(
  'post_123',
  'instagram',
  'https://www.instagram.com/p/ABC123/',
  user.id
);

console.log(result);
/*
{
  "success": true,
  "total_comments": 42,
  "sentiment_breakdown": {
    "positive": 28,
    "negative": 5,
    "neutral": 9
  },
  "emotions": {
    "joy": 25,
    "surprise": 8,
    "anger": 4,
    "sadness": 3,
    "fear": 2
  },
  "sentiment_score": "0.55",
  "timestamp": "2025-11-10T10:30:00.000Z",
  "message": "Successfully analyzed 42 comments"
}
*/
```

---

## 📊 Récupérer les Analytics

```typescript
// Récupérer tous les commentaires d'un post
export const getPostComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  return data;
};

// Récupérer les analytics agrégées
export const getCommentAnalytics = async (postId: string) => {
  const { data, error } = await supabase
    .from('comment_analytics')
    .select('*')
    .eq('post_id', postId)
    .single();

  return data;
};
```

---

## 🧪 Test du Workflow

### Test Manuel dans N8N

1. Ouvrez le workflow
2. Cliquez sur **"Execute Workflow"** en bas
3. Entrez les données de test:
```json
{
  "post_id": "test_123",
  "platform": "instagram",
  "post_url": "https://www.instagram.com/p/REAL_POST_ID/",
  "user_id": "user_123"
}
```
4. Cliquez sur **"Execute"**
5. Vérifiez les résultats dans chaque node

### Test depuis votre App

```bash
curl -X POST https://n8n.srv837294.hstgr.cloud/webhook/scrape-comments \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "test_123",
    "platform": "instagram",
    "post_url": "https://www.instagram.com/p/REAL_POST_ID/",
    "user_id": "user_123"
  }'
```

---

## ⚡ Performance

**Temps d'exécution estimé**:
- Scraping: 5-15 secondes (selon le nombre de commentaires)
- Sentiment analysis: 0.5 secondes par commentaire
- **Total pour 50 commentaires**: ~30-40 secondes

**Coût estimé**:
- OpenAI GPT-3.5-turbo: ~$0.002 / 1000 tokens
- 50 commentaires ≈ 5000 tokens ≈ $0.01
- **1000 posts/mois avec 50 comments chacun = $10/mois**

---

## 🔒 Sécurité

**Important**:
1. ✅ Utilisez le `service_role_key` Supabase uniquement dans N8N (backend)
2. ✅ Ne jamais exposer le `service_role_key` dans le frontend
3. ✅ Ajoutez une authentification au webhook (optionnel):

```javascript
// Dans le node "Validate Input", ajoutez:
const apiKey = $input.item.json.headers.authorization;
if (apiKey !== 'Bearer YOUR_SECRET_KEY') {
  throw new Error('Unauthorized');
}
```

---

## 📈 Améliorations Futures

1. **Rate Limiting**: Limiter à X scrapes/heure par user
2. **Caching**: Stocker les résultats pour 1h avant re-scraper
3. **Webhooks**: Notifier l'app quand l'analyse est terminée
4. **Queue System**: Pour gérer de gros volumes
5. **Proxies Rotatifs**: Pour éviter blocages IP

---

**Prêt à l'emploi!** 🚀
