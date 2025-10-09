/**
 * Service pour la gestion des leads
 * Phase 4: Lead Generation System
 */

import { 
  Lead, 
  LeadStatus, 
  LeadSearchParams, 
  LeadSearchResult, 
  LeadCampaign, 
  LeadContact, 
  LeadTemplate, 
  LeadAnalytics,
  LeadImportResult,
  LeadExportOptions
} from '@/types/leads';

// Clé de stockage localStorage
const LEADS_STORAGE_KEY = 'postelma_leads';
const CAMPAIGNS_STORAGE_KEY = 'postelma_lead_campaigns';
const TEMPLATES_STORAGE_KEY = 'postelma_lead_templates';
const CONTACTS_STORAGE_KEY = 'postelma_lead_contacts';

/**
 * Service de gestion des leads
 */
export class LeadService {
  /**
   * Récupérer tous les leads
   */
  static async getAllLeads(): Promise<Lead[]> {
    try {
      const stored = localStorage.getItem(LEADS_STORAGE_KEY);
      if (!stored) return [];
      
      const leads = JSON.parse(stored);
      return leads.map((lead: any) => ({
        ...lead,
        addedAt: new Date(lead.addedAt),
        lastContactedAt: lead.lastContactedAt ? new Date(lead.lastContactedAt) : undefined
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des leads:', error);
      return [];
    }
  }

  /**
   * Sauvegarder les leads
   */
  static async saveLeads(leads: Lead[]): Promise<void> {
    try {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des leads:', error);
      throw error;
    }
  }

  /**
   * Ajouter un nouveau lead
   */
  static async addLead(lead: Omit<Lead, 'id' | 'addedAt'>): Promise<Lead> {
    const leads = await this.getAllLeads();
    const newLead: Lead = {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date()
    };
    
    leads.push(newLead);
    await this.saveLeads(leads);
    return newLead;
  }

  /**
   * Mettre à jour un lead
   */
  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const leads = await this.getAllLeads();
    const index = leads.findIndex(lead => lead.id === id);
    
    if (index === -1) {
      throw new Error('Lead non trouvé');
    }
    
    leads[index] = { ...leads[index], ...updates };
    await this.saveLeads(leads);
    return leads[index];
  }

  /**
   * Supprimer un lead
   */
  static async deleteLead(id: string): Promise<void> {
    const leads = await this.getAllLeads();
    const filteredLeads = leads.filter(lead => lead.id !== id);
    await this.saveLeads(filteredLeads);
  }

  /**
   * Rechercher des leads
   */
  static async searchLeads(params: LeadSearchParams): Promise<LeadSearchResult> {
    const startTime = Date.now();
    const leads = await this.getAllLeads();
    
    // Filtrage basique (dans un vrai système, ceci serait fait côté serveur)
    let filteredLeads = leads.filter(lead => 
      lead.name.toLowerCase().includes(params.query.toLowerCase()) ||
      lead.category.toLowerCase().includes(params.query.toLowerCase()) ||
      lead.city.toLowerCase().includes(params.city.toLowerCase())
    );

    // Limiter les résultats
    filteredLeads = filteredLeads.slice(0, params.maxResults);
    
    const duration = (Date.now() - startTime) / 1000;
    
    return {
      leads: filteredLeads,
      totalFound: filteredLeads.length,
      searchParams: params,
      executedAt: new Date(),
      duration
    };
  }

  /**
   * Obtenir les analytics des leads
   */
  static async getAnalytics(): Promise<LeadAnalytics> {
    const leads = await this.getAllLeads();
    
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const contactedLeads = leads.filter(l => l.status === 'contacted').length;
    const interestedLeads = leads.filter(l => l.status === 'interested').length;
    const clientLeads = leads.filter(l => l.status === 'client').length;
    
    const conversionRate = totalLeads > 0 ? (clientLeads / totalLeads) * 100 : 0;
    
    // Top categories
    const categoryStats = leads.reduce((acc, lead) => {
      if (!acc[lead.category]) {
        acc[lead.category] = { total: 0, clients: 0 };
      }
      acc[lead.category].total++;
      if (lead.status === 'client') {
        acc[lead.category].clients++;
      }
      return acc;
    }, {} as Record<string, { total: number; clients: number }>);
    
    const topCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        count: stats.total,
        conversionRate: stats.total > 0 ? (stats.clients / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Top cities
    const cityStats = leads.reduce((acc, lead) => {
      if (!acc[lead.city]) {
        acc[lead.city] = { total: 0, clients: 0 };
      }
      acc[lead.city].total++;
      if (lead.status === 'client') {
        acc[lead.city].clients++;
      }
      return acc;
    }, {} as Record<string, { total: number; clients: number }>);
    
    const topCities = Object.entries(cityStats)
      .map(([city, stats]) => ({
        city,
        count: stats.total,
        conversionRate: stats.total > 0 ? (stats.clients / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Monthly stats (mock data)
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        newLeads: Math.floor(Math.random() * 20) + 5,
        contacted: Math.floor(Math.random() * 15) + 3,
        converted: Math.floor(Math.random() * 5) + 1
      };
    }).reverse();
    
    return {
      totalLeads,
      newLeads,
      contactedLeads,
      interestedLeads,
      clientLeads,
      conversionRate,
      avgResponseTime: 24, // Mock: 24 heures
      topCategories,
      topCities,
      monthlyStats
    };
  }

  /**
   * Importer des leads depuis un fichier
   */
  static async importLeads(file: File): Promise<LeadImportResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const leads: Lead[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        try {
          const values = lines[i].split(',').map(v => v.trim());
          const lead: Omit<Lead, 'id' | 'addedAt'> = {
            name: values[0] || 'Nom inconnu',
            category: values[1] || 'Autre',
            address: values[2] || '',
            city: values[3] || '',
            postalCode: values[4] || undefined,
            phone: values[5] || undefined,
            email: values[6] || undefined,
            website: values[7] || undefined,
            status: 'new',
            notes: '',
            tags: [],
            source: 'import'
          };
          
          const newLead = await this.addLead(lead);
          leads.push(newLead);
        } catch (error) {
          errors.push(`Ligne ${i + 1}: ${error}`);
        }
      }
      
      return {
        success: errors.length === 0,
        imported: leads.length,
        failed: errors.length,
        errors,
        leads
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        leads: []
      };
    }
  }

  /**
   * Exporter des leads
   */
  static async exportLeads(options: LeadExportOptions): Promise<string> {
    const leads = await this.getAllLeads();
    
    // Appliquer les filtres
    let filteredLeads = leads;
    
    if (options.filters) {
      if (options.filters.status) {
        filteredLeads = filteredLeads.filter(l => options.filters!.status!.includes(l.status));
      }
      if (options.filters.category) {
        filteredLeads = filteredLeads.filter(l => options.filters!.category!.includes(l.category));
      }
      if (options.filters.city) {
        filteredLeads = filteredLeads.filter(l => options.filters!.city!.includes(l.city));
      }
      if (options.filters.dateRange) {
        filteredLeads = filteredLeads.filter(l => 
          l.addedAt >= options.filters!.dateRange!.start && 
          l.addedAt <= options.filters!.dateRange!.end
        );
      }
    }
    
    // Générer le contenu selon le format
    if (options.format === 'csv') {
      const headers = options.fields.join(',');
      const rows = filteredLeads.map(lead => 
        options.fields.map(field => {
          const value = (lead as any)[field];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      );
      return [headers, ...rows].join('\n');
    }
    
    if (options.format === 'json') {
      return JSON.stringify(filteredLeads, null, 2);
    }
    
    return '';
  }
}

/**
 * Service pour les campagnes de leads
 */
export class CampaignService {
  static async getAllCampaigns(): Promise<LeadCampaign[]> {
    try {
      const stored = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      if (!stored) return [];
      
      const campaigns = JSON.parse(stored);
      return campaigns.map((campaign: any) => ({
        ...campaign,
        createdAt: new Date(campaign.createdAt),
        updatedAt: new Date(campaign.updatedAt)
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      return [];
    }
  }

  static async saveCampaigns(campaigns: LeadCampaign[]): Promise<void> {
    try {
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des campagnes:', error);
      throw error;
    }
  }

  static async createCampaign(campaign: Omit<LeadCampaign, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<LeadCampaign> {
    const campaigns = await this.getAllCampaigns();
    const newCampaign: LeadCampaign = {
      ...campaign,
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        total: campaign.leadIds.length,
        contacted: 0,
        interested: 0,
        clients: 0,
        notInterested: 0
      }
    };
    
    campaigns.push(newCampaign);
    await this.saveCampaigns(campaigns);
    return newCampaign;
  }
}

/**
 * Service pour les templates de contact
 */
export class TemplateService {
  static async getAllTemplates(): Promise<LeadTemplate[]> {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (!stored) return [];
      
      const templates = JSON.parse(stored);
      return templates.map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt)
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
      return [];
    }
  }

  static async saveTemplates(templates: LeadTemplate[]): Promise<void> {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des templates:', error);
      throw error;
    }
  }

  static async createTemplate(template: Omit<LeadTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeadTemplate> {
    const templates = await this.getAllTemplates();
    const newTemplate: LeadTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    templates.push(newTemplate);
    await this.saveTemplates(templates);
    return newTemplate;
  }
}
