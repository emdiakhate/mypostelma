/**
 * Inbox Webhook Handler
 *
 * Receives webhooks from Instagram and Facebook
 * Creates conversations and messages in the unified inbox
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface InstagramMessage {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
  };
}

interface InstagramComment {
  id: string;
  from: {
    id: string;
    username: string;
  };
  media: {
    id: string;
    media_product_type: string;
  };
  text: string;
  timestamp: number;
}

serve(async (req) => {
  try {
    // Verify webhook (GET request from Meta)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const VERIFY_TOKEN = Deno.env.get('WEBHOOK_VERIFY_TOKEN') || 'postelma_inbox_2025';

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        return new Response(challenge, { status: 200 });
      } else {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Handle webhook POST
    if (req.method === 'POST') {
      const payload = await req.json();
      console.log('Received webhook:', JSON.stringify(payload, null, 2));

      // Determine platform
      const platform = payload.object === 'instagram' ? 'instagram' : 'facebook';

      // Process entries
      for (const entry of payload.entry) {
        // Handle messages (DMs)
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await handleMessage(platform, entry.id, messagingEvent);
          }
        }

        // Handle comments
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments' || change.field === 'feed') {
              await handleComment(platform, entry.id, change.value);
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
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Handle incoming message (DM)
 */
async function handleMessage(
  platform: 'instagram' | 'facebook',
  accountId: string,
  messagingEvent: InstagramMessage
) {
  try {
    const senderId = messagingEvent.sender.id;
    const recipientId = messagingEvent.recipient.id;
    const messageId = messagingEvent.message.mid;
    const messageText = messagingEvent.message.text || '';
    const timestamp = new Date(messagingEvent.timestamp);

    // Find the user who owns this social account
    const { data: socialAccount } = await supabase
      .from('social_accounts')
      .select('user_id')
      .eq('platform', platform)
      .eq('platform_account_id', recipientId)
      .single();

    if (!socialAccount) {
      console.log('Social account not found for:', recipientId);
      return;
    }

    const userId = socialAccount.user_id;

    // Get sender profile info
    const senderProfile = await fetchProfileInfo(platform, senderId);

    // Create or update conversation
    const conversationId = `${platform}_${senderId}_${recipientId}`;
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('platform_conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    let dbConversationId: string;

    if (existingConversation) {
      dbConversationId = existingConversation.id;

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          status: 'unread',
          last_message_at: timestamp.toISOString(),
          participant_name: senderProfile.name,
          participant_username: senderProfile.username,
          participant_avatar_url: senderProfile.profile_picture_url,
        })
        .eq('id', dbConversationId);
    } else {
      // Create new conversation
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          platform,
          platform_conversation_id: conversationId,
          participant_id: senderId,
          participant_username: senderProfile.username,
          participant_name: senderProfile.name,
          participant_avatar_url: senderProfile.profile_picture_url,
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
      .eq('conversation_id', dbConversationId)
      .single();

    if (existingMessage) {
      console.log('Message already exists:', messageId);
      return;
    }

    // Create message
    await supabase.from('messages').insert({
      conversation_id: dbConversationId,
      platform_message_id: messageId,
      direction: 'inbound',
      message_type: messagingEvent.message.attachments ? 'image' : 'text',
      text_content: messageText,
      media_url: messagingEvent.message.attachments?.[0]?.payload?.url,
      media_type: messagingEvent.message.attachments?.[0]?.type,
      sender_id: senderId,
      sender_username: senderProfile.username,
      sender_name: senderProfile.name,
      is_read: false,
      sent_at: timestamp.toISOString(),
    });

    console.log('Message created successfully for conversation:', dbConversationId);
  } catch (error) {
    console.error('Error handling message:', error);
    throw error;
  }
}

/**
 * Handle incoming comment
 */
async function handleComment(
  platform: 'instagram' | 'facebook',
  accountId: string,
  commentData: InstagramComment | any
) {
  try {
    const commentId = commentData.id || commentData.comment_id;
    const commentText = commentData.text || commentData.message;
    const senderId = commentData.from.id;
    const senderUsername = commentData.from.username || commentData.from.name;
    const postId = commentData.media?.id || commentData.post_id;
    const timestamp = new Date(
      commentData.timestamp ? commentData.timestamp * 1000 : commentData.created_time * 1000
    );

    // Find the user who owns this social account
    const { data: socialAccount } = await supabase
      .from('social_accounts')
      .select('user_id')
      .eq('platform', platform)
      .eq('platform_account_id', accountId)
      .single();

    if (!socialAccount) {
      console.log('Social account not found for:', accountId);
      return;
    }

    const userId = socialAccount.user_id;

    // Find the post in our database
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('platform_post_id', postId)
      .eq('platform', platform)
      .single();

    // Create or update conversation (one conversation per user per post)
    const conversationId = `${platform}_comment_${postId}_${senderId}`;
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
        })
        .eq('id', dbConversationId);
    } else {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          platform,
          platform_conversation_id: conversationId,
          participant_id: senderId,
          participant_username: senderUsername,
          participant_name: senderUsername,
          post_id: post?.id,
          platform_post_id: postId,
          status: 'unread',
          priority: 'normal',
          tags: ['comment'],
          message_count: 0,
          last_message_at: timestamp.toISOString(),
        })
        .select('id')
        .single();

      dbConversationId = newConversation!.id;
    }

    // Check if comment already exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('platform_message_id', commentId)
      .single();

    if (existingMessage) {
      console.log('Comment already exists:', commentId);
      return;
    }

    // Create message
    await supabase.from('messages').insert({
      conversation_id: dbConversationId,
      platform_message_id: commentId,
      direction: 'inbound',
      message_type: 'text',
      text_content: commentText,
      sender_id: senderId,
      sender_username: senderUsername,
      sender_name: senderUsername,
      is_read: false,
      sent_at: timestamp.toISOString(),
    });

    console.log('Comment created successfully for conversation:', dbConversationId);
  } catch (error) {
    console.error('Error handling comment:', error);
    throw error;
  }
}

/**
 * Fetch profile info from platform
 */
async function fetchProfileInfo(
  platform: 'instagram' | 'facebook',
  userId: string
): Promise<{ username: string; name: string; profile_picture_url?: string }> {
  try {
    // Get access token from social accounts
    const { data: account } = await supabase
      .from('social_accounts')
      .select('access_token')
      .eq('platform', platform)
      .single();

    if (!account?.access_token) {
      return {
        username: userId,
        name: 'Unknown User',
      };
    }

    // Fetch from Graph API
    const apiUrl =
      platform === 'instagram'
        ? `https://graph.instagram.com/${userId}?fields=username,name,profile_picture_url&access_token=${account.access_token}`
        : `https://graph.facebook.com/${userId}?fields=name&access_token=${account.access_token}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    return {
      username: data.username || data.name || userId,
      name: data.name || data.username || userId,
      profile_picture_url: data.profile_picture_url,
    };
  } catch (error) {
    console.error('Error fetching profile info:', error);
    return {
      username: userId,
      name: 'Unknown User',
    };
  }
}
