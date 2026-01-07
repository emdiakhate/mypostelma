# 🚀 Instructions de déploiement Lovable - Module Compta

## 📋 Vue d'ensemble

Le module Compta (Devis & Factures) avec templates et aperçu temps réel est **100% développé**. Voici les étapes que Lovable doit effectuer pour le rendre fonctionnel en production.

---

## ✅ Étape 1: Appliquer les migrations SQL

### Migration 1: Tables Compta
**Fichier**: `supabase/migrations/20260107000001_create_compta_module.sql`

Cette migration crée:
- Tables: `compta_sequences`, `compta_quotes`, `compta_quote_items`, `compta_invoices`, `compta_invoice_items`, `compta_payments`, `compta_ocr_scans`
- Fonction: `get_next_sequence_number()` pour numérotation automatique
- Triggers: Calcul automatique du `balance_due`
- RLS Policies pour toutes les tables

**Action Lovable:**
```bash
# Cette migration devrait déjà être appliquée lors du dernier déploiement
# Vérifier avec:
supabase db inspect
```

### Migration 2: Company Settings
**Fichier**: `supabase/migrations/20260107000002_add_company_settings.sql`

Cette migration crée:
- Table: `company_settings` (logo, coordonnées, templates par défaut)
- RLS Policies
- Trigger: Mise à jour automatique de `updated_at`

**Action Lovable:**
```bash
# Appliquer la migration
supabase db push
```

---

## ✅ Étape 2: Créer le bucket Supabase Storage

### Bucket "logos"
Pour stocker les logos d'entreprise.

**Action Lovable:**
1. Aller dans Supabase Dashboard → Storage
2. Créer un bucket nommé `logos`
3. Configurer comme **public**
4. Ajouter les RLS policies:

```sql
-- Policy: Les utilisateurs peuvent uploader leur propre logo
CREATE POLICY "Users can upload their own logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Les utilisateurs peuvent voir leur propre logo
CREATE POLICY "Users can view their own logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

-- Policy: Les utilisateurs peuvent supprimer leur propre logo
CREATE POLICY "Users can delete their own logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Bucket "documents" (pour OCR Scanner)
Pour stocker les documents scannés.

**Action Lovable:**
1. Créer un bucket nommé `documents`
2. Configurer comme **privé**
3. Ajouter les RLS policies similaires

---

## ✅ Étape 3: Installer les dépendances NPM

**Action Lovable:**
```bash
npm install jspdf jspdf-autotable
```

Ces libraries sont nécessaires pour la génération de PDFs.

---

## ✅ Étape 4: Déployer les Edge Functions Supabase

### Fonction 1: process-ocr
**Fichier**: `supabase/functions/process-ocr/index.ts`

Appelle OpenAI Vision API pour extraire les données des documents scannés.

**Action Lovable:**
```bash
supabase functions deploy process-ocr
```

### Fonction 2: send-document-email
**Fichier**: `supabase/functions/send-document-email/index.ts`

Envoie les devis/factures par email avec Resend API.

**Action Lovable:**
```bash
supabase functions deploy send-document-email
```

### Fonction 3: send-document-whatsapp
**Fichier**: `supabase/functions/send-document-whatsapp/index.ts`

Envoie les devis/factures via WhatsApp Business API.

**Action Lovable:**
```bash
supabase functions deploy send-document-whatsapp
```

---

## ✅ Étape 5: Configurer les variables d'environnement

### Variables pour Edge Functions

Dans Supabase Dashboard → Edge Functions → Settings:

```env
# OpenAI pour OCR Scanner (OBLIGATOIRE)
OPENAI_API_KEY=sk-...

# Resend pour emails (OPTIONNEL)
RESEND_API_KEY=re_...

# WhatsApp Business API (OPTIONNEL)
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

**⚠️ Important:**
- **OPENAI_API_KEY** est **OBLIGATOIRE** pour le Scanner OCR
- **RESEND_API_KEY** est **OPTIONNEL** (si non configuré, l'envoi email ne marchera pas)
- **WHATSAPP credentials** sont **OPTIONNELS** (si non configurés, l'envoi WhatsApp ne marchera pas)
- Les autres fonctionnalités (Devis, Factures, Paiements, Dashboard, Templates, Aperçu) fonctionnent sans ces APIs

---

## ✅ Étape 6: Déployer le code frontend

**Action Lovable:**
```bash
# Le code est déjà committé et pushé sur la branche claude/analyze-project-con5n
# Merges les commits suivants:
# - 4d9579d: Module Compta complet (Phases 1-8)
# - 18990b0: Système de templates + corrections routes
# - 59c02c1: Aperçu temps réel

git checkout main
git merge claude/analyze-project-con5n
git push origin main

# Puis déployer normalement
npm run build
# ou via l'interface Lovable
```

---

## ✅ Étape 7: Vérifications post-déploiement

### 1. Tester la navigation
- ✅ `/app/compta/dashboard` - Dashboard avec KPIs
- ✅ `/app/compta/devis` - Liste des devis
- ✅ `/app/compta/devis/new` - Créer un devis
- ✅ `/app/compta/factures` - Liste des factures
- ✅ `/app/compta/factures/new` - Créer une facture
- ✅ `/app/compta/scanner` - Scanner OCR
- ✅ `/app/compta/settings` - Paramètres (logo + templates)

### 2. Tester les fonctionnalités de base
- ✅ Créer un devis → Enregistrer → Voir dans la liste
- ✅ Transformer un devis en facture (bouton dans la liste)
- ✅ Créer une facture → Ajouter paiement → Vérifier balance_due
- ✅ Ouvrir Paramètres → Uploader un logo
- ✅ Créer un devis → Cliquer "Aperçu" → Voir le modal

### 3. Tester le Scanner OCR (si OpenAI configurée)
- ✅ `/app/compta/scanner` → Upload une image de facture
- ✅ Vérifier que l'extraction IA fonctionne
- ✅ Vérifier que le score de confiance s'affiche

### 4. Tester les templates
- ✅ Paramètres → Choisir template "Minimal"
- ✅ Créer un devis → Aperçu → Vérifier que le template Minimal s'affiche
- ✅ Changer pour template "Modern" → Vérifier

---

## 📊 Récapitulatif des fonctionnalités

### ✅ Fonctionnalités prêtes (sans configuration externe)
- Dashboard avec KPIs temps réel
- Gestion devis (CRUD complet)
- Gestion factures (CRUD complet)
- Transformation devis → facture (1 clic)
- Gestion paiements (modal avec historique)
- Système de templates (3 templates prêts)
- Aperçu temps réel (modal avec rendu HTML)
- Upload logo entreprise
- Paramètres entreprise (coordonnées, templates)

### ⚠️ Fonctionnalités nécessitant configuration
- **Scanner OCR**: Nécessite `OPENAI_API_KEY`
- **Envoi email**: Nécessite `RESEND_API_KEY`
- **Envoi WhatsApp**: Nécessite `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`
- **Génération PDF**: Fonctionne mais utilise encore jsPDF (à améliorer avec HTML to PDF)

---

## 🎯 Prochaines améliorations (optionnelles)

### Court terme
1. **Améliorer génération PDF**
   - Actuellement: jsPDF basique
   - Objectif: Utiliser les templates HTML pour les PDFs (avec html2pdf ou puppeteer)

2. **Ajouter bouton "Télécharger PDF"**
   - Dans le modal d'aperçu
   - Dans les listes (devis/factures)

3. **Créer thumbnails des templates**
   - Images de prévisualisation des templates dans Settings

### Moyen terme
1. **Système de notifications automatiques**
   - Rappels factures en retard
   - Notifications devis expirés

2. **Export comptable**
   - Export vers Excel/CSV
   - Export vers logiciels comptables (Sage, Ciel, etc.)

3. **Paiements en ligne**
   - Intégration Stripe
   - Intégration Wave (mobile money africain)

---

## 🐛 Problèmes connus et solutions

### Problème 1: Routes ne fonctionnent pas
**Solution**: Les routes sont corrigées. Toutes les URLs internes utilisent `/app/compta/...`

### Problème 2: Templates ne s'affichent pas dans l'aperçu
**Solution**: Vérifier que `useCompanySettings()` charge correctement les settings

### Problème 3: Logo ne s'upload pas
**Solution**:
1. Vérifier que le bucket `logos` existe
2. Vérifier les RLS policies
3. Vérifier la taille du fichier (max 2MB)

### Problème 4: Scanner OCR échoue
**Solution**:
1. Vérifier que `OPENAI_API_KEY` est configurée
2. Vérifier que le bucket `documents` existe
3. Vérifier que la Edge Function `process-ocr` est déployée

---

## 📞 Support

Si des problèmes persistent après le déploiement:
1. Vérifier les logs Supabase (Database, Edge Functions, Storage)
2. Vérifier la console navigateur (erreurs JS)
3. Vérifier les migrations SQL (sont-elles toutes appliquées?)

---

## ✅ Checklist finale

- [ ] Migration 1 appliquée (`compta_*` tables)
- [ ] Migration 2 appliquée (`company_settings` table)
- [ ] Bucket `logos` créé + RLS policies
- [ ] Bucket `documents` créé + RLS policies
- [ ] NPM dependencies installées (`jspdf`, `jspdf-autotable`)
- [ ] Edge Function `process-ocr` déployée
- [ ] Edge Function `send-document-email` déployée
- [ ] Edge Function `send-document-whatsapp` déployée
- [ ] Variable `OPENAI_API_KEY` configurée (pour OCR)
- [ ] Variables email/WhatsApp configurées (optionnel)
- [ ] Code frontend déployé
- [ ] Tests de navigation effectués
- [ ] Tests de création devis/factures effectués
- [ ] Test d'aperçu temps réel effectué

**Une fois cette checklist complétée, le module Compta est 100% fonctionnel ! 🎉**
