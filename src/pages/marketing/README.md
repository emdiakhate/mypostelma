# 📢 Module Marketing

## Description
Gestion des publications, campagnes, réseaux sociaux, inbox unifiée.

## Structure
```
marketing/
├── publications/
│   ├── index.tsx          - Liste publications (PublicationsPage)
│   ├── [id].tsx           - Détail post (PostDetailPage)
│   └── calendar.tsx       - Calendrier publications (Index.tsx)
├── creation.tsx           - Studio création (CreationPage)
├── archives.tsx           - Archives publications (ArchivesPage)
├── campagnes/
│   └── index.tsx          - Campagnes marketing (crm/CampaignsPage)
├── templates/
│   └── index.tsx          - Templates emails (crm/TemplatesPage)
├── comptes-sociaux.tsx    - Gestion comptes (ConnectedAccounts + SocialAccounts fusionnés)
├── inbox.tsx              - Messagerie unifiée (InboxPage)
└── automation.tsx         - Automatisation marketing (nouveau)
```

## Migration
- ✅ Déplacer `PublicationsPage.tsx` → `publications/index.tsx`
- ✅ Déplacer `PostDetailPage.tsx` → `publications/[id].tsx`
- ✅ Déplacer `Index.tsx` (Calendar) → `publications/calendar.tsx`
- ✅ Déplacer `CreationPage.tsx` → `creation.tsx`
- ✅ Déplacer `ArchivesPage.tsx` → `archives.tsx`
- ✅ Déplacer `crm/CampaignsPage.tsx` → `campagnes/index.tsx`
- ✅ Déplacer `crm/TemplatesPage.tsx` → `templates/index.tsx`
- ✅ Fusionner `ConnectedAccountsPage.tsx` + `SocialAccountsPage.tsx` → `comptes-sociaux.tsx`
- ✅ Déplacer `InboxPage.tsx` → `inbox.tsx`
- ⭐ Créer `automation.tsx`

## Statut Migration
🔄 **Phase 3** (Semaines 4-5)
