/**
 * Inbox Service
 *
 * Handles fetching and sending messages across platforms
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Conversation,
  Message,
  QuickReply,
  ConversationWithLastMessage,
  InboxFilters,
  SendMessagePayload,
  Platform,
} from '@/types/inbox';

/**
 * Get conversations with filters
 */
export const getConversations = async (filters?: InboxFilters): Promise<ConversationWithLastMessage[]> => {
  let query = supabase
    .from('conversations_with_last_message')
    .select('*')
    .order('last_message_at', { ascending: false });

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.platform && filters.platform.length > 0) {
    query = query.in('platform', filters.platform);
  }

  if (filters?.assigned_to) {
    if (filters.assigned_to === 'me') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        query = query.eq('assigned_to', user.id);
      }
    } else if (filters.assigned_to === 'unassigned') {
      query = query.is('assigned_to', null);
    } else {
      query = query.eq('assigned_to', filters.assigned_to);
    }
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  if (filters?.sentiment && filters.sentiment.length > 0) {
    query = query.in('sentiment', filters.sentiment);
  }

  if (filters?.search) {
    query = query.or(
      `participant_name.ilike.%${filters.search}%,participant_username.ilike.%${filters.search}%,last_message_text.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Send a message (reply)
 */
export const sendMessage = async (payload: SendMessagePayload): Promise<Message> => {
  // Call the unified send-message Edge Function
  // It will handle all platforms: Gmail, Outlook, Telegram, WhatsApp, etc.
  const { data, error } = await supabase.functions.invoke('send-message', {
    body: {
      conversation_id: payload.conversation_id,
      text_content: payload.text_content,
      media_url: payload.media_url,
      media_type: payload.media_type,
    },
  });

  if (error || !data?.success) {
    throw new Error(data?.error || 'Failed to send message');
  }

  return data.message;
};

/**
 * Update conversation status
 */
export const updateConversationStatus = async (
  conversationId: string,
  status: Conversation['status']
): Promise<void> => {
  const { error } = await supabase
    .from('conversations')
    .update({ status })
    .eq('id', conversationId);

  if (error) throw error;
};

/**
 * Assign conversation to user
 */
export const assignConversation = async (
  conversationId: string,
  userId: string | null
): Promise<void> => {
  const { error } = await supabase
    .from('conversations')
    .update({
      assigned_to: userId,
      assigned_at: userId ? new Date().toISOString() : null,
    })
    .eq('id', conversationId);

  if (error) throw error;
};

/**
 * Add tags to conversation
 */
export const addConversationTags = async (
  conversationId: string,
  tags: string[]
): Promise<void> => {
  // Get current tags
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error('Conversation not found');

  const currentTags = conversation.tags || [];
  const newTags = Array.from(new Set([...currentTags, ...tags]));

  const { error } = await supabase
    .from('conversations')
    .update({ tags: newTags })
    .eq('id', conversationId);

  if (error) throw error;
};

/**
 * Remove tag from conversation
 */
export const removeConversationTag = async (
  conversationId: string,
  tag: string
): Promise<void> => {
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error('Conversation not found');

  const newTags = (conversation.tags || []).filter((t) => t !== tag);

  const { error } = await supabase
    .from('conversations')
    .update({ tags: newTags })
    .eq('id', conversationId);

  if (error) throw error;
};

/**
 * Get quick replies
 */
export const getQuickReplies = async (): Promise<QuickReply[]> => {
  const { data, error } = await supabase
    .from('quick_replies')
    .select('*')
    .order('title');

  if (error) throw error;
  return data || [];
};

/**
 * Create quick reply
 */
export const createQuickReply = async (
  quickReply: Omit<QuickReply, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count'>
): Promise<QuickReply> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('quick_replies')
    .insert({
      ...quickReply,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Use quick reply (increment usage count)
 */
export const useQuickReply = async (quickReplyId: string): Promise<void> => {
  const { error } = await supabase.rpc('increment_quick_reply_usage', {
    reply_id: quickReplyId,
  });

  if (error) throw error;
};

/**
 * Get inbox stats
 */
export const getInboxStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('inbox_stats')
    .select('*')
    .eq('user_id', user?.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return data || {
    unread_count: 0,
    read_count: 0,
    unassigned_count: 0,
    avg_response_time_minutes: 0,
    negative_sentiment_count: 0,
  };
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'read' })
    .eq('id', conversationId)
    .eq('status', 'unread'); // Only update if currently unread

  if (error) throw error;

  // Mark all messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false);
};

/**
 * Subscribe to new messages (realtime)
 */
export const subscribeToConversations = (
  userId: string,
  onNewMessage: (conversation: Conversation) => void
) => {
  const channel = supabase
    .channel('conversations-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Conversation);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Conversation);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
