/**
 * Services CRM IA
 * Gestion des secteurs, segments, tags, leads enrichis, campagnes et tâches
 */

import { supabase } from '@/integrations/supabase/client';
import {
  CRMSector,
  CRMSegment,
  CRMTag,
  EnrichedLead,
  CRMCampaign,
  CRMTask,
  CRMLeadInteraction,
  LeadFilters,
  SectorFormData,
  SegmentFormData,
  TagFormData,
  LeadFormData,
  CampaignFormData,
  TaskFormData,
  LeadStatus,
  CRMStats,
} from '@/types/crm';

// ==============================================
// SECTEURS
// ==============================================

export class SectorService {
  /**
   * Récupère tous les secteurs de l'utilisateur
   */
  static async getSectors(userId: string): Promise<CRMSector[]> {
    const { data, error } = await supabase
      .from('crm_sectors')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    return (data || []).map(this.mapSector);
  }

  /**
   * Crée un nouveau secteur
   */
  static async createSector(
    userId: string,
    formData: SectorFormData
  ): Promise<CRMSector> {
    const { data, error } = await supabase
      .from('crm_sectors')
      .insert([{
        user_id: userId,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapSector(data);
  }

  /**
   * Met à jour un secteur
   */
  static async updateSector(
    id: string,
    formData: Partial<SectorFormData>
  ): Promise<CRMSector> {
    const { data, error } = await supabase
      .from('crm_sectors')
      .update({
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapSector(data);
  }

  /**
   * Supprime un secteur
   */
  static async deleteSector(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_sectors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapSector(data: any): CRMSector {
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}

// ==============================================
// SEGMENTS
// ==============================================

export class SegmentService {
  /**
   * Récupère tous les segments d'un secteur
   */
  static async getSegmentsBySector(sectorId: string): Promise<CRMSegment[]> {
    const { data, error } = await supabase
      .from('crm_segments')
      .select('*')
      .eq('sector_id', sectorId)
      .order('name');

    if (error) throw error;

    return (data || []).map(this.mapSegment);
  }

  /**
   * Récupère tous les segments de tous les secteurs de l'utilisateur
   */
  static async getAllSegments(userId: string): Promise<CRMSegment[]> {
    const { data, error } = await supabase
      .from('crm_segments')
      .select(`
        *,
        crm_sectors!inner(user_id)
      `)
      .eq('crm_sectors.user_id', userId)
      .order('name');

    if (error) throw error;

    return (data || []).map(this.mapSegment);
  }

  /**
   * Crée un nouveau segment
   */
  static async createSegment(formData: SegmentFormData): Promise<CRMSegment> {
    const { data, error } = await supabase
      .from('crm_segments')
      .insert([{
        sector_id: formData.sector_id,
        name: formData.name,
        description: formData.description,
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapSegment(data);
  }

  /**
   * Met à jour un segment
   */
  static async updateSegment(
    id: string,
    formData: Partial<SegmentFormData>
  ): Promise<CRMSegment> {
    const { data, error } = await supabase
      .from('crm_segments')
      .update({
        name: formData.name,
        description: formData.description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapSegment(data);
  }

  /**
   * Supprime un segment
   */
  static async deleteSegment(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_segments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapSegment(data: any): CRMSegment {
    return {
      id: data.id,
      sector_id: data.sector_id,
      name: data.name,
      description: data.description,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}

// ==============================================
// TAGS
// ==============================================

export class TagService {
  /**
   * Récupère tous les tags d'un secteur
   */
  static async getTagsBySector(sectorId: string): Promise<CRMTag[]> {
    const { data, error } = await supabase
      .from('crm_tags')
      .select('*')
      .eq('sector_id', sectorId)
      .order('name');

    if (error) throw error;

    return (data || []).map(this.mapTag);
  }

  /**
   * Récupère tous les tags de l'utilisateur
   */
  static async getAllTags(userId: string): Promise<CRMTag[]> {
    const { data, error } = await supabase
      .from('crm_tags')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    return (data || []).map(this.mapTag);
  }

  /**
   * Crée un nouveau tag
   */
  static async createTag(userId: string, formData: TagFormData): Promise<CRMTag> {
    const { data, error } = await supabase
      .from('crm_tags')
      .insert([{
        user_id: userId,
        sector_id: formData.sector_id,
        name: formData.name,
        category: formData.category,
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapTag(data);
  }

  /**
   * Supprime un tag
   */
  static async deleteTag(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapTag(data: any): CRMTag {
    return {
      id: data.id,
      sector_id: data.sector_id,
      user_id: data.user_id,
      name: data.name,
      category: data.category,
      created_at: new Date(data.created_at),
    };
  }
}

// ==============================================
// LEADS ENRICHIS
// ==============================================

export class CRMLeadService {
  /**
   * Récupère les leads avec filtres
   */
  static async getLeads(
    userId: string,
    filters?: LeadFilters
  ): Promise<EnrichedLead[]> {
    let query = supabase
      .from('leads')
      .select(`
        *,
        sector:crm_sectors(id, name, icon, color),
        segment:crm_segments(id, name)
      `)
      .eq('user_id', userId);

    // Appliquer les filtres
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters?.sector_ids && filters.sector_ids.length > 0) {
      query = query.in('sector_id', filters.sector_ids);
    }

    if (filters?.segment_ids && filters.segment_ids.length > 0) {
      query = query.in('segment_id', filters.segment_ids);
    }

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters?.cities && filters.cities.length > 0) {
      query = query.in('city', filters.cities);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters?.score_min !== undefined) {
      query = query.gte('score', filters.score_min);
    }

    if (filters?.score_max !== undefined) {
      query = query.lte('score', filters.score_max);
    }

    if (filters?.has_email) {
      query = query.not('email', 'is', null);
    }

    if (filters?.has_phone) {
      query = query.not('phone', 'is', null);
    }

    if (filters?.has_whatsapp) {
      query = query.not('whatsapp', 'is', null);
    }

    if (filters?.has_social) {
      query = query.not('social_media', 'is', null);
    }

    query = query.order('added_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(this.mapLead);
  }

  /**
   * Récupère un lead par ID
   */
  static async getLeadById(id: string): Promise<EnrichedLead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        sector:crm_sectors(id, name, icon, color),
        segment:crm_segments(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return null;
    }

    return data ? this.mapLead(data) : null;
  }

  /**
   * Crée un nouveau lead
   */
  static async createLead(
    userId: string,
    formData: LeadFormData
  ): Promise<EnrichedLead> {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        user_id: userId,
        name: formData.name,
        sector_id: formData.sector_id,
        segment_id: formData.segment_id,
        category: formData.sector_id ? 'crm' : (formData.name.split(' ')[0] || 'other'),
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        website: formData.website,
        social_media: formData.social_media,
        google_rating: formData.google_rating,
        google_reviews_count: formData.google_reviews_count,
        google_maps_url: formData.google_maps_url,
        image_url: formData.image_url,
        business_hours: formData.business_hours,
        status: formData.status || 'new',
        score: formData.score,
        notes: formData.notes || '',
        tags: formData.tags || [],
        source: formData.source || 'manual',
      }])
      .select(`
        *,
        sector:crm_sectors(id, name, icon, color),
        segment:crm_segments(id, name)
      `)
      .single();

    if (error) throw error;
    return this.mapLead(data);
  }

  /**
   * Met à jour un lead
   */
  static async updateLead(
    id: string,
    formData: Partial<LeadFormData>
  ): Promise<EnrichedLead> {
    const updateData: any = {};

    Object.keys(formData).forEach((key) => {
      const value = (formData as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Si le statut change à 'contacted', mettre à jour last_contacted_at
    if (formData.status === 'contacted') {
      updateData.last_contacted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        sector:crm_sectors(id, name, icon, color),
        segment:crm_segments(id, name)
      `)
      .single();

    if (error) throw error;
    return this.mapLead(data);
  }

  /**
   * Supprime un lead
   */
  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Met à jour le statut d'un lead
   */
  static async updateLeadStatus(
    id: string,
    status: LeadStatus
  ): Promise<EnrichedLead> {
    return this.updateLead(id, { status });
  }

  /**
   * Met à jour le score d'un lead
   */
  static async updateLeadScore(id: string, score: number): Promise<EnrichedLead> {
    return this.updateLead(id, { score });
  }

  private static mapLead(data: any): EnrichedLead {
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      category: data.category,
      sector_id: data.sector_id,
      segment_id: data.segment_id,
      sector: data.sector ? {
        id: data.sector.id,
        name: data.sector.name,
        icon: data.sector.icon,
        color: data.sector.color,
        user_id: '', // Not included in select
        created_at: new Date(),
        updated_at: new Date(),
      } : undefined,
      segment: data.segment ? {
        id: data.segment.id,
        name: data.segment.name,
        sector_id: data.sector_id,
        created_at: new Date(),
        updated_at: new Date(),
      } : undefined,
      address: data.address,
      city: data.city,
      postal_code: data.postal_code,
      google_maps_url: data.google_maps_url,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      website: data.website,
      social_media: data.social_media,
      image_url: data.image_url,
      google_rating: data.google_rating,
      google_reviews_count: data.google_reviews_count,
      business_hours: data.business_hours,
      status: data.status,
      score: data.score,
      notes: data.notes || '',
      tags: data.tags || [],
      source: data.source,
      added_at: new Date(data.added_at),
      last_contacted_at: data.last_contacted_at
        ? new Date(data.last_contacted_at)
        : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }
}

// ==============================================
// STATISTIQUES
// ==============================================

export class CRMStatsService {
  /**
   * Récupère les statistiques CRM
   */
  static async getStats(userId: string): Promise<CRMStats> {
    // Récupérer tous les leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    if (leadsError) throw leadsError;

    const total_leads = leads?.length || 0;
    const new_leads = leads?.filter((l) => l.status === 'new').length || 0;
    const contacted_leads = leads?.filter((l) => l.status === 'contacted').length || 0;
    const interested_leads = leads?.filter((l) => l.status === 'interested').length || 0;
    const qualified_leads = leads?.filter((l) => l.status === 'qualified').length || 0;
    const client_leads = leads?.filter((l) => l.status === 'client').length || 0;
    const conversion_rate =
      total_leads > 0 ? (client_leads / total_leads) * 100 : 0;

    // Stats par secteur
    const { data: sectorStats, error: sectorStatsError } = await supabase
      .from('crm_leads_by_sector')
      .select('*')
      .eq('user_id', userId);

    if (sectorStatsError) throw sectorStatsError;

    // Stats par statut
    const statusCounts: Record<LeadStatus, number> = {
      new: new_leads,
      contacted: contacted_leads,
      interested: interested_leads,
      qualified: qualified_leads,
      client: client_leads,
      not_interested: leads?.filter((l) => l.status === 'not_interested').length || 0,
      archived: leads?.filter((l) => l.status === 'archived').length || 0,
    };

    const by_status = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as LeadStatus,
      count,
      percentage: total_leads > 0 ? (count / total_leads) * 100 : 0,
    }));

    // Stats par ville
    const cityCounts: Record<string, number> = {};
    leads?.forEach((lead) => {
      if (lead.city) {
        cityCounts[lead.city] = (cityCounts[lead.city] || 0) + 1;
      }
    });

    const by_city = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Tâches
    const { data: tasks, error: tasksError } = await supabase
      .from('crm_tasks')
      .select('*')
      .eq('user_id', userId);

    if (tasksError) throw tasksError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const tasks_today =
      tasks?.filter((t) => {
        if (!t.due_date || t.status === 'completed' || t.status === 'cancelled')
          return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= today && dueDate <= todayEnd;
      }).length || 0;

    const tasks_overdue =
      tasks?.filter((t) => {
        if (!t.due_date || t.status === 'completed' || t.status === 'cancelled')
          return false;
        const dueDate = new Date(t.due_date);
        return dueDate < today;
      }).length || 0;

    const tasks_this_week =
      tasks?.filter((t) => {
        if (!t.due_date || t.status === 'completed' || t.status === 'cancelled')
          return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= today && dueDate <= weekEnd;
      }).length || 0;

    return {
      total_leads,
      new_leads,
      contacted_leads,
      interested_leads,
      qualified_leads,
      client_leads,
      conversion_rate,
      by_sector: (sectorStats || []).map((s: any) => ({
        sector_id: s.sector_id,
        sector_name: s.sector_name,
        count: s.total_leads,
        avg_score: s.avg_score || 0,
      })),
      by_status,
      by_city,
      tasks_today,
      tasks_overdue,
      tasks_this_week,
    };
  }
}
