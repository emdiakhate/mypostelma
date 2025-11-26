/**
 * Types for Unified Inbox
 */

export type Platform =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'whatsapp_twilio'
  | 'gmail'
  | 'outlook'
  | 'telegram';

export type ConversationStatus = 'unread' | 'read' | 'replied' | 'archived' | 'snoozed';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type MessageDirection = 'incoming' | 'outgoing';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'story_reply' | 'story_mention';

export interface Conversation {
  id: string;
  user_id: string;
  connected_account_id?: string;

  // External identifiers
  platform: Platform;
  platform_conversation_id: string;

  // Participant info
  participant_id: string;
  participant_username?: string;
  participant_name?: string;
  participant_avatar_url?: string;

  // Context
  post_id?: string;
  platform_post_id?: string;

  // Status
  status: ConversationStatus;
  priority: Priority;
  sentiment?: Sentiment;

  // Assignment
  assigned_to?: string;
  assigned_at?: string;

  // Tags
  tags: string[];

  // Teams (AI routing)
  teams?: Array<{
    team_id: string;
    team_name: string;
    team_color: string;
    auto_assigned: boolean;
    confidence_score?: number;
  }>;

  // Metrics
  message_count: number;
  last_message_at: string;
  last_customer_message_at?: string;
  last_brand_reply_at?: string;
  first_response_time_minutes?: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;

  // External identifier
  platform_message_id: string;

  // Direction
  direction: MessageDirection;

  // Content
  message_type: MessageType;
  text_content?: string;
  media_url?: string;
  media_type?: string;

  // Metadata
  sender_id: string;
  sender_username?: string;
  sender_name?: string;

  // If sent from Postelma
  sent_by_user_id?: string;

  // State
  is_read: boolean;
  is_hidden: boolean;

  // Timestamps
  sent_at: string;
  created_at: string;
}

export interface QuickReply {
  id: string;
  user_id: string;

  title: string;
  content: string;
  shortcut?: string;

  // Category
  category?: string;

  // Platforms
  platforms?: Platform[];

  // Metrics
  usage_count: number;

  created_at: string;
  updated_at: string;
}

export interface ConversationNote {
  id: string;
  conversation_id: string;
  user_id: string;

  note_text: string;

  created_at: string;
  updated_at: string;
}

export interface ConversationWithLastMessage extends Conversation {
  last_message_text?: string;
  last_message_sender?: string;
  last_message_direction?: MessageDirection;
}

export interface InboxStats {
  user_id: string;
  unread_count: number;
  read_count: number;
  unassigned_count: number;
  avg_response_time_minutes?: number;
  negative_sentiment_count: number;
}

// Filters for inbox
export interface InboxFilters {
  status?: ConversationStatus[];
  platform?: Platform[];
  assigned_to?: string | 'me' | 'unassigned';
  tags?: string[];
  sentiment?: Sentiment[];
  search?: string; // Search in participant name/username or message content
}

// For creating a new message (sending a reply)
export interface SendMessagePayload {
  conversation_id: string;
  text_content: string;
  media_url?: string;
  media_type?: string;
}

// Webhook payloads from platforms
export interface InstagramWebhookPayload {
  object: 'instagram';
  entry: Array<{
    id: string; // Instagram account ID
    time: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload: { url: string };
        }>;
      };
    }>;
    changes?: Array<{
      field: 'comments' | 'mentions';
      value: {
        id: string; // Comment/Mention ID
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
      };
    }>;
  }>;
}

export interface FacebookWebhookPayload {
  object: 'page';
  entry: Array<{
    id: string; // Page ID
    time: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload: { url: string };
        }>;
      };
    }>;
    changes?: Array<{
      field: 'feed';
      value: {
        item: 'comment';
        comment_id: string;
        post_id: string;
        from: {
          id: string;
          name: string;
        };
        message: string;
        created_time: number;
      };
    }>;
  }>;
}

// =====================================================
// CONNECTED ACCOUNTS
// =====================================================

export type AccountStatus = 'active' | 'disconnected' | 'error' | 'pending';

export interface ConnectedAccount {
  id: string;
  user_id: string;

  // Platform info
  platform: Platform;
  platform_account_id: string; // Email, phone number, bot token, etc.
  account_name?: string; // Display name
  avatar_url?: string;

  // Connection status
  status: AccountStatus;
  error_message?: string;

  // OAuth tokens (for Gmail, Outlook)
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;

  // Platform-specific config
  config: Record<string, any>;

  // Metrics
  messages_received: number;
  messages_sent: number;
  last_sync_at?: string;

  // Timestamps
  connected_at: string;
  updated_at: string;
}

export interface ConnectedAccountWithStats extends ConnectedAccount {
  active_conversations: number;
  unread_conversations: number;
}

// Config types for different platforms
export interface GmailConfig {
  email: string;
  refresh_token: string;
  watch_history_id?: string; // For Gmail push notifications
}

export interface OutlookConfig {
  email: string;
  refresh_token: string;
  subscription_id?: string; // For Outlook webhooks
}

export interface TelegramConfig {
  bot_token: string;
  bot_username: string;
  webhook_url?: string;
}

export interface WhatsAppTwilioConfig {
  account_sid: string;
  auth_token: string;
  phone_number: string; // Format: +221771234567
  whatsapp_number: string; // Format: whatsapp:+221771234567
}

// Platform-specific webhook payloads
export interface TelegramWebhookPayload {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
      title?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    date: number;
    text?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      file_size: number;
      width: number;
      height: number;
    }>;
    document?: {
      file_id: string;
      file_unique_id: string;
      file_name?: string;
      mime_type?: string;
      file_size: number;
    };
    video?: {
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      duration: number;
      mime_type?: string;
      file_size: number;
    };
  };
}

export interface TwilioWhatsAppWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string; // Format: whatsapp:+221771234567
  To: string; // Format: whatsapp:+221771234567
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
  WaId?: string; // WhatsApp ID
  SmsStatus: 'received' | 'sent' | 'delivered' | 'failed';
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    parts?: Array<{
      mimeType: string;
      body: {
        size: number;
        data?: string; // Base64 encoded
      };
    }>;
    body?: {
      size: number;
      data?: string; // Base64 encoded
    };
  };
  internalDate: string;
}

export interface OutlookMessage {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: 'text' | 'html';
    content: string;
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  receivedDateTime: string;
  isRead: boolean;
}

// Connection request payloads
export interface ConnectGmailPayload {
  code: string; // OAuth authorization code
  redirect_uri: string;
}

export interface ConnectOutlookPayload {
  code: string; // OAuth authorization code
  redirect_uri: string;
}

export interface ConnectTelegramPayload {
  bot_token: string;
}

export interface ConnectWhatsAppTwilioPayload {
  account_sid: string;
  auth_token: string;
  phone_number: string;
}

// Send message payloads for different platforms
export interface SendEmailPayload {
  conversation_id: string;
  to: string;
  subject: string;
  body: string;
  body_html?: string;
  reply_to_message_id?: string; // For threading
}

export interface SendTelegramPayload {
  conversation_id: string;
  chat_id: number | string;
  text: string;
  photo_url?: string;
  document_url?: string;
  video_url?: string;
}

export interface SendWhatsAppPayload {
  conversation_id: string;
  to: string; // Format: whatsapp:+221771234567
  body: string;
  media_url?: string;
}
