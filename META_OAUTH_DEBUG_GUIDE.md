# Guide de Débogage - Erreur Meta OAuth (400 Bad Request)

## 🔍 Diagnostic du Problème

L'erreur 400 lors de la connexion Facebook/Instagram provient généralement de :
1. **Variables d'environnement manquantes** dans Supabase
2. **Redirect URI mismatch** entre l'app et la config Meta Developer
3. **Code d'autorisation invalide** ou expiré

---

## ✅ Étapes de Résolution

### 1. Vérifier les Variables d'Environnement Supabase

L'edge function `meta-oauth-callback` nécessite deux variables d'environnement :

```bash
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
```

**Comment vérifier/configurer :**

1. Allez sur https://supabase.com/dashboard/project/[votre-projet-id]
2. Naviguez vers **Settings** → **Edge Functions** → **Environment Variables**
3. Vérifiez que ces variables sont définies :
   - `META_APP_ID`
   - `META_APP_SECRET`

**Si elles sont manquantes :**

1. Allez sur https://developers.facebook.com/apps/
2. Sélectionnez votre application
3. Dans **Settings** → **Basic**, copiez :
   - **App ID** → Variable `META_APP_ID`
   - **App Secret** (cliquez sur "Show") → Variable `META_APP_SECRET`
4. Ajoutez-les dans Supabase Edge Functions Environment Variables

---

### 2. Vérifier la Configuration du Redirect URI dans Meta Developer

Le redirect URI doit correspondre EXACTEMENT entre :
- L'URL générée par le frontend
- L'URL configurée dans Meta Developer

**URLs utilisées par l'app :**
```
Production:     https://mypostelma.lovable.app/oauth/callback
Preview:        https://preview--mypostelma.lovable.app/oauth/callback
Personnalisé:   https://postelma.com/oauth/callback
```

**Comment configurer dans Meta Developer :**

1. Allez sur https://developers.facebook.com/apps/
2. Sélectionnez votre application
3. Dans le menu de gauche, **Facebook Login** → **Settings**
4. Ajoutez ces URIs dans **Valid OAuth Redirect URIs** :
   ```
   https://mypostelma.lovable.app/oauth/callback
   https://preview--mypostelma.lovable.app/oauth/callback
   https://postelma.com/oauth/callback
   ```
5. Cliquez sur **Save Changes** en bas de page

**⚠️ IMPORTANT:** Les URIs doivent être **exactement** les mêmes (pas de slash final différent, pas de http vs https, etc.)

---

### 3. Vérifier les Permissions de l'Application Meta

Assurez-vous que votre application Meta a les permissions nécessaires :

**Pour Facebook :**
- `pages_show_list`
- `pages_messaging`
- `pages_read_engagement`
- `pages_manage_metadata`

**Pour Instagram :**
- `instagram_basic`
- `instagram_manage_messages`
- `pages_show_list`
- `pages_messaging`

**Comment vérifier :**
1. Meta Developer Dashboard → Votre App → **App Review** → **Permissions and Features**
2. Vérifiez que les permissions listées sont **approuvées** ou en mode **test**

---

### 4. Vérifier les Logs de l'Edge Function

Après avoir configuré les variables d'environnement, testez à nouveau et consultez les logs :

1. Dashboard Supabase → **Edge Functions** → **Logs**
2. Cherchez les logs pour `meta-oauth-callback`
3. Les nouveaux logs améliorés afficheront :
   ```
   [Meta OAuth] Redirect URI: https://...
   [Meta OAuth] Platform: facebook|instagram
   [Meta OAuth] Token exchange failed:
   [Meta OAuth] Status: 400
   [Meta OAuth] Response: { error: {...} }
   ```

**Messages d'erreur courants :**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Missing META_APP_ID or META_APP_SECRET` | Variables env non définies | Configurer dans Supabase |
| `redirect_uri_mismatch` | URI ne correspond pas | Vérifier config Meta Developer |
| `Invalid authorization code` | Code utilisé/expiré | Réessayer la connexion |
| `Invalid OAuth access token` | Token invalide | Vérifier APP_SECRET |

---

### 5. Test de l'Edge Function Manuellement

Vous pouvez tester l'edge function directement :

```bash
# Via curl (après avoir obtenu un code OAuth)
curl -X POST https://qltfylleiwjvtngmsdyg.supabase.co/functions/v1/meta-oauth-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "code": "CODE_FROM_META",
    "redirect_uri": "https://mypostelma.lovable.app/oauth/callback",
    "platform": "facebook",
    "user_id": "YOUR_USER_ID"
  }'
```

---

## 🚀 Redéploiement de l'Edge Function

Si vous avez modifié le code de l'edge function, redéployez-la :

```bash
# Via Supabase CLI
supabase functions deploy meta-oauth-callback

# Ou via le dashboard Supabase
# Functions → meta-oauth-callback → Deploy
```

---

## 🧪 Test Complet

1. ✅ Variables d'environnement configurées
2. ✅ Redirect URIs ajoutés dans Meta Developer
3. ✅ Permissions configurées
4. ✅ Edge function redéployée
5. 🔄 Tester la connexion depuis l'UI

**Étapes de test :**
1. Allez sur `/app/connections`
2. Cliquez sur "Connecter Facebook" ou "Connecter Instagram"
3. Suivez le flow OAuth
4. Vérifiez les logs console du navigateur (F12)
5. Vérifiez les logs Edge Functions dans Supabase

---

## 📋 Checklist de Dépannage

- [ ] Variables `META_APP_ID` et `META_APP_SECRET` définies dans Supabase
- [ ] Les redirect URIs correspondent exactement dans Meta Developer
- [ ] L'application Meta est en mode "Development" ou "Live"
- [ ] Les permissions requises sont approuvées
- [ ] L'edge function a été redéployée avec le code mis à jour
- [ ] Les logs de l'edge function sont consultés pour l'erreur exacte
- [ ] Le compte Facebook/Instagram de test a accès à l'application

---

## 🆘 Messages d'Erreur Améliorés

Avec le code mis à jour, l'erreur devrait maintenant afficher :

```
Failed to exchange code for token

Vérifiez que l'URI de redirection est bien configurée dans votre application Meta Developer

Details: {
  "error": {
    "message": "Error validating verification code...",
    "type": "OAuthException",
    "code": 100,
    "fbtrace_id": "..."
  }
}
```

Cela vous donnera des indices précis sur le problème !

---

## 📞 Support

Si le problème persiste après toutes ces vérifications :
1. Consultez les logs complets de l'edge function
2. Vérifiez que l'app Meta n'est pas en mode "Restricted"
3. Testez avec un compte Facebook différent

---

**Dernière mise à jour :** 2025-12-11
