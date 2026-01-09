/**
 * Supabase Edge Function - Send Invoice Reminders
 *
 * Fonction automatique (cron job) pour envoyer des relances
 * pour les factures en retard
 *
 * Déclenchement: Tous les jours à 9h00
 * Configuration cron dans supabase/functions/send-invoice-reminders/cron.yaml
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

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
    // Créer client Supabase Admin (pour accéder à toutes les factures)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer toutes les factures en retard
    const now = new Date();
    const { data: overdueInvoices, error: invoicesError } = await supabaseAdmin
      .from('compta_invoices')
      .select('*, client:client_id(name, email, phone)')
      .in('status', ['sent', 'partial', 'overdue'])
      .lt('due_date', now.toISOString());

    if (invoicesError) {
      throw new Error(`Error fetching invoices: ${invoicesError.message}`);
    }

    const results = {
      total: overdueInvoices?.length || 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No overdue invoices found',
          results,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Pour chaque facture en retard
    for (const invoice of overdueInvoices) {
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Règles de relance:
      // - 1ère relance à J+7
      // - 2ème relance à J+14
      // - 3ème relance à J+21
      // - Ensuite toutes les 2 semaines
      const shouldSendReminder =
        daysOverdue === 7 ||
        daysOverdue === 14 ||
        daysOverdue === 21 ||
        (daysOverdue > 21 && daysOverdue % 14 === 0);

      if (!shouldSendReminder) {
        results.skipped++;
        continue;
      }

      // Vérifier si une relance n'a pas déjà été envoyée aujourd'hui
      const { data: todaysReminders } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id')
        .eq('invoice_id', invoice.id)
        .gte('sent_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
        .limit(1);

      if (todaysReminders && todaysReminders.length > 0) {
        results.skipped++;
        results.details.push({
          invoice_number: invoice.invoice_number,
          status: 'skipped',
          reason: 'Reminder already sent today',
        });
        continue;
      }

      const client = invoice.client;
      if (!client) {
        results.skipped++;
        results.details.push({
          invoice_number: invoice.invoice_number,
          status: 'skipped',
          reason: 'No client information',
        });
        continue;
      }

      let emailSent = false;
      let whatsappSent = false;
      let reminderType = 'email';

      // Envoyer par email si disponible
      if (client.email) {
        try {
          const { error: emailError } = await supabaseAdmin.functions.invoke('send-document-email', {
            body: {
              document_type: 'invoice',
              document_id: invoice.id,
              recipient_email: client.email,
              recipient_name: client.name,
              is_reminder: true,
              days_overdue: daysOverdue,
            },
          });

          if (!emailError) {
            emailSent = true;
          } else {
            console.error(`Error sending email reminder for ${invoice.invoice_number}:`, emailError);
          }
        } catch (error) {
          console.error(`Exception sending email for ${invoice.invoice_number}:`, error);
        }
      }

      // Envoyer par WhatsApp si disponible
      if (client.phone) {
        try {
          const { error: whatsappError } = await supabaseAdmin.functions.invoke(
            'send-document-whatsapp',
            {
              body: {
                document_type: 'invoice',
                document_id: invoice.id,
                recipient_phone: client.phone,
                recipient_name: client.name,
                is_reminder: true,
                days_overdue: daysOverdue,
              },
            }
          );

          if (!whatsappError) {
            whatsappSent = true;
          } else {
            console.error(
              `Error sending WhatsApp reminder for ${invoice.invoice_number}:`,
              whatsappError
            );
          }
        } catch (error) {
          console.error(`Exception sending WhatsApp for ${invoice.invoice_number}:`, error);
        }
      }

      // Déterminer le type de relance
      if (emailSent && whatsappSent) {
        reminderType = 'both';
      } else if (whatsappSent) {
        reminderType = 'whatsapp';
      } else if (emailSent) {
        reminderType = 'email';
      }

      // Enregistrer la relance dans la DB
      if (emailSent || whatsappSent) {
        await supabaseAdmin.from('invoice_reminders').insert({
          user_id: invoice.user_id,
          invoice_id: invoice.id,
          reminder_type: reminderType,
          days_overdue: daysOverdue,
          status: 'sent',
        });

        results.sent++;
        results.details.push({
          invoice_number: invoice.invoice_number,
          client_name: client.name,
          days_overdue: daysOverdue,
          amount: invoice.balance_due,
          reminder_type: reminderType,
          status: 'sent',
        });
      } else {
        results.failed++;
        results.details.push({
          invoice_number: invoice.invoice_number,
          status: 'failed',
          reason: 'No email or phone available',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reminders processed: ${results.sent} sent, ${results.failed} failed, ${results.skipped} skipped`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in send-invoice-reminders:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur lors de l\'envoi des relances',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
