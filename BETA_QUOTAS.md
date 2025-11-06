# 🎯 Système de Quotas Beta - POSTELMA

**Date:** 6 novembre 2025
**Version:** 1.0.0
**Statut:** ✅ Implémenté et prêt

---

## 📋 RÉSUMÉ POUR LES BETA-TESTEURS

En tant que beta-testeur de Postelma, vous disposez de quotas limités pour tester les fonctionnalités clés de la plateforme. Ces limites sont temporaires et seront levées lors du lancement de l'abonnement premium.

### 🎁 Vos Quotas Beta

| Fonctionnalité | Quota | Détails |
|----------------|-------|---------|
| **Images IA** | 15 générations | Images créées avec Gemini ou Fal.ai |
| **Vidéos IA** | 5 générations | Vidéos créées avec Fal.ai |
| **Recherches Leads** | 5 recherches | Maximum 10 résultats par recherche |

### 📍 Où voir vos quotas ?

Les compteurs de quotas sont affichés à **3 endroits** :

1. **Sidebar gauche** (en bas) : Vue complète de tous vos quotas
2. **Page de génération d'images** : Badge inline à côté du titre
3. **Page de recherche de leads** : Compteur détaillé en haut à droite

---

## 🔍 FONCTIONNALITÉS DÉTAILLÉES

### 1. Génération d'Images IA (15 max)

**Comment ça marche :**
- Ouvrez le modal de génération d'images (icône ✨)
- Chaque génération réussie consomme 1 crédit
- Le système essaie d'abord Gemini (gratuit), puis Fal.ai si nécessaire

**Compteur visible :**
- Badge "X/15" dans le modal de génération
- Barre de progression dans la sidebar

**Ce qui consomme un crédit :**
- ✅ Génération simple (texte → image)
- ✅ Édition d'image (modification d'image existante)

**Ce qui NE consomme PAS de crédit :**
- ❌ Upload d'images existantes
- ❌ Utilisation de la bibliothèque d'archives

---

### 2. Génération de Vidéos IA (5 max)

**Comment ça marche :**
- Chaque génération de vidéo consomme 1 crédit
- Deux modes disponibles :
  - **Text-to-Video** : Créer une vidéo à partir d'un texte
  - **Image-to-Video** : Animer une image existante

**Compteur visible :**
- Barre de progression dans la sidebar
- Message d'avertissement à 2 vidéos restantes

**Temps de génération :**
- Environ 2-5 minutes par vidéo
- Un timeout de 10 minutes maximum

---

### 3. Recherches de Leads (5 max)

**Comment ça marche :**
- Chaque recherche consomme 1 crédit
- Maximum 10 résultats par recherche
- Limite stricte de 10 leads pour les beta-testeurs

**Compteur visible :**
- Affichage détaillé sur la page "Leads"
- Progression et nombre restant bien visible

**Paramètres de recherche :**
- ✅ Ville (obligatoire)
- ✅ Catégorie d'entreprise (obligatoire)
- ✅ Nombre de résultats : 1-10 (limité à 10 max)

**Options incluses :**
- Email (si disponible)
- Téléphone (si disponible)
- Réseaux sociaux (si disponibles)

---

## 💡 CONSEILS D'UTILISATION

### Pour optimiser vos quotas :

#### Images IA :
1. **Soyez précis dans vos prompts** pour obtenir le bon résultat dès le premier essai
2. **Testez différents styles** pour voir ce qui fonctionne le mieux
3. **Sauvegardez vos images réussies** dans les archives

#### Vidéos IA :
1. **Les vidéos sont coûteuses** : gardez-les pour vos meilleurs contenus
2. **Testez d'abord avec des images** avant de passer aux vidéos
3. **Mode Image-to-Video** souvent plus prévisible que Text-to-Video

#### Recherches de Leads :
1. **Soyez spécifique** dans vos critères de recherche
2. **10 leads par recherche** sont suffisants pour commencer
3. **Utilisez les filtres** pour affiner les résultats après recherche

---

## 🚨 QUE SE PASSE-T-IL QUAND J'ATTEINS LA LIMITE ?

### Comportement du système :

**À 2 crédits restants :**
```
⚠️  Alerte orange : "Attention, il ne vous reste que 2 générations."
```

**À 0 crédit restant :**
```
🔴 Blocage : "Vous avez atteint votre limite de génération d'images IA (15/15).
Contactez-nous pour augmenter votre quota."
```

### Que faire ?

1. **Contactez l'équipe Postelma** pour :
   - Demander un reset de vos quotas
   - Participer davantage au beta test
   - Signaler des bugs ou faire des suggestions

2. **Email de support :** support@postelma.com
3. **Temps de réponse :** < 24h

---

## 📊 SUIVI DE VOS QUOTAS

### Interface Sidebar (vue complète)

```
┌─────────────────────────────────────┐
│ 🎯 Quotas Beta                      │
├─────────────────────────────────────┤
│ 🎨 Images IA                        │
│ ████████████░░░░  12 restants       │
│ 12 / 15 utilisés                    │
├─────────────────────────────────────┤
│ 🎥 Vidéos IA                        │
│ ████████░░░░░░░░  3 restants        │
│ 2 / 5 utilisés                      │
├─────────────────────────────────────┤
│ 👥 Recherches Leads                 │
│ ████████████████░░  4 restants      │
│ 1 / 5 utilisés                      │
└─────────────────────────────────────┘
```

### Codes couleur :

| Couleur | Signification | Seuil |
|---------|---------------|-------|
| 🟢 Vert | Quota OK | > 30% restant |
| 🟠 Orange | Attention | ≤ 2 crédits restants |
| 🔴 Rouge | Épuisé | 0 crédit restant |

---

## 🛠️ TECHNIQUE : COMMENT ÇA MARCHE ?

### Architecture du système

```
Utilisateur Beta
     ↓
┌──────────────────────────────────┐
│ 1. Requête de génération         │
└──────────────────────────────────┘
     ↓
┌──────────────────────────────────┐
│ 2. Vérification du quota         │
│    (base de données)             │
└──────────────────────────────────┘
     ↓
   Quota OK ?
     ├─ Oui → Incrémente compteur → Génération
     └─ Non → Message d'erreur 429 (Too Many Requests)
```

### Base de données

Les quotas sont stockés dans la table `profiles` :

```sql
ai_image_generation_count    INTEGER DEFAULT 0
ai_image_generation_limit    INTEGER DEFAULT 15

ai_video_generation_count    INTEGER DEFAULT 0
ai_video_generation_limit    INTEGER DEFAULT 5

lead_generation_count        INTEGER DEFAULT 0
lead_generation_limit        INTEGER DEFAULT 5
```

### Fonctions SQL

| Fonction | Description |
|----------|-------------|
| `increment_ai_image_generation()` | Vérifie et incrémente le compteur images |
| `increment_ai_video_generation()` | Vérifie et incrémente le compteur vidéos |
| `increment_lead_generation()` | Vérifie et incrémente le compteur leads |
| `get_user_quotas()` | Récupère tous les quotas d'un utilisateur |
| `reset_user_quotas()` | Reset tous les compteurs (admin only) |

---

## 🔄 RESET DES QUOTAS

### Quand les quotas sont-ils réinitialisés ?

**Pour la beta :**
- ❌ **Pas de reset automatique**
- ✅ **Reset manuel** par l'équipe Postelma sur demande

**Après le lancement :**
- ✅ Reset mensuel automatique selon votre plan
- ✅ Quotas adaptés à votre abonnement (Standard, Pro, Business)

### Comment demander un reset ?

1. Contactez support@postelma.com
2. Indiquez votre email d'inscription
3. Expliquez brièvement votre utilisation
4. Reset effectué sous 24h

---

## 📈 APRÈS LA BETA : PLANS D'ABONNEMENT

### Plans prévus (indicatifs)

| Plan | Images IA | Vidéos IA | Leads | Prix/mois |
|------|-----------|-----------|-------|-----------|
| **Gratuit** | 5 | 2 | 2 | 0€ |
| **Standard** | 50 | 10 | 20 | 29€ |
| **Pro** | 200 | 50 | 100 | 79€ |
| **Business** | Illimité | Illimité | Illimité | 199€ |

*Prix indicatifs, susceptibles de changer*

---

## ❓ FAQ

### Q1: Puis-je partager mes quotas avec quelqu'un d'autre ?
**R:** Non, les quotas sont liés à votre compte personnel.

### Q2: Que se passe-t-il si une génération échoue ?
**R:** Le crédit est quand même consommé car le coût est engagé auprès des APIs tierces.

### Q3: Puis-je voir l'historique de mes générations ?
**R:** Oui, dans la section "Archives" pour les images, et dans "Leads" pour les recherches.

### Q4: Les quotas expirent-ils ?
**R:** Pour la beta, non. Vous gardez vos quotas jusqu'à la fin du programme beta.

### Q5: Comment devenir beta-testeur ?
**R:** Contactez l'équipe via support@postelma.com. Places limitées !

---

## 📞 SUPPORT & CONTACT

### Besoin d'aide ?

**Email:** support@postelma.com
**Réponse sous:** 24h maximum

**Pour signaler un bug :**
- Décrivez le problème
- Joignez des captures d'écran
- Indiquez votre email et l'heure du bug

**Pour faire une suggestion :**
- Soyez spécifique
- Expliquez le bénéfice
- Votez pour les suggestions d'autres beta-testeurs

---

## 🎉 MERCI D'ÊTRE BETA-TESTEUR !

Votre participation est **essentielle** pour améliorer Postelma.

**Vos retours nous aident à :**
- 🐛 Corriger les bugs
- ✨ Améliorer l'UX
- 🚀 Prioriser les nouvelles fonctionnalités
- 💡 Affiner les tarifs futurs

**En échange, vous bénéficiez de :**
- ✅ Accès anticipé aux fonctionnalités
- ✅ Tarif préférentiel au lancement (si vous souhaitez continuer)
- ✅ Badge "Founding Member" dans l'app
- ✅ Votre nom dans les remerciements (si vous le souhaitez)

---

**Bonne découverte de Postelma ! 🚀**

*Dernière mise à jour: 6 novembre 2025*
