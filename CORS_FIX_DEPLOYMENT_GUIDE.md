# Guide de Déploiement - Fix CORS Edge Functions

**Date**: 2025-11-10
**Problème résolu**: Erreurs CORS bloquant postelma.com

---

## 🔍 Problème

Lors de la création d'un compte sur https://postelma.com, l'erreur CORS suivante se produit:

```
Access to fetch at 'https://qltfylleiwjvtngmsdyg.supabase.co/functions/v1/upload-post-get-profile'
from origin 'https://postelma.com' has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header has a value
'https://8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovableproject.com'
that is not equal to the supplied origin.
```

**Résultat**:
- ❌ Échec de la création de compte
- ❌ Profil Upload-Post non créé
- ❌ Utilisateur ne peut pas utiliser l'application

---

## ✅ Solution Appliquée

### Changements dans le code

Ajout de `https://postelma.com` et `https://www.postelma.com` à la liste `allowedOrigins` dans **toutes les 15 Edge Functions**:

```typescript
const allowedOrigins = [
  'https://postelma.com',           // ✅ NOUVEAU
  'https://www.postelma.com',       // ✅ NOUVEAU
  'https://8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovableproject.com',
  'https://id-preview--8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];
```

---

## 📝 Fonctions Mises à Jour (15/15)

| # | Fonction | Statut | Utilisation |
|---|----------|--------|-------------|
| 1 | `ai-lead-message` | ✅ Corrigé | Génération de messages IA pour leads |
| 2 | `ai-tone-generator` | ✅ Corrigé | Génération de tons de voix personnalisés |
| 3 | `analyze-writing-style` | ✅ Corrigé | Analyse du style d'écriture |
| 4 | `create-beta-subscription` | ✅ Corrigé | Création d'abonnement beta |
| 5 | `create-checkout` | ✅ Corrigé | Création de session de paiement |
| 6 | `fal-image-generation` | ✅ Corrigé | Génération d'images avec FAL.ai |
| 7 | `fal-video-generation` | ✅ Corrigé | Génération de vidéos avec FAL.ai |
| 8 | `generate-image-gemini` | ✅ Corrigé | Génération d'images avec Gemini |
| 9 | `monthly-quota-reset` | ✅ Corrigé | Réinitialisation des quotas mensuels |
| 10 | `upload-post-analytics` | ✅ Corrigé | Récupération des analytics Upload-Post |
| 11 | `upload-post-create-profile` | ✅ Corrigé | **Création de profil Upload-Post** |
| 12 | `upload-post-facebook-pages` | ✅ Corrigé | Récupération des pages Facebook |
| 13 | `upload-post-generate-jwt` | ✅ Corrigé | Génération de JWT Upload-Post |
| 14 | `upload-post-get-profile` | ✅ Corrigé | **Récupération de profil Upload-Post** |
| 15 | `voice-to-text` | ✅ Corrigé | Transcription vocale |

---

## 🚀 Déploiement sur Supabase

### Option 1: Via l'Interface Lovable (Recommandé)

**Si Lovable gère automatiquement le déploiement des Edge Functions:**

1. Les changements sont déjà committés dans Git
2. Lovable devrait automatiquement redéployer les fonctions
3. Attendez quelques minutes et testez

### Option 2: Via Supabase CLI (Manuel)

**Si vous devez déployer manuellement:**

#### Prérequis

Installer Supabase CLI:
```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Connexion

```bash
# Login à Supabase
supabase login

# Link au projet
supabase link --project-ref qltfylleiwjvtngmsdyg
```

#### Déploiement

**Option A: Déployer toutes les fonctions en une fois**

```bash
# Depuis la racine du projet
supabase functions deploy --project-ref qltfylleiwjvtngmsdyg
```

**Option B: Déployer une fonction spécifique (pour tester)**

```bash
# Juste la fonction de création de profil
supabase functions deploy upload-post-create-profile --project-ref qltfylleiwjvtngmsdyg

# Juste la fonction de récupération de profil
supabase functions deploy upload-post-get-profile --project-ref qltfylleiwjvtngmsdyg
```

**Option C: Déployer les fonctions critiques d'abord**

```bash
# Fonctions Upload-Post (critique pour signup)
supabase functions deploy upload-post-create-profile --project-ref qltfylleiwjvtngmsdyg
supabase functions deploy upload-post-get-profile --project-ref qltfylleiwjvtngmsdyg
supabase functions deploy upload-post-generate-jwt --project-ref qltfylleiwjvtngmsdyg

# Puis les autres
supabase functions deploy --project-ref qltfylleiwjvtngmsdyg
```

---

## 🧪 Validation du Déploiement

### 1. Vérifier le déploiement

```bash
# Lister toutes les fonctions déployées
supabase functions list --project-ref qltfylleiwjvtngmsdyg

# Voir les logs d'une fonction
supabase functions logs upload-post-create-profile --project-ref qltfylleiwjvtngmsdyg
```

### 2. Tester la création de compte

**Allez sur** https://postelma.com/auth

1. Créez un nouveau compte test
2. Vérifiez qu'il n'y a plus d'erreur CORS dans la console
3. Vérifiez que le profil est créé dans Upload-Post

### 3. Vérifier dans la console

**Avant le fix (erreur CORS)**:
```
❌ Access to fetch at '...' has been blocked by CORS policy
```

**Après le fix (succès)**:
```
✅ POST https://qltfylleiwjvtngmsdyg.supabase.co/functions/v1/upload-post-get-profile 200 OK
```

---

## 📊 Checklist de Validation

Après le déploiement, testez:

- [ ] **Signup**: Créer un nouveau compte
- [ ] **Profile Upload-Post**: Vérifier que le profil est créé
- [ ] **Login**: Se connecter avec le compte créé
- [ ] **Dashboard**: Accéder au dashboard sans erreur
- [ ] **Post Creation**: Créer un post
- [ ] **AI Generation**: Tester génération d'image/caption
- [ ] **Analytics**: Vérifier affichage des analytics

---

## 🔧 Dépannage

### Erreur: "Project not linked"

```bash
supabase link --project-ref qltfylleiwjvtngmsdyg
```

### Erreur: "Not authenticated"

```bash
supabase login
```

### Les changements ne sont pas appliqués

1. Vérifier que le déploiement a réussi:
```bash
supabase functions list --project-ref qltfylleiwjvtngmsdyg
```

2. Vider le cache du navigateur (Ctrl+Shift+R)

3. Vérifier les logs de la fonction:
```bash
supabase functions logs upload-post-create-profile --project-ref qltfylleiwjvtngmsdyg
```

### Toujours des erreurs CORS

1. Vérifier que les fonctions sont bien déployées avec la nouvelle config
2. Attendre 2-3 minutes (propagation)
3. Vider le cache navigateur
4. Vérifier que l'origine dans la console est bien `https://postelma.com`

---

## 📚 Ressources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [CORS Configuration](https://supabase.com/docs/guides/functions/cors)

---

## 🎯 Commit Effectué

**Commit**: `84f39bf - Fix CORS: Add postelma.com to all Edge Functions`

**Fichiers modifiés**: 15 Edge Functions
**Branche**: `claude/analyze-gemini-fallback-011CUrfbGTh9MbTZUaJN46yi`
**Statut**: ✅ Pushé avec succès

---

## 🚨 Important

**APRÈS LE DÉPLOIEMENT**, n'oubliez pas de:

1. ✅ Tester la création de compte
2. ✅ Vérifier Upload-Post dans l'interface admin
3. ✅ Tester toutes les fonctionnalités IA
4. ✅ Vérifier les quotas et analytics

---

**Généré le**: 2025-11-10
**Par**: Claude Code
