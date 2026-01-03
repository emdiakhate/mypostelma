# 👥 Module CRM

## Description
Gestion de la relation client : prospects, leads, clients.

## Structure
```
crm/
├── prospects/
│   └── index.tsx          - Liste des prospects (à créer)
├── leads/
│   ├── index.tsx          - Liste des leads (fusion LeadsPage + CRMLeadsPage)
│   └── [id].tsx           - Détail lead (LeadDetailPage déplacé)
├── clients/
│   └── index.tsx          - Liste des clients (à créer)
└── config.tsx             - Configuration CRM (crm/ConfigPage déplacé)
```

## Migration
- ✅ Déplacer `LeadsPage.tsx` → `leads/index.tsx`
- ✅ Fusionner `CRMLeadsPage.tsx` → `leads/index.tsx`
- ✅ Déplacer `LeadDetailPage.tsx` → `leads/[id].tsx`
- ✅ Déplacer `crm/ConfigPage.tsx` → `config.tsx`
- ⭐ Créer `prospects/index.tsx`
- ⭐ Créer `clients/index.tsx`

## Statut Migration
🔄 **Phase 2** (Semaine 3)
