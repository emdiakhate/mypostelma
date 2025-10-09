/**
 * Hook pour la gestion des leads
 * Phase 4: Lead Generation System
 */

import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadStatus, LeadSearchParams, LeadAnalytics, LeadCampaign, LeadTemplate } from '@/types/leads';
import { LeadService, CampaignService, TemplateService } from '@/services/leadService';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedLeads = await LeadService.getAllLeads();
      setLeads(loadedLeads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'addedAt'>) => {
    try {
      setError(null);
      const newLead = await LeadService.addLead(lead);
      setLeads(prev => [...prev, newLead]);
      return newLead;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du lead');
      throw err;
    }
  }, []);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      setError(null);
      const updatedLead = await LeadService.updateLead(id, updates);
      setLeads(prev => prev.map(lead => lead.id === id ? updatedLead : lead));
      return updatedLead;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du lead');
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      setError(null);
      await LeadService.deleteLead(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du lead');
      throw err;
    }
  }, []);

  const searchLeads = useCallback(async (params: LeadSearchParams) => {
    try {
      setError(null);
      return await LeadService.searchLeads(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche des leads');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return {
    leads,
    loading,
    error,
    loadLeads,
    addLead,
    updateLead,
    deleteLead,
    searchLeads
  };
}

export function useLeadAnalytics() {
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LeadService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    loadAnalytics
  };
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<LeadCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedCampaigns = await CampaignService.getAllCampaigns();
      setCampaigns(loadedCampaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (campaign: Omit<LeadCampaign, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => {
    try {
      setError(null);
      const newCampaign = await CampaignService.createCampaign(campaign);
      setCampaigns(prev => [...prev, newCampaign]);
      return newCampaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la campagne');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    createCampaign
  };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<LeadTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedTemplates = await TemplateService.getAllTemplates();
      setTemplates(loadedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (template: Omit<LeadTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const newTemplate = await TemplateService.createTemplate(template);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du template');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    createTemplate
  };
}

export function useLeadStatus() {
  const updateLeadStatus = useCallback(async (leadId: string, status: LeadStatus) => {
    try {
      await LeadService.updateLead(leadId, { 
        status,
        lastContactedAt: status === 'contacted' ? new Date() : undefined
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      throw err;
    }
  }, []);

  const getStatusColor = useCallback((status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'interested':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'client':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'not_interested':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusLabel = useCallback((status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'Nouveau';
      case 'contacted':
        return 'Contacté';
      case 'interested':
        return 'Intéressé';
      case 'client':
        return 'Client';
      case 'not_interested':
        return 'Pas intéressé';
      default:
        return status;
    }
  }, []);

  return {
    updateLeadStatus,
    getStatusColor,
    getStatusLabel
  };
}
