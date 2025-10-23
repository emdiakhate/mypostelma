/**
 * Hook pour la gestion des leads
 * Phase 4: Lead Generation System
 */

import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/types/leads';
import { LeadsService } from '@/services/leads';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const loadLeads = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await LeadsService.getLeads({
        sortBy: 'added_at',
        sortOrder: 'desc'
      });
      setLeads(result.leads);
    } catch (err) {
      setError(err as Error);
      toast.error('Erreur lors du chargement des leads');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'addedAt'>) => {
    if (!user) {
      toast.error('Vous devez être connecté pour créer un lead');
      return;
    }

    try {
      const newLead = await LeadsService.createLead(lead, user.id);
      setLeads(prev => [newLead, ...prev]);
      toast.success('Lead créé avec succès');
      return newLead;
    } catch (err) {
      toast.error('Erreur lors de la création du lead');
      throw err;
    }
  }, [user]);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      const updatedLead = await LeadsService.updateLead(id, updates);
      setLeads(prev => prev.map(lead => lead.id === id ? updatedLead : lead));
      toast.success('Lead mis à jour avec succès');
      return updatedLead;
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du lead');
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      await LeadsService.deleteLead(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success('Lead supprimé avec succès');
    } catch (err) {
      toast.error('Erreur lors de la suppression du lead');
      throw err;
    }
  }, []);

  const updateLeadStatus = useCallback(async (id: string, status: LeadStatus) => {
    try {
      const updatedLead = await LeadsService.updateLeadStatus(id, status);
      setLeads(prev => prev.map(lead => lead.id === id ? updatedLead : lead));
      toast.success('Statut mis à jour avec succès');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut');
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
    updateLeadStatus,
  };
}

export function useLeadStatus() {
  const updateLeadStatus = useCallback(async (leadId: string, status: LeadStatus) => {
    try {
      await LeadsService.updateLead(leadId, { 
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
