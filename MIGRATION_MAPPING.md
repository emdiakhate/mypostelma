# 📋 MIGRATION MAPPING - Ancienne → Nouvelle Architecture

## 📊 Inventaire des Pages Existantes (32 pages)

### Pages Publiques (6)
| Page Actuelle | Route Actuelle | Statut | Nouveau Module |
|--------------|---------------|---------|----------------|
| `LandingPage.tsx` | `/` | ✅ Conserver | Public |
| `AuthPage.tsx` | `/auth` | ✅ Conserver | Public |
| `PricingPage.tsx` | `/pricing` | ✅ Conserver | Public |
| `CheckoutSimulation.tsx` | `/checkout` | ✅ Conserver | Public |
| `CheckoutSuccess.tsx` | `/checkout-success` | ✅ Conserver | Public |
| `AcceptInvitationPage.tsx` | `/accept-invitation/:token` | ✅ Conserver | Public |

### Pages Utilitaires (3)
| Page Actuelle | Route Actuelle | Statut | Nouveau Module |
|--------------|---------------|---------|----------------|
| `OAuthCallback.tsx` | `/oauth/callback` | ✅ Conserver | Utilitaire |
| `ConnectingAccountPage.tsx` | `/connecting-account` | ✅ Conserver | Utilitaire |
| `ConnectSocialAccounts.tsx` | `/connect-accounts` | ✅ Conserver | Utilitaire |

### Pages Applicatives (23)

#### 🏠 Dashboard & Analytics (3)
| Page Actuelle | Route Actuelle | Nouvelle Route | Action | Module Cible |
|--------------|---------------|----------------|--------|--------------|
| `Dashboard.tsx` | `/app/dashboard` | `/app/dashboard` | 🔄 **REFONTE** | DASHBOARD |
| `Index.tsx` (Calendar) | `/app/calendar` | `/app/marketing/publications/calendar` | ➡️ Déplacer | MARKETING |
| `Analytics.tsx` | `/app/analytics` | `/app/reporting/analytics` | ➡️ Déplacer | REPORTING |

#### 👥 CRM (5)
| Page Actuelle | Route Actuelle | Nouvelle Route | Action | Module Cible |
|--------------|---------------|----------------|--------|--------------|
| `LeadsPage.tsx` | `/app/leads` | `/app/crm/leads` | ➡️ Déplacer | CRM |
| `LeadDetailPage.tsx` | `/app/leads/:id` | `/app/crm/leads/:id` | ➡️ Déplacer | CRM |
| `crm/CRMLeadsPage.tsx` | `/app/crm/leads` | `/app/crm/leads` | 🔀 **FUSIONNER** avec LeadsPage | CRM |
| `crm/ConfigPage.tsx` | `/app/crm/config` | `/app/crm/config` | ✅ OK | CRM |
| `crm/AcquisitionPage.tsx` | `/app/crm/acquisition` | `/app/admin/acquisition` | ➡️ Déplacer | ADMIN |

#### 📢 Marketing & Publications (7)
| Page Actuelle | Route Actuelle | Nouvelle Route | Action | Module Cible |
|--------------|---------------|----------------|--------|--------------|
| `PublicationsPage.tsx` | `/app/publications` | `/app/marketing/publications` | ➡️ Déplacer | MARKETING |
| `PostDetailPage.tsx` | `/app/post/:id` | `/app/marketing/publications/:id` | ➡️ Déplacer | MARKETING |
| `CreationPage.tsx` | `/app/creation` | `/app/marketing/creation` | ➡️ Déplacer | MARKETING |
| `ArchivesPage.tsx` | `/app/archives` | `/app/marketing/archives` | ➡️ Déplacer | MARKETING |
| `crm/CampaignsPage.tsx` | `/app/crm/campaigns` | `/app/marketing/campagnes` | ➡️ Déplacer | MARKETING |
| `crm/TemplatesPage.tsx` | `/app/crm/templates` | `/app/marketing/templates` | ➡️ Déplacer | MARKETING |
| `InboxPage.tsx` | `/app/inbox` | `/app/marketing/inbox` | ➡️ Déplacer | MARKETING |

#### 🔗 Connexions & Comptes (3)
| Page Actuelle | Route Actuelle | Nouvelle Route | Action | Module Cible |
|--------------|---------------|----------------|--------|--------------|
| `ConnectedAccountsPage.tsx` | `/app/connections` | `/app/marketing/comptes-sociaux` | ➡️ Déplacer | MARKETING |
| `SocialAccountsPage.tsx` | `/app/settings/accounts` | `/app/marketing/comptes-sociaux` | 🔀 **FUSIONNER** | MARKETING |

#### 📊 Analyse & Concurrence (3)
| Page Actuelle | Route Actuelle | Nouvelle Route | Action | Module Cible |
|--------------|---------------|----------------|--------|--------------|
| `CompetitorsPage.tsx` | `/app/competitors` | `/app/reporting/concurrence` | ➡️ Déplacer | REPORTING |
| `CompetitorsComparePage.tsx` | `/app/competitors/compare` | `/app/reporting/concurrence/compare` | ➡️ Déplacer | REPORTING |
| `ComparativeAnalysisPage.tsx` | `/app/comparative-analysis` | `/app/reporting/concurrence/analyse` | 🔀 **FUSIONNER** | REPORTING |

#### ⚙️ Administration (2)
| Page Actuelle | Route Actuelle | Nouvelle Route | Action | Module Cible |
|--------------|---------------|----------------|--------|--------------|
| `TeamsPage.tsx` | `/app/teams` | `/app/admin/equipes` | ➡️ Déplacer | ADMIN |
| `SettingsPage.tsx` | `/app/settings` | `/app/admin/parametres` | ➡️ Déplacer | ADMIN |
| `AdminPage.tsx` | `/app/admin` | `/app/admin/systeme` | ➡️ Déplacer | ADMIN |

---

## 🗂️ Nouvelle Structure de Dossiers

```
src/pages/
│
├── [Pages publiques - inchangées]
├── LandingPage.tsx
├── AuthPage.tsx
├── PricingPage.tsx
├── CheckoutSimulation.tsx
├── CheckoutSuccess.tsx
├── AcceptInvitationPage.tsx
├── OAuthCallback.tsx
├── ConnectingAccountPage.tsx
├── ConnectSocialAccounts.tsx
│
├── dashboard/
│   └── index.tsx                    (Dashboard.tsx refonte)
│
├── crm/
│   ├── leads/
│   │   ├── index.tsx                (LeadsPage.tsx + CRMLeadsPage.tsx fusionnés)
│   │   └── [id].tsx                 (LeadDetailPage.tsx)
│   ├── prospects/
│   │   └── index.tsx                ⭐ NOUVEAU
│   ├── clients/
│   │   └── index.tsx                ⭐ NOUVEAU
│   └── config.tsx                   (crm/ConfigPage.tsx)
│
├── marketing/
│   ├── publications/
│   │   ├── index.tsx                (PublicationsPage.tsx)
│   │   ├── [id].tsx                 (PostDetailPage.tsx)
│   │   └── calendar.tsx             (Index.tsx - Calendar)
│   ├── creation.tsx                 (CreationPage.tsx)
│   ├── archives.tsx                 (ArchivesPage.tsx)
│   ├── campagnes/
│   │   └── index.tsx                (crm/CampaignsPage.tsx)
│   ├── templates/
│   │   └── index.tsx                (crm/TemplatesPage.tsx)
│   ├── comptes-sociaux.tsx          (ConnectedAccountsPage + SocialAccountsPage fusionnés)
│   ├── inbox.tsx                    (InboxPage.tsx)
│   └── automation.tsx               ⭐ NOUVEAU
│
├── vente/                           ⭐ NOUVEAU MODULE COMPLET
│   ├── catalogue/
│   │   └── index.tsx
│   ├── devis/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── nouveau.tsx
│   ├── commandes/
│   │   └── index.tsx
│   ├── service-client.tsx
│   ├── tickets/
│   │   └── index.tsx
│   └── stock/
│       └── index.tsx
│
├── compta/                          ⭐ NOUVEAU MODULE COMPLET
│   ├── devis.tsx
│   ├── factures/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   ├── contrats/
│   │   └── index.tsx
│   └── paiements.tsx
│
├── reporting/
│   ├── analytics/
│   │   └── index.tsx                (Analytics.tsx)
│   └── concurrence/
│       ├── index.tsx                (CompetitorsPage.tsx)
│       ├── compare.tsx              (CompetitorsComparePage.tsx)
│       └── analyse.tsx              (ComparativeAnalysisPage.tsx fusionné)
│
└── administration/
    ├── equipes.tsx                  (TeamsPage.tsx)
    ├── parametres.tsx               (SettingsPage.tsx)
    ├── systeme.tsx                  (AdminPage.tsx)
    └── acquisition.tsx              (crm/AcquisitionPage.tsx)
```

---

## 🔄 Actions de Migration par Type

### 🔀 Pages à FUSIONNER (4 fusions)

1. **CRM Leads**
   - `LeadsPage.tsx` + `crm/CRMLeadsPage.tsx` → `/app/crm/leads/index.tsx`
   - **Raison :** Doublon fonctionnel

2. **Comptes Sociaux**
   - `ConnectedAccountsPage.tsx` + `SocialAccountsPage.tsx` → `/app/marketing/comptes-sociaux.tsx`
   - **Raison :** Gestion des connexions unifiée

3. **Analyse Concurrence**
   - `CompetitorsPage.tsx` + `ComparativeAnalysisPage.tsx` → `/app/reporting/concurrence/index.tsx`
   - **Raison :** Vues complémentaires du même domaine

4. **Calendrier**
   - `Index.tsx` (Calendar) → intégrer dans `/app/marketing/publications/calendar.tsx`
   - **Raison :** Calendrier = planification de publications

### ➡️ Pages à DÉPLACER (15 déplacements)

**Vers CRM :**
- `LeadsPage.tsx` → `/crm/leads/index.tsx`
- `LeadDetailPage.tsx` → `/crm/leads/[id].tsx`
- `crm/ConfigPage.tsx` → `/crm/config.tsx`

**Vers MARKETING :**
- `PublicationsPage.tsx` → `/marketing/publications/index.tsx`
- `PostDetailPage.tsx` → `/marketing/publications/[id].tsx`
- `CreationPage.tsx` → `/marketing/creation.tsx`
- `ArchivesPage.tsx` → `/marketing/archives.tsx`
- `crm/CampaignsPage.tsx` → `/marketing/campagnes/index.tsx`
- `crm/TemplatesPage.tsx` → `/marketing/templates/index.tsx`
- `InboxPage.tsx` → `/marketing/inbox.tsx`

**Vers REPORTING :**
- `Analytics.tsx` → `/reporting/analytics/index.tsx`
- `CompetitorsPage.tsx` → `/reporting/concurrence/index.tsx`
- `CompetitorsComparePage.tsx` → `/reporting/concurrence/compare.tsx`

**Vers ADMIN :**
- `TeamsPage.tsx` → `/administration/equipes.tsx`
- `SettingsPage.tsx` → `/administration/parametres.tsx`
- `AdminPage.tsx` → `/administration/systeme.tsx`
- `crm/AcquisitionPage.tsx` → `/administration/acquisition.tsx`

### 🔄 Pages à REFONDRE (1)

- `Dashboard.tsx` → Nouvelle version avec widgets multi-modules

### ⭐ Pages à CRÉER (11 nouvelles pages)

**CRM :**
- `/crm/prospects/index.tsx`
- `/crm/clients/index.tsx`

**MARKETING :**
- `/marketing/automation.tsx`

**VENTE (nouveau module - 5 pages) :**
- `/vente/catalogue/index.tsx`
- `/vente/devis/index.tsx` + `nouveau.tsx` + `[id].tsx`
- `/vente/commandes/index.tsx`
- `/vente/service-client.tsx`
- `/vente/stock/index.tsx`

**COMPTA (nouveau module - 3 pages) :**
- `/compta/devis.tsx`
- `/compta/factures/index.tsx` + `[id].tsx`
- `/compta/contrats/index.tsx`

---

## 🛣️ Mapping des Routes

### Routes Actuelles → Nouvelles Routes

```
ANCIENNE ROUTE                    →  NOUVELLE ROUTE                          ACTION
────────────────────────────────────────────────────────────────────────────────────

PUBLIC (inchangées)
/                                 →  /                                       OK
/auth                             →  /auth                                   OK
/pricing                          →  /pricing                                OK

DASHBOARD & ANALYTICS
/app/dashboard                    →  /app/dashboard                          REFONTE
/app/calendar                     →  /app/marketing/publications/calendar    REDIRECT
/app/analytics                    →  /app/reporting/analytics                REDIRECT

CRM
/app/leads                        →  /app/crm/leads                          REDIRECT
/app/leads/:id                    →  /app/crm/leads/:id                      REDIRECT
/app/crm/leads                    →  /app/crm/leads                          FUSION
/app/crm/config                   →  /app/crm/config                         OK
/app/crm/acquisition              →  /app/admin/acquisition                  REDIRECT
                                  →  /app/crm/prospects                      NOUVEAU
                                  →  /app/crm/clients                        NOUVEAU

MARKETING
/app/publications                 →  /app/marketing/publications             REDIRECT
/app/post/:id                     →  /app/marketing/publications/:id         REDIRECT
/app/creation                     →  /app/marketing/creation                 REDIRECT
/app/archives                     →  /app/marketing/archives                 REDIRECT
/app/crm/campaigns                →  /app/marketing/campagnes                REDIRECT
/app/crm/templates                →  /app/marketing/templates                REDIRECT
/app/inbox                        →  /app/marketing/inbox                    REDIRECT
/app/connections                  →  /app/marketing/comptes-sociaux          REDIRECT
/app/settings/accounts            →  /app/marketing/comptes-sociaux          REDIRECT
                                  →  /app/marketing/automation               NOUVEAU

VENTE (tout nouveau)
                                  →  /app/vente/catalogue                    NOUVEAU
                                  →  /app/vente/devis                        NOUVEAU
                                  →  /app/vente/commandes                    NOUVEAU
                                  →  /app/vente/service-client               NOUVEAU
                                  →  /app/vente/stock                        NOUVEAU

COMPTA (tout nouveau)
                                  →  /app/compta/devis                       NOUVEAU
                                  →  /app/compta/factures                    NOUVEAU
                                  →  /app/compta/contrats                    NOUVEAU

REPORTING
/app/competitors                  →  /app/reporting/concurrence              REDIRECT
/app/competitors/compare          →  /app/reporting/concurrence/compare      REDIRECT
/app/comparative-analysis         →  /app/reporting/concurrence/analyse      REDIRECT

ADMINISTRATION
/app/teams                        →  /app/admin/equipes                      REDIRECT
/app/settings                     →  /app/admin/parametres                   REDIRECT
/app/admin                        →  /app/admin/systeme                      REDIRECT
```

---

## 🎯 Statistiques de Migration

### Par Action
- ✅ **Conserver inchangées :** 9 pages (publiques + utilitaires)
- ➡️ **Déplacer :** 15 pages
- 🔀 **Fusionner :** 4 fusions (8 pages → 4 pages)
- 🔄 **Refondre :** 1 page (Dashboard)
- ⭐ **Créer :** 11 nouvelles pages

### Par Module
- **DASHBOARD :** 1 page (refonte)
- **CRM :** 4 pages (2 déplacées + 2 nouvelles)
- **MARKETING :** 9 pages (8 déplacées/fusionnées + 1 nouvelle)
- **VENTE :** 5 pages (toutes nouvelles)
- **COMPTA :** 3 pages (toutes nouvelles)
- **REPORTING :** 3 pages (toutes déplacées/fusionnées)
- **ADMIN :** 4 pages (toutes déplacées)

### Total
- **Avant :** 32 pages
- **Après :** 29 pages + 11 nouvelles = **40 pages**
- **Réduction par fusion :** -4 pages en doublon

---

## 📦 Composants Partagés à Identifier

### Composants Layout
- ✅ `Layout.tsx` → À remplacer par `LayoutV2.tsx` avec nouvelle sidebar
- ✅ `ProtectedRoute.tsx` → Conserver
- ✅ `ErrorBoundary.tsx` → Conserver
- ✅ `UserMenu.tsx` → Conserver

### Composants UI Réutilisables
- À inventorier dans `/src/components/`
- Candidats : composants de cartes, formulaires, listes, modaux

---

## ⚠️ Points d'Attention

### Dépendances à Vérifier
1. **Imports** : Tous les imports de pages déplacées doivent être mis à jour
2. **Services** : Vérifier si les services référencent des chemins de pages
3. **Hooks** : Certains hooks peuvent référencer des routes spécifiques
4. **Tests** : Mettre à jour les tests si existants

### Redirections Obligatoires
- Toutes les anciennes routes doivent rediriger vers les nouvelles
- Feature flags pour permettre rollback
- Conservation des redirections pendant 2-3 versions

---

**Date de création :** 2026-01-03
**Version :** 1.0
**Statut :** 📝 Document de référence
