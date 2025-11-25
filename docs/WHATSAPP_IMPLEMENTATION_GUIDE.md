# Guide d'Implémentation WhatsApp Business API

## Vue d'ensemble

Ce guide explique comment intégrer WhatsApp Business API dans Postelma en utilisant **WhatsApp Cloud API** (gratuit, numéro propre du client).

---

## Option 1 : WhatsApp Cloud API (Recommandé) 🥇

### Avantages
- ✅ **Gratuit** jusqu'à 1000 conversations/mois
- ✅ Le client utilise **son propre numéro**
- ✅ API officielle Meta (pas de middleman)
- ✅ Disponible en Afrique
- ✅ Setup relativement simple

### Prérequis

1. **Facebook Business Account**
2. **WhatsApp Business Account** lié au Facebook Business
3. **Numéro de téléphone** à vérifier (pas déjà sur WhatsApp personnel)
4. **Carte bancaire** (pour vérification, pas de paiement immédiat)

### Setup Initial

#### Étape 1: Créer l'App Facebook

```bash
1. Aller sur https://developers.facebook.com/apps
2. Créer une nouvelle app → Type: Business
3. Ajouter le produit "WhatsApp"
4. Configurer WhatsApp Business API
```

#### Étape 2: Vérifier le Numéro de Téléphone

```
1. Dans l'app Facebook → WhatsApp → Getting Started
2. Ajouter un numéro de téléphone
3. Vérifier via SMS (code à 6 chiffres)
4. Le numéro est maintenant lié à l'API
```

#### Étape 3: Obtenir les Credentials

```
Phone Number ID: 1234567890 (dans "From" section)
WhatsApp Business Account ID: 1234567890
Access Token: EAAG... (temporaire ou permanent)
```

#### Étape 4: Configurer le Webhook

```
Webhook URL: https://[ton-projet].supabase.co/functions/v1/whatsapp-webhook-handler
Verify Token: postelma_whatsapp_2025
Subscribe to: messages, messaging_postbacks
```

---

## Structure Base de Données (Extension pour WhatsApp)

```sql
-- Étendre la table conversations pour WhatsApp
ALTER TABLE conversations
ADD COLUMN whatsapp_phone_number TEXT, -- Numéro client (+221771234567)
ADD COLUMN whatsapp_name TEXT; -- Nom du contact

-- Table pour stocker les templates WhatsApp approuvés
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    template_name VARCHAR(100) NOT NULL, -- Ex: "welcome_message"
    language VARCHAR(10) NOT NULL, -- "fr", "en", "wo" (wolof)
    category VARCHAR(50) NOT NULL, -- "MARKETING", "UTILITY", "AUTHENTICATION"

    -- Contenu
    header_type VARCHAR(20), -- "TEXT", "IMAGE", "VIDEO", "DOCUMENT"
    header_content TEXT, -- Texte ou URL du media
    body_text TEXT NOT NULL, -- Corps du message (avec {{1}}, {{2}} pour variables)
    footer_text TEXT, -- Texte du footer
    buttons JSONB, -- Boutons CTA ou Quick Reply

    -- Statut Meta
    status VARCHAR(20) DEFAULT 'pending', -- "pending", "approved", "rejected"
    template_id TEXT, -- ID Meta une fois approuvé

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id, template_name, language)
);

-- Table pour les broadcasts WhatsApp
CREATE TABLE whatsapp_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    campaign_name VARCHAR(200) NOT NULL,
    template_id UUID REFERENCES whatsapp_templates(id),

    -- Audience
    target_contacts JSONB, -- Liste de numéros ou segments
    estimated_reach INTEGER,

    -- Statut
    status VARCHAR(20) DEFAULT 'draft', -- "draft", "scheduled", "sending", "sent", "failed"
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,

    -- Métriques
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_read INTEGER DEFAULT 0,
    total_replied INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own whatsapp templates"
    ON whatsapp_templates FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own whatsapp broadcasts"
    ON whatsapp_broadcasts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## Edge Function: WhatsApp Webhook Handler

```typescript
// supabase/functions/whatsapp-webhook-handler/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'postelma_whatsapp_2025';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Webhook verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Handle incoming messages (POST)
  if (req.method === 'POST') {
    const body = await req.json();

    console.log('WhatsApp webhook:', JSON.stringify(body, null, 2));

    // Process messages
    if (body.entry && body.entry[0]?.changes) {
      for (const change of body.entry[0].changes) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            await handleIncomingMessage(
              body.entry[0].id, // WhatsApp Business Account ID
              change.value.metadata.phone_number_id,
              message,
              change.value.contacts?.[0]
            );
          }
        }

        // Handle message status updates (sent, delivered, read)
        if (change.value?.statuses) {
          for (const status of change.value.statuses) {
            await handleMessageStatus(status);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
});

async function handleIncomingMessage(
  businessAccountId: string,
  phoneNumberId: string,
  message: any,
  contact: any
) {
  try {
    const fromNumber = message.from; // Ex: "221771234567"
    const messageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);

    // Find user who owns this WhatsApp Business number
    const { data: socialAccount } = await supabase
      .from('social_accounts')
      .select('user_id')
      .eq('platform', 'whatsapp')
      .eq('platform_account_id', phoneNumberId)
      .single();

    if (!socialAccount) {
      console.log('WhatsApp account not found:', phoneNumberId);
      return;
    }

    const userId = socialAccount.user_id;

    // Create or update conversation
    const conversationId = `whatsapp_${fromNumber}_${phoneNumberId}`;
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('platform_conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    let dbConversationId: string;

    if (existingConversation) {
      dbConversationId = existingConversation.id;

      await supabase
        .from('conversations')
        .update({
          status: 'unread',
          last_message_at: timestamp.toISOString(),
          participant_name: contact?.profile?.name || fromNumber,
        })
        .eq('id', dbConversationId);
    } else {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          platform: 'whatsapp',
          platform_conversation_id: conversationId,
          participant_id: fromNumber,
          participant_name: contact?.profile?.name || fromNumber,
          whatsapp_phone_number: fromNumber,
          whatsapp_name: contact?.profile?.name,
          status: 'unread',
          priority: 'normal',
          tags: [],
          message_count: 0,
          last_message_at: timestamp.toISOString(),
        })
        .select('id')
        .single();

      dbConversationId = newConversation!.id;
    }

    // Check if message already exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('platform_message_id', messageId)
      .single();

    if (existingMessage) {
      console.log('Message already exists:', messageId);
      return;
    }

    // Parse message content
    let messageType = 'text';
    let textContent = '';
    let mediaUrl = '';

    if (message.type === 'text') {
      textContent = message.text.body;
    } else if (message.type === 'image') {
      messageType = 'image';
      mediaUrl = message.image.id; // Media ID, need to download separately
      textContent = message.image.caption || '';
    } else if (message.type === 'video') {
      messageType = 'video';
      mediaUrl = message.video.id;
      textContent = message.video.caption || '';
    } else if (message.type === 'audio') {
      messageType = 'audio';
      mediaUrl = message.audio.id;
    }

    // Create message
    await supabase.from('messages').insert({
      conversation_id: dbConversationId,
      platform_message_id: messageId,
      direction: 'inbound',
      message_type: messageType,
      text_content: textContent,
      media_url: mediaUrl,
      sender_id: fromNumber,
      sender_name: contact?.profile?.name || fromNumber,
      is_read: false,
      sent_at: timestamp.toISOString(),
    });

    console.log('WhatsApp message created successfully');
  } catch (error) {
    console.error('Error handling WhatsApp message:', error);
  }
}

async function handleMessageStatus(status: any) {
  try {
    const messageId = status.id;
    const newStatus = status.status; // "sent", "delivered", "read", "failed"

    // Update message in DB (for outbound messages)
    // This is for tracking delivery status
    console.log(`Message ${messageId} status: ${newStatus}`);

    // You can add logic here to update message_delivery_status in messages table
  } catch (error) {
    console.error('Error handling message status:', error);
  }
}
```

---

## Edge Function: Send WhatsApp Message

```typescript
// supabase/functions/send-whatsapp-message/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

serve(async (req) => {
  try {
    const {
      phone_number_id, // Ex: "123456789"
      to, // Ex: "221771234567"
      message_type, // "text", "template", "image"
      text, // Si text message
      template_name, // Si template
      template_language, // Si template
      template_params, // Variables template
      media_url, // Si image/video
      access_token,
    } = await req.json();

    let payload: any = {
      messaging_product: 'whatsapp',
      to: to,
    };

    if (message_type === 'text') {
      payload.type = 'text';
      payload.text = { body: text };
    } else if (message_type === 'template') {
      payload.type = 'template';
      payload.template = {
        name: template_name,
        language: { code: template_language },
        components: template_params || [],
      };
    } else if (message_type === 'image') {
      payload.type = 'image';
      payload.image = {
        link: media_url,
        caption: text || '',
      };
    }

    const url = `${WHATSAPP_API_URL}/${phone_number_id}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send WhatsApp message');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: data.messages[0].id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

---

## Fonctionnalités WhatsApp Clés

### 1. **Inbox Unifié** (déjà fait ✅)
- Les messages WhatsApp apparaissent dans le même inbox que Instagram/Facebook
- Conversation par numéro de téléphone

### 2. **Templates de Messages**
- Obligatoire pour messages sortants (après 24h de silence)
- Doivent être approuvés par Meta avant utilisation
- Categories: Marketing, Utility, Authentication

**Exemple de template** :
```
Nom: welcome_message
Body: "Bonjour {{1}}, bienvenue chez {{2}} ! 🎉 Comment puis-je vous aider aujourd'hui ?"
Variables: [Prénom, Nom entreprise]
```

### 3. **Broadcasts** (Campagnes de Masse)
- Envoyer à 100+ contacts simultanément
- Utilise des templates approuvés
- Trackingcomplet (envoyé, délivré, lu, répondu)

### 4. **Chatbot Simple**
- Réponses automatiques aux FAQ
- Keywords triggers
- Fallback vers agent humain

### 5. **Catalogue Produits**
- Intégrer catalogue WhatsApp Business
- Clients peuvent naviguer et commander
- Liens produits directs

---

## Pricing WhatsApp

**Gratuit** :
- 1000 conversations gratuites/mois (conversation = 24h window)

**Payant** (après 1000 conversations) :
- Marketing: $0.016-0.09 par conversation (selon pays)
- Utility: $0.005-0.04 par conversation
- Authentication: $0.005-0.02 par conversation

**Sénégal** : ~$0.02-0.04 par conversation (très abordable)

---

## Configuration dans Postelma

### Ajouter WhatsApp Account

```typescript
// Dans settings
interface WhatsAppAccount {
  phone_number: string; // "+221771234567"
  phone_number_id: string; // De Meta
  business_account_id: string;
  access_token: string; // Long-lived token
  webhook_verify_token: string;
}
```

### Flow Utilisateur

```
1. User va dans Settings → Comptes Sociaux
2. Clique "Connecter WhatsApp"
3. Redirigé vers Facebook → Autorise l'app
4. Revient sur Postelma avec credentials
5. Setup webhook automatiquement
6. Prêt à recevoir et envoyer messages
```

---

## Alternative: 360dialog ou Twilio (si problème avec Cloud API)

Si Cloud API pose problème (verification Facebook difficile), alternatives :

### 360dialog (BSP Européen)
- €0.04-0.08 par conversation
- Setup plus simple
- Support multilingue
- **Permet aussi le numéro propre du client**

### Twilio
- $0.005-0.09 par message
- Numéro Twilio (pas idéal pour Afrique)
- Très bien documenté
- Fallback option

---

## Résumé

**Pour permettre aux clients d'utiliser leur propre numéro** :
1. ✅ **WhatsApp Cloud API** (gratuit, recommandé)
2. ✅ **360dialog** (payant mais simple, numéro propre)
3. ❌ **Twilio** (numéro Twilio, pas africain)

**Je recommande : WhatsApp Cloud API**
- Gratuit jusqu'à 1000 conversations/mois
- Numéro propre du client
- API officielle et stable
