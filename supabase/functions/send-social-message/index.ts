/**
 * Send Social Message
 *
 * Sends messages/replies to Instagram, Facebook, etc.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const {
      platform,
      platform_conversation_id,
      participant_id,
      text_content,
      media_url,
      media_type,
    } = await req.json();

    console.log('Sending message:', {
      platform,
      participant_id,
      text_content,
    });

    // Get access token for this platform
    const { data: socialAccount } = await supabase
      .from('social_accounts')
      .select('access_token, platform_account_id')
      .eq('platform', platform)
      .single();

    if (!socialAccount) {
      throw new Error(`No social account found for platform: ${platform}`);
    }

    const accessToken = socialAccount.access_token;
    let platformMessageId: string;

    // Send message based on platform
    if (platform === 'instagram') {
      platformMessageId = await sendInstagramMessage(
        participant_id,
        socialAccount.platform_account_id,
        text_content,
        media_url,
        accessToken
      );
    } else if (platform === 'facebook') {
      platformMessageId = await sendFacebookMessage(
        participant_id,
        socialAccount.platform_account_id,
        text_content,
        media_url,
        accessToken
      );
    } else {
      throw new Error(`Platform not supported: ${platform}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        platform_message_id: platformMessageId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Send Instagram message
 */
async function sendInstagramMessage(
  recipientId: string,
  senderId: string,
  text: string,
  mediaUrl: string | undefined,
  accessToken: string
): Promise<string> {
  const url = `https://graph.instagram.com/v18.0/${senderId}/messages`;

  const payload: any = {
    recipient: { id: recipientId },
    message: {},
  };

  if (mediaUrl) {
    payload.message.attachment = {
      type: 'image',
      payload: {
        url: mediaUrl,
        is_reusable: true,
      },
    };
  } else {
    payload.message.text = text;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      access_token: accessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Instagram API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.message_id;
}

/**
 * Send Facebook message
 */
async function sendFacebookMessage(
  recipientId: string,
  pageId: string,
  text: string,
  mediaUrl: string | undefined,
  accessToken: string
): Promise<string> {
  const url = `https://graph.facebook.com/v18.0/${pageId}/messages`;

  const payload: any = {
    recipient: { id: recipientId },
    message: {},
  };

  if (mediaUrl) {
    payload.message.attachment = {
      type: 'image',
      payload: {
        url: mediaUrl,
        is_reusable: true,
      },
    };
  } else {
    payload.message.text = text;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      access_token: accessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Facebook API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.message_id;
}

/**
 * Reply to Instagram/Facebook comment
 */
async function replyToComment(
  platform: 'instagram' | 'facebook',
  commentId: string,
  text: string,
  accessToken: string
): Promise<string> {
  const url = `https://graph.${platform === 'instagram' ? 'instagram' : 'facebook'}.com/v18.0/${commentId}/replies`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: text,
      access_token: accessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${platform} API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.id;
}
