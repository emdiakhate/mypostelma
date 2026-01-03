# 🛣️ Guide du Nouveau Système de Routing V2

## 📋 Vue d'Ensemble

Le nouveau système de routing (`routes.v2.tsx`) permet une migration progressive vers la nouvelle architecture modulaire grâce à un système de **feature flags**.

## 🚩 Feature Flags

### Configuration

Les feature flags sont définis dans `/src/config/featureFlags.ts` :

```typescript
export const FEATURE_FLAGS = {
  ENABLE_NEW_ARCHITECTURE: false,    // Flag principal
  ENABLE_NEW_SIDEBAR: false,         // Nouvelle sidebar
  ENABLE_NEW_DASHBOARD: false,       // Dashboard refonte
  ENABLE_NEW_CRM: false,             // Module CRM
  ENABLE_NEW_MARKETING: false,       // Module Marketing
  ENABLE_VENTE_MODULE: false,        // Module Vente (nouveau)
  ENABLE_COMPTA_MODULE: false,       // Module Compta (nouveau)
  ENABLE_NEW_REPORTING: false,       // Module Reporting
  ENABLE_NEW_ADMIN: false,           // Module Admin
};
```

### Utilisation en Développement

Les feature flags peuvent être override en développement via localStorage :

```javascript
// Dans la console du navigateur

// Activer la nouvelle sidebar
window.featureFlags.toggle('ENABLE_NEW_SIDEBAR', true);

// Activer le module CRM
window.featureFlags.toggle('ENABLE_NEW_CRM', true);

// Voir l'état de tous les flags
window.featureFlags.debug();

// Vérifier si un flag est activé
window.featureFlags.isEnabled('ENABLE_NEW_MARKETING');
```

**Astuce :** Après avoir changé un flag, rafraîchir la page pour voir les changements.

## 🗺️ Structure des Routes V2

### Routes par Module

```
/                           → Landing page
/auth                       → Authentification

/dashboard                  → Dashboard unifié

/crm/prospects              → Prospects (nouveau)
/crm/leads                  → Liste des leads
/crm/leads/:id              → Détail lead
/crm/clients                → Clients (nouveau)
/crm/config                 → Configuration CRM

/marketing/publications     → Publications
/marketing/publications/:id → Détail post
/marketing/publications/calendar → Calendrier
/marketing/creation         → Studio création
/marketing/archives         → Archives
/marketing/campagnes        → Campagnes
/marketing/templates        → Templates emails
/marketing/comptes-sociaux  → Gestion comptes sociaux
/marketing/inbox            → Messagerie unifiée
/marketing/automation       → Automation (nouveau)

/vente/catalogue            → Catalogue produits (nouveau)
/vente/devis                → Devis (nouveau)
/vente/commandes            → Commandes (nouveau)
/vente/service-client       → Service client (nouveau)
/vente/stock                → Stock (nouveau)

/compta/devis               → Devis compta (nouveau)
/compta/factures            → Factures (nouveau)
/compta/contrats            → Contrats (nouveau)
/compta/paiements           → Paiements (nouveau)

/reporting/analytics        → Analytics
/reporting/concurrence      → Analyse concurrence
/reporting/concurrence/compare → Comparaison
/reporting/concurrence/analyse → Analyse comparative

/admin/equipes              → Gestion équipes
/admin/parametres           → Paramètres
/admin/systeme              → Administration
/admin/acquisition          → Acquisition leads
```

### Redirections Automatiques

Les anciennes URLs redirigent automatiquement vers les nouvelles :

```
ANCIENNE → NOUVELLE
────────────────────────────────────────────────
/leads                → /crm/leads
/publications         → /marketing/publications
/calendar             → /marketing/publications/calendar
/inbox                → /marketing/inbox
/connections          → /marketing/comptes-sociaux
/analytics            → /reporting/analytics
/competitors          → /reporting/concurrence
/teams                → /admin/equipes
/settings             → /admin/parametres
/admin                → /admin/systeme
```

**Les anciennes routes continuent de fonctionner** grâce aux redirections.

## 🔄 Migration Progressive

### Phase 1 : Préparation (Actuel)
✅ Structure de dossiers créée
✅ Système de routing V2 créé
✅ Feature flags configurés
⏳ Nouvelle sidebar à créer

**Action :** Aucun changement visible pour l'utilisateur

---

### Phase 2 : Activation Sidebar V2
```javascript
// Activer la nouvelle sidebar
window.featureFlags.toggle('ENABLE_NEW_SIDEBAR', true);
```

**Résultat :**
- Menu organisé par modules (5 sections principales)
- Sous-menus déroulants
- Navigation améliorée

---

### Phase 3 : Migration CRM
```javascript
// Activer le module CRM
window.featureFlags.toggle('ENABLE_NEW_CRM', true);
```

**Résultat :**
- Routes `/crm/*` utilisent les nouvelles pages
- Anciennes routes `/leads` redirigent vers `/crm/leads`
- Nouvelles pages Prospects et Clients disponibles

---

### Phase 4 : Migration Marketing
```javascript
window.featureFlags.toggle('ENABLE_NEW_MARKETING', true);
```

**Résultat :**
- Routes `/marketing/*` utilisent les nouvelles pages
- Publications, Campagnes, Templates déplacés
- Comptes sociaux fusionnés

---

### Phase 5 : Activation Module Vente
```javascript
window.featureFlags.toggle('ENABLE_VENTE_MODULE', true);
```

**Résultat :**
- Nouveau module Vente accessible
- Catalogue, Devis, Commandes, Stock disponibles

---

### Phase 6 : Activation Module Compta
```javascript
window.featureFlags.toggle('ENABLE_COMPTA_MODULE', true);
```

**Résultat :**
- Nouveau module Compta accessible
- Factures, Contrats, Paiements disponibles

---

### Phase 7 : Dashboard V2
```javascript
window.featureFlags.toggle('ENABLE_NEW_DASHBOARD', true);
```

**Résultat :**
- Dashboard refonte avec widgets multi-modules

---

### Phase 8 : Migration Complète
```javascript
window.featureFlags.toggle('ENABLE_NEW_ARCHITECTURE', true);
```

**Résultat :**
- Tous les modules activés
- Anciens fichiers peuvent être supprimés

## 📝 Intégration dans App.tsx

Pour activer le nouveau système de routing, il suffit de remplacer dans `App.tsx` :

```typescript
// Ancien (actuellement)
<MainLayout />

// Nouveau (à terme)
<RoutesV2 />
```

Pendant la transition, les deux systèmes peuvent coexister :

```typescript
import { isFeatureEnabled } from '@/config/featureFlags';
import RoutesV2 from './routes.v2';

function App() {
  return (
    <BrowserRouter>
      {isFeatureEnabled('ENABLE_NEW_ARCHITECTURE') ? (
        <RoutesV2 />
      ) : (
        <MainLayout />
      )}
    </BrowserRouter>
  );
}
```

## 🧪 Tests des Routes

### Tester une route spécifique

```javascript
// 1. Activer le flag du module
window.featureFlags.toggle('ENABLE_NEW_MARKETING', true);

// 2. Naviguer vers la route
window.location.href = '/marketing/publications';

// 3. Vérifier que la nouvelle page s'affiche
```

### Tester les redirections

```javascript
// Naviguer vers une ancienne route
window.location.href = '/publications';

// Vérifier la redirection automatique vers /marketing/publications
console.log(window.location.pathname); // → /marketing/publications
```

## ⚠️ Notes Importantes

### En Production

- **Ne pas activer** les feature flags tant que les pages correspondantes ne sont pas prêtes
- Les flags en production doivent être modifiés dans `featureFlags.ts` et déployés
- Prévoir une période de transition où les deux systèmes coexistent

### En Développement

- Les overrides localStorage persistent entre les sessions
- Pour réinitialiser : `localStorage.clear()` puis rafraîchir
- Les flags affichent automatiquement leur état dans la console

### Rollback

En cas de problème, il suffit de :

1. Désactiver le flag problématique
2. Rafraîchir la page
3. L'ancienne version est restaurée instantanément

```javascript
window.featureFlags.toggle('ENABLE_NEW_CRM', false);
location.reload();
```

## 📊 Suivi de la Migration

### Checklist par Phase

- [ ] Phase 1 : Structure créée ✅
- [ ] Phase 2 : Sidebar V2 créée et testée
- [ ] Phase 3 : Module CRM migré et testé
- [ ] Phase 4 : Module Marketing migré et testé
- [ ] Phase 5 : Module Vente créé et testé
- [ ] Phase 6 : Module Compta créé et testé
- [ ] Phase 7 : Dashboard V2 créé et testé
- [ ] Phase 8 : Module Reporting migré et testé
- [ ] Phase 9 : Module Admin migré et testé
- [ ] Phase 10 : Nettoyage ancien code

### Activation Progressive en Production

```
Semaine 1-2   : ENABLE_NEW_SIDEBAR (beta users)
Semaine 3     : ENABLE_NEW_CRM (beta users)
Semaine 4-5   : ENABLE_NEW_MARKETING (beta users)
Semaine 6     : ENABLE_NEW_REPORTING (beta users)
Semaine 7-9   : ENABLE_VENTE_MODULE (beta users)
Semaine 10-11 : ENABLE_COMPTA_MODULE (beta users)
Semaine 12    : ENABLE_NEW_DASHBOARD (all users)
Semaine 13    : ENABLE_NEW_ADMIN (all users)
Semaine 14    : ENABLE_NEW_ARCHITECTURE (all users) + suppression ancien code
```

## 🔗 Fichiers Clés

- `/src/config/featureFlags.ts` - Configuration des flags
- `/src/routes.v2.tsx` - Nouvelles routes
- `/src/App.tsx` - Point d'entrée (à modifier)
- `/MIGRATION_MAPPING.md` - Mapping détaillé des pages

---

**Dernière mise à jour :** 2026-01-03
**Version :** 1.0
