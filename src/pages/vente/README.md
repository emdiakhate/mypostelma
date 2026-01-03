# 💼 Module Vente

## Description
Gestion commerciale : catalogue, devis, commandes, service client, stock.

## Structure
```
vente/
├── catalogue/
│   └── index.tsx          - Catalogue produits/services (nouveau)
├── devis/
│   ├── index.tsx          - Liste devis (nouveau)
│   ├── [id].tsx           - Détail devis (nouveau)
│   └── nouveau.tsx        - Création devis (nouveau)
├── commandes/
│   └── index.tsx          - Gestion commandes (nouveau)
├── service-client.tsx     - Service client & SAV (nouveau)
├── tickets/
│   └── index.tsx          - Tickets support (nouveau)
└── stock/
    └── index.tsx          - Gestion stock (nouveau)
```

## Fonctionnalités Prévues

### Catalogue
- CRUD produits/services
- Catégorisation
- Tarifs et remises
- Images produits

### Devis
- Création avec templates
- Versioning
- Conversion devis → commande
- Génération PDF
- Workflow : brouillon → envoyé → signé/refusé

### Commandes
- Conversion devis → commande
- Statuts : en traitement, validée, livrée
- Lien avec Stock

### Service Client
- Système de tickets
- Intégration avec Inbox
- Assignation équipe
- Suivi résolution

### Stock
- Inventaire produits
- Mouvements (entrées/sorties)
- Alertes stock bas
- Traçabilité

## Statut Migration
🔄 **Phase 5** (Semaines 7-9)
⭐ **Tout nouveau module**
