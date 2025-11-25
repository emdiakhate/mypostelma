/**
 * Twilio WhatsApp Webhook (MVP Version)
 *
 * Setup rapide sans Facebook Business
 * Utilise un numéro Twilio temporaire
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // Parse Twilio webhook (form-encoded)
    const formData = await req.formData();

    const messageId = formData.get('MessageSid') as string;
    const fromNumber = formData.get('From') as string; // whatsapp:+221771234567
    const toNumber = formData.get('To') as string; // whatsapp:+14155238886
    const messageBody = formData.get('Body') as string;
    const numMedia = parseInt(formData.get('NumMedia') as string || '0');

    console.log('Twilio WhatsApp message:', { messageId, fromNumber, messageBody });

    // Extract clean phone number
    const cleanFrom = fromNumber.replace('whatsapp:', '');
    const cleanTo = toNumber.replace('whatsapp:', '');

    // Find user (for MVP, you can hardcode or use first user)
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!users) {
      console.log('No user found');
      return new Response('', { status: 200 });
    }

    const userId = users.id;

    // Create or update conversation
    const conversationId = `whatsapp_${cleanFrom}_${cleanTo}`;
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
          last_message_at: new Date().toISOString(),
        })
        .eq('id', dbConversationId);
    } else {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          platform: 'whatsapp',
          platform_conversation_id: conversationId,
          participant_id: cleanFrom,
          participant_name: cleanFrom,
          whatsapp_phone_number: cleanFrom,
          status: 'unread',
          priority: 'normal',
          tags: ['twilio'],
          message_count: 0,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      dbConversationId = newConversation!.id;
    }

    // Check if message exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('platform_message_id', messageId)
      .single();

    if (!existingMessage) {
      // Handle media if present
      let mediaUrl = '';
      if (numMedia > 0) {
        mediaUrl = formData.get('MediaUrl0') as string;
      }

      // Create message
      await supabase.from('messages').insert({
        conversation_id: dbConversationId,
        platform_message_id: messageId,
        direction: 'inbound',
        message_type: numMedia > 0 ? 'image' : 'text',
        text_content: messageBody,
        media_url: mediaUrl,
        sender_id: cleanFrom,
        sender_name: cleanFrom,
        is_read: false,
        sent_at: new Date().toISOString(),
      });
    }

    // Return TwiML response (empty = success)
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response('', { status: 200 }); // Always return 200 to Twilio
  }
});
