/**
 * Custom React Hook pour la gestion du CRM
 * Intégration avec Supabase pour leads, secteurs, segments, interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  EnrichedLead,
  LeadStatus,
  LeadFilters,
  LeadFormData,
  CRMSector,
  CRMSegment,
  CRMTag,
  CRMLeadInteraction,
  InteractionType,
  SectorFormData,
  SegmentFormData,
  TagFormData,
} from '@/types/crm';

// ==============================================
// Hook principal: useCRMLeads
// ==============================================

export const useCRMLeads = (filters?: LeadFilters) => {
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Charger les leads
  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('crm_leads')
        .select(`
          *,
          sector:crm_sectors(*),
          segment:crm_segments(*)
        `)
        .order('added_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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

      const { data, error } = await query;

      if (error) throw error;

      setLeads((data as any[]) || []);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les leads',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Créer un lead
  const createLead = useCallback(async (leadData: LeadFormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const newLead = {
        user_id: user.id,
        name: leadData.name,
        sector_id: leadData.sector_id,
        segment_id: leadData.segment_id,
        address: leadData.address,
        city: leadData.city,
        postal_code: leadData.postal_code,
        phone: leadData.phone,
        whatsapp: leadData.whatsapp,
        email: leadData.email,
        website: leadData.website,
        social_media: leadData.social_media,
        google_rating: leadData.google_rating,
        google_reviews_count: leadData.google_reviews_count,
        google_maps_url: leadData.google_maps_url,
        image_url: leadData.image_url,
        business_hours: leadData.business_hours,
        status: leadData.status || 'new',
        score: leadData.score,
        notes: leadData.notes || '',
        tags: leadData.tags || [],
        source: leadData.source || 'manual',
        added_at: new Date().toISOString(),
        category: '', // Legacy field, can be removed later
      };

      const { data, error } = await supabase
        .from('crm_leads')
        .insert([newLead])
        .select(`
          *,
          sector:crm_sectors(*),
          segment:crm_segments(*)
        `)
        .single();

      if (error) throw error;

      setLeads((prev) => [data as EnrichedLead, ...prev]);

      toast({
        title: 'Succès',
        description: 'Lead créé avec succès',
      });

      return data as EnrichedLead;
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de créer le lead',
      });
      throw error;
    }
  }, [toast]);

  // Mettre à jour un lead
  const updateLead = useCallback(async (leadId: string, updates: Partial<LeadFormData>) => {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select(`
          *,
          sector:crm_sectors(*),
          segment:crm_segments(*)
        `)
        .single();

      if (error) throw error;

      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? (data as EnrichedLead) : lead))
      );

      toast({
        title: 'Succès',
        description: 'Lead mis à jour',
      });

      return data as EnrichedLead;
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le lead',
      });
      throw error;
    }
  }, [toast]);

  // Mettre à jour le statut d'un lead
  const updateLeadStatus = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          status: newStatus,
          last_contacted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select(`
          *,
          sector:crm_sectors(*),
          segment:crm_segments(*)
        `)
        .single();

      if (error) throw error;

      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? (data as EnrichedLead) : lead))
      );

      // Créer une interaction pour le changement de statut
      await createInteraction(leadId, {
        type: 'status_change',
        content: `Statut changé vers: ${newStatus}`,
      });

      toast({
        title: 'Statut mis à jour',
        description: `Lead marqué comme ${newStatus}`,
      });

      return data as EnrichedLead;
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
      });
      throw error;
    }
  }, [toast]);

  // Supprimer un lead
  const deleteLead = useCallback(async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));

      toast({
        title: 'Succès',
        description: 'Lead supprimé',
      });
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le lead',
      });
      throw error;
    }
  }, [toast]);

  // Créer une interaction
  const createInteraction = useCallback(async (
    leadId: string,
    interactionData: {
      type: InteractionType;
      channel?: string;
      subject?: string;
      content?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('crm_lead_interactions')
        .insert([{
          lead_id: leadId,
          user_id: user.id,
          type: interactionData.type,
          channel: interactionData.channel,
          subject: interactionData.subject,
          content: interactionData.content,
          metadata: interactionData.metadata,
          status: 'sent',
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error creating interaction:', error);
    }
  }, []);

  // Charger les leads au montage et quand les filtres changent
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return {
    leads,
    loading,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    createInteraction,
    loadLeads,
  };
};

// ==============================================
// Hook: useSectors
// ==============================================

export const useSectors = () => {
  const [sectors, setSectors] = useState<CRMSector[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSectors = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_sectors')
        .select('*')
        .order('name');

      if (error) throw error;

      setSectors(data || []);
    } catch (error: any) {
      console.error('Error loading sectors:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les secteurs',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSector = useCallback(async (sectorData: SectorFormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('crm_sectors')
        .insert([{
          user_id: user.id,
          ...sectorData,
        }])
        .select()
        .single();

      if (error) throw error;

      setSectors((prev) => [...prev, data as CRMSector]);

      toast({
        title: 'Succès',
        description: 'Secteur créé',
      });

      return data as CRMSector;
    } catch (error: any) {
      console.error('Error creating sector:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le secteur',
      });
      throw error;
    }
  }, [toast]);

  const updateSector = useCallback(async (sectorId: string, updates: Partial<SectorFormData>) => {
    try {
      const { data, error } = await supabase
        .from('crm_sectors')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sectorId)
        .select()
        .single();

      if (error) throw error;

      setSectors((prev) =>
        prev.map((sector) => (sector.id === sectorId ? (data as CRMSector) : sector))
      );

      toast({
        title: 'Succès',
        description: 'Secteur mis à jour',
      });

      return data as CRMSector;
    } catch (error: any) {
      console.error('Error updating sector:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le secteur',
      });
      throw error;
    }
  }, [toast]);

  const deleteSector = useCallback(async (sectorId: string) => {
    try {
      const { error } = await supabase
        .from('crm_sectors')
        .delete()
        .eq('id', sectorId);

      if (error) throw error;

      setSectors((prev) => prev.filter((sector) => sector.id !== sectorId));

      toast({
        title: 'Succès',
        description: 'Secteur supprimé',
      });
    } catch (error: any) {
      console.error('Error deleting sector:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le secteur',
      });
      throw error;
    }
  }, [toast]);

  useEffect(() => {
    loadSectors();
  }, [loadSectors]);

  return {
    sectors,
    loading,
    createSector,
    updateSector,
    deleteSector,
    loadSectors,
  };
};

// ==============================================
// Hook: useSegments
// ==============================================

export const useSegments = () => {
  const [segments, setSegments] = useState<CRMSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSegments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_segments')
        .select('*')
        .order('name');

      if (error) throw error;

      setSegments(data || []);
    } catch (error: any) {
      console.error('Error loading segments:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les segments',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSegment = useCallback(async (segmentData: SegmentFormData) => {
    try {
      const { data, error } = await supabase
        .from('crm_segments')
        .insert([segmentData])
        .select()
        .single();

      if (error) throw error;

      setSegments((prev) => [...prev, data as CRMSegment]);

      toast({
        title: 'Succès',
        description: 'Segment créé',
      });

      return data as CRMSegment;
    } catch (error: any) {
      console.error('Error creating segment:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le segment',
      });
      throw error;
    }
  }, [toast]);

  const updateSegment = useCallback(async (segmentId: string, updates: Partial<SegmentFormData>) => {
    try {
      const { data, error } = await supabase
        .from('crm_segments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', segmentId)
        .select()
        .single();

      if (error) throw error;

      setSegments((prev) =>
        prev.map((segment) => (segment.id === segmentId ? (data as CRMSegment) : segment))
      );

      toast({
        title: 'Succès',
        description: 'Segment mis à jour',
      });

      return data as CRMSegment;
    } catch (error: any) {
      console.error('Error updating segment:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le segment',
      });
      throw error;
    }
  }, [toast]);

  const deleteSegment = useCallback(async (segmentId: string) => {
    try {
      const { error } = await supabase
        .from('crm_segments')
        .delete()
        .eq('id', segmentId);

      if (error) throw error;

      setSegments((prev) => prev.filter((segment) => segment.id !== segmentId));

      toast({
        title: 'Succès',
        description: 'Segment supprimé',
      });
    } catch (error: any) {
      console.error('Error deleting segment:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le segment',
      });
      throw error;
    }
  }, [toast]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  return {
    segments,
    loading,
    createSegment,
    updateSegment,
    deleteSegment,
    loadSegments,
  };
};

// ==============================================
// Hook: useLeadInteractions
// ==============================================

export const useLeadInteractions = (leadId: string) => {
  const [interactions, setInteractions] = useState<CRMLeadInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInteractions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_lead_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInteractions(data || []);
    } catch (error: any) {
      console.error('Error loading interactions:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      loadInteractions();
    }
  }, [leadId, loadInteractions]);

  return {
    interactions,
    loading,
    loadInteractions,
  };
};

// ==============================================
// Hook: useLeadStatusHelpers
// ==============================================

export const useLeadStatusHelpers = () => {
  const getStatusColor = (status: LeadStatus): string => {
    const colors: Record<LeadStatus, string> = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      interested: 'bg-green-500',
      qualified: 'bg-purple-500',
      client: 'bg-emerald-500',
      not_interested: 'bg-gray-500',
      archived: 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: LeadStatus): string => {
    const labels: Record<LeadStatus, string> = {
      new: 'Nouveau',
      contacted: 'Contacté',
      interested: 'Intéressé',
      qualified: 'Qualifié',
      client: 'Client',
      not_interested: 'Pas intéressé',
      archived: 'Archivé',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: LeadStatus): string => {
    const icons: Record<LeadStatus, string> = {
      new: '🆕',
      contacted: '📞',
      interested: '👍',
      qualified: '⭐',
      client: '🎉',
      not_interested: '❌',
      archived: '📦',
    };
    return icons[status] || '📋';
  };

  return {
    getStatusColor,
    getStatusLabel,
    getStatusIcon,
  };
};
