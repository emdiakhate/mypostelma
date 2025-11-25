/**
 * Send WhatsApp via Twilio (MVP)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || '+14155238886';

serve(async (req) => {
  try {
    const { to, message, media_url } = await req.json();

    // Twilio requires 'whatsapp:' prefix
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const fromNumber = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

    // Build request body
    const body = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message,
    });

    if (media_url) {
      body.append('MediaUrl', media_url);
    }

    // Send via Twilio API
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send WhatsApp');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: data.sid,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
