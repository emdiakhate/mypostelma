# ⚠️ DÉPLOIEMENT REQUIS - ACTIONS CRITIQUES

## 🚨 Problème Actuel

**RIEN NE FONCTIONNE** car les migrations de base de données **ne sont pas déployées** dans Supabase !

### Symptômes constatés :
- ❌ Sync Gmail affiche "0 messages synchronisés"
- ❌ Invitation de membres d'équipe → Erreur 403
- ❌ Page Équipes → Erreur 403 sur `team_members`
- ❌ Routage IA des messages → Ne peut pas fonctionner

### Cause racine :
Les **tables n'existent pas** dans Supabase car les migrations suivantes n'ont **jamais été appliquées** :

1. `20251125160037_e6fd68fa-e239-4a6b-901d-91cbe1811123.sql` - Tables Inbox (conversations, messages, connected_accounts)
2. `20251127160000_create_teams_and_routing.sql` - Tables Teams (teams, team_members, conversation_teams, message_ai_analysis)

---

## ✅ SOLUTION : Déployer via Lovable

### Option 1 : Déploiement Automatique (RECOMMANDÉ)

**Via Lovable Dashboard :**

1. Ouvrez votre projet sur **Lovable.dev**
2. Cliquez sur le bouton **"Deploy"** ou **"Sync"**
3. Lovable détectera automatiquement les 2 nouvelles migrations
4. **Confirmez le déploiement**
5. Lovable appliquera les migrations à Supabase automatiquement

**Temps estimé :** 2-3 minutes

---

### Option 2 : Déploiement Manuel (Si Option 1 ne fonctionne pas)

**Via Supabase Dashboard :**

1. Allez sur **https://supabase.com/dashboard**
2. Sélectionnez votre projet : `qltfylleiwjvtngmsdyg`
3. Dans le menu latéral, cliquez sur **"SQL Editor"**
4. Créez une nouvelle requête
5. **Copiez-collez le contenu de CHAQUE migration dans l'ordre :**

#### Migration 1/2 : Inbox (CRITIQUE pour sync Gmail)
```sql
-- Fichier: supabase/migrations/20251125160037_e6fd68fa-e239-4a6b-901d-91cbe1811123.sql
-- Copiez TOUT le contenu de ce fichier et exécutez-le
```

#### Migration 2/2 : Teams (CRITIQUE pour invitations)
```sql
-- Fichier: supabase/migrations/20251127160000_create_teams_and_routing.sql
-- Copiez TOUT le contenu de ce fichier et exécutez-le
```

6. Cliquez sur **"Run"** pour chaque migration
7. Vérifiez qu'il n'y a pas d'erreurs

**Temps estimé :** 5-10 minutes

---

## 📋 Checklist de Vérification Post-Déploiement

Une fois les migrations déployées, vérifiez que ces tables existent dans Supabase :

**Dans Supabase Dashboard → Table Editor :**

### Tables Inbox (Migration 1)
- [ ] `connected_accounts` ← Pour Gmail/Outlook/Telegram/WhatsApp
- [ ] `conversations` ← Pour stocker les conversations
- [ ] `messages` ← Pour stocker les messages
- [ ] `quick_replies` ← Pour réponses rapides
- [ ] `webhook_logs` ← Pour logs webhooks

### Tables Teams (Migration 2)
- [ ] `teams` ← Pour créer des équipes
- [ ] `team_members` ← Pour inviter des membres
- [ ] `conversation_teams` ← Pour assigner conversations aux équipes
- [ ] `message_ai_analysis` ← Pour logs analyse IA

### Vues (Views)
- [ ] `teams_with_stats`
- [ ] `conversations_with_teams`
- [ ] `conversations_with_last_message`
- [ ] `connected_accounts_with_stats`

---

## 🧪 Tests Après Déploiement

### Test 1 : Sync Gmail ✅
1. Allez sur **Connexions** (`/app/connections`)
2. Sélectionnez votre compte Gmail
3. Cliquez sur **"Sync"**
4. **Résultat attendu :** "X messages synchronisés" (X > 0)

### Test 2 : Créer une Équipe ✅
1. Allez sur **Équipes** (`/app/teams`)
2. Cliquez sur **"Créer une équipe"**
3. Nom : "RH", Description : "Ressources Humaines"
4. **Résultat attendu :** L'équipe apparaît dans la liste

### Test 3 : Inviter un Membre ✅
1. Sur la page Équipes, cliquez sur **"Membres"** pour l'équipe RH
2. Entrez un email
3. Cliquez sur **"Inviter"**
4. **Résultat attendu :** Le membre apparaît avec statut "En attente"

### Test 4 : Routage IA ✅
1. Envoyez un email à votre compte Gmail avec :
   > "Bonjour, je souhaite déposer ma candidature pour le poste de commercial"
2. Synchronisez les messages
3. Allez dans **Messages** (`/app/inbox`)
4. **Résultat attendu :** Message tagué avec l'équipe "RH"

---

## 🔑 Variables d'Environnement Requises

**Après déploiement des migrations**, vérifiez que ces variables sont configurées dans Supabase Edge Functions :

### Via Supabase Dashboard → Edge Functions → Settings

```bash
# Pour le routage IA
OPENAI_API_KEY=sk-...

# Pour le scraping (analyse concurrentielle)
APIFY_TOKEN=apify_api_...

# Déjà configurés (normalement)
SUPABASE_URL=https://qltfylleiwjvtngmsdyg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 📊 Ce Que Les Migrations Créent

### Migration 1 : Inbox (20251125160037)
- **5 tables** : connected_accounts, conversations, messages, quick_replies, webhook_logs
- **16 indexes** : Pour optimiser les requêtes
- **4 vues** : Pour afficher données enrichies
- **6 fonctions** : Pour triggers et helpers
- **12 RLS policies** : Pour la sécurité multi-utilisateurs

### Migration 2 : Teams (20251127160000)
- **4 tables** : teams, team_members, conversation_teams, message_ai_analysis
- **8 indexes** : Pour optimiser les requêtes
- **2 vues** : teams_with_stats, conversations_with_teams
- **3 triggers** : Pour compteurs automatiques
- **12 RLS policies** : Pour la sécurité

**Total :** 9 tables, 24 indexes, 6 vues, 9 fonctions, 24 RLS policies

---

## ❓ FAQ

### Q: Pourquoi les migrations ne sont pas automatiquement appliquées ?
**R:** Lovable doit déployer manuellement les migrations dans Supabase. Elles ne sont pas appliquées automatiquement lors d'un simple commit Git.

### Q: Puis-je appliquer les migrations moi-même sans Lovable ?
**R:** Oui, via l'Option 2 (Supabase Dashboard SQL Editor). Mais c'est plus risqué car vous devez tout copier-coller manuellement.

### Q: Que se passe-t-il si j'oublie de déployer ?
**R:** RIEN ne fonctionnera dans l'application :
- Pas de sync Gmail/Outlook
- Pas d'équipes ni invitations
- Pas de routage IA
- Erreurs 403/500 partout

### Q: Les migrations vont-elles supprimer mes données existantes ?
**R:** NON. Les migrations utilisent `CREATE TABLE IF NOT EXISTS`, donc elles ne touchent pas aux tables existantes. C'est 100% sûr.

### Q: Combien de temps prend le déploiement ?
**R:**
- Via Lovable (Option 1) : 2-3 minutes
- Manuellement (Option 2) : 5-10 minutes

---

## 🚀 PROCHAINE ÉTAPE : DÉPLOYEZ MAINTENANT !

**ACTION REQUISE :** Allez sur Lovable et déployez les migrations **IMMÉDIATEMENT**.

Sans ce déploiement, **RIEN ne fonctionnera**.

---

**Créé le :** 2025-11-27
**Dernière mise à jour :** 2025-11-27
**Statut :** ⚠️ CRITIQUE - DÉPLOIEMENT REQUIS
