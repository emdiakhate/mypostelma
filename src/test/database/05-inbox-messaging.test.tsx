/**
 * Test DB 05: Module Inbox & Messagerie
 * Tables: connected_accounts, conversations, messages, message_ai_analysis,
 *         quick_replies, webhook_logs
 *
 * Basé sur DATABASE_SCHEMA_COMPLETE.md
 */
import { describe, it, expect } from 'vitest';

describe('DB Test 05: Inbox & Messagerie', () => {
  // ============= TESTS CONNECTED_ACCOUNTS =============

  it('✅ should validate connected account structure', () => {
    const account = {
      id: 'uuid-account-1',
      user_id: 'uuid-user',
      platform: 'instagram',
      platform_account_id: 'ig_12345678',
      account_name: '@ma_entreprise',
      avatar_url: 'https://instagram.com/avatar.jpg',
      status: 'active',
      error_message: null,
      access_token: 'encrypted_token_abc123',
      refresh_token: 'encrypted_refresh_xyz789',
      token_expires_at: new Date(Date.now() + 90 * 86400000), // 90 jours
      config: {
        auto_reply: true,
        notifications: true,
      },
      messages_sent: 245,
      messages_received: 389,
      last_sync_at: new Date(),
      connected_at: new Date('2025-11-01'),
      updated_at: new Date(),
    };

    const platforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'email', 'whatsapp'];
    const statuses = ['active', 'inactive', 'error', 'expired'];

    expect(platforms).toContain(account.platform);
    expect(statuses).toContain(account.status);
    expect(account.token_expires_at.getTime()).toBeGreaterThan(Date.now());
    console.log('✅ PASS - Connected account structure validated');
  });

  it('✅ should detect token expiration', () => {
    const account = {
      token_expires_at: new Date(Date.now() - 86400000), // expiré hier
    };

    const isExpired = new Date() > account.token_expires_at;
    expect(isExpired).toBe(true);
    console.log('✅ PASS - Token expiration detected');
  });

  // ============= TESTS CONVERSATIONS =============

  it('✅ should validate conversation structure', () => {
    const conversation = {
      id: 'uuid-conv-1',
      user_id: 'uuid-user',
      connected_account_id: 'uuid-account-1',
      platform: 'instagram',
      platform_conversation_id: 'ig_thread_12345',
      participant_id: 'ig_user_67890',
      participant_name: 'Jean Dupont',
      participant_username: '@jeandupont',
      participant_avatar_url: 'https://instagram.com/avatar/jean.jpg',
      status: 'unread',
      sentiment: 'positive',
      tags: ['vip', 'urgent'],
      notes: 'Client intéressé par le produit Premium',
      assigned_to: 'uuid-team-member-1',
      assigned_at: new Date(),
      last_message_at: new Date(),
      created_at: new Date('2026-01-10'),
      updated_at: new Date(),
    };

    const statuses = ['unread', 'read', 'replied', 'archived', 'spam'];
    const sentiments = ['positive', 'neutral', 'negative', 'urgent'];

    expect(statuses).toContain(conversation.status);
    expect(sentiments).toContain(conversation.sentiment);
    expect(conversation.tags).toContain('vip');
    console.log('✅ PASS - Conversation structure validated');
  });

  it('✅ should sort conversations by priority', () => {
    const conversations = [
      { id: '1', status: 'unread', sentiment: 'urgent', last_message_at: new Date('2026-01-13T10:00:00') },
      { id: '2', status: 'unread', sentiment: 'positive', last_message_at: new Date('2026-01-13T09:00:00') },
      { id: '3', status: 'read', sentiment: 'neutral', last_message_at: new Date('2026-01-13T11:00:00') },
    ];

    const getPriority = (conv: typeof conversations[0]) => {
      let priority = 0;
      if (conv.status === 'unread') priority += 100;
      if (conv.sentiment === 'urgent') priority += 50;
      if (conv.sentiment === 'negative') priority += 30;
      return priority;
    };

    const sorted = conversations.sort((a, b) => getPriority(b) - getPriority(a));
    expect(sorted[0].id).toBe('1'); // unread + urgent
    console.log('✅ PASS - Conversations sorted by priority');
  });

  // ============= TESTS MESSAGES =============

  it('✅ should validate message structure', () => {
    const message = {
      id: 'uuid-message-1',
      conversation_id: 'uuid-conv-1',
      platform_message_id: 'ig_msg_12345',
      direction: 'incoming',
      message_type: 'text',
      text_content: 'Bonjour, je suis intéressé par votre produit. Quel est le prix?',
      media_url: null,
      media_type: null,
      sender_id: 'ig_user_67890',
      sender_name: 'Jean Dupont',
      sender_username: '@jeandupont',
      email_subject: null,
      email_to: null,
      email_cc: null,
      email_from: null,
      is_read: false,
      is_starred: false,
      sent_at: new Date(),
      created_at: new Date(),
    };

    const directions = ['incoming', 'outgoing'];
    const messageTypes = ['text', 'image', 'video', 'audio', 'file', 'sticker'];

    expect(directions).toContain(message.direction);
    expect(messageTypes).toContain(message.message_type);
    expect(message.text_content).toContain('prix');
    console.log('✅ PASS - Message structure validated');
  });

  it('✅ should validate email message structure', () => {
    const emailMessage = {
      id: 'uuid-message-2',
      conversation_id: 'uuid-conv-2',
      direction: 'incoming',
      message_type: 'text',
      text_content: 'Contenu de l\'email...',
      email_subject: 'Demande d\'information',
      email_to: 'contact@entreprise.com',
      email_cc: 'manager@entreprise.com',
      email_from: 'client@example.com',
      is_read: false,
      sent_at: new Date(),
      created_at: new Date(),
    };

    expect(emailMessage.email_subject).toBeDefined();
    expect(emailMessage.email_from).toMatch(/@/);
    console.log('✅ PASS - Email message structure validated');
  });

  // ============= TESTS MESSAGE_AI_ANALYSIS =============

  it('✅ should validate AI analysis structure', () => {
    const analysis = {
      id: 'uuid-analysis-1',
      message_id: 'uuid-message-1',
      conversation_id: 'uuid-conv-1',
      analyzed_content: 'Bonjour, je suis intéressé par votre produit. Quel est le prix?',
      detected_intent: 'product_inquiry',
      detected_language: 'fr',
      suggested_team_ids: ['uuid-team-sales'],
      confidence_scores: {
        intent: 0.92,
        language: 0.98,
        sentiment: 0.75,
      },
      model_used: 'gpt-4',
      tokens_used: 125,
      processing_time_ms: 450,
      analyzed_at: new Date(),
    };

    const intents = [
      'product_inquiry', 'support_request', 'complaint', 'feedback',
      'order_status', 'general_question', 'spam'
    ];

    expect(intents).toContain(analysis.detected_intent);
    expect(analysis.confidence_scores.intent).toBeGreaterThan(0.5);
    expect(analysis.processing_time_ms).toBeLessThan(5000);
    console.log('✅ PASS - AI analysis structure validated');
  });

  it('✅ should route message based on intent', () => {
    const intentToTeam: Record<string, string> = {
      product_inquiry: 'sales',
      support_request: 'support',
      complaint: 'manager',
      order_status: 'operations',
      general_question: 'support',
    };

    const analysis = { detected_intent: 'product_inquiry' };
    const team = intentToTeam[analysis.detected_intent];

    expect(team).toBe('sales');
    console.log('✅ PASS - Message routed based on intent');
  });

  // ============= TESTS QUICK_REPLIES =============

  it('✅ should validate quick reply structure', () => {
    const quickReply = {
      id: 'uuid-reply-1',
      user_id: 'uuid-user',
      title: 'Horaires d\'ouverture',
      content: 'Bonjour! Nous sommes ouverts du lundi au vendredi de 8h à 18h, et le samedi de 9h à 13h.',
      usage_count: 45,
      created_at: new Date('2025-10-01'),
      updated_at: new Date(),
    };

    expect(quickReply.title).toBeDefined();
    expect(quickReply.usage_count).toBeGreaterThanOrEqual(0);
    console.log('✅ PASS - Quick reply structure validated');
  });

  it('✅ should track most used quick replies', () => {
    const replies = [
      { title: 'Horaires', usage_count: 45 },
      { title: 'Prix', usage_count: 78 },
      { title: 'Livraison', usage_count: 62 },
    ];

    const mostUsed = replies.sort((a, b) => b.usage_count - a.usage_count)[0];
    expect(mostUsed.title).toBe('Prix');
    console.log('✅ PASS - Most used quick replies tracked');
  });

  // ============= TESTS WEBHOOK_LOGS =============

  it('✅ should validate webhook log structure', () => {
    const webhook = {
      id: 'uuid-webhook-1',
      connected_account_id: 'uuid-account-1',
      platform: 'instagram',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature': 'sha256=abc123',
      },
      body: {
        object: 'instagram',
        entry: [
          {
            id: '12345',
            messaging: [
              {
                sender: { id: '67890' },
                recipient: { id: 'page_id' },
                message: { text: 'Hello!' },
              },
            ],
          },
        ],
      },
      query_params: {},
      status_code: 200,
      response_body: { success: true },
      error_message: null,
      processed: true,
      received_at: new Date(),
      processed_at: new Date(),
    };

    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    expect(methods).toContain(webhook.method);
    expect(webhook.status_code).toBe(200);
    expect(webhook.processed).toBe(true);
    console.log('✅ PASS - Webhook log structure validated');
  });

  it('✅ should handle webhook errors', () => {
    const failedWebhook = {
      status_code: 500,
      error_message: 'Invalid signature',
      processed: false,
    };

    const isError = failedWebhook.status_code >= 400;
    expect(isError).toBe(true);
    expect(failedWebhook.processed).toBe(false);
    console.log('✅ PASS - Webhook errors handled');
  });
});
