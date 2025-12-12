# 🔧 Guide de Débogage - Erreur 500 Publication Facebook

**Date:** 2025-12-12
**Erreur:** `POST meta-publish 500 (Internal Server Error)`
**Contexte:** Publication Facebook échoue avec erreur 500

---

## 🔍 Diagnostic de l'Erreur

### Erreur Observée

```
POST https://qltfylleiwjvtngmsdyg.supabase.co/functions/v1/meta-publish 500 (Internal Server Error)
Meta publish error: FunctionsHttpError: Edge Function returned a non-2xx status code
```

### Cause Probable

L'erreur 500 signifie qu'il y a une exception non gérée dans l'edge function `meta-publish`. Les causes les plus fréquentes :

1. **Token d'accès manquant** dans `connected_accounts`
2. **`platform_account_id` manquant** (ID de la page Facebook)
3. **Token expiré** (code 190 de Meta API)
4. **Permissions insuffisantes** (pas de `pages_manage_posts`)
5. **Page Facebook non valide** ou pas d'accès admin

---

## ✅ Améliorations Apportées

### 1. Logs Détaillés dans `meta-publish/index.ts`

Ajout de logs à chaque étape :

```typescript
// Étape 1: Authentification
console.log('[META-PUBLISH] User authenticated:', user.id);

// Étape 2: Récupération du compte
console.log('[META-PUBLISH] Account found:', {
  platform: account.platform,
  account_name: account.account_name,
  has_token: !!account.access_token,
  platform_account_id: account.platform_account_id
});

// Étape 3: Vérifications
console.log('[META-PUBLISH] Using page ID:', pageId);

// Étape 4: Appel API Facebook
console.log('[META-PUBLISH] Publishing text post to Facebook page:', pageId);
console.log('[META-PUBLISH] Facebook API response status:', response.status);
```

### 2. Vérifications Supplémentaires

**Vérification du `platform_account_id` :**

```typescript
if (!account.platform_account_id) {
  return new Response(JSON.stringify({
    error: 'ID de page Facebook manquant. Veuillez reconnecter votre compte.',
    account_name: account.account_name
  }), { status: 400 });
}
```

### 3. Messages d'Erreur Améliorés

**Traduction des codes d'erreur Meta :**

```typescript
if (errorData.error?.code === 190) {
  userMessage = 'Token d\'accès expiré. Veuillez reconnecter votre compte Facebook.';
} else if (errorData.error?.code === 200) {
  userMessage = 'Permissions insuffisantes. Vérifiez que vous avez autorisé la publication sur cette page.';
} else if (errorData.error?.code === 100) {
  userMessage = 'Paramètre invalide. ' + (errorData.error?.message || '');
}
```

### 4. Gestion d'Erreur Côté Client (`usePostPublishing.ts`)

Meilleure extraction des erreurs :

```typescript
if (error.context) {
  const errorBody = await error.context.json();
  errorDetails = errorBody.error || errorDetails;
  if (errorBody.hint) {
    errorDetails += `\n\n${errorBody.hint}`;
  }
}
```

---

## 🚀 Actions Requises

### 1. Redéployer l'Edge Function

```bash
# Via Supabase CLI
supabase functions deploy meta-publish

# Ou via Dashboard Supabase
# Functions → meta-publish → Deploy
```

### 2. Consulter les Logs

**Via Dashboard Supabase :**
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. **Edge Functions** → **meta-publish** → **Logs**

**Logs à chercher :**

```
[META-PUBLISH] Starting publish request
[META-PUBLISH] User authenticated: xxx
[META-PUBLISH] Account ID: xxx
[META-PUBLISH] Account found: {...}
[META-PUBLISH] Using page ID: xxx
```

**Si l'erreur se produit à une étape spécifique, vous verrez :**

```
[META-PUBLISH] Account not found: {...}
// OU
[META-PUBLISH] Missing access token for account: xxx
// OU
[META-PUBLISH] Missing platform_account_id for account: xxx
// OU
[META-PUBLISH] Facebook post error: {...}
```

### 3. Vérifier la Configuration du Compte

**Via SQL dans Supabase :**

```sql
-- Vérifier votre compte Facebook connecté
SELECT
  id,
  platform,
  account_name,
  platform_account_id,
  access_token IS NOT NULL as has_token,
  status,
  created_at
FROM connected_accounts
WHERE user_id = 'YOUR_USER_ID'
  AND platform = 'facebook';
```

**Résultat attendu :**
- ✅ `has_token` = `true`
- ✅ `platform_account_id` = ID de votre page Facebook (pas null)
- ✅ `status` = `'active'`

**Si `platform_account_id` est NULL :**
→ Problème lors de la connexion Facebook. Reconnecter le compte.

**Si `has_token` est `false` :**
→ Token d'accès manquant. Reconnecter le compte.

---

## 🔍 Causes Communes et Solutions

### Cause 1: Token d'Accès Manquant

**Symptôme :**
```
[META-PUBLISH] Missing access token for account: xxx
```

**Solution :**
1. Déconnectez Facebook : `/app/connections` → Déconnecter
2. Reconnectez Facebook
3. **Important :** Acceptez TOUTES les permissions demandées
4. Sélectionnez votre **page Facebook** (pas votre profil personnel)

### Cause 2: ID de Page Facebook Manquant

**Symptôme :**
```
[META-PUBLISH] Missing platform_account_id for account: xxx
```

**Solution :**
1. Vérifiez dans `meta-oauth-callback` que le `platform_account_id` est bien sauvegardé
2. Lors de la connexion Facebook, assurez-vous de :
   - Avoir au moins une page Facebook
   - Être **administrateur** de cette page
   - Autoriser l'accès à cette page

**Dans `meta-oauth-callback/index.ts` (lignes 177-190) :**
```typescript
// If there's at least one page, use the first page as the primary account
if (pages.length > 0) {
  accountData.account_name = pages[0].name;
  accountData.platform_account_id = pages[0].id; // ← Doit être défini
  accountData.access_token = pages[0].access_token;
}
```

### Cause 3: Token Expiré (Code 190)

**Symptôme :**
```
[META-PUBLISH] Facebook post error: { error: { code: 190 } }
```

**Solution :**
- Reconnectez votre compte Facebook
- Les tokens Meta expirent après 60 jours (long-lived token)

### Cause 4: Permissions Insuffisantes (Code 200)

**Symptôme :**
```
[META-PUBLISH] Facebook post error: { error: { code: 200 } }
```

**Solution :**
1. Meta Developer Dashboard → Votre app
2. **Use Cases** → **Customize**
3. Ajoutez la permission : **`pages_manage_posts`** ← CRUCIAL
4. Si Development mode : Ajoutez votre compte comme testeur
5. Déconnectez/Reconnectez Facebook sur Postelma

### Cause 5: Paramètre Invalide (Code 100)

**Symptôme :**
```
[META-PUBLISH] Facebook post error: { error: { code: 100 } }
```

**Causes possibles :**
- Message vide ou trop long
- URL d'image invalide (blob:// ou data://)
- Page ID incorrect

**Solution :**
- Vérifiez que le message n'est pas vide
- Si vous publiez une image, assurez-vous qu'elle est publiquement accessible (HTTPS)

---

## 📊 Checklist de Débogage

### Configuration Meta Developer

- [ ] App ID et App Secret configurés dans Supabase env vars
- [ ] Redirect URIs configurés dans Facebook Login settings
- [ ] Permission `pages_manage_posts` activée
- [ ] Permission `pages_show_list` activée
- [ ] App en mode Development avec testeurs OU Live après révision

### Compte Facebook dans `connected_accounts`

- [ ] `access_token` présent (not null)
- [ ] `platform_account_id` présent (ID de la page Facebook)
- [ ] `status` = 'active'
- [ ] `token_expires_at` dans le futur (pas expiré)

### Configuration de la Page Facebook

- [ ] Vous êtes **administrateur** de la page
- [ ] La page n'est **pas restreinte**
- [ ] La page est **publiée** (pas en brouillon)

### Edge Function

- [ ] Déployée avec les dernières modifications
- [ ] Variables d'environnement correctes :
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## 🧪 Test Manuel

### Test 1: Vérifier le Token dans Graph Explorer

1. Allez sur https://developers.facebook.com/tools/explorer/
2. Sélectionnez votre app
3. **Get Token** → **Get User Access Token**
4. Cochez : `pages_show_list`, `pages_manage_posts`
5. Endpoint : `GET /me/accounts?fields=id,name,access_token`

**Résultat attendu :**
```json
{
  "data": [
    {
      "id": "PAGE_ID",
      "name": "Ma Page",
      "access_token": "token..."
    }
  ]
}
```

### Test 2: Tester une Publication

Dans Graph Explorer :

1. Changez en **POST**
2. Endpoint : `/{PAGE_ID}/feed`
3. Paramètres :
   ```
   message: Test de publication
   access_token: {le token de la page}
   ```
4. **Submit**

**Si succès :** Le problème vient de votre app (token ou config)
**Si erreur :** Le problème vient de Meta (permissions, page, etc.)

---

## 📞 Prochaines Étapes

1. **Redéployez** l'edge function `meta-publish`
2. **Réessayez** de publier sur Facebook
3. **Consultez les logs** Supabase pour identifier l'erreur exacte
4. **Suivez la solution** correspondant au log d'erreur

**Avec les logs améliorés, vous verrez exactement où l'erreur se produit !**

---

## 🔐 Note de Sécurité

Les améliorations incluent des logs détaillés. En production, assurez-vous de ne pas logger des informations sensibles comme :
- Tokens d'accès complets (loggez `!!token` au lieu de `token`)
- Secrets API
- Données utilisateur sensibles

Les logs actuels sont sécurisés et ne loggent que :
- User ID (UUID anonyme)
- Présence du token (`has_token: true/false`)
- IDs de pages Facebook (publics)
