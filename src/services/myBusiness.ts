/**
 * My Business Service
 *
 * Manages the user's own business profile for competitor comparison
 */

import { supabase } from '@/integrations/supabase/client';
import type { MyBusiness, CompetitorAnalysisExtended } from '@/types/competitor';

/**
 * Get user's business profile
 */
export const getMyBusiness = async (): Promise<any> => {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('my_business' as any)
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine
    throw error;
  }

  return data;
};

/**
 * Create or update business profile
 */
export const upsertMyBusiness = async (business: Omit<MyBusiness, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<any> => {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Check if business already exists
  const existing = await getMyBusiness();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('my_business' as any)
      .update({
        ...business,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('my_business' as any)
      .insert({
        ...business,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * Delete business profile
 */
export const deleteMyBusiness = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('my_business' as any)
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Get latest analysis for my business
 */
export const getMyBusinessLatestAnalysis = async (businessId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('my_business_analysis')
    .select('*')
    .eq('business_id', businessId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

/**
 * Analyze my business (similar to competitor analysis)
 */
export const analyzeMyBusiness = async (business: any): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-my-business', {
      body: {
        business_id: business.id,
        business_name: business.business_name,
        industry: business.industry,
        instagram_url: business.instagram_url,
        facebook_url: business.facebook_url,
        linkedin_url: business.linkedin_url,
        twitter_url: business.twitter_url,
        tiktok_url: business.tiktok_url,
        website_url: business.website_url,
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
