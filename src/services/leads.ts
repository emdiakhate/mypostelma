import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStatus } from '@/types/leads';

export interface LeadFilters {
  status?: LeadStatus[];
  category?: string[];
  city?: string[];
  tags?: string[];
  search?: string;
}

export interface LeadSearchParams extends LeadFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'category' | 'city' | 'added_at' | 'last_contacted_at';
  sortOrder?: 'asc' | 'desc';
}

export class LeadsService {
  /**
   * Récupère tous les leads avec filtres optionnels
   */
  static async getLeads(params?: LeadSearchParams): Promise<{ leads: Lead[]; total: number }> {
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Filtres
    if (params?.status && params.status.length > 0) {
      query = query.in('status', params.status);
    }

    if (params?.category && params.category.length > 0) {
      query = query.in('category', params.category);
    }

    if (params?.city && params.city.length > 0) {
      query = query.in('city', params.city);
    }

    if (params?.tags && params.tags.length > 0) {
      query = query.overlaps('tags', params.tags);
    }

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }

    // Tri
    const sortBy = params?.sortBy || 'added_at';
    const sortOrder = params?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }

    const leads: Lead[] = (data || []).map((lead: any) => ({
      id: lead.id,
      name: lead.name,
      category: lead.category,
      address: lead.address,
      city: lead.city,
      postalCode: lead.postal_code,
      phone: lead.phone,
      email: lead.email,
      website: lead.website,
      socialMedia: (lead.social_media || {}) as any,
      metrics: (lead.metrics || {}) as any,
      status: lead.status,
      notes: lead.notes,
      tags: lead.tags,
      addedAt: new Date(lead.added_at),
      lastContactedAt: lead.last_contacted_at ? new Date(lead.last_contacted_at) : undefined,
      source: lead.source,
    }));

    return {
      leads,
      total: count || 0,
    };
  }

  /**
   * Récupère un lead par ID
   */
  static async getLeadById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      phone: data.phone,
      email: data.email,
      website: data.website,
      socialMedia: (data.social_media || {}) as any,
      metrics: (data.metrics || {}) as any,
      status: data.status,
      notes: data.notes,
      tags: data.tags,
      addedAt: new Date(data.added_at),
      lastContactedAt: data.last_contacted_at ? new Date(data.last_contacted_at) : undefined,
      source: data.source,
    };
  }

  /**
   * Crée un nouveau lead
   */
  static async createLead(lead: Partial<Lead>, userId: string): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        user_id: userId,
        name: lead.name,
        category: lead.category,
        address: lead.address,
        city: lead.city,
        postal_code: lead.postalCode,
        phone: lead.phone,
        email: lead.email,
        website: lead.website,
        social_media: (lead.socialMedia || {}) as any,
        metrics: (lead.metrics || {}) as any,
        status: lead.status || 'new',
        notes: lead.notes || '',
        tags: lead.tags || [],
        source: lead.source || 'manual',
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      phone: data.phone,
      email: data.email,
      website: data.website,
      socialMedia: (data.social_media || {}) as any,
      metrics: (data.metrics || {}) as any,
      status: data.status,
      notes: data.notes,
      tags: data.tags,
      addedAt: new Date(data.added_at),
      lastContactedAt: data.last_contacted_at ? new Date(data.last_contacted_at) : undefined,
      source: data.source,
    };
  }

  /**
   * Met à jour un lead
   */
  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.postalCode !== undefined) updateData.postal_code = updates.postalCode;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.socialMedia !== undefined) updateData.social_media = updates.socialMedia;
    if (updates.metrics !== undefined) updateData.metrics = updates.metrics;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'contacted') {
        updateData.last_contacted_at = new Date().toISOString();
      }
    }
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.source !== undefined) updateData.source = updates.source;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      phone: data.phone,
      email: data.email,
      website: data.website,
      socialMedia: (data.social_media || {}) as any,
      metrics: (data.metrics || {}) as any,
      status: data.status,
      notes: data.notes,
      tags: data.tags,
      addedAt: new Date(data.added_at),
      lastContactedAt: data.last_contacted_at ? new Date(data.last_contacted_at) : undefined,
      source: data.source,
    };
  }

  /**
   * Supprime un lead
   */
  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'un lead
   */
  static async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
    return this.updateLead(id, { status });
  }

  /**
   * Ajoute des tags à un lead
   */
  static async addLeadTags(id: string, newTags: string[]): Promise<Lead> {
    const lead = await this.getLeadById(id);
    if (!lead) throw new Error('Lead not found');
    
    const updatedTags = [...new Set([...lead.tags, ...newTags])];
    return this.updateLead(id, { tags: updatedTags });
  }

  /**
   * Supprime des tags d'un lead
   */
  static async removeLeadTags(id: string, tagsToRemove: string[]): Promise<Lead> {
    const lead = await this.getLeadById(id);
    if (!lead) throw new Error('Lead not found');
    
    const updatedTags = lead.tags.filter(tag => !tagsToRemove.includes(tag));
    return this.updateLead(id, { tags: updatedTags });
  }
}
