/**
 * Twilio WhatsApp Webhook
 *
 * Receives WhatsApp messages via Twilio and stores them in unified inbox
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // Parse Twilio webhook (form-encoded)
    const formData = await req.formData();

    const messageId = formData.get('MessageSid') as string;
    const fromNumber = formData.get('From') as string; // whatsapp:+221771234567
    const toNumber = formData.get('To') as string; // whatsapp:+14155238886
    const messageBody = formData.get('Body') as string;
    const profileName = formData.get('ProfileName') as string;
    const numMedia = parseInt((formData.get('NumMedia') as string) || '0');

    console.log('Twilio WhatsApp message:', { messageId, fromNumber, toNumber, messageBody });

    // Extract clean phone number
    const cleanFrom = fromNumber.replace('whatsapp:', '');
    const cleanTo = toNumber.replace('whatsapp:', '');

    // Find connected account for this WhatsApp number
    const { data: accounts } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('platform', 'whatsapp_twilio')
      .eq('status', 'active');

    if (!accounts || accounts.length === 0) {
      console.error('No active WhatsApp Twilio account found');
      return new Response('', { status: 200 });
    }

    // Find the account that matches this toNumber
    const connectedAccount = accounts.find(
      (acc) => acc.config.whatsapp_number === toNumber || acc.config.phone_number === cleanTo
    );

    if (!connectedAccount) {
      console.error('No connected account found for number:', toNumber);
      return new Response('', { status: 200 });
    }

    // Create or get conversation
    const conversationId = `whatsapp_${cleanFrom}`;
    const participantId = cleanFrom;
    const participantName = profileName || cleanFrom;

    // Upsert conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .upsert(
        {
          user_id: connectedAccount.user_id,
          connected_account_id: connectedAccount.id,
          platform: 'whatsapp_twilio',
          platform_conversation_id: conversationId,
          participant_id: participantId,
          participant_name: participantName,
          status: 'unread',
          last_message_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,platform,platform_conversation_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return new Response('', { status: 200 });
    }

    // Check if message already exists (avoid duplicates)
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('platform_message_id', messageId)
      .single();

    if (!existingMessage) {
      // Handle media if present
      let mediaUrl = null;
      let mediaType = null;
      let messageType = 'text';

      if (numMedia > 0) {
        mediaUrl = formData.get('MediaUrl0') as string;
        mediaType = formData.get('MediaContentType0') as string;

        if (mediaType?.startsWith('image/')) {
          messageType = 'image';
        } else if (mediaType?.startsWith('video/')) {
          messageType = 'video';
        } else if (mediaType?.startsWith('audio/')) {
          messageType = 'audio';
        }
      }

      // Create message
      const { data: insertedMessage, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          platform_message_id: messageId,
          direction: 'incoming',
          message_type: messageType,
          text_content: messageBody || '',
          media_url: mediaUrl,
          media_type: mediaType,
          sender_id: participantId,
          sender_name: participantName,
          is_read: false,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (msgError) {
        console.error('Error creating message:', msgError);
      } else if (insertedMessage) {
        // Trigger AI routing asynchronously
        try {
          console.log('Triggering AI routing for WhatsApp message:', insertedMessage.id);
          supabase.functions.invoke('analyze-message-routing', {
            body: {
              conversation_id: conversation.id,
              message_id: insertedMessage.id,
            },
          }).then((response: any) => {
            if (response.error) {
              console.error('AI routing error:', response.error);
            } else {
              console.log('AI routing completed:', response.data);
            }
          }).catch((error: any) => {
            console.error('AI routing failed:', error);
          });
        } catch (routingError) {
          console.error('Error triggering AI routing:', routingError);
        }
      }
    }

    // Return TwiML response (empty = success)
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in twilio-whatsapp-webhook:', error);
    return new Response('', { status: 200 }); // Always return 200 to Twilio
  }
});
