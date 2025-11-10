# Fix de Déploiement - Variables d'Environnement en Production

**Date**: 2025-11-10
**Problème**: `supabaseUrl is required` en production sur Lovable Cloud

---

## 🔍 Problème Identifié

Après avoir sécurisé les fichiers `.env` (retirés du Git), Lovable Cloud ne peut plus accéder aux variables d'environnement nécessaires pour le build de production.

**Erreur rencontrée**:
```
Uncaught Error: supabaseUrl is required.
```

---

## ✅ Solution Appliquée (TEMPORAIRE)

### Fallbacks dans le code

Ajout de valeurs par défaut dans `src/integrations/supabase/client.ts`:

```typescript
// TEMPORARY WORKAROUND: Fallback values for production deployment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qltfylleiwjvtngmsdyg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGc...";
```

**Note**: Ces clés sont des clés **publiques** (anon key) - il est **sécuritaire** de les exposer dans le code client. Elles ne donnent pas d'accès admin à Supabase.

---

## 🎯 Solution Recommandée (Long Terme)

### Option 1: Configuration Lovable Cloud (PRÉFÉRÉE)

Lovable Cloud devrait permettre de configurer les variables d'environnement via leur interface:

1. Aller dans les paramètres du projet Lovable
2. Section "Environment Variables"
3. Ajouter:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

### Option 2: Fichier de configuration dédié

Créer un fichier `config/environment.ts` avec les valeurs:

```typescript
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "fallback",
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY || "fallback"
};
```

---

## 🔒 Sécurité

### ✅ C'est sécuritaire car:

1. **Clés publiques uniquement**: Les clés Supabase exposées sont des "anon keys" (clés anonymes publiques)
2. **Row Level Security (RLS)**: La sécurité réelle est gérée par les policies Supabase côté serveur
3. **Pas de secrets**: Aucune clé privée, token admin ou secret n'est exposé

### ⚠️ Bonnes pratiques:

- Les **vraies clés secrètes** (service_role_key, etc.) ne doivent **JAMAIS** être dans le code client
- Les clés publiques peuvent être exposées (c'est leur usage normal)
- La sécurité doit toujours être côté serveur (Supabase RLS)

---

## 📝 TODO

- [ ] Vérifier si Lovable Cloud permet la configuration des env vars
- [ ] Si oui, configurer les variables et retirer les fallbacks
- [ ] Si non, garder les fallbacks avec documentation claire

---

## 🧪 Validation

**Test effectué**:
```bash
npm run build
✓ built in 16.30s
```

**Statut**: ✅ Le build fonctionne avec les fallbacks

---

## 📚 Références

- [Supabase: Is it safe to expose anon key?](https://supabase.com/docs/guides/api#api-url-and-keys)
- [Vite: Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Généré le**: 2025-11-10
**Par**: Claude Code
