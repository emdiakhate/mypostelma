/**
 * Supabase Edge Function - Send Document Email
 *
 * Envoie un devis ou une facture par email avec PDF en pièce jointe
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
    const { document_type, document_id, recipient_email, recipient_name } = await req.json();

    if (!document_type || !document_id || !recipient_email) {
      throw new Error('Paramètres requis: document_type, document_id, recipient_email');
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
    let tableName = '';
    let documentNumber = '';
    let documentTitle = '';

    if (document_type === 'quote') {
      tableName = 'compta_quotes';
      const { data, error } = await supabaseClient
        .from('compta_quotes')
        .select('*, client:client_id(name, email)')
        .eq('id', document_id)
        .single();

      if (error || !data) throw new Error('Devis introuvable');
      document = data;
      documentNumber = data.quote_number;
      documentTitle = 'Devis';
    } else if (document_type === 'invoice') {
      tableName = 'compta_invoices';
      const { data, error } = await supabaseClient
        .from('compta_invoices')
        .select('*, client:client_id(name, email)')
        .eq('id', document_id)
        .single();

      if (error || !data) throw new Error('Facture introuvable');
      document = data;
      documentNumber = data.invoice_number;
      documentTitle = 'Facture';
    } else {
      throw new Error('Type de document invalide');
    }

    // Récupérer la clé API Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY non configurée');
    }

    // Préparer le template email
    const emailSubject = `${documentTitle} ${documentNumber} - MyPostelma`;
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 12px;
    }
    .details {
      background: white;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MyPostelma</h1>
      <p>Gestion d'Entreprise Simplifiée</p>
    </div>
    <div class="content">
      <h2>Bonjour ${recipient_name || 'Client'},</h2>

      <p>
        Veuillez trouver ci-joint votre ${documentTitle.toLowerCase()}
        <strong>${documentNumber}</strong>.
      </p>

      <div class="details">
        <div class="detail-row">
          <span><strong>${documentTitle} N°:</strong></span>
          <span>${documentNumber}</span>
        </div>
        <div class="detail-row">
          <span><strong>Date:</strong></span>
          <span>${new Date(document.issue_date).toLocaleDateString('fr-FR')}</span>
        </div>
        ${
          document_type === 'invoice'
            ? `
        <div class="detail-row">
          <span><strong>Échéance:</strong></span>
          <span>${new Date(document.due_date).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="detail-row">
          <span><strong>Montant Total:</strong></span>
          <span style="font-size: 18px; font-weight: bold;">${document.total.toLocaleString()} ${document.currency}</span>
        </div>
        ${
          document.balance_due > 0
            ? `
        <div class="detail-row" style="background: #fff3cd; margin-top: 10px; padding: 10px; border-radius: 5px;">
          <span><strong>Reste à payer:</strong></span>
          <span style="color: #856404; font-weight: bold;">${document.balance_due.toLocaleString()} ${document.currency}</span>
        </div>
        `
            : ''
        }
        `
            : `
        <div class="detail-row">
          <span><strong>Valable jusqu'au:</strong></span>
          <span>${new Date(document.expiration_date).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="detail-row">
          <span><strong>Montant Total:</strong></span>
          <span style="font-size: 18px; font-weight: bold;">${document.total.toLocaleString()} ${document.currency}</span>
        </div>
        `
        }
      </div>

      ${
        document_type === 'invoice' && document.balance_due > 0
          ? `
      <p style="background: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #0c5460;">
        <strong>💳 Modalités de paiement:</strong><br>
        Merci d'effectuer le paiement avant la date d'échéance.<br>
        ${document.terms || 'Contactez-nous pour les détails de paiement.'}
      </p>
      `
          : ''
      }

      ${
        document.notes
          ? `
      <p style="background: #e2e3e5; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <strong>📝 Notes:</strong><br>
        ${document.notes}
      </p>
      `
          : ''
      }

      <p>
        Pour toute question, n'hésitez pas à nous contacter.
      </p>

      <p>
        Cordialement,<br>
        <strong>L'équipe MyPostelma</strong>
      </p>
    </div>
    <div class="footer">
      <p>
        © ${new Date().getFullYear()} MyPostelma - Tous droits réservés<br>
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Envoyer l'email via Resend
    // Note: Pour joindre le PDF, il faudrait le générer côté serveur
    // Pour l'instant on envoie sans PDF, à améliorer plus tard
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'MyPostelma <noreply@mypostelma.com>',
        to: [recipient_email],
        subject: emailSubject,
        html: emailHtml,
        // TODO: Ajouter PDF en attachement
        // attachments: [
        //   {
        //     filename: `${documentNumber}.pdf`,
        //     content: pdfBase64,
        //   },
        // ],
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${documentTitle} envoyé à ${recipient_email}`,
        email_id: resendData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur lors de l\'envoi de l\'email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
