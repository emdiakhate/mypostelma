# 💰 Module Comptabilité

## Description
Gestion comptable et financière : devis, factures, contrats, paiements.

## Structure
```
compta/
├── devis.tsx              - Vue comptable des devis (nouveau)
├── factures/
│   ├── index.tsx          - Liste factures (nouveau)
│   └── [id].tsx           - Détail facture (nouveau)
├── contrats/
│   └── index.tsx          - Gestion contrats (nouveau)
└── paiements.tsx          - Enregistrement paiements (nouveau)
```

## Fonctionnalités Prévues

### Devis (Vue Compta)
- Vue comptable des devis
- Filtres : signés, en attente
- CA prévisionnel

### Factures
- Conversion commande → facture
- Génération PDF (numérotation légale)
- Statuts : brouillon, envoyée, payée, en retard
- Envoi par email
- Relances automatiques

### Contrats
- Templates de contrats
- Signature électronique
- Renouvellements
- Archivage

### Paiements
- Enregistrement paiements reçus
- Lien facture ↔ paiement
- Moyens de paiement (CB, virement, chèque)
- Rapprochement bancaire simple

## Extensions Futures
- Comptabilité générale (écritures, balance, bilan)
- TVA et déclarations
- Export comptable (FEC)
- Trésorerie prévisionnelle

## Statut Migration
🔄 **Phase 6** (Semaines 10-11)
⭐ **Tout nouveau module**
