# ⚙️ Module Administration

## Description
Gestion des utilisateurs, équipes, paramètres système.

## Structure
```
administration/
├── equipes.tsx            - Gestion équipes (TeamsPage)
├── parametres.tsx         - Paramètres utilisateur (SettingsPage)
├── systeme.tsx            - Administration système (AdminPage)
└── acquisition.tsx        - Acquisition leads (crm/AcquisitionPage)
```

## Migration
- ✅ Déplacer `TeamsPage.tsx` → `equipes.tsx`
- ✅ Déplacer `SettingsPage.tsx` → `parametres.tsx`
- ✅ Déplacer `AdminPage.tsx` → `systeme.tsx`
- ✅ Déplacer `crm/AcquisitionPage.tsx` → `acquisition.tsx`

## Extensions Futures
- Gestion des rôles et permissions
- Logs d'activité (audit trail)
- Multi-entités/sociétés
- GED (Gestion Électronique de Documents)
- Paramétrage global de l'app

## Statut Migration
🔄 **Phase 8** (Semaine 13)
