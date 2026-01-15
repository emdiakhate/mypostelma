# 🧪 Guide de Tests MyPostelma CRM - Pour Lovable

## 🚀 Comment activer le Mode Test (Bypass Authentification)

**IMPORTANT** : Pour tester l'application sans avoir à créer un compte ou se connecter, utilisez le **Mode Test**.

### Activation du Mode Test :

**Option 1 - Via URL** :
```
Ajoutez ?testMode=true à la fin de l'URL
Exemple: https://votre-app.lovable.app/?testMode=true
```

**Option 2 - Via Console** :
```javascript
window.testMode.enable()
```

### Désactivation du Mode Test :
```javascript
window.testMode.disable()
```

### Vérifier si le Mode Test est actif :
```javascript
window.testMode.isActive()
```

---

## ✅ 10 Tests Complets à Exécuter

### Test 1️⃣ : Navigation & Sidebar
**OBJECTIF** : Vérifier que tous les menus du sidebar s'affichent et sont cliquables

**ÉTAPES** :
1. Activer le mode test : ajouter `?testMode=true` à l'URL
2. Vérifier que tu es redirigé vers `/app/dashboard`
3. Vérifier que le sidebar affiche exactement **8 modules** :
   - Dashboard
   - CRM
   - Marketing
   - Vente
   - Stock
   - Compta
   - Caisse
   - Administration
4. Cliquer sur chaque module pour vérifier qu'il s'expand
5. Vérifier qu'il n'y a PAS de :
   - "Dashboard Global"
   - "Rapports"
   - "Reporting"

**RÉSULTAT ATTENDU** :
- ✅ 8 modules affichés
- ✅ Tous les sous-menus s'ouvrent correctement
- ✅ Aucun menu redondant
- ✅ Module "Administration" est visible

**CRITÈRES DE VALIDATION** :
```javascript
// Dans la console, vérifier :
document.querySelectorAll('[id*="dashboard"]').length === 1  // Un seul dashboard
document.querySelector('[id="admin"]') !== null              // Admin visible
```

---

### Test 2️⃣ : Module CRM - Gestion des Leads
**OBJECTIF** : Tester le flux complet de création et gestion d'un lead

**ÉTAPES** :
1. Aller dans **CRM > Leads**
2. Cliquer sur "Nouveau Lead" ou "Créer un lead"
3. Remplir le formulaire :
   - Nom: "Test Lead Lovable"
   - Email: "test@lovable.app"
   - Téléphone: "+221 77 123 4567"
   - Statut: "Nouveau"
4. Sauvegarder
5. Vérifier que le lead apparaît dans la liste
6. Cliquer sur le lead pour voir les détails
7. Modifier le statut en "Contacté"
8. Sauvegarder et vérifier que la modification est enregistrée

**RÉSULTAT ATTENDU** :
- ✅ Lead créé avec succès
- ✅ Lead visible dans la liste
- ✅ Page détails s'ouvre
- ✅ Modification de statut fonctionne
- ✅ Données persistées (rafraîchir la page pour vérifier)

---

### Test 3️⃣ : Module Marketing - Publications
**OBJECTIF** : Tester la création d'une publication sur réseaux sociaux

**ÉTAPES** :
1. Aller dans **Marketing > Publications**
2. Cliquer sur "Nouvelle Publication"
3. Créer une publication avec :
   - Texte: "Test publication depuis Lovable 🚀"
   - Plateforme: Instagram (ou autre)
   - Date: Aujourd'hui + 1 jour
4. Sauvegarder la publication
5. Aller dans **Marketing > Calendrier**
6. Vérifier que la publication apparaît dans le calendrier
7. Retourner à la liste des publications
8. Éditer la publication (changer le texte)
9. Tester la suppression (optionnel)

**RÉSULTAT ATTENDU** :
- ✅ Publication créée
- ✅ Visible dans Publications
- ✅ Visible dans Calendrier
- ✅ Édition fonctionne
- ✅ Suppression fonctionne

---

### Test 4️⃣ : Module Stock - Gestion Entrepôts
**OBJECTIF** : Vérifier la gestion des entrepôts et inventaire

**ÉTAPES** :
1. Aller dans **Stock > Entrepôts**
2. Vérifier que la liste des entrepôts s'affiche
3. Cliquer sur "Nouvel Entrepôt"
4. Créer un entrepôt :
   - Nom: "Entrepôt Test Lovable"
   - Type: "Principal"
   - Adresse: "Dakar, Sénégal"
5. Sauvegarder
6. Aller dans **Stock > Inventaire**
7. Vérifier que l'inventaire s'affiche
8. Utiliser la barre de recherche pour chercher un produit

**RÉSULTAT ATTENDU** :
- ✅ Liste des entrepôts chargée
- ✅ Création d'entrepôt fonctionne
- ✅ Inventaire se charge
- ✅ Recherche fonctionne

---

### Test 5️⃣ : Module Compta - Factures & Scanner OCR
**OBJECTIF** : Tester la comptabilité et le scanner OCR IA

**ÉTAPES** :
1. Aller dans **Compta > Factures**
2. Cliquer sur "Nouvelle Facture"
3. Créer une facture :
   - Client: Sélectionner ou créer "Client Test"
   - Produit: Ajouter un produit avec quantité
   - Vérifier le calcul automatique du total
4. Sauvegarder
5. Télécharger la facture en PDF
6. Aller dans **Compta > Scanner OCR**
7. Tester l'upload d'une image de facture
8. Vérifier que l'OCR extrait les données

**RÉSULTAT ATTENDU** :
- ✅ Facture créée
- ✅ Calculs corrects (TVA, total)
- ✅ PDF généré et téléchargeable
- ✅ Scanner OCR fonctionne
- ✅ Extraction de données réussie

---

### Test 6️⃣ : Module Caisse - Point de Vente
**OBJECTIF** : Simuler une vente en caisse

**ÉTAPES** :
1. Aller dans **Caisse > Nouvelle Vente**
2. Ajouter des produits au panier :
   - Produit 1 × 2
   - Produit 2 × 1
3. Vérifier le calcul du total
4. Sélectionner un mode de paiement : **Espèces**
5. Finaliser la vente
6. Aller dans **Caisse > Caisse Journalière**
7. Vérifier que la vente apparaît dans le rapport

**RÉSULTAT ATTENDU** :
- ✅ Ajout de produits fonctionne
- ✅ Calculs corrects
- ✅ Vente finalisée
- ✅ Vente visible dans caisse journalière
- ✅ Montants cohérents

---

### Test 7️⃣ : Module Vente - Catalogue & Commandes
**OBJECTIF** : Tester la gestion du catalogue et des commandes

**ÉTAPES** :
1. Aller dans **Vente > Catalogue**
2. Cliquer sur "Nouveau Produit"
3. Créer un produit :
   - Nom: "Produit Test Lovable"
   - Prix: 15000 FCFA
   - Stock: 100 unités
   - Catégorie: Sélectionner une catégorie
4. Sauvegarder
5. Vérifier que le produit apparaît dans le catalogue
6. Aller dans **Vente > Commandes**
7. Créer une nouvelle commande avec le produit créé
8. Finaliser la commande
9. Vérifier que le stock est décrémenté automatiquement

**RÉSULTAT ATTENDU** :
- ✅ Produit créé
- ✅ Produit visible dans catalogue
- ✅ Commande créée
- ✅ Stock mis à jour automatiquement
- ✅ Cohérence des données

---

### Test 8️⃣ : Module Marketing - Studio Création IA
**OBJECTIF** : Tester la génération d'images avec IA

**ÉTAPES** :
1. Aller dans **Marketing > Studio Création**
2. Uploader une image de produit (ou utiliser une image test)
3. Sélectionner un template :
   - "Palette Couleurs" OU
   - "Produit Flottant" OU
   - Autre template disponible
4. Cliquer sur "Générer"
5. Attendre la génération (30-60 secondes)
6. Vérifier que les images générées s'affichent
7. Télécharger une image générée

**RÉSULTAT ATTENDU** :
- ✅ Upload d'image fonctionne
- ✅ Sélection de template fonctionne
- ✅ Génération IA se lance
- ✅ Images générées correctement
- ✅ Téléchargement fonctionne

**NOTE** : Ce test peut échouer si l'API IA n'est pas configurée. Dans ce cas, marquer comme "SKIP - API non configurée"

---

### Test 9️⃣ : Module Administration - Gestion Équipes
**OBJECTIF** : Vérifier la gestion des utilisateurs et équipes

**ÉTAPES** :
1. Vérifier que **Administration** est visible dans le sidebar (bug corrigé)
2. Aller dans **Administration > Équipes**
3. Cliquer sur "Nouvelle Équipe"
4. Créer une équipe :
   - Nom: "Équipe Test Lovable"
   - Description: "Équipe de test automatique"
5. Sauvegarder
6. Aller dans **Administration > Paramètres**
7. Modifier le nom de l'entreprise
8. Sauvegarder
9. Rafraîchir la page et vérifier que la modification est persistée

**RÉSULTAT ATTENDU** :
- ✅ Module Administration visible
- ✅ Équipe créée
- ✅ Paramètres modifiables
- ✅ Sauvegardes fonctionnent
- ✅ Données persistées

---

### Test 🔟 : Intégration Multi-Modules - Flux Complet
**OBJECTIF** : Tester un flux complet qui traverse plusieurs modules

**ÉTAPES** :
1. **CRM** : Créer un lead "Client Final Test Lovable"
2. **CRM** : Convertir le lead en client (si l'option existe)
3. **Vente** : Créer une commande pour ce client avec 2 produits
4. **Stock** : Aller dans Mouvements et vérifier que les sorties de stock sont enregistrées
5. **Caisse** : Finaliser le paiement de la commande
6. **Compta** : Générer la facture pour cette vente
7. Vérifier la cohérence des données :
   - Client existe dans CRM
   - Commande existe dans Vente
   - Stock décrémenté dans Stock
   - Paiement enregistré dans Caisse
   - Facture générée dans Compta

**RÉSULTAT ATTENDU** :
- ✅ Flux complet fonctionne sans erreur
- ✅ Données synchronisées entre modules
- ✅ Aucune perte de données
- ✅ Cohérence des montants
- ✅ Cohérence des quantités en stock

---

## 📊 Format du Rapport de Tests

Pour chaque test, indique :

```
✅ PASS - Test réussi complètement
⚠️ PARTIAL - Test réussi partiellement avec bugs mineurs
❌ FAIL - Test échoué avec erreurs critiques
⏭️ SKIP - Test non exécutable (API manquante, etc.)
```

### Template de Rapport :

```markdown
## Rapport de Tests MyPostelma CRM

**Date** : [Date]
**Environnement** : Lovable
**Mode Test** : ✅ Activé

### Résultats :

| Test | Statut | Commentaires |
|------|--------|-------------|
| 1️⃣ Navigation & Sidebar | ✅ PASS | Tous les menus s'affichent correctement |
| 2️⃣ CRM Leads | ✅ PASS | Création et modification OK |
| 3️⃣ Marketing Publications | ⚠️ PARTIAL | Création OK, mais calendrier lent |
| 4️⃣ Stock Entrepôts | ✅ PASS | Fonctionne parfaitement |
| 5️⃣ Compta Factures | ❌ FAIL | Erreur lors du téléchargement PDF |
| 6️⃣ Caisse POS | ✅ PASS | Vente enregistrée correctement |
| 7️⃣ Vente Catalogue | ✅ PASS | Stock mis à jour automatiquement |
| 8️⃣ Studio IA | ⏭️ SKIP | API IA non configurée |
| 9️⃣ Administration | ✅ PASS | Module maintenant visible |
| 🔟 Flux Complet | ✅ PASS | Intégration multi-modules fonctionne |

### Score Global : 8/9 (89%) - 1 Skip

### Bugs Trouvés :

1. **Test 3 - Calendrier lent** :
   - Severité: Mineure
   - Description: Le calendrier met 3-4 secondes à charger les publications
   - Solution proposée: Optimiser la requête ou ajouter pagination

2. **Test 5 - PDF ne se télécharge pas** :
   - Severité: Critique
   - Description: Erreur 500 lors du téléchargement du PDF
   - Logs: [Inclure les logs de la console]
   - Solution proposée: Vérifier la configuration du générateur PDF

### Recommandations :

1. Corriger le bug critique du PDF (Test 5)
2. Optimiser les performances du calendrier (Test 3)
3. Configurer l'API IA pour activer le Studio Création
```

---

## 🐛 Debug & Logs

Pour aider au debugging, inclure dans ton rapport :

### Logs Console :
```javascript
// Capturer les erreurs console
console.log('=== LOGS DE TEST ===');
// Copier tous les logs/errors/warnings
```

### État de l'Application :
```javascript
// Feature Flags
window.featureFlags.debug()

// Mode Test
window.testMode.isActive()

// Utilisateur Test
console.log('User:', JSON.parse(localStorage.getItem('test-user')))
```

---

## ⚠️ Notes Importantes

1. **Mode Test activé** : Tu as les permissions "Owner" = tous les droits
2. **Données de test** : Utilise des données fictives (préfixe "Test Lovable")
3. **Pas de vrai paiement** : Tous les paiements sont simulés
4. **API externes** : Certaines features (IA, OCR) peuvent nécessiter des clés API

---

## 🎯 Objectif Final

L'objectif est de valider que :
- ✅ Toute la navigation fonctionne
- ✅ Les modules principaux sont opérationnels
- ✅ Les flux métier complets fonctionnent
- ✅ Les données sont cohérentes entre modules
- ✅ Aucune régression après les dernières modifications (nettoyage sidebar)

**Bonne chance avec les tests ! 🚀**
