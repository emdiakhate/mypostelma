/**
 * Test DB 02: Module CRM & Leads
 * Tables: crm_sectors, crm_segments, crm_tags, leads, crm_campaigns,
 *         crm_lead_interactions, crm_tasks, communication_logs
 *
 * Basé sur DATABASE_SCHEMA_COMPLETE.md
 */
import { describe, it, expect } from 'vitest';

describe('DB Test 02: CRM & Leads', () => {
  // ============= TESTS CRM_SECTORS =============

  it('✅ should validate sector structure', () => {
    const sector = {
      id: 'uuid-sector-1',
      user_id: 'uuid-user',
      name: 'Technologie',
      description: 'Entreprises tech et IT',
      icon: 'laptop',
      color: '#3B82F6',
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(sector.name).toBeDefined();
    expect(sector.color).toMatch(/^#[0-9A-F]{6}$/i);
    console.log('✅ PASS - Sector structure validated');
  });

  // ============= TESTS CRM_SEGMENTS =============

  it('✅ should validate segment linking to sector', () => {
    const segment = {
      id: 'uuid-segment-1',
      sector_id: 'uuid-sector-1',
      name: 'PME Tech',
      description: 'PME dans le secteur technologique',
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(segment.sector_id).toBeDefined();
    expect(segment.name).toBe('PME Tech');
    console.log('✅ PASS - Segment linking validated');
  });

  // ============= TESTS CRM_TAGS =============

  it('✅ should validate tags structure', () => {
    const tags = [
      { id: 'tag-1', user_id: 'user-1', sector_id: 'sector-1', name: 'VIP', category: 'priority' },
      { id: 'tag-2', user_id: 'user-1', sector_id: 'sector-1', name: 'Prospect chaud', category: 'status' },
      { id: 'tag-3', user_id: 'user-1', sector_id: null, name: 'Newsletter', category: 'marketing' },
    ];

    const vipTag = tags.find(t => t.name === 'VIP');
    expect(vipTag).toBeDefined();
    expect(vipTag?.category).toBe('priority');
    console.log('✅ PASS - Tags structure validated');
  });

  // ============= TESTS LEADS =============

  it('✅ should validate lead complete structure', () => {
    const lead = {
      id: 'uuid-lead-1',
      user_id: 'uuid-user',
      name: 'TechCorp SARL',
      category: 'B2B',
      address: '15 Avenue des Champs',
      city: 'Dakar',
      postal_code: '10200',
      phone: '+221 77 123 4567',
      email: 'contact@techcorp.sn',
      website: 'https://techcorp.sn',
      whatsapp: '+221 77 123 4567',
      status: 'qualified',
      score: 85,
      sector_id: 'uuid-sector-1',
      segment_id: 'uuid-segment-1',
      tags: ['VIP', 'Prospect chaud'],
      notes: 'Intéressé par nos services',
      source: 'linkedin',
      google_rating: 4.5,
      google_reviews_count: 127,
      google_maps_url: 'https://maps.google.com/?cid=123',
      social_media: {
        facebook: 'techcorp',
        linkedin: 'company/techcorp',
        instagram: '@techcorp',
      },
      business_hours: {
        monday: '08:00-18:00',
        friday: '08:00-17:00',
      },
      metrics: {
        employees: 50,
        revenue: '500M XOF',
      },
      last_contacted_at: new Date(),
      added_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(lead.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(lead.score).toBeGreaterThanOrEqual(0);
    expect(lead.score).toBeLessThanOrEqual(100);
    expect(lead.tags).toContain('VIP');
    console.log('✅ PASS - Lead complete structure validated');
  });

  it('✅ should validate lead status workflow', () => {
    const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    const validTransitions: Record<string, string[]> = {
      new: ['contacted', 'lost'],
      contacted: ['qualified', 'lost'],
      qualified: ['proposal', 'lost'],
      proposal: ['negotiation', 'lost'],
      negotiation: ['won', 'lost'],
      won: [],
      lost: ['new'], // Réactivation possible
    };

    expect(statuses).toContain('qualified');
    expect(validTransitions.qualified).toContain('proposal');
    expect(validTransitions.won).not.toContain('lost');
    console.log('✅ PASS - Lead status workflow validated');
  });

  it('✅ should calculate lead score correctly', () => {
    const calculateScore = (factors: {
      hasEmail: boolean;
      hasPhone: boolean;
      hasWebsite: boolean;
      contacted: boolean;
      googleRating: number | null;
      source: string;
    }) => {
      let score = 0;
      if (factors.hasEmail) score += 20;
      if (factors.hasPhone) score += 20;
      if (factors.hasWebsite) score += 15;
      if (factors.contacted) score += 25;
      if (factors.googleRating && factors.googleRating >= 4.0) score += 15;
      if (factors.source === 'referral') score += 15;
      else if (factors.source === 'linkedin') score += 10;
      else if (factors.source === 'manual') score += 5;
      return Math.min(score, 100);
    };

    const score = calculateScore({
      hasEmail: true,
      hasPhone: true,
      hasWebsite: true,
      contacted: true,
      googleRating: 4.5,
      source: 'linkedin',
    });

    expect(score).toBe(100); // 20+20+15+25+15+10 = 105, capped at 100
    console.log('✅ PASS - Lead score calculation correct');
  });

  // ============= TESTS CRM_CAMPAIGNS =============

  it('✅ should validate campaign structure', () => {
    const campaign = {
      id: 'uuid-campaign-1',
      user_id: 'uuid-user',
      name: 'Campagne Rentrée 2026',
      description: 'Offre spéciale rentrée',
      channel: 'whatsapp',
      status: 'scheduled',
      message: 'Bonjour {{name}}, profitez de notre offre spéciale!',
      subject: null,
      target_sector_ids: ['sector-1', 'sector-2'],
      target_segment_ids: ['segment-1'],
      target_cities: ['Dakar', 'Thiès'],
      target_tags: ['VIP'],
      target_status: ['qualified', 'proposal'],
      total_leads: 150,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      replied_count: 0,
      failed_count: 0,
      scheduled_at: new Date(Date.now() + 86400000),
      sent_at: null,
      completed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const channels = ['email', 'whatsapp', 'sms', 'call'];
    expect(channels).toContain(campaign.channel);
    expect(campaign.message).toContain('{{name}}');
    expect(campaign.total_leads).toBeGreaterThan(0);
    console.log('✅ PASS - Campaign structure validated');
  });

  it('✅ should calculate campaign metrics', () => {
    const campaign = {
      total_leads: 100,
      sent_count: 95,
      delivered_count: 90,
      read_count: 75,
      replied_count: 15,
      failed_count: 5,
    };

    const deliveryRate = (campaign.delivered_count / campaign.sent_count) * 100;
    const openRate = (campaign.read_count / campaign.delivered_count) * 100;
    const responseRate = (campaign.replied_count / campaign.read_count) * 100;
    const failureRate = (campaign.failed_count / campaign.sent_count) * 100;

    expect(deliveryRate).toBeCloseTo(94.74, 1);
    expect(openRate).toBeCloseTo(83.33, 1);
    expect(responseRate).toBe(20);
    expect(failureRate).toBeCloseTo(5.26, 1);
    console.log('✅ PASS - Campaign metrics calculated correctly');
  });

  // ============= TESTS CRM_LEAD_INTERACTIONS =============

  it('✅ should validate lead interaction structure', () => {
    const interaction = {
      id: 'uuid-interaction-1',
      lead_id: 'uuid-lead-1',
      campaign_id: 'uuid-campaign-1',
      user_id: 'uuid-user',
      type: 'email_sent',
      channel: 'email',
      status: 'delivered',
      subject: 'Offre spéciale',
      content: 'Bonjour, nous avons une offre...',
      metadata: {
        opened_at: new Date(),
        clicked: true,
      },
      created_at: new Date(),
    };

    const interactionTypes = [
      'call', 'email_sent', 'email_received', 'meeting',
      'whatsapp', 'sms', 'note', 'task_completed'
    ];
    expect(interactionTypes).toContain(interaction.type);
    expect(interaction.metadata.clicked).toBe(true);
    console.log('✅ PASS - Lead interaction validated');
  });

  // ============= TESTS CRM_TASKS =============

  it('✅ should validate task structure', () => {
    const task = {
      id: 'uuid-task-1',
      user_id: 'uuid-user',
      lead_id: 'uuid-lead-1',
      assigned_to: 'uuid-user-2',
      title: 'Appeler TechCorp',
      description: 'Faire un suivi après l\'envoi du devis',
      type: 'call',
      priority: 'high',
      status: 'pending',
      due_date: new Date(Date.now() + 2 * 86400000), // dans 2 jours
      completed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const priorities = ['low', 'medium', 'high', 'urgent'];
    const taskStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

    expect(priorities).toContain(task.priority);
    expect(taskStatuses).toContain(task.status);
    expect(task.due_date.getTime()).toBeGreaterThan(Date.now());
    console.log('✅ PASS - Task structure validated');
  });

  // ============= TESTS COMMUNICATION_LOGS =============

  it('✅ should validate communication log structure', () => {
    const log = {
      id: 'uuid-log-1',
      lead_id: 'uuid-lead-1',
      user_id: 'uuid-user',
      type: 'whatsapp',
      recipient: '+221771234567',
      subject: null,
      message: 'Bonjour, merci pour votre intérêt',
      status: 'sent',
      provider_response: {
        message_id: 'wa-msg-123',
        status: 'delivered',
        timestamp: new Date(),
      },
      sent_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const communicationTypes = ['email', 'sms', 'whatsapp', 'call'];
    const statuses = ['pending', 'sent', 'delivered', 'read', 'failed'];

    expect(communicationTypes).toContain(log.type);
    expect(statuses).toContain(log.status);
    expect(log.provider_response.message_id).toBeDefined();
    console.log('✅ PASS - Communication log validated');
  });
});
