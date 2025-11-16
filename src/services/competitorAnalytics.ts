/**
 * Competitor Analytics Service
 *
 * Integrates with Apify (Instagram/Facebook/Twitter/TikTok) + Jina.ai (websites) + OpenAI for competitor strategy analysis.
 */

import { supabase } from '@/integrations/supabase/client';

// Input type (dates as strings from API/DB)
export interface CompetitorInput {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  description?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  website_url?: string;
  instagram_followers?: string;
  facebook_likes?: string;
  linkedin_followers?: string;
  added_at: string;
  last_analyzed_at?: string;
  analysis_count: number;
}

export interface CompetitorAnalysis {
  id: string;
  competitor_id: string;
  positioning?: string;
  content_strategy?: string;
  tone?: string;
  target_audience?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities_for_us?: string[];
  social_media_presence?: string;
  estimated_budget?: string;
  key_differentiators?: string[];
  recommendations?: string;
  summary?: string;
  instagram_data?: any;
  facebook_data?: any;
  linkedin_data?: any;
  twitter_data?: any;
  tiktok_data?: any;
  website_data?: any;
  analyzed_at: string;
  tokens_used?: number;
  analysis_cost?: number;
  version: number;
}

/**
 * Fetch all competitors for the current user
 */
export const getCompetitors = async (): Promise<Competitor[]> => {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .order('last_analyzed_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch a single competitor by ID
 */
export const getCompetitor = async (id: string): Promise<Competitor | null> => {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Create a new competitor
 */
export const createCompetitor = async (competitor: Omit<Competitor, 'id' | 'added_at' | 'analysis_count'>): Promise<Competitor> => {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('competitors')
    .insert({
      ...competitor,
      user_id: userData.user?.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Update a competitor
 */
export const updateCompetitor = async (id: string, updates: Partial<Competitor>): Promise<Competitor> => {
  const { data, error } = await supabase
    .from('competitors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Delete a competitor
 */
export const deleteCompetitor = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Get latest analysis for a competitor
 */
export const getLatestAnalysis = async (competitorId: string): Promise<CompetitorAnalysis | null> => {
  const { data, error } = await supabase
    .from('competitor_analysis')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * Get all analyses for a competitor (for history)
 */
export const getCompetitorAnalysisHistory = async (competitorId: string): Promise<CompetitorAnalysis[]> => {
  const { data, error } = await supabase
    .from('competitor_analysis')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('analyzed_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Trigger Apify + Jina.ai + OpenAI analysis for competitor strategy
 * This initiates web scraping via Apify (social media) and Jina.ai (websites), then AI analysis via OpenAI
 * Typically takes 1-5 minutes to complete (depending on Apify actor execution time)
 */
export const analyzeCompetitorStrategy = async (competitor: CompetitorInput): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-competitor-apify', {
      body: {
        competitor_id: competitor.id,
        name: competitor.name,
        industry: competitor.industry,
        instagram_url: competitor.instagram_url,
        facebook_url: competitor.facebook_url,
        linkedin_url: competitor.linkedin_url,
        twitter_url: competitor.twitter_url,
        tiktok_url: competitor.tiktok_url,
        website_url: competitor.website_url,
      },
    });

    if (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Analysis failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Use competitor_latest_analysis view for easy access
 */
export const getCompetitorsWithLatestAnalysis = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('competitor_latest_analysis')
    .select('*')
    .order('last_analyzed_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Use competitor_comparison view for metrics comparison
 */
export const getCompetitorComparison = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('competitor_comparison')
    .select('*')
    .order('instagram_followers', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};
