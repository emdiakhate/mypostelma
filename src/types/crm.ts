/**
 * Types pour le système CRM IA
 * Sprint 1: Core CRM avec secteurs, segments, tags, et leads enrichis
 */

// ==============================================
// Secteurs & Segments
// ==============================================

export interface CRMSector {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string; // Nom de l'icône Lucide
  color?: string; // Code couleur hex
  created_at: Date;
  updated_at: Date;
}

export interface CRMSegment {
  id: string;
  sector_id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CRMTag {
  id: string;
  sector_id?: string;
  user_id: string;
  name: string;
  category?: 'amenity' | 'feature' | 'service' | 'other';
  created_at: Date;
}

// ==============================================
// Leads enrichis (extension du type Lead existant)
// ==============================================

export interface EnrichedLead {
  id: string;
  user_id: string;
  name: string;
  category: string; // Catégorie legacy

  // Nouveau système secteur/segment
  sector_id?: string;
  segment_id?: string;
  sector?: CRMSector;
  segment?: CRMSegment;

  // Localisation
  address: string;
  city: string;
  postal_code?: string;
  google_maps_url?: string;

  // Contacts
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;

  // Réseaux sociaux
  social_media?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };

  // Médias
  image_url?: string;

  // Google Business
  google_rating?: number;
  google_reviews_count?: number;
  business_hours?: {
    [day: string]: string; // Ex: { "monday": "9:00-18:00" }
  };

  // CRM
  status: LeadStatus;
  score?: number; // 1-5
  notes: string;
  tags: string[];

  // Métadonnées
  source: string;
  added_at: Date;
  last_contacted_at?: Date;
  updated_at?: Date;
}

export type LeadStatus =
  | 'new'           // Nouveau lead
  | 'contacted'     // Contacté
  | 'interested'    // Intéressé
  | 'qualified'     // Qualifié
  | 'client'        // Devenu client
  | 'not_interested' // Pas intéressé
  | 'archived';     // Archivé

// ==============================================
// Campagnes
// ==============================================

export type CampaignChannel = 'email' | 'whatsapp' | 'both';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled';

export interface CRMCampaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  channel: CampaignChannel;
  status: CampaignStatus;

  // Ciblage
  target_sector_ids?: string[];
  target_segment_ids?: string[];
  target_cities?: string[];
  target_tags?: string[];
  target_status?: LeadStatus[];

  // Message
  subject?: string;
  message: string;

  // Programmation
  scheduled_at?: Date;
  sent_at?: Date;
  completed_at?: Date;

  // Statistiques
  total_leads: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  replied_count: number;
  failed_count: number;

  created_at: Date;
  updated_at: Date;
}

export interface CampaignTarget {
  sector_ids?: string[];
  segment_ids?: string[];
  cities?: string[];
  tags?: string[];
  status?: LeadStatus[];
}

export interface CampaignMessage {
  subject?: string;
  content: string;
  variables: string[]; // Ex: ['{{nom}}', '{{ville}}']
}

// ==============================================
// Interactions
// ==============================================

export type InteractionType = 'email' | 'whatsapp' | 'call' | 'meeting' | 'note' | 'status_change';
export type InteractionStatus = 'sent' | 'delivered' | 'read' | 'replied' | 'failed';

export interface CRMLeadInteraction {
  id: string;
  lead_id: string;
  campaign_id?: string;
  user_id: string;

  type: InteractionType;
  channel?: string;
  status?: InteractionStatus;

  subject?: string;
  content?: string;
  metadata?: Record<string, any>;

  created_at: Date;
}

// ==============================================
// Tâches
// ==============================================

export type TaskType = 'call' | 'email' | 'meeting' | 'followup' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CRMTask {
  id: string;
  user_id: string;
  lead_id?: string;
  assigned_to?: string;

  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;

  due_date?: Date;
  completed_at?: Date;

  created_at: Date;
  updated_at: Date;

  // Relations (optionnelles)
  lead?: EnrichedLead;
}

// ==============================================
// Statistiques & Analytics
// ==============================================

export interface CRMStats {
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  interested_leads: number;
  qualified_leads: number;
  client_leads: number;
  conversion_rate: number;

  by_sector: {
    sector_id: string;
    sector_name: string;
    count: number;
    avg_score: number;
  }[];

  by_status: {
    status: LeadStatus;
    count: number;
    percentage: number;
  }[];

  by_city: {
    city: string;
    count: number;
  }[];

  tasks_today: number;
  tasks_overdue: number;
  tasks_this_week: number;
}

export interface SectorAnalytics {
  sector_id: string;
  sector_name: string;
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  interested_leads: number;
  client_leads: number;
  avg_score: number;
}

// ==============================================
// Scraping (Jina.ai + Apify)
// ==============================================

export interface ScrapingParams {
  query: string; // Ex: "restaurant"
  city: string; // Ex: "Dakar"
  maxResults?: number;
  sources?: ('jina' | 'apify')[]; // Sources à utiliser
}

export interface JinaGoogleResult {
  title: string;
  address: string;
  rating?: number;
  reviews_count?: number;
  phone?: string;
  website?: string;
  hours?: string;
}

export interface ApifyGoogleMapsResult {
  title: string;
  address: string;
  city: string;
  location?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  category?: string;
  image_url?: string;
  google_maps_url?: string;
  social_media?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface ScrapingResult {
  leads: EnrichedLead[];
  source: 'jina' | 'apify' | 'merged';
  found_count: number;
  timestamp: Date;
}

// ==============================================
// Configuration CRM
// ==============================================

export interface CRMConfig {
  sectors: CRMSector[];
  segments_by_sector: {
    [sector_id: string]: CRMSegment[];
  };
  tags_by_sector: {
    [sector_id: string]: CRMTag[];
  };
}

// ==============================================
// Filtres & Recherche
// ==============================================

export interface LeadFilters {
  search?: string;
  sector_ids?: string[];
  segment_ids?: string[];
  status?: LeadStatus[];
  cities?: string[];
  tags?: string[];
  score_min?: number;
  score_max?: number;
  has_email?: boolean;
  has_phone?: boolean;
  has_whatsapp?: boolean;
  has_social?: boolean;
}

export interface LeadSortOptions {
  field: 'name' | 'city' | 'score' | 'added_at' | 'last_contacted_at';
  order: 'asc' | 'desc';
}

// ==============================================
// Formulaires
// ==============================================

export interface SectorFormData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface SegmentFormData {
  sector_id: string;
  name: string;
  description?: string;
}

export interface TagFormData {
  sector_id?: string;
  name: string;
  category?: string;
}

export interface LeadFormData {
  name: string;
  sector_id?: string;
  segment_id?: string;
  address: string;
  city: string;
  postal_code?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  social_media?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  google_rating?: number;
  google_reviews_count?: number;
  google_maps_url?: string;
  image_url?: string;
  business_hours?: Record<string, string>;
  status?: LeadStatus;
  score?: number;
  notes?: string;
  tags?: string[];
  source?: string;
}

export interface CampaignFormData {
  name: string;
  description?: string;
  channel: CampaignChannel;
  target: CampaignTarget;
  message: CampaignMessage;
  scheduled_at?: Date;
}

export interface TaskFormData {
  lead_id?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  due_date?: Date;
}
