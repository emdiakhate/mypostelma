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

  private static mapSector(row: any): CRMSector {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

// ==============================================
// SEGMENTS
// ==============================================

export class SegmentService {
  static async getSegmentsBySector(sectorId: string): Promise<CRMSegment[]> {
    const { data, error } = await supabase
      .from('crm_segments')
      .select('*')
      .eq('sector_id', sectorId)
      .order('name');

    if (error) throw error;
    return (data || []).map(this.mapSegment);
  }

  static async getAllSegments(userId: string): Promise<CRMSegment[]> {
    const { data, error } = await supabase
      .from('crm_segments')
      .select(`
        *,
        sector:crm_sectors!inner(user_id)
      `)
      .eq('sector.user_id', userId)
      .order('name');

    if (error) throw error;
    return (data || []).map(this.mapSegment);
  }

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

  static async deleteSegment(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_segments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapSegment(row: any): CRMSegment {
    return {
      id: row.id,
      sector_id: row.sector_id,
      name: row.name,
      description: row.description,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

// ==============================================
// TAGS
// ==============================================

export class TagService {
  static async getTagsBySector(sectorId: string): Promise<CRMTag[]> {
    const { data, error } = await supabase
      .from('crm_tags')
      .select('*')
      .eq('sector_id', sectorId)
      .order('name');

    if (error) throw error;
    return (data || []).map(this.mapTag);
  }

  static async getAllTags(userId: string): Promise<CRMTag[]> {
    const { data, error } = await supabase
      .from('crm_tags')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return (data || []).map(this.mapTag);
  }

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

  static async deleteTag(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapTag(row: any): CRMTag {
    return {
      id: row.id,
      sector_id: row.sector_id,
      user_id: row.user_id,
      name: row.name,
      category: row.category,
      created_at: new Date(row.created_at),
    };
  }
}

// ==============================================
// LEADS ENRICHIS
// ==============================================

export class CRMLeadService {
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

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    if (filters?.sector_ids && filters.sector_ids.length > 0) {
      query = query.in('sector_id', filters.sector_ids);
    }

    if (filters?.segment_ids && filters.segment_ids.length > 0) {
      query = query.in('segment_id', filters.segment_ids);
    }

    if (filters?.cities && filters.cities.length > 0) {
      query = query.in('city', filters.cities);
    }

    if (filters?.status && filters.status.length > 0) {
      const supportedStatuses = filters.status.filter(s => 
        ['new', 'contacted', 'interested', 'client', 'not_interested'].includes(s)
      ) as Array<'new' | 'contacted' | 'interested' | 'client' | 'not_interested'>;
      if (supportedStatuses.length > 0) {
        query = query.in('status', supportedStatuses);
      }
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
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

    const { data, error } = await query.order('added_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapLead);
  }

  static async getLead(id: string): Promise<EnrichedLead | null> {
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
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapLead(data);
  }

  static async createLead(
    userId: string,
    formData: LeadFormData
  ): Promise<EnrichedLead> {
    const dbStatus = (formData.status && 
      ['new', 'contacted', 'interested', 'client', 'not_interested'].includes(formData.status))
      ? formData.status as 'new' | 'contacted' | 'interested' | 'client' | 'not_interested'
      : 'new' as const;

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        user_id: userId,
        name: formData.name,
        category: formData.sector_id || 'other',
        sector_id: formData.sector_id,
        segment_id: formData.segment_id,
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
        status: dbStatus,
        score: formData.score,
        notes: formData.notes,
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

  static async updateLead(
    id: string,
    formData: Partial<LeadFormData>
  ): Promise<EnrichedLead> {
    const updateData: any = {};

    if (formData.name) updateData.name = formData.name;
    if (formData.sector_id !== undefined) updateData.sector_id = formData.sector_id;
    if (formData.segment_id !== undefined) updateData.segment_id = formData.segment_id;
    if (formData.address) updateData.address = formData.address;
    if (formData.city) updateData.city = formData.city;
    if (formData.postal_code !== undefined) updateData.postal_code = formData.postal_code;
    if (formData.phone !== undefined) updateData.phone = formData.phone;
    if (formData.whatsapp !== undefined) updateData.whatsapp = formData.whatsapp;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.website !== undefined) updateData.website = formData.website;
    if (formData.social_media !== undefined) updateData.social_media = formData.social_media;
    if (formData.google_rating !== undefined) updateData.google_rating = formData.google_rating;
    if (formData.google_reviews_count !== undefined) updateData.google_reviews_count = formData.google_reviews_count;
    if (formData.google_maps_url !== undefined) updateData.google_maps_url = formData.google_maps_url;
    if (formData.image_url !== undefined) updateData.image_url = formData.image_url;
    if (formData.business_hours !== undefined) updateData.business_hours = formData.business_hours;
    if (formData.status && ['new', 'contacted', 'interested', 'client', 'not_interested'].includes(formData.status)) {
      updateData.status = formData.status as 'new' | 'contacted' | 'interested' | 'client' | 'not_interested';
    }
    if (formData.score !== undefined) updateData.score = formData.score;
    if (formData.notes !== undefined) updateData.notes = formData.notes;
    if (formData.tags !== undefined) updateData.tags = formData.tags;

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

  static async updateLeadStatus(
    id: string,
    status: LeadStatus
  ): Promise<EnrichedLead> {
    const supportedStatuses: Array<'new' | 'contacted' | 'interested' | 'client' | 'not_interested'> = 
      ['new', 'contacted', 'interested', 'client', 'not_interested'];
    const dbStatus: 'new' | 'contacted' | 'interested' | 'client' | 'not_interested' = 
      (supportedStatuses.includes(status as any)) ? status as any : 'new';

    const { data, error } = await supabase
      .from('leads')
      .update({ status: dbStatus })
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

  static async updateLeadScore(id: string, score: number): Promise<EnrichedLead> {
    const { data, error } = await supabase
      .from('leads')
      .update({ score })
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

  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapLead(row: any): EnrichedLead {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      category: row.category,
      sector_id: row.sector_id,
      segment_id: row.segment_id,
      sector: row.sector,
      segment: row.segment,
      address: row.address,
      city: row.city,
      postal_code: row.postal_code,
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      website: row.website,
      social_media: row.social_media,
      image_url: row.image_url,
      google_rating: row.google_rating,
      google_reviews_count: row.google_reviews_count,
      google_maps_url: row.google_maps_url,
      business_hours: row.business_hours,
      status: row.status as LeadStatus,
      score: row.score,
      notes: row.notes || '',
      tags: row.tags || [],
      source: row.source,
      added_at: new Date(row.added_at),
      last_contacted_at: row.last_contacted_at ? new Date(row.last_contacted_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }
}

// ==============================================
// STATISTIQUES
// ==============================================

export class CRMStatsService {
  static async getStats(userId: string): Promise<CRMStats> {
    // Get leads with sectors
    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        status,
        city,
        score,
        sector_id,
        sector:crm_sectors(id, name)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const leadsData = leads || [];
    
    // Count by status
    const statusCounts = leadsData.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by city
    const cityCounts = leadsData.reduce((acc, lead) => {
      acc[lead.city] = (acc[lead.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Stats by sector
    const sectorStats = leadsData.reduce((acc, lead) => {
      if (!lead.sector_id || !lead.sector) return acc;
      
      if (!acc[lead.sector_id]) {
        acc[lead.sector_id] = {
          sector_id: lead.sector_id,
          sector_name: lead.sector.name,
          count: 0,
          scores: [],
        };
      }
      
      acc[lead.sector_id].count++;
      if (lead.score) {
        acc[lead.sector_id].scores.push(lead.score);
      }
      
      return acc;
    }, {} as Record<string, any>);

    const by_sector = Object.values(sectorStats).map((s: any) => ({
      sector_id: s.sector_id,
      sector_name: s.sector_name,
      count: s.count,
      avg_score: s.scores.length > 0 
        ? s.scores.reduce((a: number, b: number) => a + b, 0) / s.scores.length 
        : 0,
    }));

    // Get tasks stats
    const { data: tasks } = await supabase
      .from('crm_tasks')
      .select('status, due_date')
      .eq('user_id', userId);

    const tasksData = tasks || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const tasks_today = tasksData.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= today && dueDate <= endOfDay;
    }).length;

    const tasks_overdue = tasksData.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const dueDate = new Date(t.due_date);
      return dueDate < today;
    }).length;

    const tasks_this_week = tasksData.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= today && dueDate <= endOfWeek;
    }).length;

    const total = leadsData.length;
    const clients = statusCounts['client'] || 0;

    return {
      total_leads: total,
      new_leads: statusCounts['new'] || 0,
      contacted_leads: statusCounts['contacted'] || 0,
      interested_leads: statusCounts['interested'] || 0,
      qualified_leads: 0, // Not supported in current schema
      client_leads: clients,
      conversion_rate: total > 0 ? (clients / total) * 100 : 0,
      by_sector,
      by_status: Object.entries(statusCounts).map(([status, count]) => ({
        status: status as LeadStatus,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      })),
      by_city: Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      tasks_today,
      tasks_overdue,
      tasks_this_week,
    };
  }
}

// ==============================================
// CAMPAGNES
// ==============================================

export class CampaignService {
  static async getCampaigns(userId: string): Promise<CRMCampaign[]> {
    const { data, error } = await supabase
      .from('crm_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapCampaign);
  }

  static async createCampaign(
    userId: string,
    formData: CampaignFormData
  ): Promise<CRMCampaign> {
    const { data, error } = await supabase
      .from('crm_campaigns')
      .insert([{
        user_id: userId,
        name: formData.name,
        description: formData.description,
        channel: formData.channel,
        target_sector_ids: formData.target.sector_ids,
        target_segment_ids: formData.target.segment_ids,
        target_cities: formData.target.cities,
        target_tags: formData.target.tags,
        target_status: formData.target.status,
        subject: formData.message.subject,
        message: formData.message.content,
        scheduled_at: formData.scheduled_at?.toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapCampaign(data);
  }

  static async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapCampaign(row: any): CRMCampaign {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      channel: row.channel,
      status: row.status,
      target_sector_ids: row.target_sector_ids,
      target_segment_ids: row.target_segment_ids,
      target_cities: row.target_cities,
      target_tags: row.target_tags,
      target_status: row.target_status,
      subject: row.subject,
      message: row.message,
      scheduled_at: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      sent_at: row.sent_at ? new Date(row.sent_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      total_leads: row.total_leads,
      sent_count: row.sent_count,
      delivered_count: row.delivered_count,
      read_count: row.read_count,
      replied_count: row.replied_count,
      failed_count: row.failed_count,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

// ==============================================
// TÂCHES
// ==============================================

export class TaskService {
  static async getTasks(userId: string, filters?: { lead_id?: string; status?: string }): Promise<CRMTask[]> {
    let query = supabase
      .from('crm_tasks')
      .select(`
        *,
        lead:leads(id, name, city)
      `)
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
      .order('due_date', { ascending: true });

    if (filters?.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(this.mapTask);
  }

  static async createTask(
    userId: string,
    formData: TaskFormData
  ): Promise<CRMTask> {
    const { data, error } = await supabase
      .from('crm_tasks')
      .insert([{
        user_id: userId,
        lead_id: formData.lead_id,
        assigned_to: formData.assigned_to,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        due_date: formData.due_date?.toISOString(),
      }])
      .select(`
        *,
        lead:leads(id, name, city)
      `)
      .single();

    if (error) throw error;
    return this.mapTask(data);
  }

  static async updateTask(
    id: string,
    updates: Partial<TaskFormData>
  ): Promise<CRMTask> {
    const updateData: any = { ...updates };
    
    // Convert Date to ISO string
    if (updateData.due_date instanceof Date) {
      updateData.due_date = updateData.due_date.toISOString();
    }

    const { data, error } = await supabase
      .from('crm_tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        lead:leads(id, name, city)
      `)
      .single();

    if (error) throw error;
    return this.mapTask(data);
  }

  static async completeTask(id: string): Promise<CRMTask> {
    const { data, error } = await supabase
      .from('crm_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        lead:leads(id, name, city)
      `)
      .single();

    if (error) throw error;
    return this.mapTask(data);
  }

  static async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapTask(row: any): CRMTask {
    return {
      id: row.id,
      user_id: row.user_id,
      lead_id: row.lead_id,
      assigned_to: row.assigned_to,
      title: row.title,
      description: row.description,
      type: row.type,
      priority: row.priority,
      status: row.status,
      due_date: row.due_date ? new Date(row.due_date) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      lead: row.lead,
    };
  }
}

// ==============================================
// INTERACTIONS
// ==============================================

export class InteractionService {
  static async getInteractions(leadId: string): Promise<CRMLeadInteraction[]> {
    const { data, error } = await supabase
      .from('crm_lead_interactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapInteraction);
  }

  static async createInteraction(
    userId: string,
    leadId: string,
    interaction: {
      type: CRMLeadInteraction['type'];
      channel?: string;
      status?: CRMLeadInteraction['status'];
      subject?: string;
      content?: string;
      metadata?: Record<string, any>;
      campaign_id?: string;
    }
  ): Promise<CRMLeadInteraction> {
    const { data, error } = await supabase
      .from('crm_lead_interactions')
      .insert([{
        user_id: userId,
        lead_id: leadId,
        ...interaction,
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapInteraction(data);
  }

  private static mapInteraction(row: any): CRMLeadInteraction {
    return {
      id: row.id,
      lead_id: row.lead_id,
      campaign_id: row.campaign_id,
      user_id: row.user_id,
      type: row.type,
      channel: row.channel,
      status: row.status,
      subject: row.subject,
      content: row.content,
      metadata: row.metadata,
      created_at: new Date(row.created_at),
    };
  }
}
