# Guide de Test - Competitive Intelligence

## 🔍 Problème "Ajouter un concurrent" ne fonctionne pas

### Diagnostic rapide

1. **Ouvrez la console du navigateur** (F12 → Console)
   - Vérifiez s'il y a des erreurs JavaScript
   - Erreurs communes : "Cannot read property", "undefined is not a function"

2. **Vérifiez que vous êtes connecté**
   - La page nécessite une authentification
   - Si non connecté, vous serez redirigé vers `/auth`

3. **Testez manuellement le Dialog**
   - Ouvrez la console et tapez :
   ```javascript
   document.querySelector('button[type="button"]').click()
   ```

### Solutions possibles

**Solution 1: Vider le cache du navigateur**
```
Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
```

**Solution 2: Vérifier les logs**
```bash
# Dans le terminal, vérifiez les logs du serveur
tail -f /tmp/dev-server.log
```

**Solution 3: Forcer le rebuild**
```bash
npm run build
npm run dev
```

---

## 🧪 Guide de Test Complet

### Étape 1: Ajouter un Concurrent de Test

Utilisez ces exemples réels pour tester :

#### Exemple 1: Nike (Multi-plateformes)
```
Nom: Nike
Industrie: Sports & Apparel
Instagram: https://www.instagram.com/nike/
Twitter: https://twitter.com/Nike
Facebook: https://www.facebook.com/nike
TikTok: https://www.tiktok.com/@nike
Website: https://www.nike.com
```

#### Exemple 2: Netflix (Social Media Focus)
```
Nom: Netflix
Industrie: Entertainment
Instagram: https://www.instagram.com/netflix/
Twitter: https://twitter.com/netflix
Website: https://www.netflix.com
```

#### Exemple 3: Glossier (Beauty/E-commerce)
```
Nom: Glossier
Industrie: Beauty & Cosmetics
Instagram: https://www.instagram.com/glossier/
TikTok: https://www.tiktok.com/@glossier
Website: https://www.glossier.com
```

#### Exemple 4: Airbnb (Travel Tech)
```
Nom: Airbnb
Industrie: Hospitality
Instagram: https://www.instagram.com/airbnb/
Twitter: https://twitter.com/Airbnb
Facebook: https://www.facebook.com/airbnb
Website: https://www.airbnb.com
```

### Étape 2: Lancer l'Analyse

**Important:** Avant de lancer l'analyse, assurez-vous que les API keys sont configurées :

1. **Vérifier les secrets Supabase**
   ```bash
   # Voir les secrets configurés
   supabase secrets list
   ```

2. **Configurer les secrets requis** (si manquants)
   ```bash
   # Obligatoire
   supabase secrets set APIFY_TOKEN=votre_token_apify
   supabase secrets set OPENAI_API_KEY=votre_clé_openai

   # Optionnel (pour Twitter gratuit)
   supabase secrets set TWITTER_BEARER_TOKEN=votre_token_twitter
   ```

3. **Déployer la nouvelle Edge Function**
   ```bash
   supabase functions deploy analyze-competitor-apify
   ```

4. **Cliquer sur "Analyze"** sur la carte du concurrent
   - ⏱️ Durée: 1-5 minutes
   - 🔄 Le système poll automatiquement toutes les 15 secondes
   - ✅ Toast de confirmation à la fin

### Étape 3: Vérifier les Résultats

**Données Instagram attendues:**
- Nombre de followers
- Taux d'engagement
- Moyenne de likes/commentaires
- 10 derniers posts avec métriques

**Données Twitter attendues:**
- Followers, tweets count
- 10 derniers tweets avec engagement
- Source: "twitter_api_v2" ou "apify"

**Données Facebook attendues:**
- Likes de page, followers
- Posts récents avec engagement

**Données TikTok attendues:**
- Followers, hearts, vidéos count
- Vidéos récentes avec vues/likes

**Analyse OpenAI attendue:**
- Positionnement marketing
- Stratégie de contenu
- Forces (3-5 points)
- Faiblesses (2-3 points)
- Opportunités pour vous (3-5 points)
- Recommandations stratégiques

### Étape 4: Tester les Filtres

1. **Ajouter 3+ concurrents** de différentes industries
2. **Tester la recherche** par nom
3. **Tester le filtre** par industrie
4. **Vérifier les statistiques** en haut de page

---

## 🐛 Debugging - Problèmes Courants

### Problème: "Analysis failed: Apify token not configured"
**Solution:**
```bash
supabase secrets set APIFY_TOKEN=votre_token
supabase functions deploy analyze-competitor-apify
```

### Problème: "No data returned from Instagram"
**Causes possibles:**
- Profil privé
- URL invalide (doit être https://www.instagram.com/username/)
- Apify quota dépassé

**Test manuel dans Apify:**
1. Allez sur https://console.apify.com
2. Cherchez "Instagram Profile Scraper"
3. Testez avec l'URL du concurrent

### Problème: "Analysis taking longer than 5 minutes"
**Causes:**
- Gros compte (>1M followers)
- Apify actor timeout
- Trop de posts à scraper

**Solution:**
```typescript
// Dans analyze-competitor-apify/index.ts, réduire resultsLimit
{
  usernames: [username],
  resultsLimit: 50, // au lieu de 100
}
```

### Problème: Dialog ne s'ouvre pas
**Vérifications:**
1. **Console JavaScript** (F12)
2. **État d'authentification**
   ```javascript
   // Dans la console
   localStorage.getItem('supabase.auth.token')
   ```
3. **Composants shadcn/ui installés**
   ```bash
   ls -la src/components/ui/dialog.tsx
   ```

---

## 📊 Vérifier les Coûts

### Dans Supabase
```sql
-- Total des analyses effectuées
SELECT COUNT(*), SUM(analysis_cost) as total_cost_euros
FROM competitor_analysis;

-- Coût par concurrent
SELECT
  c.name,
  COUNT(ca.id) as analyses_count,
  SUM(ca.analysis_cost) as total_cost
FROM competitors c
LEFT JOIN competitor_analysis ca ON ca.competitor_id = c.id
GROUP BY c.id, c.name
ORDER BY total_cost DESC;
```

### Dans Apify Dashboard
1. Allez sur https://console.apify.com/billing
2. Vérifiez les crédits restants
3. Regardez l'historique des runs

---

## ✅ Checklist de Test Complet

- [ ] Bouton "Ajouter un concurrent" ouvre le dialog
- [ ] Formulaire accepte les données et sauvegarde
- [ ] Concurrent apparaît dans la liste
- [ ] Statistiques se mettent à jour
- [ ] Bouton "Analyze" lance l'analyse
- [ ] Toast "Analysis Started" s'affiche
- [ ] Polling toutes les 15 secondes
- [ ] Toast "Analysis Complete" après 1-5 min
- [ ] Analyse apparaît dans le card (expand)
- [ ] Données Instagram chargées correctement
- [ ] Données Twitter chargées correctement
- [ ] Analyse OpenAI complète et pertinente
- [ ] Filtres fonctionnent
- [ ] Recherche fonctionne
- [ ] Bouton "Delete" supprime le concurrent

---

## 🚀 Test Rapide (Sans Apify)

Si vous voulez tester SANS configurer Apify (juste pour voir l'UI):

1. **Commentez temporairement les scrapes Apify** dans l'Edge Function
2. **Gardez uniquement Jina.ai (website)**
3. **Testez avec un concurrent ayant seulement un website**

```typescript
// Dans analyze-competitor-apify/index.ts, ligne ~570
// Commentez tous les scrapes sauf website:

// if (instagram_url && apifyToken) { ... }  // COMMENTÉ
// if (twitter_url && apifyToken) { ... }     // COMMENTÉ
// if (facebook_url && apifyToken) { ... }    // COMMENTÉ
// if (tiktok_url && apifyToken) { ... }      // COMMENTÉ

if (website_url) {
  scrapePromises.push(
    scrapeWebsite(website_url).then(data => { scrapedData.website = data; })
  );
}
```

Puis ajoutez un concurrent avec SEULEMENT un website:
```
Nom: Example Co
Website: https://example.com
```

L'analyse prendra ~15 secondes et utilisera uniquement Jina.ai + OpenAI.

---

## 📞 Si ça ne fonctionne toujours pas

Envoyez-moi:
1. **Screenshot de la console (F12)**
2. **Logs du serveur de dev**
3. **Message d'erreur exact** dans les toasts
4. **Version de Node** (`node -v`)
5. **Résultat de** `supabase status`
