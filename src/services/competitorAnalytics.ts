/**
 * Competitor Analytics Service
 *
 * Integrates with N8N workflow for competitor strategy analysis via web scraping and AI.
 * Cost: ~0.0013€ per analysis using GPT-4o-mini
 */

import { supabase } from '@/integrations/supabase/client';

const N8N_WEBHOOK_URL = 'https://srv837294.hstgr.cloud/webhook/analyze-competitor';

export interface Competitor {
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
    console.error('Error fetching competitors:', error);
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
    console.error('Error fetching competitor:', error);
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
    console.error('Error creating competitor:', error);
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
    console.error('Error updating competitor:', error);
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

  if (error) {
    console.error('Error deleting competitor:', error);
    throw error;
  }
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
    console.error('Error fetching analysis:', error);
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
    console.error('Error fetching analysis history:', error);
    throw error;
  }

  return data || [];
};

/**
 * Trigger N8N workflow to analyze competitor strategy
 * This initiates web scraping and AI analysis
 */
export const analyzeCompetitorStrategy = async (competitor: Competitor): Promise<any> => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        competitor_id: competitor.id,
        name: competitor.name,
        industry: competitor.industry,
        instagram_url: competitor.instagram_url,
        facebook_url: competitor.facebook_url,
        linkedin_url: competitor.linkedin_url,
        twitter_url: competitor.twitter_url,
        website_url: competitor.website_url,
      }),
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing competitor:', error);
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
    console.error('Error fetching competitors with analysis:', error);
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
    console.error('Error fetching competitor comparison:', error);
    throw error;
  }

  return data || [];
};
