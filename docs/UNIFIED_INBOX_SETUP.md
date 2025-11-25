# Unified Inbox - Guide de Configuration et Utilisation

## 📋 Vue d'ensemble

L'Inbox Unifié permet de recevoir et répondre aux messages de plusieurs plateformes dans une seule interface :
- **Email** : Gmail, Outlook
- **Messagerie** : Telegram, WhatsApp (via Twilio)
- **À venir** : Instagram, Facebook, Twitter, LinkedIn, TikTok

## 🗂️ Structure des fichiers créés

### Base de données
- `/database_migrations/add_connected_accounts.sql` - Tables pour les comptes connectés, webhooks logs, et relations

### Types TypeScript
- `/src/types/inbox.ts` - Types étendus pour toutes les plateformes (Gmail, Outlook, Telegram, WhatsApp)

### Services
- `/src/services/connectedAccounts.ts` - Gestion des comptes connectés (CRUD, connexion, déconnexion)
- `/src/services/inbox.ts` - Envoi de messages unifié (mis à jour)

### Pages
- `/src/pages/ConnectedAccountsPage.tsx` - Interface pour gérer les connexions aux différentes plateformes
- `/src/pages/InboxPage.tsx` - Interface de messagerie unifiée (existante)

### Composants
- `/src/components/inbox/ConnectGmailModal.tsx` - Modal pour connecter Gmail
- `/src/components/inbox/ConnectOutlookModal.tsx` - Modal pour connecter Outlook
- `/src/components/inbox/ConnectTelegramModal.tsx` - Modal pour connecter Telegram
- `/src/components/inbox/ConnectWhatsAppModal.tsx` - Modal pour connecter WhatsApp Twilio
- `/src/components/inbox/ConversationList.tsx` - Liste des conversations avec badges et filtres
- `/src/components/inbox/ConversationView.tsx` - Vue de conversation avec messages et envoi

### Edge Functions
- `/supabase/functions/connect-gmail/index.ts` - OAuth2 Gmail
- `/supabase/functions/connect-outlook/index.ts` - OAuth2 Outlook
- `/supabase/functions/connect-telegram/index.ts` - Validation et webhook Telegram
- `/supabase/functions/connect-whatsapp-twilio/index.ts` - Validation credentials Twilio
- `/supabase/functions/telegram-webhook/index.ts` - Réception messages Telegram
- `/supabase/functions/twilio-whatsapp-webhook/index.ts` - Réception messages WhatsApp (mis à jour)
- `/supabase/functions/send-message/index.ts` - Envoi de messages unifié vers toutes les plateformes

### Navigation
- `/src/App.tsx` - Routes ajoutées : `/app/inbox`, `/app/messages`, `/app/connections`
- `/src/components/Layout.tsx` - Menu sidebar mis à jour avec "Messages" et "Connexions"

## 🚀 Installation et Configuration

### 1. Appliquer la migration de base de données

```bash
# Via Supabase CLI
supabase db push
# Ou exécuter manuellement le fichier SQL dans Supabase Dashboard
```

### 2. Configurer les variables d'environnement

Ajoutez ces variables dans votre projet Supabase (Settings → Edge Functions → Secrets) :

```bash
# Gmail OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Outlook OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Supabase (déjà configurés normalement)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Configurer OAuth

#### Gmail
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Gmail
4. Créer des identifiants OAuth 2.0
5. Ajouter les URLs de redirection autorisées :
   - `https://your-domain.com/oauth/google/callback`
   - `http://localhost:5173/oauth/google/callback` (dev)
6. Copier le Client ID et Client Secret

#### Outlook
1. Aller sur [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Créer une nouvelle inscription d'application
3. Ajouter les permissions Microsoft Graph :
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `offline_access`
4. Ajouter les URLs de redirection :
   - `https://your-domain.com/oauth/microsoft/callback`
   - `http://localhost:5173/oauth/microsoft/callback` (dev)
5. Créer un secret client
6. Copier l'Application (client) ID et le secret

### 4. Déployer les Edge Functions

```bash
# Déployer toutes les nouvelles Edge Functions
supabase functions deploy connect-gmail
supabase functions deploy connect-outlook
supabase functions deploy connect-telegram
supabase functions deploy connect-whatsapp-twilio
supabase functions deploy telegram-webhook
supabase functions deploy twilio-whatsapp-webhook
supabase functions deploy send-message
```

### 5. Mettre à jour le frontend

Ajoutez les variables d'environnement dans `.env` :

```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
```

## 📱 Utilisation

### Connecter un compte

1. Aller sur `/app/connections`
2. Cliquer sur "Connecter" pour la plateforme souhaitée
3. Suivre les instructions spécifiques à chaque plateforme

#### Gmail / Outlook
- Cliquer sur "Connecter Gmail" ou "Connecter Outlook"
- Autoriser l'application dans la fenêtre OAuth
- Le compte sera automatiquement connecté

#### Telegram
- Créer un bot via [@BotFather](https://t.me/BotFather) sur Telegram
- Copier le token du bot
- Coller le token dans le modal
- Le webhook sera automatiquement configuré

#### WhatsApp (Twilio)
- Créer un compte [Twilio](https://www.twilio.com/try-twilio)
- Activer le [WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
- Copier Account SID, Auth Token et numéro WhatsApp
- Coller les identifiants dans le modal
- Configurer le webhook manuellement dans [Twilio Console](https://console.twilio.com/) :
  - URL : `https://your-supabase-project.supabase.co/functions/v1/twilio-whatsapp-webhook`

### Utiliser l'Inbox

1. Aller sur `/app/inbox` ou `/app/messages`
2. Voir toutes les conversations de toutes les plateformes
3. Filtrer par plateforme, statut, ou rechercher
4. Cliquer sur une conversation pour la voir
5. Répondre directement depuis l'interface
6. Les messages sont automatiquement marqués comme lus

## 🔄 Flux de données

### Réception de messages

```
Message arrive → Webhook Edge Function → Création/MAJ conversation → Création message → UI en temps réel
```

**Gmail/Outlook** : Nécessite configuration de push notifications (à implémenter)
**Telegram** : Webhook automatique configuré lors de la connexion
**WhatsApp** : Webhook configuré manuellement dans Twilio Console

### Envoi de messages

```
UI → sendMessage service → send-message Edge Function → Routage plateforme → API plateforme → Stockage DB → UI mise à jour
```

## 🎨 Fonctionnalités de l'interface

### Page Connexions (`/app/connections`)
- Cartes pour chaque plateforme (Gmail, Outlook, Telegram, WhatsApp)
- Statut de connexion (actif, erreur, déconnecté)
- Statistiques par compte (messages reçus/envoyés, conversations actives)
- Boutons : Connecter, Synchroniser, Déconnecter
- Badges de statut et d'erreur

### Page Messages (`/app/inbox`)
- Liste de conversations avec :
  - Icône de la plateforme (colorée)
  - Nom et username du participant
  - Dernier message
  - Badges : non lu, répondu, priorité, sentiment
  - Tags personnalisés
  - Temps relatif
- Vue de conversation avec :
  - Header avec info participant
  - Fil de messages (entrants/sortants)
  - Support images, vidéos, fichiers
  - Zone de réponse avec bouton d'envoi
  - Raccourci clavier : Ctrl+Entrée pour envoyer

## 🔐 Sécurité

- **Tokens OAuth** : Stockés chiffrés dans la base de données (TODO: implémenter chiffrement)
- **RLS Policies** : Chaque utilisateur ne peut voir que ses propres comptes et conversations
- **Webhooks** : Validation des signatures (à implémenter pour production)
- **Secrets** : Stockés dans Supabase Edge Functions secrets, jamais exposés au client

## 🐛 Résolution de problèmes

### Gmail/Outlook ne se connecte pas
- Vérifier que les URLs de redirection sont correctes
- Vérifier que les scopes/permissions sont activés
- Vérifier les logs dans Supabase Edge Functions

### Telegram ne reçoit pas de messages
- Vérifier que le webhook est bien configuré : `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Vérifier les logs de l'Edge Function `telegram-webhook`
- Tester manuellement le webhook avec un outil comme Postman

### WhatsApp Twilio ne fonctionne pas
- Vérifier que le webhook est configuré dans Twilio Console
- Pour le sandbox, vérifier que l'utilisateur a envoyé "join [code]" d'abord
- Vérifier les logs Twilio et Supabase

### Messages ne s'envoient pas
- Vérifier que le compte est bien connecté (status = 'active')
- Vérifier que les tokens ne sont pas expirés
- Vérifier les logs de `send-message` Edge Function
- Tester l'API de la plateforme directement avec les credentials

## 📊 Monitoring

### Tables à surveiller
- `connected_accounts` : Comptes connectés, vérifier status
- `webhook_logs` : Logs des webhooks reçus
- `conversations` : Conversations créées
- `messages` : Messages reçus/envoyés

### Métriques importantes
- Nombre de comptes connectés par plateforme
- Taux d'erreur des webhooks
- Temps de réponse moyen
- Messages non lus

## 🚧 À faire (Next Steps)

1. **Implémenter chiffrement des tokens OAuth**
2. **Ajouter push notifications pour Gmail/Outlook**
   - Gmail : utiliser Gmail Push API
   - Outlook : utiliser Microsoft Graph subscriptions
3. **Ajouter validation des signatures de webhooks**
4. **Implémenter refresh token automatique**
5. **Ajouter support des médias dans Telegram**
6. **Créer pages OAuth callback** (actuellement utilise postMessage)
7. **Ajouter tests unitaires et d'intégration**
8. **Implémenter rate limiting sur les Edge Functions**
9. **Ajouter Meta platforms** (Instagram, Facebook) quand le freelance termine
10. **Ajouter analytics de l'inbox** (temps de réponse, etc.)

## 📝 Notes

- Le système est conçu pour être extensible : ajouter une nouvelle plateforme nécessite :
  1. Ajouter le type dans `Platform`
  2. Créer l'Edge Function de connexion
  3. Créer l'Edge Function webhook
  4. Ajouter le cas dans `send-message`
  5. Mettre à jour l'UI avec l'icône et la couleur
- Tous les messages sont stockés localement dans Supabase
- Les conversations sont identifiées de manière unique par `platform_conversation_id`
- Le système supporte le temps réel grâce aux subscriptions Supabase

## 🎯 Prochaines priorités

D'après votre plan initial :
1. ✅ **Unified Inbox** - Terminé !
2. ⏳ **WhatsApp Business API** - Twilio sandbox prêt, en attente du freelance pour Meta
3. ⏳ **Approval Workflow** - À implémenter
