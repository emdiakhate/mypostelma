/**
 * Types pour le système de Lead Generation
 * Phase 4: Lead Generation System
 */

export type LeadStatus = 
  | 'new'           // Nouveau lead
  | 'contacted'     // Contacté
  | 'interested'    // Intéressé
  | 'client'        // Devenu client
  | 'not_interested'; // Pas intéressé

export interface SocialMediaHandles {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
}

export interface LeadMetrics {
  instagramFollowers?: number;
  facebookLikes?: number;
  linkedinFollowers?: number;
  twitterFollowers?: number;
}

export interface Lead {
  id: string;
  name: string;
  category: string;          // Ex: 'restaurant', 'salon', 'coach'
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: SocialMediaHandles;
  metrics?: LeadMetrics;
  status: LeadStatus;
  notes: string;
  tags: string[];           // Ex: ['premium', 'hot_lead']
  addedAt: Date;
  lastContactedAt?: Date;
  source: string;           // 'google_maps', 'manual', 'import'
}

export interface LeadSearchParams {
  query: string;            // Ex: 'restaurant'
  city: string;             // Ex: 'paris'
  maxResults: number;       // Ex: 100
  includeEmail: boolean;
  includePhone: boolean;
  includeSocial: boolean;
}

export interface LeadSearchResult {
  leads: Lead[];
  totalFound: number;
  searchParams: LeadSearchParams;
  executedAt: Date;
  duration: number;         // En secondes
}

export interface LeadCampaign {
  id: string;
  name: string;
  description?: string;
  leadIds: string[];
  createdAt: Date;
  updatedAt: Date;
  stats: {
    total: number;
    contacted: number;
    interested: number;
    clients: number;
    notInterested: number;
  };
}

export interface LeadContact {
  id: string;
  leadId: string;
  type: 'email' | 'phone' | 'social' | 'in_person';
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'failed';
  content: string;
  sentAt: Date;
  responseAt?: Date;
  notes?: string;
}

export interface LeadTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  type: 'email' | 'linkedin' | 'instagram' | 'facebook';
  variables: string[];      // Ex: ['{name}', '{business}', '{city}']
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadAnalytics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  interestedLeads: number;
  clientLeads: number;
  conversionRate: number;
  avgResponseTime: number;   // En heures
  topCategories: Array<{
    category: string;
    count: number;
    conversionRate: number;
  }>;
  topCities: Array<{
    city: string;
    count: number;
    conversionRate: number;
  }>;
  monthlyStats: Array<{
    month: string;
    newLeads: number;
    contacted: number;
    converted: number;
  }>;
}

export interface LeadImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  leads: Lead[];
}

export interface LeadExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  fields: string[];
  filters?: {
    status?: LeadStatus[];
    category?: string[];
    city?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}
