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
   * Jina est requis, N8N est optionnel
   */
  static async scrapeHybrid(params: ScrapingParams): Promise<EnrichedLead[]> {
    const startTime = Date.now();

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 HYBRID SCRAPING STARTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Parameters:', {
        query: params.query,
        city: params.city,
        maxResults: params.maxResults || 10,
      });
      console.log('');

      // Lancer les deux sources en parallèle
      console.log('⏱️ Launching parallel requests...');
      const [jinaResults, n8nResults] = await Promise.allSettled([
        this.scrapeWithJina(params),
        this.scrapeWithN8N(params),
      ]);

      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 RESULTS SUMMARY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Extraire les résultats valides
      const jinaLeads =
        jinaResults.status === 'fulfilled' ? jinaResults.value : [];
      const n8nLeads = n8nResults.status === 'fulfilled' ? n8nResults.value : [];

      // Détails des résultats
      if (jinaResults.status === 'fulfilled') {
        console.log(`✅ Jina.ai: ${jinaLeads.length} leads`);
      } else {
        console.error(`❌ Jina.ai failed:`, jinaResults.reason);
      }

      if (n8nResults.status === 'fulfilled') {
        if (n8nLeads.length > 0) {
          console.log(`✅ N8N/Apify: ${n8nLeads.length} leads`);
        } else {
          console.log(`⚠️ N8N/Apify: 0 leads (timeout ou échec - mode fallback Jina actif)`);
        }
      } else {
        console.warn(`⚠️ N8N/Apify rejected:`, n8nResults.reason?.message || 'Unknown error');
      }

      console.log('');

      // Vérifier qu'on a au moins des résultats Jina
      if (jinaLeads.length === 0 && n8nLeads.length === 0) {
        const elapsed = Date.now() - startTime;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`❌ NO RESULTS - Completed in ${elapsed}ms`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('💡 Debugging tips:');
        console.log('1. Check if Google has results for this query');
        console.log('2. Try different city spelling');
        console.log('3. Check console for parsing details above');
        console.log('');
        return [];
      }

      // Fusionner et dédupliquer
      console.log('🔄 Merging and deduplicating...');
      const mergedLeads = this.mergeAndDeduplicate(jinaLeads, n8nLeads);

      const elapsed = Date.now() - startTime;

      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ SCRAPING COMPLETED in ${elapsed}ms`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🎯 Final result: ${mergedLeads.length} unique leads`);
      console.log('Sources breakdown:');
      console.log(`  - Jina.ai contributed: ${jinaLeads.length} leads`);
      console.log(`  - N8N/Apify contributed: ${n8nLeads.length} leads`);
      console.log(`  - After deduplication: ${mergedLeads.length} leads`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      return mergedLeads;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`❌ SCRAPING ERROR after ${elapsed}ms`);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
      throw error;
    }
  }

  /**
   * Scraping avec Jina.ai Reader (gratuit)
   * Stratégie hybride: Google Search + Google Maps
   */
  private static async scrapeWithJina(
    params: ScrapingParams
  ): Promise<Partial<EnrichedLead>[]> {
    try {
      // Augmenter le nombre demandé pour compenser les filtres (demander 50% de plus)
      const requestCount = Math.ceil((params.maxResults || 10) * 1.5);

      console.log(`🔎 Jina.ai scraping: requesting ${requestCount} to get ${params.maxResults} results`);

      // Essayer Google Maps d'abord (plus fiable pour les leads locaux)
      const mapsLeads = await this.scrapeJinaGoogleMaps(params, requestCount);

      // Si pas assez de résultats, compléter avec Google Search
      if (mapsLeads.length < (params.maxResults || 10)) {
        console.log(`📍 Maps returned ${mapsLeads.length}, complementing with Search...`);
        const searchLeads = await this.scrapeJinaGoogleSearch(params, requestCount);

        // Fusionner sans doublons
        const combinedLeads = [...mapsLeads];
        searchLeads.forEach(searchLead => {
          const isDuplicate = mapsLeads.some(mapsLead =>
            this.getLeadKey(mapsLead) === this.getLeadKey(searchLead)
          );
          if (!isDuplicate) {
            combinedLeads.push(searchLead);
          }
        });

        console.log(`✅ Combined: ${combinedLeads.length} unique leads from Jina`);
        return combinedLeads.slice(0, params.maxResults || 10);
      }

      console.log(`✅ Jina.ai extracted ${mapsLeads.length} leads from Maps`);
      return mapsLeads.slice(0, params.maxResults || 10);
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
   * Scraping Google Maps via Jina.ai (meilleur pour leads locaux)
   */
  private static async scrapeJinaGoogleMaps(
    params: ScrapingParams,
    maxResults: number
  ): Promise<Partial<EnrichedLead>[]> {
    try {
      const searchQuery = `${params.query} ${params.city}`;
      const googleMapsUrl = `google.com/maps/search/${encodeURIComponent(searchQuery)}`;

      console.log(`🗺️ Jina.ai scraping Google Maps: ${googleMapsUrl}`);

      const response = await fetchWithTimeout(
        `${JINA_READER_URL}/${googleMapsUrl}`,
        {
          headers: {
            Accept: 'application/json',
            'X-Return-Format': 'json',
          },
        },
        15000 // 15 secondes pour Maps
      );

      if (!response.ok) {
        console.warn('Jina.ai Maps request failed:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('Jina.ai Maps raw response length:', JSON.stringify(data).length);

      return this.parseJinaResponse(data, params, 'maps', maxResults);
    } catch (error: any) {
      console.warn('Jina.ai Maps scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scraping Google Search via Jina.ai (fallback)
   */
  private static async scrapeJinaGoogleSearch(
    params: ScrapingParams,
    maxResults: number
  ): Promise<Partial<EnrichedLead>[]> {
    try {
      const searchQuery = `${params.query} ${params.city}`;
      const googleSearchUrl = `google.com/search?q=${encodeURIComponent(searchQuery)}`;

      console.log(`🔍 Jina.ai scraping Google Search: ${googleSearchUrl}`);

      const response = await fetchWithTimeout(
        `${JINA_READER_URL}/${googleSearchUrl}`,
        {
          headers: {
            Accept: 'application/json',
            'X-Return-Format': 'json',
          },
        },
        10000 // 10 secondes pour Search
      );

      if (!response.ok) {
        console.warn('Jina.ai Search request failed:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('Jina.ai Search raw response length:', JSON.stringify(data).length);

      return this.parseJinaResponse(data, params, 'search', maxResults);
    } catch (error: any) {
      console.warn('Jina.ai Search scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Parse la réponse Jina.ai (unifié pour Maps et Search)
   */
  private static parseJinaResponse(
    data: any,
    params: ScrapingParams,
    source: 'maps' | 'search',
    maxResults: number
  ): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];

    if (!data || !data.data) {
      console.warn('No data in Jina response');
      return leads;
    }

    const content = data.data;

    // Si le contenu est une chaîne (markdown)
    if (typeof content === 'string') {
      console.log(`📝 Parsing markdown content (${content.length} chars) from ${source}`);
      const parsedLeads = this.parseJinaMarkdown(content, params);
      leads.push(...parsedLeads);
    }
    // Si c'est un objet avec des résultats structurés
    else if (content.results && Array.isArray(content.results)) {
      content.results.slice(0, maxResults).forEach((item: any) => {
        const lead = this.parseJinaResult(item, params);
        if (lead) leads.push(lead);
      });
    }
    // Si c'est directement un tableau
    else if (Array.isArray(content)) {
      content.slice(0, maxResults).forEach((item: any) => {
        const lead = this.parseJinaResult(item, params);
        if (lead) leads.push(lead);
      });
    }

    console.log(`📊 Parsed ${leads.length} leads from ${source}`);
    return leads;
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
   * Utilise plusieurs stratégies de parsing pour gérer différents formats
   */
  private static parseJinaMarkdown(
    content: string,
    params: ScrapingParams
  ): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];
    const maxResults = params.maxResults || 10;

    console.log(`🔍 Parsing strategies for markdown (${content.length} chars)`);

    // STRATÉGIE 1: Pattern avec étoiles et rating
    // Exemple: "Restaurant ABC ★ 4.5 (123)" ou "ABC · 4,5 ⭐ (123 avis)"
    const strategy1Leads = this.parseMarkdownStrategy1(content, params);
    if (strategy1Leads.length > 0) {
      console.log(`✅ Strategy 1 (ratings): found ${strategy1Leads.length} leads`);
      leads.push(...strategy1Leads);
    }

    // STRATÉGIE 2: Pattern avec adresses structurées
    // Exemple: "Restaurant Name\nAdresse: 123 Rue...\nTéléphone: ..."
    if (leads.length < maxResults) {
      const strategy2Leads = this.parseMarkdownStrategy2(content, params);
      if (strategy2Leads.length > 0) {
        console.log(`✅ Strategy 2 (addresses): found ${strategy2Leads.length} leads`);
        leads.push(...strategy2Leads);
      }
    }

    // STRATÉGIE 3: Pattern Google Maps URLs
    // Chercher les URLs Google Maps dans le contenu
    if (leads.length < maxResults) {
      const strategy3Leads = this.parseMarkdownStrategy3(content, params);
      if (strategy3Leads.length > 0) {
        console.log(`✅ Strategy 3 (maps URLs): found ${strategy3Leads.length} leads`);
        leads.push(...strategy3Leads);
      }
    }

    // STRATÉGIE 4: Pattern liste avec tirets ou numéros
    // Exemple: "- Restaurant ABC" ou "1. Restaurant ABC"
    if (leads.length < maxResults) {
      const strategy4Leads = this.parseMarkdownStrategy4(content, params);
      if (strategy4Leads.length > 0) {
        console.log(`✅ Strategy 4 (lists): found ${strategy4Leads.length} leads`);
        leads.push(...strategy4Leads);
      }
    }

    // STRATÉGIE 5: Pattern simple (fallback)
    // Lignes commençant par majuscule avec longueur raisonnable
    if (leads.length < maxResults) {
      const strategy5Leads = this.parseMarkdownStrategy5(content, params);
      if (strategy5Leads.length > 0) {
        console.log(`✅ Strategy 5 (simple): found ${strategy5Leads.length} leads`);
        leads.push(...strategy5Leads);
      }
    }

    // Dédupliquer par nom
    const uniqueLeads = this.deduplicateLeadsByName(leads);
    console.log(`📊 Total after deduplication: ${uniqueLeads.length} unique leads`);

    return uniqueLeads.slice(0, maxResults);
  }

  /**
   * Stratégie 1: Parse les entrées avec ratings (★ ou ⭐)
   */
  private static parseMarkdownStrategy1(content: string, params: ScrapingParams): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];

    // Pattern flexible pour ratings
    // Match: "Nom ★ 4.5 (123)" ou "Nom · 4,5 ⭐ (123 avis)" ou "Nom - 4.5★ (123)"
    const patterns = [
      /([^\n]+?)\s*[★⭐]\s*([\d.,]+)\s*\(([^\)]+)\)/g,
      /([^\n]+?)\s*[·•-]\s*([\d.,]+)\s*[★⭐]\s*\(([^\)]+)\)/g,
      /([^\n]+?)\s*Rating:\s*([\d.,]+)[^\n]*\(([^\)]+)\)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const [_, name, rating, reviews] = match;

        if (name && name.trim() && name.length > 3 && name.length < 150) {
          const cleanName = name.trim().replace(/^[•\-\d.]+\s*/, ''); // Enlever puces/numéros

          leads.push({
            name: cleanName,
            category: params.query,
            city: params.city,
            google_rating: parseFloat(rating.replace(',', '.')) || undefined,
            google_reviews_count: parseInt(reviews.replace(/[,\s\D]/g, '')) || undefined,
            source: 'jina',
            tags: ['jina_search'],
          });
        }
      }
    });

    return leads;
  }

  /**
   * Stratégie 2: Parse les adresses structurées
   */
  private static parseMarkdownStrategy2(content: string, params: ScrapingParams): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];

    // Chercher des blocs avec nom + adresse
    const blockPattern = /^([A-Z][^\n]{5,100})\s*\n.*(?:adresse|address|rue|avenue|boulevard)[:\s]+([^\n]+)/gim;

    let match;
    while ((match = blockPattern.exec(content)) !== null) {
      const [_, name, address] = match;

      if (name && address) {
        leads.push({
          name: name.trim(),
          category: params.query,
          city: params.city,
          address: address.trim(),
          source: 'jina',
          tags: ['jina_search'],
        });
      }
    }

    return leads;
  }

  /**
   * Stratégie 3: Extraire depuis Google Maps URLs
   */
  private static parseMarkdownStrategy3(content: string, params: ScrapingParams): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];

    // Chercher les liens Google Maps avec noms de lieux
    const mapsPattern = /\[([^\]]+)\]\(https:\/\/(?:www\.)?google\.com\/maps[^\)]+\)/g;

    let match;
    while ((match = mapsPattern.exec(content)) !== null) {
      const [fullMatch, name] = match;
      const url = fullMatch.match(/\((https:\/\/[^\)]+)\)/)?.[1];

      if (name && name.length > 3 && name.length < 150) {
        leads.push({
          name: name.trim(),
          category: params.query,
          city: params.city,
          google_maps_url: url,
          source: 'jina',
          tags: ['jina_maps'],
        });
      }
    }

    return leads;
  }

  /**
   * Stratégie 4: Parse les listes à puces ou numérotées
   */
  private static parseMarkdownStrategy4(content: string, params: ScrapingParams): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];

    // Pattern pour listes: "- Item" ou "1. Item" ou "• Item"
    const listPattern = /^[\s]*(?:[•\-*]|\d+\.)\s+([A-Z][^\n]{5,100})/gm;

    let match;
    while ((match = listPattern.exec(content)) !== null) {
      const name = match[1].trim();

      // Filtrer les titres/headers évidents
      if (!name.match(/^(Google|Maps|Search|Results?|About|Contact|Menu)/i)) {
        leads.push({
          name,
          category: params.query,
          city: params.city,
          source: 'jina',
          tags: ['jina_search'],
        });
      }
    }

    return leads;
  }

  /**
   * Stratégie 5: Pattern simple (fallback)
   */
  private static parseMarkdownStrategy5(content: string, params: ScrapingParams): Partial<EnrichedLead>[] {
    const leads: Partial<EnrichedLead>[] = [];

    // Chercher des lignes qui ressemblent à des noms de business
    const simplePattern = /^([A-ZÀÂÄÆÇÉÈÊËÏÎÔŒÙÛÜŸ][^\n]{8,100})$/gm;

    let match;
    while ((match = simplePattern.exec(content)) !== null) {
      const name = match[1].trim();

      // Filtrer les patterns communs à éviter
      const excludePatterns = [
        /^https?:\/\//i,
        /^(Google|Maps|Search|Results?|About|Contact|Menu|More|View|See|All)/i,
        /^\d+\s*(km|meters|miles)/i,
        /^[A-Z]{2,}$/,  // Tout en majuscules (souvent des labels)
      ];

      const shouldExclude = excludePatterns.some(pattern => pattern.test(name));

      if (!shouldExclude) {
        leads.push({
          name,
          category: params.query,
          city: params.city,
          source: 'jina',
          tags: ['jina_search'],
        });
      }
    }

    return leads;
  }

  /**
   * Déduplique les leads par nom (ignore la casse et caractères spéciaux)
   */
  private static deduplicateLeadsByName(leads: Partial<EnrichedLead>[]): Partial<EnrichedLead>[] {
    const seen = new Set<string>();
    const unique: Partial<EnrichedLead>[] = [];

    leads.forEach(lead => {
      const normalizedName = (lead.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      if (normalizedName && !seen.has(normalizedName)) {
        seen.add(normalizedName);
        unique.push(lead);
      }
    });

    return unique;
  }

  /**
   * Scraping avec N8N (utilise Apify en backend)
   * Optionnel - si échoue, le système fonctionne quand même avec Jina
   */
  private static async scrapeWithN8N(
    params: ScrapingParams
  ): Promise<Partial<EnrichedLead>[]> {
    try {
      console.log('🤖 N8N/Apify scraping (optional):', params);

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
        60000 // 60 secondes pour N8N/Apify (Apify peut être lent)
      );

      if (!response.ok) {
        console.warn(`⚠️ N8N request failed with status ${response.status} - continuing with Jina only`);
        return [];
      }

      const result = await response.json();

      // Parser la réponse N8N (format existant)
      const data = Array.isArray(result) ? result[0] : result;

      if (!data.leads) {
        console.warn('⚠️ No leads in N8N response - continuing with Jina only');
        return [];
      }

      // Parser la string JSON des leads
      let parsedLeads: any[] = [];

      if (typeof data.leads === 'string') {
        try {
          const leadsArray = JSON.parse(data.leads);
          parsedLeads = leadsArray.map((item: any) => item.json || item);
        } catch (parseError) {
          console.error('⚠️ Error parsing N8N leads - continuing with Jina only:', parseError);
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

      console.log(`✅ N8N extracted ${leads.length} leads`);
      return leads;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ N8N request timed out after 60s - continuing with Jina only');
      } else {
        console.warn('⚠️ N8N scraping failed - continuing with Jina only:', error.message);
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
