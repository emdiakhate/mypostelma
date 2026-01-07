/**
 * Send WhatsApp Message via Twilio (CRM Integration)
 * Sends WhatsApp messages to leads and logs communication history
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Parse request body
    const { lead_id, recipient, message } = await req.json();

    // Validate input
    if (!lead_id || !recipient || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: lead_id, recipient, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the lead belongs to this user
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, user_id')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lead.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - You do not have access to this lead' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create communication log entry (pending)
    const { data: logEntry, error: logError } = await supabase
      .from('communication_logs')
      .insert({
        lead_id,
        user_id: userId,
        type: 'whatsapp',
        recipient,
        message,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create communication log:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to log communication' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number for Twilio (needs whatsapp: prefix)
    const toNumber = recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`;
    const fromNumber = TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
      ? TWILIO_WHATSAPP_FROM
      : `whatsapp:${TWILIO_WHATSAPP_FROM}`;

    // Build Twilio request
    const body = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message,
    });

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // Send via Twilio
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: body.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      // Update log as failed
      await supabase
        .from('communication_logs')
        .update({
          status: 'failed',
          provider_response: twilioData,
        })
        .eq('id', logEntry.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: twilioData.message || 'Failed to send WhatsApp message',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update log as sent
    await supabase
      .from('communication_logs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_response: {
          sid: twilioData.sid,
          status: twilioData.status,
          date_sent: twilioData.date_sent,
        },
      })
      .eq('id', logEntry.id);

    console.log('WhatsApp sent successfully:', twilioData.sid);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: twilioData.sid,
        log_id: logEntry.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-whatsapp:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
