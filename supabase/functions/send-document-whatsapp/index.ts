/**
 * Supabase Edge Function - Send Document WhatsApp
 *
 * Envoie un devis ou une facture via WhatsApp Business API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { document_type, document_id, recipient_phone, recipient_name } = await req.json();

    if (!document_type || !document_id || !recipient_phone) {
      throw new Error('Paramètres requis: document_type, document_id, recipient_phone');
    }

    // Créer client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Récupérer le document
    let document;
    let documentNumber = '';
    let documentTitle = '';

    if (document_type === 'quote') {
      const { data, error } = await supabaseClient
        .from('compta_quotes')
        .select('*, client:client_id(name, phone)')
        .eq('id', document_id)
        .single();

      if (error || !data) throw new Error('Devis introuvable');
      document = data;
      documentNumber = data.quote_number;
      documentTitle = 'Devis';
    } else if (document_type === 'invoice') {
      const { data, error } = await supabaseClient
        .from('compta_invoices')
        .select('*, client:client_id(name, phone)')
        .eq('id', document_id)
        .single();

      if (error || !data) throw new Error('Facture introuvable');
      document = data;
      documentNumber = data.invoice_number;
      documentTitle = 'Facture';
    } else {
      throw new Error('Type de document invalide');
    }

    // Formater le numéro de téléphone (format international)
    let formattedPhone = recipient_phone.replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      // Assumer Sénégal +221 si pas de code pays
      formattedPhone = '+221' + formattedPhone;
    }

    // Récupérer les clés API WhatsApp
    const wabaToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const wabaPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!wabaToken || !wabaPhoneNumberId) {
      throw new Error('Variables WhatsApp non configurées (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID)');
    }

    // Préparer le message
    const messageText = `
🧾 *${documentTitle} ${documentNumber}*

Bonjour ${recipient_name || 'Client'},

${document_type === 'quote'
  ? `Vous avez reçu un nouveau devis de la part de MyPostelma.`
  : `Vous avez reçu une facture de la part de MyPostelma.`
}

📋 *Détails:*
• N° ${documentNumber}
• Date: ${new Date(document.issue_date).toLocaleDateString('fr-FR')}
${document_type === 'invoice'
  ? `• Échéance: ${new Date(document.due_date).toLocaleDateString('fr-FR')}`
  : `• Valable jusqu'au: ${new Date(document.expiration_date).toLocaleDateString('fr-FR')}`
}
• Montant: *${document.total.toLocaleString()} ${document.currency}*

${document_type === 'invoice' && document.balance_due > 0
  ? `💰 *Reste à payer: ${document.balance_due.toLocaleString()} ${document.currency}*\n\n`
  : ''
}${document.notes
  ? `📝 *Notes:*\n${document.notes}\n\n`
  : ''
}Pour plus de détails, veuillez consulter le document PDF joint.

Merci de votre confiance ! 🙏

---
_Message automatique - MyPostelma_
    `.trim();

    // Envoyer via WhatsApp Business API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${wabaPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${wabaToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: messageText,
          },
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
    }

    const whatsappData = await whatsappResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${documentTitle} envoyé à ${formattedPhone} via WhatsApp`,
        whatsapp_message_id: whatsappData.messages?.[0]?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error sending WhatsApp:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur lors de l\'envoi WhatsApp',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
