/**
 * Services CRM IA
 * TEMPORAIREMENT DÉSACTIVÉ - Les tables CRM n'existent pas encore dans la base de données
 * Ce fichier sera réactivé une fois les migrations créées
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
// SECTEURS - TEMPORAIREMENT DÉSACTIVÉ
// ==============================================

export class SectorService {
  static async getSectors(userId: string): Promise<CRMSector[]> {
    console.warn('CRM tables not yet created - returning empty array');
    return [];
  }

  static async createSector(
    userId: string,
    formData: SectorFormData
  ): Promise<CRMSector> {
    throw new Error('CRM tables not yet created');
  }

  static async updateSector(
    id: string,
    formData: Partial<SectorFormData>
  ): Promise<CRMSector> {
    throw new Error('CRM tables not yet created');
  }

  static async deleteSector(id: string): Promise<void> {
    throw new Error('CRM tables not yet created');
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
// SEGMENTS - TEMPORAIREMENT DÉSACTIVÉ
// ==============================================

export class SegmentService {
  static async getSegmentsBySector(sectorId: string): Promise<CRMSegment[]> {
    console.warn('CRM tables not yet created - returning empty array');
    return [];
  }

  static async getAllSegments(userId: string): Promise<CRMSegment[]> {
    console.warn('CRM tables not yet created - returning empty array');
    return [];
  }

  static async createSegment(formData: SegmentFormData): Promise<CRMSegment> {
    throw new Error('CRM tables not yet created');
  }

  static async updateSegment(
    id: string,
    formData: Partial<SegmentFormData>
  ): Promise<CRMSegment> {
    throw new Error('CRM tables not yet created');
  }

  static async deleteSegment(id: string): Promise<void> {
    throw new Error('CRM tables not yet created');
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
// TAGS - TEMPORAIREMENT DÉSACTIVÉ
// ==============================================

export class TagService {
  static async getTagsBySector(sectorId: string): Promise<CRMTag[]> {
    console.warn('CRM tables not yet created - returning empty array');
    return [];
  }

  static async getAllTags(userId: string): Promise<CRMTag[]> {
    console.warn('CRM tables not yet created - returning empty array');
    return [];
  }

  static async createTag(userId: string, formData: TagFormData): Promise<CRMTag> {
    throw new Error('CRM tables not yet created');
  }

  static async deleteTag(id: string): Promise<void> {
    throw new Error('CRM tables not yet created');
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
// LEADS - UTILISE LA TABLE EXISTANTE
// ==============================================

export class CRMLeadService {
  static async getLeads(
    userId: string,
    filters?: LeadFilters
  ): Promise<EnrichedLead[]> {
    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }

    if (filters?.cities && filters.cities.length > 0) {
      query = query.in('city', filters.cities);
    }

    if (filters?.status && filters.status.length > 0) {
      // Only use status values supported by the database
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

    const { data, error } = await query.order('added_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapLead);
  }

  static async createLead(
    userId: string,
    formData: LeadFormData
  ): Promise<EnrichedLead> {
    // Map status to database-supported values
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
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        social_media: formData.social_media,
        status: dbStatus,
        notes: formData.notes,
        tags: formData.tags || [],
        source: formData.source || 'manual',
        metrics: {
          google_rating: formData.google_rating,
          google_reviews_count: formData.google_reviews_count,
          google_maps_url: formData.google_maps_url,
          image_url: formData.image_url,
          business_hours: formData.business_hours,
        },
      }])
      .select()
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
    if (formData.address) updateData.address = formData.address;
    if (formData.city) updateData.city = formData.city;
    if (formData.postal_code !== undefined) updateData.postal_code = formData.postal_code;
    if (formData.phone !== undefined) updateData.phone = formData.phone;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.website !== undefined) updateData.website = formData.website;
    if (formData.social_media !== undefined) updateData.social_media = formData.social_media;
    if (formData.status && ['new', 'contacted', 'interested', 'client', 'not_interested'].includes(formData.status)) {
      updateData.status = formData.status as 'new' | 'contacted' | 'interested' | 'client' | 'not_interested';
    }
    if (formData.notes !== undefined) updateData.notes = formData.notes;
    if (formData.tags !== undefined) updateData.tags = formData.tags;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapLead(data);
  }

  static async updateLeadStatus(
    id: string,
    status: LeadStatus
  ): Promise<EnrichedLead> {
    // Only use status values supported by the database
    const supportedStatuses: Array<'new' | 'contacted' | 'interested' | 'client' | 'not_interested'> = 
      ['new', 'contacted', 'interested', 'client', 'not_interested'];
    const dbStatus: 'new' | 'contacted' | 'interested' | 'client' | 'not_interested' = 
      (supportedStatuses.includes(status as any)) ? status as any : 'new';

    const { data, error } = await supabase
      .from('leads')
      .update({ status: dbStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapLead(data);
  }

  static async updateLeadScore(id: string, score: number): Promise<EnrichedLead> {
    // Score is stored in notes for now
    const { data, error } = await supabase
      .from('leads')
      .select('notes')
      .eq('id', id)
      .single();

    if (error) throw error;

    const currentNotes = data.notes || '';
    const scoreNote = `Score: ${score}/5`;
    const updatedNotes = currentNotes ? `${currentNotes}\n${scoreNote}` : scoreNote;

    const { data: updated, error: updateError } = await supabase
      .from('leads')
      .update({ notes: updatedNotes })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return this.mapLead(updated);
  }

  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private static mapLead(row: any): EnrichedLead {
    const metrics = row.metrics || {};
    
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      category: row.category,
      address: row.address,
      city: row.city,
      postal_code: row.postal_code,
      phone: row.phone,
      whatsapp: row.phone, // Use phone as whatsapp for now
      email: row.email,
      website: row.website,
      social_media: row.social_media,
      image_url: metrics.image_url,
      google_rating: metrics.google_rating,
      google_reviews_count: metrics.google_reviews_count,
      google_maps_url: metrics.google_maps_url,
      business_hours: metrics.business_hours,
      status: (row.status as LeadStatus) || 'new',
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
// STATISTIQUES - TEMPORAIREMENT DÉSACTIVÉ
// ==============================================

export class CRMStatsService {
  static async getStats(userId: string): Promise<CRMStats> {
    console.warn('CRM stats not yet fully implemented - returning mock data');
    
    // Get basic stats from leads table
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, city')
      .eq('user_id', userId);

    if (error) throw error;

    const leadsData = leads || [];
    const statusCounts = leadsData.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cityCounts = leadsData.reduce((acc, lead) => {
      acc[lead.city] = (acc[lead.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
      by_sector: [],
      by_status: Object.entries(statusCounts).map(([status, count]) => ({
        status: status as LeadStatus,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      })),
      by_city: Object.entries(cityCounts).map(([city, count]) => ({
        city,
        count,
      })),
      tasks_today: 0,
      tasks_overdue: 0,
      tasks_this_week: 0,
    };
  }
}

// ==============================================
// CAMPAGNES - TEMPORAIREMENT DÉSACTIVÉ
// ==============================================

export class CampaignService {
  static async getCampaigns(userId: string): Promise<CRMCampaign[]> {
    console.warn('CRM campaigns not yet implemented - returning empty array');
    return [];
  }

  static async createCampaign(
    userId: string,
    formData: CampaignFormData
  ): Promise<CRMCampaign> {
    throw new Error('CRM campaigns not yet implemented');
  }
}

// ==============================================
// TÂCHES - TEMPORAIREMENT DÉSACTIVÉ
// ==============================================

export class TaskService {
  static async getTasks(userId: string): Promise<CRMTask[]> {
    console.warn('CRM tasks not yet implemented - returning empty array');
    return [];
  }

  static async createTask(
    userId: string,
    formData: TaskFormData
  ): Promise<CRMTask> {
    throw new Error('CRM tasks not yet implemented');
  }
}
