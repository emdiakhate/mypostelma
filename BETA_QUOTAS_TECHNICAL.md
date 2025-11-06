# 🔧 Système de Quotas Beta - Documentation Technique

**Date:** 6 novembre 2025
**Version:** 1.0.0
**Développeur:** Claude Code

---

## 📊 VUE D'ENSEMBLE

Ce système implémente des quotas pour les beta-testeurs sur 3 fonctionnalités:
- Images IA: 15 générations max
- Vidéos IA: 5 générations max
- Recherches de leads: 5 recherches max (10 résultats/recherche)

---

## 🗂️ FICHIERS CRÉÉS/MODIFIÉS

### Nouveaux fichiers

```
supabase/migrations/20251106_beta_quotas.sql    (266 lignes)
src/hooks/useQuotas.ts                          (172 lignes)
src/components/QuotaDisplay.tsx                 (221 lignes)
BETA_QUOTAS.md                                  (Documentation utilisateur)
BETA_QUOTAS_TECHNICAL.md                        (Ce fichier)
```

### Fichiers modifiés

```
supabase/functions/fal-image-generation/index.ts    (+55 lignes auth/quota)
supabase/functions/fal-video-generation/index.ts    (+55 lignes auth/quota)
src/components/LeadSearchForm.tsx                   (maxResults: 50→10)
src/components/AiImageGenerationModal.tsx           (+vérification quota)
src/pages/LeadsPage.tsx                             (+QuotaDisplay)
src/components/Layout.tsx                           (+QuotaDisplay sidebar)
```

---

## 🗄️ BASE DE DONNÉES

### Nouvelles colonnes dans `profiles`

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS:
  - ai_image_generation_count INTEGER DEFAULT 0
  - ai_image_generation_limit INTEGER DEFAULT 15
  - ai_video_generation_count INTEGER DEFAULT 0
  - ai_video_generation_limit INTEGER DEFAULT 5
  - quota_reset_date TIMESTAMPTZ DEFAULT NOW()
```

### Fonctions SQL créées

| Fonction | Type | Description |
|----------|------|-------------|
| `increment_ai_image_generation(p_user_id)` | SECURITY DEFINER | Vérifie quota et incrémente compteur images |
| `increment_ai_video_generation(p_user_id)` | SECURITY DEFINER | Vérifie quota et incrémente compteur vidéos |
| `get_user_quotas(p_user_id)` | SECURITY DEFINER | Retourne tous les quotas en JSON |
| `reset_user_quotas(p_user_id)` | SECURITY DEFINER | Reset tous les compteurs (admin) |
| `initialize_beta_quotas()` | TRIGGER FUNCTION | Initialise quotas pour nouveaux users beta |

### Format de retour des fonctions

```typescript
// increment_ai_image_generation / increment_ai_video_generation
{
  success: boolean;
  count: number;
  limit: number;
  remaining: number;
  error?: string;
  message?: string;
}

// get_user_quotas
{
  ai_images: { count: number, limit: number, remaining: number },
  ai_videos: { count: number, limit: number, remaining: number },
  lead_searches: { count: number, limit: number, remaining: number },
  beta_user: boolean,
  quota_reset_date: string
}
```

---

## ⚛️ FRONTEND

### Hook `useQuotas()`

**Emplacement:** `src/hooks/useQuotas.ts`

**Usage:**
```tsx
import { useQuotas } from '@/hooks/useQuotas';

function MyComponent() {
  const {
    quotas,              // Tous les quotas
    isLoading,           // Chargement
    canUseQuota,         // Fonction de vérification
    checkAndUseQuota,    // Vérifier + consommer
    getQuotaErrorMessage // Message d'erreur approprié
  } = useQuotas();

  // Vérifier avant action
  if (!canUseQuota('ai_images')) {
    toast.error(getQuotaErrorMessage('ai_images'));
    return;
  }

  // Ou vérifier et consommer en une fois
  const success = await checkAndUseQuota('ai_images');
  if (!success) return;
}
```

**API complète:**
```typescript
interface UseQuotasReturn {
  quotas: UserQuotas | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  canUseQuota: (type) => boolean;
  getQuotaErrorMessage: (type) => string;
  checkAndUseQuota: (type) => Promise<boolean>;
  incrementImageQuota: () => void;
  incrementVideoQuota: () => void;
  incrementLeadSearchQuota: () => void;
  isIncrementingImage: boolean;
  isIncrementingVideo: boolean;
  isIncrementingLeadSearch: boolean;
}
```

### Composant `<QuotaDisplay />`

**Emplacement:** `src/components/QuotaDisplay.tsx`

**Variants:**

```tsx
// 1. Full - Card complète avec tous les quotas
<QuotaDisplay variant="full" />

// 2. Compact - Barres de progression compactes
<QuotaDisplay variant="compact" />

// 3. Inline - Badge simple pour 1 quota
<QuotaDisplay variant="inline" showOnlyType="ai_images" />

// 4. Filtré - Afficher seulement 1 type en compact
<QuotaDisplay variant="compact" showOnlyType="lead_searches" />
```

**Codes couleur automatiques:**
- Vert: > 30% restant
- Orange: ≤ 2 crédits restants
- Rouge: 0 crédit restant

---

## 🔌 EDGE FUNCTIONS

### Modification: fal-image-generation

**Changements:**
```typescript
// AVANT: Pas d'auth, pas de quota
serve(async (req) => {
  const { prompt, image_urls, type } = await req.json();
  // Génération directe...
});

// APRÈS: Auth + vérification quota
serve(async (req) => {
  // 1. Authentification
  const authHeader = req.headers.get('Authorization');
  const { user } = await supabaseClient.auth.getUser();

  // 2. Vérification quota
  const { data: quotaResult } = await supabaseClient.rpc(
    'increment_ai_image_generation',
    { p_user_id: user.id }
  );

  if (!quotaResult?.success) {
    return Response 429 (Too Many Requests);
  }

  // 3. Génération (si quota OK)
  const { prompt, image_urls, type } = await req.json();
  // ...
});
```

**Statuts HTTP retournés:**
- `200` OK - Génération réussie
- `401` Unauthorized - Pas authentifié
- `429` Too Many Requests - Quota dépassé
- `500` Internal Server Error - Erreur technique

### Modification: fal-video-generation

**Identique à fal-image-generation** mais avec `increment_ai_video_generation`

---

## 🎨 INTÉGRATIONS UI

### 1. Modal Génération d'Images

**Fichier:** `src/components/AiImageGenerationModal.tsx`

**Intégration:**
```tsx
// Header avec badge inline
<h3>Générer avec IA</h3>
{quotas && quotas.beta_user && (
  <QuotaDisplay variant="inline" showOnlyType="ai_images" />
)}

// Vérification avant génération
const handleGenerateImage = async () => {
  if (!canUseQuota('ai_images')) {
    toast.error(getQuotaErrorMessage('ai_images'));
    return;
  }
  // Génération...
};
```

### 2. Page Recherche de Leads

**Fichier:** `src/pages/LeadsPage.tsx`

**Intégration:**
```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <div>
      <CardTitle>Recherche de Leads</CardTitle>
      <CardDescription>
        Maximum 10 résultats par recherche
      </CardDescription>
    </div>
    <div className="w-72">
      <QuotaDisplay variant="compact" showOnlyType="lead_searches" />
    </div>
  </div>
</CardHeader>
```

### 3. Sidebar Globale

**Fichier:** `src/components/Layout.tsx`

**Intégration:**
```tsx
{/* Avant le bouton Toggle */}
{!sidebarCollapsed && (
  <div className="p-4 border-t border-gray-600">
    <QuotaDisplay variant="compact" />
  </div>
)}
```

---

## 🔄 FLUX DE DONNÉES

### Génération d'image avec quota

```
1. User clique "Générer"
   ↓
2. Frontend: canUseQuota('ai_images') ?
   ├─ Non → Toast error + stop
   └─ Oui → Continue
   ↓
3. Edge Function: auth.getUser()
   ├─ Error → 401 Unauthorized
   └─ OK → Continue
   ↓
4. Edge Function: increment_ai_image_generation(user.id)
   ├─ Quota dépassé → 429 Too Many Requests
   └─ Quota OK → Incrémente + Continue
   ↓
5. Génération d'image (Gemini → Fal.ai)
   ↓
6. Success: Image retournée
   ↓
7. Frontend: refetch quotas
   ↓
8. UI: Mise à jour automatique des compteurs
```

### Affichage des quotas

```
1. useQuotas() hook mount
   ↓
2. Query: get_user_quotas(user.id)
   ↓
3. JSON returned with all quotas
   ↓
4. QuotaDisplay renders with colors
   ↓
5. Auto-refresh every 60s
```

---

## 🧪 TESTS

### Tests manuels requis

```bash
# 1. Créer un utilisateur beta
UPDATE profiles SET beta_user = true WHERE id = 'user_id';

# 2. Tester génération images
- Générer 14 images → OK
- Générer 15ème image → OK
- Générer 16ème image → Erreur "Quota exceeded"

# 3. Tester génération vidéos
- Générer 4 vidéos → OK
- Générer 5ème vidéo → OK
- Générer 6ème vidéo → Erreur "Quota exceeded"

# 4. Tester recherche leads
- Faire 4 recherches → OK
- Faire 5ème recherche → OK
- Faire 6ème recherche → Erreur "Quota exceeded"
- Vérifier max 10 résultats par recherche

# 5. Tester UI
- Vérifier compteur sidebar
- Vérifier badge inline modal
- Vérifier barre compacte leads page
- Vérifier changement couleur (vert → orange → rouge)

# 6. Reset quotas (admin)
SELECT reset_user_quotas('user_id');
- Vérifier compteurs à 0
- Vérifier quota_reset_date updated
```

### Requêtes SQL utiles

```sql
-- Voir quotas d'un utilisateur
SELECT
  ai_image_generation_count,
  ai_image_generation_limit,
  ai_video_generation_count,
  ai_video_generation_limit,
  lead_generation_count,
  lead_generation_limit
FROM profiles
WHERE id = 'user_id';

-- Reset manuel
UPDATE profiles
SET
  ai_image_generation_count = 0,
  ai_video_generation_count = 0,
  lead_generation_count = 0,
  quota_reset_date = NOW()
WHERE id = 'user_id';

-- Voir tous les beta users
SELECT id, email, beta_user FROM profiles WHERE beta_user = true;

-- Statistiques d'utilisation
SELECT
  AVG(ai_image_generation_count) as avg_images,
  MAX(ai_image_generation_count) as max_images,
  AVG(ai_video_generation_count) as avg_videos,
  AVG(lead_generation_count) as avg_leads
FROM profiles
WHERE beta_user = true;
```

---

## 🚀 DÉPLOIEMENT

### Étapes de déploiement

```bash
# 1. Appliquer la migration SQL
psql -d postelma_db -f supabase/migrations/20251106_beta_quotas.sql

# 2. Vérifier les fonctions créées
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%quota%';

# 3. Build frontend
npm run build

# 4. Deploy Edge Functions
supabase functions deploy fal-image-generation
supabase functions deploy fal-video-generation

# 5. Tester en production
curl -X POST https://api.postelma.com/functions/v1/fal-image-generation \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"test","type":"simple"}'
```

### Variables d'environnement requises

**Edge Functions:**
```
SUPABASE_URL
SUPABASE_ANON_KEY
FAL_AI_API_KEY
GEMINI_API_KEY
```

**Frontend:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## 📝 TODO FUTUR

### Après la beta

- [ ] Créer système d'abonnements avec plans
- [ ] Reset automatique mensuel des quotas
- [ ] Dashboard admin pour voir usage quotas
- [ ] Système d'alertes email (quota à 80%)
- [ ] Possibilité d'acheter des crédits supplémentaires
- [ ] Analytics d'utilisation des quotas
- [ ] A/B testing des limites optimales

### Améliorations techniques

- [ ] Cache Redis pour les quotas (performance)
- [ ] Rate limiting global (pas que quotas)
- [ ] Logs centralisés (DataDog/Sentry)
- [ ] Tests automatisés (Playwright)
- [ ] Webhook notification quota dépassé

---

## 🐛 TROUBLESHOOTING

### Problème: Quota ne se met pas à jour

**Cause possible:**
- Cache React Query
- Migration SQL pas appliquée

**Solution:**
```typescript
// Forcer refresh
const { refetch } = useQuotas();
await refetch();

// Ou invalidate cache
queryClient.invalidateQueries({ queryKey: ['user-quotas'] });
```

### Problème: Erreur 429 même avec quota disponible

**Cause possible:**
- Compteur désynchronisé

**Solution:**
```sql
-- Vérifier compteur
SELECT * FROM profiles WHERE id = 'user_id';

-- Reset si nécessaire
SELECT reset_user_quotas('user_id');
```

### Problème: Edge Function retourne 401

**Cause possible:**
- Token expiré
- Header Authorization manquant

**Solution:**
```typescript
// Vérifier que le token est bien envoyé
const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session?.access_token);
```

---

## 📚 RÉFÉRENCES

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Query](https://tanstack.com/query/latest)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

**Auteur:** Claude Code (Anthropic)
**Date:** 6 novembre 2025
**Version:** 1.0.0
