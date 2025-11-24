export interface Competitor {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  description?: string;
  website_url?: string;
  instagram_url?: string;
  instagram_followers?: string;
  facebook_url?: string;
  facebook_likes?: string;
  linkedin_url?: string;
  linkedin_followers?: string;
  twitter_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  added_at: string;
  last_analyzed_at?: string;
  analysis_count: number;
}

/**
 * Extended competitor analysis following comprehensive framework
 */
export interface CompetitorAnalysisExtended {
  id: string;
  competitor_id: string;
  analyzed_at: string;
  version: number;

  // 1. Contexte et objectifs
  context_objectives?: {
    brand_presentation?: string; // Présentation rapide de la marque
    target_audience?: string; // Cible principale
    main_offering?: string; // Offre principale
    analysis_objectives?: string[]; // Objectifs de l'analyse
  };

  // 2. Identité de marque
  brand_identity?: {
    visual_universe?: {
      logo_style?: string;
      primary_colors?: string[];
      typography?: string;
      image_style?: string;
      visual_consistency?: string; // Cohérence entre site, réseaux, supports
    };
    tone_and_messages?: {
      communication_tone?: string; // formel/fun/expert
      main_promise?: string;
      core_values?: string[];
      storytelling?: string;
    };
  };

  // 3. Analyse de l'offre et du positionnement
  offering_positioning?: {
    products_services?: {
      product_range?: string[];
      price_levels?: string; // entrée de gamme, premium, etc.
      differentiators?: string[];
      business_model?: string; // abonnement, one-shot, freemium
    };
    positioning?: {
      segment?: string; // entrée de gamme, premium, niche
      target_personas?: string[];
      value_proposition?: string;
      vs_competitors?: string;
    };
  };

  // 4. Présence digitale et marketing
  digital_presence?: {
    website?: {
      ux_quality?: number; // 1-10
      user_journey_clarity?: string;
      content_quality?: string;
      loading_speed?: string;
      seo_basics?: {
        structure?: string;
        keywords?: string[];
        has_blog?: boolean;
      };
    };
    social_media?: {
      platforms_used?: string[];
      posting_frequency?: {
        [platform: string]: string; // ex: "instagram": "2-3/jour"
      };
      engagement_metrics?: {
        [platform: string]: {
          likes_avg?: number;
          comments_avg?: number;
          shares_avg?: number;
          engagement_rate?: number;
        };
      };
      content_types?: string[];
      brand_consistency?: string;
    };
  };

  // 5. SWOT Analysis
  swot?: {
    strengths?: string[]; // Forces
    weaknesses?: string[]; // Faiblesses
    opportunities?: string[]; // Opportunités
    threats?: string[]; // Menaces
  };

  // 6. Analyse concurrentielle directe
  competitive_analysis?: {
    advantages?: string[]; // Avantages du concurrent
    disadvantages?: string[]; // Inconvénients du concurrent
    market_position?: string; // Position sur le marché
    market_share_estimate?: string;
  };

  // 7. Insights et recommandations
  insights_recommendations?: {
    key_insights?: string[]; // 3-5 insights clés
    actionable_recommendations?: {
      short_term?: string[]; // Actions court terme
      medium_term?: string[]; // Actions moyen terme
      long_term?: string[]; // Actions long terme
    };
    priority_actions?: string[];
  };

  // Données brutes (compatibilité avec l'ancien système)
  raw_data?: {
    instagram_data?: any;
    facebook_data?: any;
    linkedin_data?: any;
    twitter_data?: any;
    tiktok_data?: any;
    website_data?: any;
  };

  // Métadonnées d'analyse
  metadata?: {
    tokens_used?: number;
    analysis_cost?: number;
    data_sources?: string[];
    confidence_score?: number; // 0-100
  };
}

/**
 * My Business Profile - Pour permettre l'analyse du propre business de l'utilisateur
 */
export interface MyBusiness {
  id: string;
  user_id: string;
  business_name: string;
  industry?: string;
  description?: string;
  website_url?: string;
  instagram_url?: string;
  instagram_followers?: string;
  facebook_url?: string;
  facebook_likes?: string;
  linkedin_url?: string;
  linkedin_followers?: string;
  twitter_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  created_at: string;
  updated_at: string;
  last_analyzed_at?: string;
}

/**
 * Comparative Analysis - Comparaison entre le business de l'utilisateur et ses concurrents
 */
export interface ComparativeAnalysis {
  id: string;
  user_id: string;
  my_business_id: string;
  competitor_ids: string[];
  analysis_date: string;

  // Comparaison globale
  overall_comparison?: {
    market_position?: string; // Position par rapport aux concurrents
    strengths_vs_competitors?: string[];
    weaknesses_vs_competitors?: string[];
    opportunities_identified?: string[];
    threats_identified?: string[];
  };

  // Comparaison par domaine
  domain_comparisons?: {
    brand_identity?: { score: number; comparison: string };
    digital_presence?: { score: number; comparison: string };
    content_strategy?: { score: number; comparison: string };
    engagement?: { score: number; comparison: string };
    seo_performance?: { score: number; comparison: string };
  };

  // Recommandations personnalisées
  personalized_recommendations?: {
    quick_wins?: string[]; // Actions rapides à fort impact
    strategic_moves?: string[]; // Mouvements stratégiques
    areas_to_improve?: string[]; // Domaines à améliorer en priorité
    competitive_advantages?: string[]; // Avantages compétitifs à exploiter
  };

  // Insights basés sur les données
  data_insights?: {
    vs_market_leader?: string;
    vs_average_competitor?: string;
    growth_potential?: string;
    differentiation_opportunities?: string[];
  };
}
