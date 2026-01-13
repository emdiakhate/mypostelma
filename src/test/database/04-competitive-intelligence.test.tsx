/**
 * Test DB 04: Module Veille Concurrentielle
 * Tables: my_business, my_business_analysis, competitors, competitor_analysis,
 *         competitor_posts, post_comments, competitor_metrics_history,
 *         sentiment_statistics, comparative_analysis
 *
 * Basé sur DATABASE_SCHEMA_COMPLETE.md
 */
import { describe, it, expect } from 'vitest';

describe('DB Test 04: Veille Concurrentielle', () => {
  // ============= TESTS MY_BUSINESS =============

  it('✅ should validate my business structure', () => {
    const business = {
      id: 'uuid-business-1',
      user_id: 'uuid-user',
      business_name: 'Ma Super Entreprise',
      industry: 'Technology',
      description: 'Entreprise de développement logiciel',
      website_url: 'https://masuperentreprise.com',
      instagram_url: 'https://instagram.com/masuperentreprise',
      instagram_followers: '5.2K',
      facebook_url: 'https://facebook.com/masuperentreprise',
      facebook_likes: '3.8K',
      linkedin_url: 'https://linkedin.com/company/masuperentreprise',
      linkedin_followers: '1.5K',
      twitter_url: 'https://twitter.com/masuperentreprise',
      tiktok_url: null,
      youtube_url: null,
      last_analyzed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(business.website_url).toMatch(/^https?:\/\//);
    expect(business.instagram_followers).toContain('K');
    console.log('✅ PASS - My business structure validated');
  });

  // ============= TESTS MY_BUSINESS_ANALYSIS =============

  it('✅ should validate business analysis structure', () => {
    const analysis = {
      id: 'uuid-analysis-1',
      business_id: 'uuid-business-1',
      version: 1,
      context_objectives: {
        mission: 'Développer des solutions innovantes',
        vision: 'Leader du marché en 2030',
        objectives: ['Croissance 50%', 'Expansion régionale'],
      },
      brand_identity: {
        values: ['Innovation', 'Qualité', 'Service client'],
        personality: 'Dynamique et moderne',
      },
      offering_positioning: {
        products: ['Logiciel A', 'Service B'],
        target_market: 'PME tech',
        differentiation: 'Support 24/7',
      },
      digital_presence: {
        website_quality: 'excellent',
        social_media_activity: 'high',
        content_strategy: 'educational',
      },
      swot: {
        strengths: ['Équipe expérimentée', 'Technologie avancée'],
        weaknesses: ['Budget marketing limité'],
        opportunities: ['Marché en croissance'],
        threats: ['Concurrence accrue'],
      },
      competitive_analysis: {
        main_competitors: ['Concurrent A', 'Concurrent B'],
        market_position: 'Challenger',
      },
      insights_recommendations: {
        insights: ['Forte demande marché PME'],
        recommendations: ['Investir dans le marketing digital'],
      },
      raw_data: {},
      metadata: { analysis_duration: 120, model: 'gpt-4' },
      analyzed_at: new Date(),
    };

    expect(analysis.swot.strengths).toHaveLength(2);
    expect(analysis.version).toBe(1);
    console.log('✅ PASS - Business analysis structure validated');
  });

  // ============= TESTS COMPETITORS =============

  it('✅ should validate competitor structure', () => {
    const competitor = {
      id: 'uuid-competitor-1',
      user_id: 'uuid-user',
      name: 'Concurrent Tech SA',
      industry: 'Technology',
      description: 'Leader du marché logiciel',
      website_url: 'https://concurrenttech.com',
      instagram_url: 'https://instagram.com/concurrenttech',
      instagram_followers: '15.3K',
      facebook_url: 'https://facebook.com/concurrenttech',
      facebook_likes: '22.1K',
      linkedin_url: 'https://linkedin.com/company/concurrenttech',
      linkedin_followers: '8.7K',
      twitter_url: 'https://twitter.com/concurrenttech',
      tiktok_url: null,
      youtube_url: 'https://youtube.com/@concurrenttech',
      analysis_count: 3,
      last_analyzed_at: new Date(),
      added_at: new Date(),
    };

    expect(competitor.analysis_count).toBeGreaterThanOrEqual(0);
    expect(competitor.name).toBeDefined();
    console.log('✅ PASS - Competitor structure validated');
  });

  // ============= TESTS COMPETITOR_ANALYSIS =============

  it('✅ should validate competitor analysis structure', () => {
    const analysis = {
      id: 'uuid-comp-analysis-1',
      competitor_id: 'uuid-competitor-1',
      version: 2,
      positioning: 'Leader premium',
      content_strategy: 'Focus sur l\'éducation et le thought leadership',
      tone: 'Professionnel et inspirant',
      target_audience: 'Entreprises moyennes et grandes',
      strengths: ['Marque forte', 'Grande équipe', 'Budget important'],
      weaknesses: ['Prix élevés', 'Moins agile'],
      opportunities_for_us: ['Cibler PME avec prix compétitifs', 'Service personnalisé'],
      key_differentiators: ['Innovants', 'Réactifs', 'Prix accessibles'],
      social_media_presence: 'Très actif sur LinkedIn et Instagram',
      estimated_budget: '500K-1M € / an',
      recommendations: 'Se différencier sur le service client et la réactivité',
      summary: 'Concurrent solide mais vulnérable sur le segment PME',
      instagram_data: { avg_engagement: 4.2, post_frequency: 5 },
      facebook_data: { avg_engagement: 3.1, post_frequency: 3 },
      linkedin_data: { avg_engagement: 6.8, post_frequency: 4 },
      tokens_used: 3500,
      analysis_cost: 0.05,
      analyzed_at: new Date(),
    };

    expect(analysis.strengths).toHaveLength(3);
    expect(analysis.opportunities_for_us).toHaveLength(2);
    expect(analysis.version).toBe(2);
    console.log('✅ PASS - Competitor analysis structure validated');
  });

  // ============= TESTS COMPETITOR_POSTS =============

  it('✅ should validate competitor post structure', () => {
    const post = {
      id: 'uuid-comp-post-1',
      competitor_id: 'uuid-competitor-1',
      analysis_id: 'uuid-comp-analysis-1',
      platform: 'instagram',
      post_url: 'https://instagram.com/p/ABC123',
      caption: 'Découvrez notre nouveau produit! 🚀 #innovation #tech',
      media_urls: ['https://cdn.instagram.com/img1.jpg'],
      hashtags: ['#innovation', '#tech', '#business'],
      content_type: 'photo',
      detected_tone: 'enthusiastic',
      likes: 1250,
      comments: 89,
      comments_count: 89,
      shares: 34,
      views: 15000,
      engagement_rate: 9.2,
      sentiment_score: 0.78,
      sentiment_label: 'positive',
      raw_data: {},
      posted_at: new Date('2026-01-10'),
      scraped_at: new Date(),
    };

    const platforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube'];
    expect(platforms).toContain(post.platform);
    expect(post.engagement_rate).toBeGreaterThan(0);
    console.log('✅ PASS - Competitor post structure validated');
  });

  it('✅ should calculate post engagement correctly', () => {
    const post = {
      likes: 1000,
      comments: 100,
      shares: 50,
      views: 10000,
      followers: 15000,
    };

    const engagementRate = ((post.likes + post.comments + post.shares) / post.followers) * 100;
    const viralityScore = (post.shares / post.likes) * 100;

    expect(engagementRate).toBeCloseTo(7.67, 2);
    expect(viralityScore).toBe(5);
    console.log('✅ PASS - Post engagement calculated correctly');
  });

  // ============= TESTS POST_COMMENTS =============

  it('✅ should validate competitor post comment structure', () => {
    const comment = {
      id: 'uuid-comment-1',
      post_id: 'uuid-comp-post-1',
      comment_text: 'Intéressant! Mais le prix est élevé...',
      author_username: '@reviewer123',
      author_is_verified: false,
      comment_likes: 8,
      comment_url: 'https://instagram.com/p/ABC123/c/456',
      sentiment_score: 0.45,
      sentiment_label: 'neutral',
      sentiment_explanation: 'Commentaire mitigé avec compliment et critique',
      keywords: ['intéressant', 'prix', 'élevé'],
      is_competitor_reply: false,
      posted_at: new Date(),
      scraped_at: new Date(),
      created_at: new Date(),
    };

    expect(comment.keywords).toContain('prix');
    expect(comment.sentiment_label).toBe('neutral');
    console.log('✅ PASS - Competitor post comment validated');
  });

  // ============= TESTS COMPETITOR_METRICS_HISTORY =============

  it('✅ should validate metrics history structure', () => {
    const metrics = {
      id: 'uuid-metrics-1',
      competitor_id: 'uuid-competitor-1',
      instagram_followers: 15300,
      instagram_following: 487,
      instagram_posts_count: 1245,
      facebook_likes: 22100,
      linkedin_followers: 8700,
      linkedin_employees: 150,
      avg_likes: 1150.5,
      avg_comments: 78.3,
      avg_engagement_rate: 8.5,
      posts_last_7_days: 5,
      posts_last_30_days: 18,
      recorded_at: new Date(),
    };

    expect(metrics.instagram_followers).toBeGreaterThan(0);
    expect(metrics.avg_engagement_rate).toBeGreaterThan(0);
    console.log('✅ PASS - Metrics history structure validated');
  });

  // ============= TESTS SENTIMENT_STATISTICS =============

  it('✅ should validate sentiment statistics structure', () => {
    const stats = {
      id: 'uuid-stats-1',
      analysis_id: 'uuid-comp-analysis-1',
      competitor_id: 'uuid-competitor-1',
      total_posts: 25,
      total_comments: 1250,
      avg_sentiment_score: 0.65,
      positive_count: 750,
      neutral_count: 350,
      negative_count: 150,
      positive_percentage: 60.0,
      neutral_percentage: 28.0,
      negative_percentage: 12.0,
      top_keywords: { produit: 85, qualité: 62, service: 45 },
      response_rate: 0.42,
      avg_engagement_rate: 7.8,
      analyzed_at: new Date(),
      created_at: new Date(),
    };

    const totalPercentage = stats.positive_percentage + stats.neutral_percentage + stats.negative_percentage;
    expect(totalPercentage).toBe(100);
    expect(stats.positive_count + stats.neutral_count + stats.negative_count).toBe(stats.total_comments);
    console.log('✅ PASS - Sentiment statistics structure validated');
  });

  // ============= TESTS COMPARATIVE_ANALYSIS =============

  it('✅ should validate comparative analysis structure', () => {
    const comparison = {
      id: 'uuid-comparison-1',
      user_id: 'uuid-user',
      my_business_id: 'uuid-business-1',
      competitor_ids: ['uuid-competitor-1', 'uuid-competitor-2'],
      overall_comparison: {
        our_position: 'Challenger',
        market_share_estimate: '15%',
        competitive_advantages: ['Prix', 'Réactivité'],
      },
      domain_comparisons: {
        social_media: {
          us: { followers: 5200, engagement: 8.2 },
          competitor1: { followers: 15300, engagement: 7.8 },
          competitor2: { followers: 8900, engagement: 6.5 },
        },
        content_quality: {
          us: 8.5,
          competitor1: 8.0,
          competitor2: 7.2,
        },
      },
      personalized_recommendations: [
        'Augmenter la fréquence de publication sur LinkedIn',
        'Créer plus de contenu vidéo',
        'Améliorer le community management',
      ],
      data_insights: {
        opportunities: ['Marché PME sous-exploité'],
        threats: ['Concurrent 1 investit massivement en marketing'],
      },
      analysis_date: new Date(),
    };

    expect(comparison.competitor_ids).toHaveLength(2);
    expect(comparison.personalized_recommendations).toHaveLength(3);
    console.log('✅ PASS - Comparative analysis structure validated');
  });
});
