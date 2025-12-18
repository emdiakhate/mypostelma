# 🚀 Guide de déploiement en production - Postelma

## 📋 Prérequis

- Compte Supabase (projet créé)
- Compte Resend (API key pour emails)
- Compte Twilio (pour WhatsApp)
- Domaine vérifié dans Resend

---

## 1️⃣ Configuration Supabase

### Appliquer les migrations

Dans l'ordre chronologique, appliquez toutes les migrations depuis le dossier `supabase/migrations/` :

```bash
# Via Supabase CLI
supabase db push

# OU via SQL Editor dans Supabase Dashboard
# Copiez-collez le contenu de chaque fichier SQL dans l'ordre
```

**Migrations critiques :**
- `20251217000000_communication_logs.sql` - Historique communications
- `20251217000001_user_templates.sql` - Templates personnalisés
- `20251217000002_email_attachments_storage.sql` - Storage pièces jointes
- `20251217000003_team_invitation_tokens.sql` - Système d'invitations équipes

### Déployer les Edge Functions

```bash
# send-whatsapp
supabase functions deploy send-whatsapp

# send-email  
supabase functions deploy send-email

# send-team-invitation
supabase functions deploy send-team-invitation

# accept-team-invitation
supabase functions deploy accept-team-invitation
```

---

## 2️⃣ Variables d'environnement

### Supabase Edge Functions

Dans **Supabase Dashboard → Settings → Edge Functions**, ajoutez :

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@postelma.com

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Invitations équipes
JWT_SECRET=<générer-clé-aléatoire-32-caractères>
APP_URL=https://votre-app.com
```

**⚠️ Générer JWT_SECRET sécurisé :**
```bash
openssl rand -base64 32
```

---

## 3️⃣ Configuration DNS (Resend)

Dans votre registrar de domaine, ajoutez les enregistrements DNS fournis par Resend :

| Type | Name | Value |
|------|------|-------|
| TXT | resend._domainkey | p=MIGfMA0GCS... |
| MX | send | feedback-smtp.eu-west-1.amazonses.com (priority: 10) |
| TXT | send | v=spf1 include:amazonses.com ~all |
| TXT | _dmarc | v=DMARC1; p=none |

Attendez 5-30 minutes, puis vérifiez dans Resend Dashboard.

---

## 4️⃣ Configuration Twilio

1. Allez sur [Twilio Console](https://console.twilio.com/)
2. Activez WhatsApp Sandbox (pour test)
3. Pour production : Demandez approbation WhatsApp Business
4. Récupérez : `ACCOUNT_SID`, `AUTH_TOKEN`, `WHATSAPP_FROM`

---

## 5️⃣ Optimisations production

### Performance

- ✅ Fichiers tests supprimés (`DialogTestPage`)
- ✅ Dossier dupliqué supprimé (`database_migrations/`)
- ✅ Routes inutiles retirées

### Sécurité

- ✅ RLS activé sur toutes les tables
- ✅ JWT tokens signés (invitations équipes)
- ✅ Validation email
- ✅ Permissions granulaires (owner/admin/member)

### Monitoring

Activez **Supabase Logs** pour suivre :
- Edge Functions (erreurs, latence)
- Database Queries (slow queries)
- Auth Events (connexions, échecs)

---

## 6️⃣ Tests pré-production

### ✅ Checklist

- [ ] Migrations appliquées sans erreur
- [ ] Edge functions déployées
- [ ] Variables d'environnement configurées
- [ ] DNS Resend vérifiés (domaine validé)
- [ ] Test envoi email (depuis CRM Leads)
- [ ] Test envoi WhatsApp (depuis CRM Leads)
- [ ] Test invitation équipe (email reçu + acceptation)
- [ ] Test acceptation invitation user non inscrit
- [ ] Vérifier historique communications
- [ ] Tester templates personnalisés
- [ ] Tester pièces jointes email (< 5MB)

---

## 7️⃣ Rollback en cas de problème

### Revenir à une migration précédente

```sql
-- Lister les migrations appliquées
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;

-- Revenir en arrière (exemple)
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20251217000003';
DROP TABLE team_members; -- puis ré-appliquer l'ancienne version
```

### Désactiver une edge function

```bash
supabase functions delete <function-name>
```

---

## 🐛 Troubleshooting

### "Failed to send invitation email"
- Vérifiez `RESEND_API_KEY` dans Supabase
- Vérifiez domaine vérifié dans Resend
- Check logs : `supabase functions logs send-team-invitation`

### "Invalid or expired token"
- Token expiré (>7j) → Réinviter
- JWT_SECRET différent entre envoi/vérification

### "WhatsApp message not sent"
- Vérifiez `TWILIO_ACCOUNT_SID`, `AUTH_TOKEN`
- Sandbox activé pour test
- Numéro au format international (+33...)

---

## 📞 Support

- **Issues GitHub** : https://github.com/your-repo/issues
- **Supabase Support** : https://supabase.com/support
- **Resend Docs** : https://resend.com/docs
- **Twilio Docs** : https://www.twilio.com/docs/whatsapp

---

**Dernière mise à jour** : 2024-12-18
