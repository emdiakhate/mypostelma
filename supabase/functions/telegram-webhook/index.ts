import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log('Telegram webhook payload:', payload);

    // Extract message info
    const message = payload.message;
    if (!message) {
      return new Response('OK', { status: 200 });
    }

    const {
      message_id,
      from,
      chat,
      date,
      text,
      photo,
      document,
      video,
    } = message;

    // Get connected account for this bot
    // Note: We need to identify which bot token this webhook is for
    // For now, we'll use a header or find by chat context
    const botId = from.id.toString();

    // Find connected account (bot)
    const { data: accounts } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('platform', 'telegram')
      .eq('status', 'active');

    if (!accounts || accounts.length === 0) {
      console.error('No active Telegram bot found');
      return new Response('OK', { status: 200 });
    }

    // For now, use the first active account
    // In production, you should use a unique webhook URL per bot
    const connectedAccount = accounts[0];

    // Determine message type and content
    let messageType = 'text';
    let textContent = text || '';
    let mediaUrl = null;
    let mediaType = null;

    if (photo && photo.length > 0) {
      messageType = 'image';
      const largestPhoto = photo[photo.length - 1];
      mediaUrl = `https://api.telegram.org/bot${connectedAccount.config.bot_token}/getFile?file_id=${largestPhoto.file_id}`;
      mediaType = 'image/jpeg';
    } else if (document) {
      messageType = 'document';
      mediaUrl = `https://api.telegram.org/bot${connectedAccount.config.bot_token}/getFile?file_id=${document.file_id}`;
      mediaType = document.mime_type;
    } else if (video) {
      messageType = 'video';
      mediaUrl = `https://api.telegram.org/bot${connectedAccount.config.bot_token}/getFile?file_id=${video.file_id}`;
      mediaType = video.mime_type;
    }

    // Create or get conversation
    const conversationId = `telegram_${chat.id}`;
    const participantId = from.id.toString();
    const participantName = `${from.first_name}${from.last_name ? ' ' + from.last_name : ''}`;
    const participantUsername = from.username || '';

    // Upsert conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .upsert(
        {
          user_id: connectedAccount.user_id,
          connected_account_id: connectedAccount.id,
          platform: 'telegram',
          platform_conversation_id: conversationId,
          participant_id: participantId,
          participant_name: participantName,
          participant_username: participantUsername,
          status: 'unread',
          last_message_at: new Date(date * 1000).toISOString(),
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
      return new Response('OK', { status: 200 });
    }

    // Insert message
    const { data: insertedMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        platform_message_id: message_id.toString(),
        direction: 'incoming',
        message_type: messageType,
        text_content: textContent,
        media_url: mediaUrl,
        media_type: mediaType,
        sender_id: participantId,
        sender_name: participantName,
        sender_username: participantUsername,
        is_read: false,
        sent_at: new Date(date * 1000).toISOString(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error creating message:', msgError);
    } else if (insertedMessage) {
      // Trigger AI routing asynchronously
      try {
        console.log('Triggering AI routing for Telegram message:', insertedMessage.id);
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

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('Error in telegram-webhook:', error);
    return new Response('OK', { status: 200 });
  }
});
