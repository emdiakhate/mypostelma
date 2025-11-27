/**
 * Hooks pour le CRM IA
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  SectorService,
  SegmentService,
  TagService,
  CRMLeadService,
  CRMStatsService,
  CampaignService,
} from '@/services/crm';
import {
  CRMSector,
  CRMSegment,
  CRMTag,
  EnrichedLead,
  CRMStats,
  CRMCampaign,
  LeadFilters,
  SectorFormData,
  SegmentFormData,
  TagFormData,
  LeadFormData,
  CampaignFormData,
  LeadStatus,
} from '@/types/crm';
import { toast } from 'sonner';

// ==============================================
// Hook: useSectors
// ==============================================

export function useSectors() {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<CRMSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSectors = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await SectorService.getSectors(user.id);
      setSectors(data);
    } catch (err: any) {
      console.error('Error loading sectors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createSector = async (formData: SectorFormData) => {
    if (!user?.id) throw new Error('User not authenticated');

    const newSector = await SectorService.createSector(user.id, formData);
    setSectors((prev) => [...prev, newSector]);
    return newSector;
  };

  const updateSector = async (id: string, formData: Partial<SectorFormData>) => {
    const updated = await SectorService.updateSector(id, formData);
    setSectors((prev) =>
      prev.map((s) => (s.id === id ? updated : s))
    );
    return updated;
  };

  const deleteSector = async (id: string) => {
    await SectorService.deleteSector(id);
    setSectors((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    loadSectors();
  }, [loadSectors]);

  return {
    sectors,
    loading,
    error,
    loadSectors,
    createSector,
    updateSector,
    deleteSector,
  };
}

// ==============================================
// Hook: useSegments
// ==============================================

export function useSegments(sectorId?: string) {
  const { user } = useAuth();
  const [segments, setSegments] = useState<CRMSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSegments = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = sectorId
        ? await SegmentService.getSegmentsBySector(sectorId)
        : await SegmentService.getAllSegments(user.id);
      setSegments(data);
    } catch (err: any) {
      console.error('Error loading segments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, sectorId]);

  const createSegment = async (formData: SegmentFormData) => {
    const newSegment = await SegmentService.createSegment(formData);
    setSegments((prev) => [...prev, newSegment]);
    return newSegment;
  };

  const updateSegment = async (id: string, formData: Partial<SegmentFormData>) => {
    const updated = await SegmentService.updateSegment(id, formData);
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? updated : s))
    );
    return updated;
  };

  const deleteSegment = async (id: string) => {
    await SegmentService.deleteSegment(id);
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  return {
    segments,
    loading,
    error,
    loadSegments,
    createSegment,
    updateSegment,
    deleteSegment,
  };
}

// ==============================================
// Hook: useTags
// ==============================================

export function useTags(sectorId?: string) {
  const { user } = useAuth();
  const [tags, setTags] = useState<CRMTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = sectorId
        ? await TagService.getTagsBySector(sectorId)
        : await TagService.getAllTags(user.id);
      setTags(data);
    } catch (err: any) {
      console.error('Error loading tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, sectorId]);

  const createTag = async (formData: TagFormData) => {
    if (!user?.id) throw new Error('User not authenticated');

    const newTag = await TagService.createTag(user.id, formData);
    setTags((prev) => [...prev, newTag]);
    return newTag;
  };

  const deleteTag = async (id: string) => {
    await TagService.deleteTag(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return {
    tags,
    loading,
    error,
    loadTags,
    createTag,
    deleteTag,
  };
}

// ==============================================
// Hook: useCRMLeads
// ==============================================

export function useCRMLeads(filters?: LeadFilters) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await CRMLeadService.getLeads(user.id, filters);
      setLeads(data);
    } catch (err: any) {
      console.error('Error loading leads:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des leads');
    } finally {
      setLoading(false);
    }
  }, [user?.id, JSON.stringify(filters)]);

  const createLead = async (formData: LeadFormData) => {
    if (!user?.id) throw new Error('User not authenticated');

    const newLead = await CRMLeadService.createLead(user.id, formData);
    setLeads((prev) => [newLead, ...prev]);
    toast.success('Lead créé avec succès');
    return newLead;
  };

  const updateLead = async (id: string, formData: Partial<LeadFormData>) => {
    const updated = await CRMLeadService.updateLead(id, formData);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    toast.success('Lead mis à jour');
    return updated;
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    const updated = await CRMLeadService.updateLeadStatus(id, status);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    toast.success('Statut mis à jour');
    return updated;
  };

  const updateLeadScore = async (id: string, score: number) => {
    const updated = await CRMLeadService.updateLeadScore(id, score);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    return updated;
  };

  const deleteLead = async (id: string) => {
    await CRMLeadService.deleteLead(id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success('Lead supprimé');
  };

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return {
    leads,
    loading,
    error,
    loadLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    updateLeadScore,
    deleteLead,
  };
}

// ==============================================
// Hook: useCRMStats
// ==============================================

export function useCRMStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await CRMStatsService.getStats(user.id);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
  };
}

// ==============================================
// Hook: useLeadStatusHelpers
// ==============================================

export function useLeadStatusHelpers() {
  const getStatusColor = (status: LeadStatus): string => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'interested':
        return 'bg-green-100 text-green-800';
      case 'qualified':
        return 'bg-purple-100 text-purple-800';
      case 'client':
        return 'bg-emerald-100 text-emerald-800';
      case 'not_interested':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: LeadStatus): string => {
    switch (status) {
      case 'new':
        return 'Nouveau';
      case 'contacted':
        return 'Contacté';
      case 'interested':
        return 'Intéressé';
      case 'qualified':
        return 'Qualifié';
      case 'client':
        return 'Client';
      case 'not_interested':
        return 'Pas intéressé';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: LeadStatus): string => {
    switch (status) {
      case 'new':
        return '🆕';
      case 'contacted':
        return '📞';
      case 'interested':
        return '👍';
      case 'qualified':
        return '🔥';
      case 'client':
        return '✅';
      case 'not_interested':
        return '❌';
      case 'archived':
        return '📦';
      default:
        return '❓';
    }
  };

  return {
    getStatusColor,
    getStatusLabel,
    getStatusIcon,
  };
}

// ==============================================
// Hook: useCampaigns
// ==============================================

export function useCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CRMCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await CampaignService.getCampaigns(user.id);
      setCampaigns(data);
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createCampaign = async (formData: CampaignFormData) => {
    if (!user?.id) throw new Error('User not authenticated');

    const newCampaign = await CampaignService.createCampaign(user.id, formData);
    setCampaigns((prev) => [newCampaign, ...prev]);
    toast.success('Campagne créée avec succès');
    return newCampaign;
  };

  const deleteCampaign = async (id: string) => {
    await CampaignService.deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success('Campagne supprimée');
  };

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    createCampaign,
    deleteCampaign,
  };
}
