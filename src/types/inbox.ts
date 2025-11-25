/**
 * Types for Unified Inbox
 */

export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'whatsapp';

export type ConversationStatus = 'unread' | 'read' | 'replied' | 'archived' | 'snoozed';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'story_reply' | 'story_mention';

export interface Conversation {
  id: string;
  user_id: string;

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
