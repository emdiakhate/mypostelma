/**
 * Service de scraping hybride pour génération de leads
 * Combine Jina.ai (Google Search) + N8N/Apify (Google Maps)
 */

import { EnrichedLead } from '@/types/crm';

// URL Jina.ai Reader API
const JINA_READER_URL = 'https://r.jina.ai';

// URL du webhook N8N existant
const N8N_WEBHOOK_URL = 'https://n8n.srv837294.hstgr.cloud/webhook/scrapping';

// Timeout pour les requêtes (en ms)
const FETCH_TIMEOUT = 15000; // 15 secondes

/**
 * Wrapper fetch avec timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

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
      const googleSearchUrl = `google.com/search?q=${encodeURIComponent(
        searchQuery
      )}`;

      console.log('🔎 Jina.ai scraping:', googleSearchUrl);

      // Appeler Jina.ai Reader avec timeout
      const response = await fetchWithTimeout(
        `${JINA_READER_URL}/${googleSearchUrl}`,
        {
          headers: {
            Accept: 'application/json',
            'X-Return-Format': 'json',
          },
        },
        10000 // 10 secondes pour Jina.ai
      );

      if (!response.ok) {
        console.warn('Jina.ai request failed:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('Jina.ai raw response:', JSON.stringify(data).substring(0, 500));

      const leads: Partial<EnrichedLead>[] = [];

      // Parser la structure de réponse Jina.ai
      // Jina.ai retourne un objet avec 'data' contenant le contenu structuré
      if (data && data.data) {
        const content = data.data;

        // Si le contenu est une chaîne (markdown), essayer de l'extraire
        if (typeof content === 'string') {
          const parsedLeads = this.parseJinaMarkdown(content, params);
          leads.push(...parsedLeads);
        }
        // Si c'est un objet avec des résultats structurés
        else if (content.results && Array.isArray(content.results)) {
          content.results.slice(0, params.maxResults || 10).forEach((item: any) => {
            const lead = this.parseJinaResult(item, params);
            if (lead) leads.push(lead);
          });
        }
        // Si c'est directement un tableau
        else if (Array.isArray(content)) {
          content.slice(0, params.maxResults || 10).forEach((item: any) => {
            const lead = this.parseJinaResult(item, params);
            if (lead) leads.push(lead);
          });
        }
      }

      console.log(`Jina.ai extracted ${leads.length} leads`);
      return leads;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Jina.ai request timed out');
      } else {
        console.error('Error scraping with Jina.ai:', error);
      }
      return [];
    }
  }

  /**
   * Parse un résultat individuel de Jina.ai
   */
  private static parseJinaResult(
    item: any,
    params: ScrapingParams
  ): Partial<EnrichedLead> | null {
    // Extraire le nom (title ou name)
    const name = item.title || item.name || item.heading;
    if (!name) return null;

    // Extraire le rating et reviews
    let rating: number | undefined;
    let reviewsCount: number | undefined;

    // Chercher le rating dans différents formats
    if (item.rating) {
      rating = typeof item.rating === 'number' ? item.rating : parseFloat(item.rating);
    } else if (item.stars) {
      rating = typeof item.stars === 'number' ? item.stars : parseFloat(item.stars);
    }

    // Chercher le nombre d'avis
    if (item.reviews) {
      reviewsCount = typeof item.reviews === 'number' ? item.reviews : parseInt(item.reviews);
    } else if (item.reviewsCount || item.reviews_count) {
      const count = item.reviewsCount || item.reviews_count;
      reviewsCount = typeof count === 'number' ? count : parseInt(count);
    }

    // Extraire l'adresse
    let address = item.address || item.snippet || item.description || '';

    // Si l'adresse contient le rating, le nettoyer
    if (typeof address === 'string') {
      address = address.replace(/★\s*[\d.]+\s*\([\d,]+\)/g, '').trim();
    }

    return {
      name,
      category: params.query,
      address,
      city: params.city,
      website: item.url || item.link || item.website || undefined,
      google_rating: rating,
      google_reviews_count: reviewsCount,
      google_maps_url: item.maps_url || item.mapUrl || undefined,
      phone: item.phone || item.telephone || undefined,
      source: 'jina',
      tags: ['jina_search'],
    } as Partial<EnrichedLead>;
  }

  /**
   * Parse le contenu markdown de Jina.ai pour extraire les leads
   */
  private static parseJinaMarkdown(
    content: string,
    params: ScrapingParams
  ): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];

    // Pattern pour extraire les informations de business
    // Exemple: "Restaurant ABC ★ 4.5 (123) · Adresse · Téléphone"
    const businessPattern = /([^\n]+?)\s*[★⭐]\s*([\d.]+)\s*\(([^\)]+)\)/g;

    let match;
    while ((match = businessPattern.exec(content)) !== null) {
      const [_, name, rating, reviews] = match;

      if (name && name.trim()) {
        leads.push({
          name: name.trim(),
          category: params.query,
          city: params.city,
          google_rating: parseFloat(rating) || undefined,
          google_reviews_count: parseInt(reviews.replace(/[,\s]/g, '')) || undefined,
          source: 'jina',
          tags: ['jina_search'],
        } as Partial<EnrichedLead>);
      }
    }

    // Si aucun lead trouvé avec le pattern rating, essayer un pattern plus simple
    if (leads.length === 0) {
      const simplePattern = /^([A-Z][^\n]{10,100})$/gm;
      let simpleMatch;
      let count = 0;

      while ((simpleMatch = simplePattern.exec(content)) !== null && count < (params.maxResults || 10)) {
        const name = simpleMatch[1].trim();
        if (name && !name.startsWith('http') && !name.includes('Google')) {
          leads.push({
            name,
            category: params.query,
            city: params.city,
            source: 'jina',
            tags: ['jina_search'],
          } as Partial<EnrichedLead>);
          count++;
        }
      }
    }

    return leads;
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

      const response = await fetchWithTimeout(
        N8N_WEBHOOK_URL,
        {
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
        },
        30000 // 30 secondes pour N8N/Apify (peut être plus lent)
      );

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
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('N8N request timed out');
      } else {
        console.error('Error scraping with N8N:', error);
      }
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
