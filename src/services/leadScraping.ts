/**
 * Service de scraping hybride pour génération de leads
 * Combine Jina.ai (Google Search) + N8N/Apify (Google Maps)
 */

import { EnrichedLead } from '@/types/crm';

// URL Jina.ai Reader API
const JINA_READER_URL = 'https://r.jina.ai';

// URL du webhook N8N existant
const N8N_WEBHOOK_URL = 'https://n8n.srv837294.hstgr.cloud/webhook/scrapping';

export interface ScrapingParams {
  query: string;
  city: string;
  maxResults?: number;
}

interface JinaResult {
  title: string;
  snippet?: string;
  url?: string;
  rating?: number;
  reviews?: number;
}

interface N8NLeadResult {
  Titre: string;
  Categorie: string;
  Addresse: string;
  Telephone?: string;
  Horaires?: string;
  Lien?: string;
  ImageUrl?: string;
  LinkedIns?: string;
  twitters?: string;
  instagrams?: string;
  facebooks?: string;
}

export class LeadScrapingService {
  /**
   * Scraping hybride : combine Jina.ai + N8N (Apify)
   */
  static async scrapeHybrid(params: ScrapingParams): Promise<EnrichedLead[]> {
    try {
      console.log('🔍 Starting hybrid scraping:', params);

      // Lancer les deux sources en parallèle
      const [jinaResults, n8nResults] = await Promise.allSettled([
        this.scrapeWithJina(params),
        this.scrapeWithN8N(params),
      ]);

      console.log('Jina results:', jinaResults);
      console.log('N8N results:', n8nResults);

      // Extraire les résultats valides
      const jinaLeads =
        jinaResults.status === 'fulfilled' ? jinaResults.value : [];
      const n8nLeads = n8nResults.status === 'fulfilled' ? n8nResults.value : [];

      console.log(
        `✅ Jina: ${jinaLeads.length} leads, N8N: ${n8nLeads.length} leads`
      );

      // Fusionner et dédupliquer
      const mergedLeads = this.mergeAndDeduplicate(jinaLeads, n8nLeads);

      console.log(`🎯 Merged: ${mergedLeads.length} unique leads`);

      return mergedLeads;
    } catch (error) {
      console.error('Error in hybrid scraping:', error);
      throw error;
    }
  }

  /**
   * Scraping avec Jina.ai Reader (gratuit)
   * Utilise Google Search pour trouver des leads
   */
  private static async scrapeWithJina(
    params: ScrapingParams
  ): Promise<Partial<EnrichedLead>[]> {
    try {
      const searchQuery = `${params.query} ${params.city}`;
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        searchQuery
      )}`;

      console.log('🔎 Jina.ai scraping:', googleSearchUrl);

      // Appeler Jina.ai Reader
      const response = await fetch(`${JINA_READER_URL}/${googleSearchUrl}`, {
        headers: {
          Accept: 'application/json',
          'X-Return-Format': 'json',
        },
      });

      if (!response.ok) {
        console.warn('Jina.ai request failed:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('Jina.ai raw response:', data);

      // Parser les résultats Jina
      // La structure exacte dépend de la réponse de Jina.ai
      // On va essayer d'extraire les informations pertinentes
      const leads: Partial<EnrichedLead>[] = [];

      // Jina.ai retourne du markdown ou JSON avec le contenu de la page
      // On va essayer de parser les snippets Google
      if (data.data && Array.isArray(data.data)) {
        data.data.slice(0, params.maxResults || 10).forEach((item: any) => {
          if (item.title && item.url) {
            leads.push({
              name: item.title,
              category: params.query,
              address: item.snippet || '',
              city: params.city,
              website: item.url,
              google_rating: item.rating || undefined,
              google_reviews_count: item.reviews || undefined,
              source: 'jina',
              tags: ['jina_search'],
            } as Partial<EnrichedLead>);
          }
        });
      }

      console.log(`Jina.ai extracted ${leads.length} leads`);
      return leads;
    } catch (error) {
      console.error('Error scraping with Jina.ai:', error);
      return [];
    }
  }

  /**
   * Scraping avec N8N (utilise Apify en backend)
   * Réutilise le workflow existant
   */
  private static async scrapeWithN8N(
    params: ScrapingParams
  ): Promise<Partial<EnrichedLead>[]> {
    try {
      console.log('🤖 N8N/Apify scraping:', params);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: params.query,
          city: params.city,
          maxResults: params.maxResults || 10,
          includePhone: true,
          includeEmail: true,
          includeSocial: true,
        }),
      });

      if (!response.ok) {
        console.warn('N8N request failed:', response.status);
        return [];
      }

      const result = await response.json();

      // Parser la réponse N8N (format existant)
      const data = Array.isArray(result) ? result[0] : result;

      if (!data.leads) {
        console.warn('No leads in N8N response');
        return [];
      }

      // Parser la string JSON des leads
      let parsedLeads: any[] = [];

      if (typeof data.leads === 'string') {
        try {
          const leadsArray = JSON.parse(data.leads);
          parsedLeads = leadsArray.map((item: any) => item.json || item);
        } catch (parseError) {
          console.error('Error parsing N8N leads:', parseError);
          return [];
        }
      } else if (Array.isArray(data.leads)) {
        parsedLeads = data.leads;
      }

      // Convertir au format EnrichedLead
      const leads: Partial<EnrichedLead>[] = parsedLeads.map(
        (lead: N8NLeadResult) => {
          const parseSocialMedia = (jsonString: string): string[] => {
            try {
              const parsed = JSON.parse(jsonString);
              return Array.isArray(parsed)
                ? parsed.filter((url) => url && url.trim() !== '')
                : [];
            } catch {
              return [];
            }
          };

          return {
            name: lead.Titre || 'Sans nom',
            category: lead.Categorie || params.query,
            address: lead.Addresse || '',
            city: params.city,
            phone: lead.Telephone && lead.Telephone !== 'undefined' ? lead.Telephone : undefined,
            website: lead.Lien || undefined,
            image_url: lead.ImageUrl || undefined,
            business_hours:
              typeof lead.Horaires === 'string'
                ? { general: lead.Horaires }
                : undefined,
            social_media: {
              instagram: parseSocialMedia(lead.instagrams || '[]')[0],
              facebook: parseSocialMedia(lead.facebooks || '[]')[0],
              linkedin: parseSocialMedia(lead.LinkedIns || '[]')[0],
              twitter: parseSocialMedia(lead.twitters || '[]')[0],
            },
            source: 'apify',
            tags: ['apify_maps'],
          } as Partial<EnrichedLead>;
        }
      );

      console.log(`N8N extracted ${leads.length} leads`);
      return leads;
    } catch (error) {
      console.error('Error scraping with N8N:', error);
      return [];
    }
  }

  /**
   * Fusionne et déduplique les leads de différentes sources
   */
  private static mergeAndDeduplicate(
    jinaLeads: Partial<EnrichedLead>[],
    n8nLeads: Partial<EnrichedLead>[]
  ): EnrichedLead[] {
    const merged: Map<string, Partial<EnrichedLead>> = new Map();

    // Ajouter les leads N8N d'abord (plus complets)
    n8nLeads.forEach((lead) => {
      const key = this.getLeadKey(lead);
      merged.set(key, lead);
    });

    // Fusionner avec les leads Jina
    jinaLeads.forEach((jinaLead) => {
      const key = this.getLeadKey(jinaLead);
      const existing = merged.get(key);

      if (existing) {
        // Fusionner les données (Jina peut avoir des infos manquantes dans N8N)
        merged.set(key, {
          ...existing,
          google_rating: jinaLead.google_rating || existing.google_rating,
          google_reviews_count:
            jinaLead.google_reviews_count || existing.google_reviews_count,
          website: jinaLead.website || existing.website,
          tags: [
            ...(existing.tags || []),
            ...(jinaLead.tags || []),
          ].filter((v, i, a) => a.indexOf(v) === i), // Unique tags
        });
      } else {
        // Nouveau lead de Jina
        merged.set(key, jinaLead);
      }
    });

    // Convertir en EnrichedLead complet
    const leads: EnrichedLead[] = Array.from(merged.values()).map((lead) => ({
      id: '', // Will be set by DB
      user_id: '', // Will be set by service
      name: lead.name || 'Sans nom',
      category: lead.category || 'Autre',
      address: lead.address || '',
      city: lead.city || '',
      postal_code: lead.postal_code,
      phone: lead.phone,
      whatsapp: lead.whatsapp || lead.phone, // Use phone as WhatsApp by default
      email: lead.email,
      website: lead.website,
      social_media: lead.social_media,
      image_url: lead.image_url,
      google_rating: lead.google_rating,
      google_reviews_count: lead.google_reviews_count,
      google_maps_url: lead.google_maps_url,
      business_hours: lead.business_hours,
      status: 'new',
      score: this.calculateLeadScore(lead),
      notes: '',
      tags: lead.tags || [],
      source: lead.source || 'hybrid',
      added_at: new Date(),
    }));

    return leads;
  }

  /**
   * Génère une clé unique pour un lead (pour déduplication)
   */
  private static getLeadKey(lead: Partial<EnrichedLead>): string {
    // Utiliser le nom normalisé + ville
    const name = (lead.name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
    const city = (lead.city || '').toLowerCase().trim();
    return `${name}_${city}`;
  }

  /**
   * Calcule un score pour un lead (1-5)
   */
  private static calculateLeadScore(lead: Partial<EnrichedLead>): number {
    let score = 3; // Score de base

    // +1 si a un site web
    if (lead.website) score += 0.5;

    // +1 si a des réseaux sociaux
    if (
      lead.social_media &&
      Object.values(lead.social_media).some((v) => v)
    ) {
      score += 0.5;
    }

    // +1 si a un téléphone
    if (lead.phone) score += 0.5;

    // +0.5 si bon rating Google
    if (lead.google_rating && lead.google_rating >= 4.0) {
      score += 0.5;
    }

    // Limiter entre 1 et 5
    return Math.min(5, Math.max(1, Math.round(score)));
  }

  /**
   * Scraping avec Jina.ai seul (fallback gratuit)
   */
  static async scrapeWithJinaOnly(
    params: ScrapingParams
  ): Promise<EnrichedLead[]> {
    const jinaLeads = await this.scrapeWithJina(params);
    return jinaLeads.map((lead) => ({
      id: '',
      user_id: '',
      name: lead.name || 'Sans nom',
      category: lead.category || params.query,
      address: lead.address || '',
      city: lead.city || params.city,
      status: 'new',
      score: this.calculateLeadScore(lead),
      notes: '',
      tags: lead.tags || [],
      source: 'jina',
      added_at: new Date(),
      ...lead,
    })) as EnrichedLead[];
  }

  /**
   * Scraping avec N8N seul (Apify)
   */
  static async scrapeWithN8NOnly(
    params: ScrapingParams
  ): Promise<EnrichedLead[]> {
    const n8nLeads = await this.scrapeWithN8N(params);
    return n8nLeads.map((lead) => ({
      id: '',
      user_id: '',
      name: lead.name || 'Sans nom',
      category: lead.category || params.query,
      address: lead.address || '',
      city: lead.city || params.city,
      status: 'new',
      score: this.calculateLeadScore(lead),
      notes: '',
      tags: lead.tags || [],
      source: 'apify',
      added_at: new Date(),
      ...lead,
    })) as EnrichedLead[];
  }
}
