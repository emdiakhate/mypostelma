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
   * Utilise Google Maps pour trouver des leads (meilleure source)
   */
  private static async scrapeWithJina(
    params: ScrapingParams
  ): Promise<Partial<EnrichedLead>[]> {
    try {
      // Utiliser Google Maps au lieu de Google Search pour de meilleurs résultats
      const searchQuery = `${params.query} ${params.city}`;
      const googleMapsUrl = `google.com/maps/search/${encodeURIComponent(searchQuery)}`;

      console.log('🔎 Jina.ai scraping Google Maps:', googleMapsUrl);

      // Appeler Jina.ai Reader avec timeout
      const response = await fetchWithTimeout(
        `${JINA_READER_URL}/${googleMapsUrl}`,
        {
          headers: {
            Accept: 'application/json',
            'X-Return-Format': 'json',
          },
        },
        15000 // 15 secondes pour Jina.ai
      );

      if (!response.ok) {
        console.warn('Jina.ai request failed:', response.status);
        // Fallback: essayer avec Google Search local
        return this.scrapeWithJinaFallback(params);
      }

      const data = await response.json();
      console.log('Jina.ai raw response length:', JSON.stringify(data).length);

      const leads: Partial<EnrichedLead>[] = [];

      // Parser la structure de réponse Jina.ai
      if (data && data.data) {
        const content = data.data;

        // Si le contenu est une chaîne (markdown), parser
        if (typeof content === 'string') {
          const parsedLeads = this.parseJinaMarkdown(content, params);
          leads.push(...parsedLeads);
        }
        // Si c'est un objet avec du contenu markdown
        else if (content.content && typeof content.content === 'string') {
          const parsedLeads = this.parseJinaMarkdown(content.content, params);
          leads.push(...parsedLeads);
        }
        // Si c'est un objet avec des résultats structurés
        else if (content.results && Array.isArray(content.results)) {
          content.results.slice(0, params.maxResults || 10).forEach((item: any) => {
            const lead = this.parseJinaResult(item, params);
            if (lead) leads.push(lead);
          });
        }
      }

      console.log(`Jina.ai extracted ${leads.length} leads`);
      
      // Si toujours 0 leads, essayer le fallback
      if (leads.length === 0) {
        return this.scrapeWithJinaFallback(params);
      }
      
      return leads;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Jina.ai request timed out');
      } else {
        console.error('Error scraping with Jina.ai:', error);
      }
      // Essayer le fallback
      return this.scrapeWithJinaFallback(params);
    }
  }

  /**
   * Fallback: Utiliser un site d'annuaire local comme source alternative
   */
  private static async scrapeWithJinaFallback(
    params: ScrapingParams
  ): Promise<Partial<EnrichedLead>[]> {
    try {
      // Utiliser PagesJaunes ou Yelp comme fallback
      const searchQuery = `${params.query} ${params.city}`;
      const yelpUrl = `yelp.com/search?find_desc=${encodeURIComponent(params.query)}&find_loc=${encodeURIComponent(params.city)}`;
      
      console.log('🔄 Jina.ai fallback avec Yelp:', yelpUrl);

      const response = await fetchWithTimeout(
        `${JINA_READER_URL}/${yelpUrl}`,
        {
          headers: {
            Accept: 'application/json',
            'X-Return-Format': 'json',
          },
        },
        12000
      );

      if (!response.ok) {
        console.warn('Jina.ai fallback failed:', response.status);
        return [];
      }

      const data = await response.json();
      const leads: Partial<EnrichedLead>[] = [];

      if (data && data.data) {
        const content = typeof data.data === 'string' ? data.data : data.data.content || '';
        
        // Pattern spécifique Yelp: les noms de business sont souvent en liens
        const yelpPattern = /\[([^\]]{3,60})\]\([^\)]*yelp\.com\/biz[^\)]*\)/g;
        let match;
        while ((match = yelpPattern.exec(content)) !== null && leads.length < (params.maxResults || 10)) {
          const name = match[1].trim();
          if (name && !leads.some(l => l.name?.toLowerCase() === name.toLowerCase())) {
            leads.push({
              name,
              category: params.query,
              city: params.city,
              source: 'jina',
              tags: ['yelp_fallback'],
            } as Partial<EnrichedLead>);
          }
        }

        // Si pas de résultats Yelp, parser comme markdown générique
        if (leads.length === 0) {
          const genericLeads = this.parseJinaMarkdown(content, params);
          leads.push(...genericLeads);
        }
      }

      console.log(`Jina.ai fallback extracted ${leads.length} leads`);
      return leads;
    } catch (error) {
      console.error('Error in Jina fallback:', error);
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
   * Gère le format Google Search markdown
   */
  private static parseJinaMarkdown(
    content: string,
    params: ScrapingParams
  ): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];
    const maxResults = params.maxResults || 10;

    // Pattern 1: Format avec étoiles et avis "Restaurant ABC ★ 4.5 (123)"
    const ratingPattern = /([^\n★⭐]+?)\s*[★⭐]\s*([\d.,]+)\s*\(([^)]+)\)/g;
    let match;
    while ((match = ratingPattern.exec(content)) !== null && leads.length < maxResults) {
      const [_, rawName, rating, reviews] = match;
      const name = rawName.replace(/^[\s\-·•]+/, '').trim();
      if (name && name.length > 3 && !name.toLowerCase().includes('google')) {
        leads.push({
          name,
          category: params.query,
          city: params.city,
          google_rating: parseFloat(rating.replace(',', '.')) || undefined,
          google_reviews_count: parseInt(reviews.replace(/[,\s\xa0]/g, '')) || undefined,
          source: 'jina',
          tags: ['jina_search'],
        } as Partial<EnrichedLead>);
      }
    }

    // Pattern 2: Liens markdown avec titres "[Nom du business](url)"
    if (leads.length < maxResults) {
      const linkPattern = /\[([^\]]{5,80})\]\((https?:\/\/[^\)]+)\)/g;
      while ((match = linkPattern.exec(content)) !== null && leads.length < maxResults) {
        const [_, name, url] = match;
        const cleanName = name.trim();
        // Exclure les liens de navigation Google
        if (cleanName && 
            !cleanName.toLowerCase().includes('google') &&
            !cleanName.toLowerCase().includes('search') &&
            !cleanName.toLowerCase().includes('image') &&
            !url.includes('google.com/search') &&
            !leads.some(l => l.name?.toLowerCase() === cleanName.toLowerCase())) {
          leads.push({
            name: cleanName,
            category: params.query,
            city: params.city,
            website: url.includes('maps.google') ? undefined : url,
            google_maps_url: url.includes('maps.google') ? url : undefined,
            source: 'jina',
            tags: ['jina_search'],
          } as Partial<EnrichedLead>);
        }
      }
    }

    // Pattern 3: Titres de section "### Nom du business" ou "## Nom"
    if (leads.length < maxResults) {
      const headingPattern = /^#{1,3}\s+([^\n]{5,80})$/gm;
      while ((match = headingPattern.exec(content)) !== null && leads.length < maxResults) {
        const name = match[1].trim();
        if (name && 
            !name.toLowerCase().includes('google') &&
            !name.toLowerCase().includes('search') &&
            !name.toLowerCase().includes('result') &&
            !leads.some(l => l.name?.toLowerCase() === name.toLowerCase())) {
          leads.push({
            name,
            category: params.query,
            city: params.city,
            source: 'jina',
            tags: ['jina_search'],
          } as Partial<EnrichedLead>);
        }
      }
    }

    // Pattern 4: Lignes avec format business typique (mot capitalisé suivi de détails)
    if (leads.length < maxResults) {
      const businessLinePattern = /^([A-Z][A-Za-zÀ-ÿ\s\-'&]{4,50})\s*[-·•|]\s*(.+)$/gm;
      while ((match = businessLinePattern.exec(content)) !== null && leads.length < maxResults) {
        const [_, name, details] = match;
        const cleanName = name.trim();
        if (cleanName && 
            !cleanName.toLowerCase().includes('google') &&
            !cleanName.toLowerCase().includes('accessibility') &&
            !leads.some(l => l.name?.toLowerCase() === cleanName.toLowerCase())) {
          leads.push({
            name: cleanName,
            category: params.query,
            city: params.city,
            address: details.includes(params.city) ? details : undefined,
            source: 'jina',
            tags: ['jina_search'],
          } as Partial<EnrichedLead>);
        }
      }
    }

    console.log(`parseJinaMarkdown extracted ${leads.length} leads`);
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
