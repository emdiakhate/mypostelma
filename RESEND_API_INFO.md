# 📧 Configuration RESEND API (Optionnel)

## Qu'est-ce que RESEND ?

**RESEND** est un service d'envoi d'emails transactionnels (invitations, notifications, etc.). Il est **optionnel** pour le moment mais peut être utile pour :
- Envoyer des emails d'invitation aux membres d'équipe
- Notifications par email
- Récupération de mot de passe personnalisée

## ⚠️ Pas Nécessaire pour le Fonctionnement Actuel

**IMPORTANT:** RESEND n'est **PAS nécessaire** pour que l'application fonctionne actuellement. L'erreur d'invitation de membre n'est **PAS liée** à RESEND, mais à un problème de permissions RLS dans Supabase (déjà corrigé dans le commit précédent).

## 🔑 Où Obtenir une Clé RESEND (Si Besoin)

### Étape 1 : Créer un compte
1. Allez sur **https://resend.com**
2. Cliquez sur **"Sign Up"**
3. Créez un compte gratuit

### Étape 2 : Obtenir la clé API
1. Une fois connecté, allez dans **"API Keys"**
2. Cliquez sur **"Create API Key"**
3. Donnez un nom (ex: "MyPostelma Production")
4. Copiez la clé (format: `re_...`)

### Étape 3 : Configurer dans Supabase
1. Allez dans **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
2. Ajoutez une nouvelle variable:
   ```
   Nom: RESEND_API_KEY
   Valeur: re_xxxxxxxxxxxxxxxxx
   ```

## 📋 Plan Tarifaire

**Gratuit:** 3,000 emails/mois
**Pro:** $20/mois pour 50,000 emails

Pour une application en développement, le plan gratuit est largement suffisant.

## 🚀 Alternative : Supabase Auth (Déjà Utilisé)

Pour l'invitation de membres, vous pouvez utiliser **Supabase Auth** qui est **déjà configuré** et ne nécessite pas RESEND :

- Les invitations sont stockées dans `team_members` avec statut "pending"
- Quand un utilisateur crée un compte avec le même email, il sera automatiquement lié
- Pas besoin d'email pour le moment

## ✅ Recommandation

**Pour le moment, n'installez PAS RESEND.**

L'invitation de membres fonctionne via la base de données:
1. Vous invitez un email → Statut "pending" dans la BDD
2. La personne crée un compte avec cet email
3. Son compte est automatiquement lié à l'équipe

**RESEND sera utile plus tard** pour envoyer des emails d'invitation automatiques avec un lien magique.

---

**Créé le :** 2025-11-27
**Dernière mise à jour :** 2025-11-27
**Statut :** 📌 OPTIONNEL - Pas nécessaire pour le moment
