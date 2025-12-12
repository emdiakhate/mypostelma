# 🔍 Diagnostic des Problèmes Meta (Facebook/Instagram)

**Date:** 2025-12-12
**Problèmes identifiés:**
1. ✅ Facebook se connecte
2. ❌ Instagram ne se connecte pas
3. ❌ Publication Facebook échoue

---

## 📋 Analyse du Code

### Problème 1: Instagram ne se connecte pas

**Code concerné:** `supabase/functions/meta-oauth-callback/index.ts:145-164`

```typescript
// For Instagram, we need to get the Instagram Business Account
if (platform === "instagram") {
  // Get Facebook Pages with Instagram Business Accounts
  const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${finalToken}`;
  const pagesResponse = await fetch(pagesUrl);
  const pagesData = await pagesResponse.json();

  const pages: FacebookPage[] = pagesData.data || [];
  const pageWithInstagram = pages.find((p) => p.instagram_business_account);

  if (pageWithInstagram && pageWithInstagram.instagram_business_account) {
    // Succès
  } else {
    // ❌ ERREUR: "No Instagram Business Account found"
    return new Response(
      JSON.stringify({
        error: "No Instagram Business Account found",
        message: "Please connect a Facebook Page with an Instagram Business Account"
      }),
      { status: 400 }
    );
  }
}
```

**🎯 Cause du problème:**

L'app tente de récupérer un compte Instagram Business lié à une page Facebook. Si aucun n'est trouvé, la connexion échoue.

**✅ Solutions:**

#### Solution 1: Convertir votre compte Instagram en Business

1. **Sur votre téléphone Instagram:**
   - Allez dans **Paramètres** → **Compte**
   - Appuyez sur **Passer à un compte professionnel**
   - Choisissez **Entreprise**

2. **Lier à une page Facebook:**
   - Paramètres → **Compte** → **Page liée**
   - Connectez-vous à Facebook et sélectionnez/créez une page
   - **Important:** Vous devez être administrateur de la page Facebook

3. **Vérifier la connexion:**
   - Page Facebook → **Paramètres** → **Instagram**
   - Vérifiez que votre compte Instagram est bien lié

#### Solution 2: Vérifier les permissions Meta

1. Allez sur https://developers.facebook.com/apps/1962990054562877
2. Menu gauche → **Use Cases** → **Customize**
3. Assurez-vous que ces permissions sont ajoutées:

**Pour Instagram:**
```
✓ instagram_basic
✓ instagram_manage_messages
✓ instagram_content_publish (pour publier)
✓ pages_show_list
✓ pages_read_engagement
```

4. Si ces permissions ne sont pas disponibles, activez **Instagram Graph API**:
   - Dashboard → **Add Products** → **Instagram Graph API** → **Set Up**

---

### Problème 2: Publication Facebook échoue

**Code concerné:** `supabase/functions/meta-publish/index.ts:196-250`

La publication Facebook utilise 2 endpoints selon le type:
- **Photos:** `/{pageId}/photos`
- **Texte:** `/{pageId}/feed`

**🎯 Causes possibles:**

1. **Token d'accès à la page manquant**
   ```typescript
   if (!account.access_token) {
     return new Response(JSON.stringify({
       error: 'Token d\'accès manquant. Veuillez reconnecter votre compte.'
     }), { status: 400 });
   }
   ```

2. **Permissions insuffisantes**
   - Le token de la page doit avoir `pages_manage_posts`

3. **URL d'image non accessible**
   - Les images doivent être publiquement accessibles (HTTPS)
   - Pas de blob: ou data: URLs directement

**✅ Solutions:**

#### Solution 1: Reconnecter Facebook

1. Déconnectez Facebook depuis `/app/connections`
2. Reconnectez en vous assurant d'accepter toutes les permissions
3. Vérifiez que vous sélectionnez la bonne **page Facebook** (pas votre profil)

#### Solution 2: Vérifier les permissions de l'app

1. Dashboard Meta → Votre App → **Use Cases**
2. Ajoutez ces permissions:

**Pour publications Facebook:**
```
✓ pages_show_list
✓ pages_manage_posts        ← CRUCIAL pour publier
✓ pages_read_engagement
✓ pages_read_user_content
```

3. **Important:** Certaines permissions nécessitent une révision par Meta:
   - Si l'app est en mode **Development**, seuls les testeurs peuvent utiliser l'app
   - Pour aller en production, soumettez une révision: **App Review** → **Permissions**

#### Solution 3: Vérifier l'App Mode

1. Dashboard Meta → **Settings** → **Basic**
2. Vérifiez le statut:
   - **Development:** Seuls les testeurs/admins peuvent utiliser l'app
   - **Live:** Accessible publiquement (nécessite révision Meta)

3. Ajouter des testeurs (si en Development):
   - **Roles** → **Test Users**
   - Ou **Roles** → **Administrators** pour ajouter votre compte

---

### Problème 3: Récupération de messages

**Permissions requises:**

```
Facebook Messenger:
✓ pages_messaging
✓ pages_manage_metadata
✓ pages_read_user_content

Instagram Direct:
✓ instagram_manage_messages
✓ instagram_basic
✓ pages_show_list
```

**Note:** Ces permissions nécessitent généralement une révision Meta avant utilisation en production.

---

## 🧪 Tests Manuels

### Test 1: Vérifier que l'App ID/Secret sont valides

Utilisez l'API Graph Explorer:
1. Allez sur https://developers.facebook.com/tools/explorer/
2. Sélectionnez votre app: **1962990054562877**
3. Cliquez sur **Get Token** → **Get App Token**
4. Si vous obtenez un token, les identifiants sont valides ✅

### Test 2: Vérifier les pages Facebook accessibles

1. Dans Graph Explorer, avec un **User Access Token**
2. Endpoint: `GET /me/accounts`
3. Ajoutez les champs: `id,name,access_token,instagram_business_account`
4. Cliquez **Submit**

**Résultat attendu:**
```json
{
  "data": [
    {
      "id": "page_id",
      "name": "Nom de la page",
      "access_token": "page_token...",
      "instagram_business_account": {
        "id": "instagram_id"
      }
    }
  ]
}
```

Si `instagram_business_account` est absent → Votre Instagram n'est pas lié ou n'est pas Business.

### Test 3: Tester une publication Facebook

1. Graph Explorer → **User Access Token** avec permissions `pages_manage_posts`
2. Changez en **POST** request
3. Endpoint: `/{PAGE_ID}/feed`
4. Paramètres:
   ```
   message: Test de publication depuis Graph Explorer
   ```
5. **Submit**

Si erreur → Vérifiez le message d'erreur Meta.

---

## 📊 Checklist de Vérification

### Configuration Meta Developer

- [ ] App ID: `1962990054562877` est correct
- [ ] App Secret configuré dans Supabase Edge Functions env vars
- [ ] Redirect URIs configurés:
  - [ ] `https://mypostelma.lovable.app/oauth/callback`
  - [ ] `https://preview--mypostelma.lovable.app/oauth/callback`
  - [ ] `https://postelma.com/oauth/callback`
- [ ] App en mode **Development** avec testeurs ajoutés OU **Live** après révision
- [ ] **Facebook Login** → **Settings** → Valid OAuth Redirect URIs configurés

### Permissions

**Facebook:**
- [ ] `pages_show_list`
- [ ] `pages_manage_posts`
- [ ] `pages_read_engagement`
- [ ] `pages_messaging`
- [ ] `pages_manage_metadata`

**Instagram:**
- [ ] `instagram_basic`
- [ ] `instagram_manage_messages`
- [ ] `instagram_content_publish`
- [ ] Instagram Graph API activé dans les produits

### Configuration Instagram

- [ ] Compte Instagram converti en **Business** ou **Creator**
- [ ] Compte Instagram lié à une **page Facebook**
- [ ] Vous êtes **administrateur** de la page Facebook
- [ ] Vérifiable sur Page FB → **Paramètres** → **Instagram**

### Configuration Supabase

- [ ] Variable `META_APP_ID` définie dans Edge Functions
- [ ] Variable `META_APP_SECRET` définie dans Edge Functions
- [ ] Edge function `meta-oauth-callback` déployée
- [ ] Edge function `meta-publish` déployée

---

## 🔧 Commandes de Débogage

### Voir les logs de l'Edge Function OAuth

```bash
# Dashboard Supabase → Edge Functions → meta-oauth-callback → Logs

# Ou via CLI
supabase functions logs meta-oauth-callback
```

**Logs importants à chercher:**
```
[Meta OAuth] Fetching Instagram Business Account...
[Meta OAuth] Pages response: {"data": [...]}
[Meta OAuth] No Instagram Business Account found  ← ERREUR ICI
```

### Voir les logs de publication

```bash
supabase functions logs meta-publish
```

**Logs importants:**
```
[META-PUBLISH] Publishing to facebook for user...
[META-PUBLISH] Facebook photo error: {...}  ← ERREUR ICI
```

---

## 🎯 Actions Prioritaires

### 1️⃣ Pour Instagram (PRIORITÉ HAUTE)

1. **Convertir le compte en Business**
   - Instagram App → Paramètres → Compte → Passer à un compte professionnel

2. **Lier à une page Facebook**
   - Instagram App → Paramètres → Compte → Page liée

3. **Activer Instagram Graph API**
   - Meta Developer Dashboard → Add Products → Instagram Graph API

4. **Ajouter les permissions Instagram**
   - Use Cases → Customize → Ajouter `instagram_basic`, `instagram_manage_messages`

### 2️⃣ Pour Publication Facebook (PRIORITÉ HAUTE)

1. **Vérifier le mode de l'app**
   - Settings → Basic → App Mode
   - Si Development → Ajouter votre compte comme testeur/admin

2. **Ajouter pages_manage_posts**
   - Use Cases → Customize → `pages_manage_posts`

3. **Reconnecter Facebook**
   - App → Déconnecter Facebook → Reconnecter
   - Accepter TOUTES les permissions demandées
   - Sélectionner la page Facebook (pas le profil)

### 3️⃣ Pour Messages (PRIORITÉ MOYENNE)

1. **Activer Messenger/Instagram APIs**
   - Dashboard → Add Products → Messenger / Instagram

2. **Soumettre pour révision**
   - App Review → Demander `pages_messaging`, `instagram_manage_messages`
   - Fournir une vidéo/description de l'utilisation

---

## 🆘 Besoin d'Aide?

Si les problèmes persistent après avoir suivi ce guide:

1. **Vérifiez les logs** Supabase Edge Functions
2. **Testez dans Graph Explorer** pour isoler le problème
3. **Vérifiez le statut de l'app** (Development vs Live)
4. **Consultez la documentation Meta:**
   - https://developers.facebook.com/docs/facebook-login
   - https://developers.facebook.com/docs/instagram-api
   - https://developers.facebook.com/docs/graph-api/reference/page/feed

---

**⚠️ SÉCURITÉ:** Après le débogage, régénérez votre App Secret dans Meta Developer Dashboard et mettez à jour la variable d'environnement dans Supabase.
