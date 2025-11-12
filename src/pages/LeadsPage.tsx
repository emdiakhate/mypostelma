/**
 * Page principale Lead Generation
 * Phase 4: Lead Generation System - Page Principale
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Phone, 
  CheckCircle, 
  TrendingUp,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  Mail,
  MapPin,
  Building,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLeads, useLeadStatus } from '@/hooks/useLeads';
import { Lead, LeadStatus } from '@/types/leads';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import LeadSearchForm from '@/components/LeadSearchForm';
import LeadsGrid from '@/components/LeadsGrid';
import { N8NLeadData } from '@/components/LeadCard';
import { QuickActionsButtons } from '@/components/leads/QuickActionsButtons';
import { SendMessageModal } from '@/components/leads/SendMessageModal';
import { QuotaDisplay } from '@/components/QuotaDisplay';
import { createCompetitor } from '@/services/competitorAnalytics';

const LEADS_PER_PAGE = 10;

const LeadsPage: React.FC = () => {
  const { leads, loading, error, loadLeads, addLead, updateLead, deleteLead } = useLeads();
  const { getStatusColor, getStatusLabel } = useLeadStatus();
  
  // États de recherche
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ found: 0, percentage: 0, elapsed: 0 });
  const [showSearchForm, setShowSearchForm] = useState(true); // true par défaut
  
  // États pour les résultats de recherche N8N
  const [searchResults, setSearchResults] = useState<N8NLeadData[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // États pour le modal Mes Leads
  const [showMyLeadsModal, setShowMyLeadsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  
  // États de sélection
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // États pour le modal de message
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageChannel, setMessageChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtres
  const [filters, setFilters] = useState({
    status: 'all' as LeadStatus | 'all',
    hasEmail: false,
    hasPhone: false,
    hasSocial: false,
    searchTerm: ''
  });

  // Chargement initial
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);


  // Fonction pour annuler la recherche
  const handleCancelSearch = () => {
    setIsSearching(false);
    setSearchProgress({ found: 0, percentage: 0, elapsed: 0 });
  };

  // Fonction pour ajouter un lead aux leads sauvegardés
  const handleAddToLeads = (n8nLead: N8NLeadData) => {
    try {
      // Convertir le lead N8N en format Lead
      const newLead: Lead = {
        id: Date.now().toString(),
        name: n8nLead.Titre,
        category: n8nLead.Categorie,
        address: n8nLead.Addresse,
        city: n8nLead.Addresse.split(',').pop()?.trim() || '',
        phone: n8nLead.Telephone !== 'undefined' ? n8nLead.Telephone : undefined,
        website: n8nLead.Lien,
        socialMedia: {
          instagram: n8nLead.instagrams !== '[]' ? JSON.parse(n8nLead.instagrams)[0] : undefined,
          facebook: n8nLead.facebooks !== '[]' ? JSON.parse(n8nLead.facebooks)[0] : undefined,
          linkedin: n8nLead.LinkedIns !== '[]' ? JSON.parse(n8nLead.LinkedIns)[0] : undefined,
          twitter: n8nLead.twitters !== '[]' ? JSON.parse(n8nLead.twitters)[0] : undefined,
        },
        status: 'new',
        notes: `Ajouté depuis la recherche - Horaires: ${n8nLead.Horaires}`,
        tags: ['recherche'],
        addedAt: new Date(),
        source: 'search'
      };

      addLead(newLead);
      toast.success('Lead ajouté avec succès !');
    } catch (error) {
      console.error('Erreur ajout lead:', error);
      toast.error('Erreur lors de l\'ajout du lead');
    }
  };

  // Calcul des statistiques
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    interested: leads.filter(l => l.status === 'interested').length,
    clients: leads.filter(l => l.status === 'client').length,
    toContact: leads.filter(l => l.status === 'new' && (l.email || l.phone)).length
  };

  // Filtrage des leads pour le modal
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
      const matchesSearch = searchQuery === '' || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [leads, filterStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const endIndex = startIndex + LEADS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Gestion de la sélection
  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  // Fonctions pour le modal Mes Leads
  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCallLead = (lead: Lead) => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, '_self');
    }
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    // TODO: Implémenter l'édition
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      toast.success('Lead supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Fonction pour ouvrir le modal de message
  const handleOpenMessageModal = (lead: Lead, channel: 'whatsapp' | 'email') => {
    setSelectedLead(lead);
    setMessageChannel(channel);
    setMessageModalOpen(true);
  };

  // Fonction pour marquer un lead comme concurrent
  const handleMarkAsCompetitor = async (lead: Lead) => {
    try {
      await createCompetitor({
        name: lead.name,
        industry: lead.category,
        description: lead.description,
        website_url: lead.website,
        instagram_url: lead.socialMedia?.instagram,
        facebook_url: lead.socialMedia?.facebook,
        linkedin_url: lead.socialMedia?.linkedin,
        twitter_url: lead.socialMedia?.twitter,
      } as any);

      toast.success(`${lead.name} ajouté comme concurrent`);
    } catch (error: any) {
      console.error('Error marking lead as competitor:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout du concurrent');
    }
  };

  const getStatusVariant = (status: LeadStatus) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'contacted': return 'default';
      case 'interested': return 'default';
      case 'client': return 'default';
      default: return 'secondary';
    }
  };

  // Gestion de la recherche avec webhook N8N
  const handleSearch = async (searchParams: any) => {
    // IMPORTANT : Activer le loader IMMÉDIATEMENT
    setIsSearching(true);
    setSearchError(null);
    setSearchProgress({ found: 0, percentage: 0, elapsed: 0 });

    try {
      // Afficher un message de recherche en cours
      toast.loading('Recherche en cours...', { id: 'search-loading' });
      
      // Envoyer toutes les données du formulaire à n8n
      const response = await fetch('https://n8n.srv837294.hstgr.cloud/webhook/scrapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchParams.query,
          city: searchParams.city,
          maxResults: searchParams.maxResults,
          includePhone: searchParams.includePhone,
          includeEmail: searchParams.includeEmail,
          includeSocial: searchParams.includeSocial,
          radius: searchParams.radius,
          category: searchParams.category
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche N8N');
      }

      const result = await response.json();
      console.log('Webhook response received:', result);

      // Fermer le toast de loading
      toast.dismiss('search-loading');

      // IMPORTANT : result est un ARRAY, prendre le premier élément
      const data = Array.isArray(result) ? result[0] : result;
      console.log('Data extracted:', data);

      // Parser la string JSON des leads
      if (data.leads && typeof data.leads === 'string') {
        try {
          // 1er parsing : convertir la string en array
          const parsedLeads = JSON.parse(data.leads);
          console.log('Parsed leads array:', parsedLeads);
          
          // 2ème parsing : extraire les données depuis les objets {json: {...}}
          const extractedLeads = parsedLeads.map((item: any) => item.json);
          console.log('Extracted leads:', extractedLeads);
          
          // Maintenant on a le bon format
          const n8nLeads: N8NLeadData[] = extractedLeads.map((lead: any) => ({
            Titre: lead.Titre || 'Sans nom',
            Categorie: lead.Categorie || searchParams.query || 'Non catégorisé',
            Addresse: lead.Addresse || '',
            Telephone: lead.Telephone || 'undefined',
            Horaires: Array.isArray(lead.Horaires) ? 
              lead.Horaires.map((h: any) => `${h.day}: ${h.hours}`).join(', ') : 
              (lead.Horaires || ''),
            Lien: lead.Lien || '',
            ImageUrl: lead.ImageUrl || '',
            LinkedIns: lead.LinkedIns || '[]',
            twitters: lead.twitters || '[]',
            instagrams: lead.instagrams || '[]',
            facebooks: lead.facebooks || '[]'
          }));
          
          console.log('Final N8N Leads:', n8nLeads);
          setSearchResults(n8nLeads);
          console.log('Search results set, length:', n8nLeads.length);
          setIsSearching(false);
          setSearchProgress({ 
            found: n8nLeads.length, 
            percentage: 100, 
            elapsed: 0
          });
          
          toast.success(
            `✓ ${n8nLeads.length} leads trouvés !`,
            { description: `Recherche: ${searchParams.query} à ${searchParams.city}` }
          );
          
        } catch (parseError) {
          console.error('Error parsing leads JSON:', parseError);
          setIsSearching(false);
          setSearchError('Erreur lors du parsing des leads');
          toast.error('Erreur lors du parsing des leads');
        }
      } else if (data.leads && Array.isArray(data.leads)) {
        // Fallback : si leads est déjà un array
        console.log('Leads is already an array');
        const n8nLeads: N8NLeadData[] = data.leads.map((lead: any) => ({
          Titre: lead.Titre || 'Sans nom',
          Categorie: lead.Categorie || searchParams.query || 'Non catégorisé',
          Addresse: lead.Addresse || '',
          Telephone: lead.Telephone || 'undefined',
          Horaires: Array.isArray(lead.Horaires) ? 
            lead.Horaires.map((h: any) => `${h.day}: ${h.hours}`).join(', ') : 
            (lead.Horaires || ''),
          Lien: lead.Lien || '',
          ImageUrl: lead.ImageUrl || '',
          LinkedIns: lead.LinkedIns || '[]',
          twitters: lead.twitters || '[]',
          instagrams: lead.instagrams || '[]',
          facebooks: lead.facebooks || '[]'
        }));

        console.log('N8N Leads processed (array):', n8nLeads);
        setSearchResults(n8nLeads);
        setIsSearching(false);
        setSearchProgress({ 
          found: n8nLeads.length, 
          percentage: 100, 
          elapsed: 0
        });
        
        toast.success(
          `✓ ${n8nLeads.length} leads trouvés !`,
          { description: `Recherche: ${searchParams.query} à ${searchParams.city}` }
        );
      } else {
        console.log('No leads found in response:', data);
        setSearchResults([]);
        setIsSearching(false);
        toast.info('Aucun lead trouvé pour cette recherche');
      }
      
    } catch (error) {
      // Fermer le loading en cas d'erreur
      toast.dismiss('search-loading');
      setIsSearching(false);
      setSearchError('Erreur lors de la recherche');
      console.error('Error with N8N search:', error);
      toast.error('Erreur lors de la recherche', {
        description: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  };


  // Fonction pour éviter les doublons
  const mergeLeads = (existing: Lead[], newLeads: Lead[]): Lead[] => {
    const merged = [...existing];
    
    newLeads.forEach(newLead => {
      const isDuplicate = existing.some(lead => 
        lead.email === newLead.email || 
        lead.phone === newLead.phone ||
        (lead.name === newLead.name && lead.city === newLead.city)
      );

      if (!isDuplicate) {
        merged.push(newLead);
      }
    });

    return merged;
  };

  // Génération de leads mock
  const generateMockLeads = (params: any): Lead[] => {
    const categories = ['restaurant', 'salon', 'coach', 'boutique', 'service'];
    const names = [
      'Le Bistrot du Coin', 'Salon Coiffure Élégance', 'Coach Sportif Pro',
      'Boutique Mode Chic', 'Service à Domicile', 'Restaurant Gastronomique',
      'Institut de Beauté', 'Gym Fitness', 'Boulangerie Artisanale', 'Café Culturel'
    ];
    
    return Array.from({ length: Math.min(params.maxResults, 25) }, (_, i) => ({
      id: `mock_lead_${Date.now()}_${i}`,
      name: names[i % names.length],
      category: categories[i % categories.length],
      address: `${Math.floor(Math.random() * 100) + 1} Rue de la ${params.query}`,
      city: params.city,
      postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      phone: params.includePhone ? `0${Math.floor(Math.random() * 900000000) + 100000000}` : undefined,
      email: params.includeEmail ? `contact@${names[i % names.length].toLowerCase().replace(/\s+/g, '')}.com` : undefined,
      website: `https://www.${names[i % names.length].toLowerCase().replace(/\s+/g, '')}.com`,
      socialMedia: params.includeSocial ? {
        instagram: `@${names[i % names.length].toLowerCase().replace(/\s+/g, '')}`,
        facebook: names[i % names.length],
        linkedin: names[i % names.length]
      } : undefined,
      status: 'new' as LeadStatus,
      notes: '',
      tags: ['recherche_automatique'],
      addedAt: new Date(),
      source: 'google_maps'
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header avec stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Generation</h1>
          <p className="text-gray-600">
            Gérez vos prospects et développez votre portefeuille client
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>
                  <Button onClick={() => setShowMyLeadsModal(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Mes Leads ({filteredLeads.length})
          </Button>
        </div>
      </div>

      {/* KPIs Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">+23 ce mois</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">À Contacter</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.toContact}</p>
                <p className="text-xs text-gray-500">-15 vs hier</p>
              </div>
              <Phone className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Intéressés</p>
                <p className="text-2xl font-bold text-green-600">{stats.interested}</p>
                <p className="text-xs text-gray-500">+5 cette semaine</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-purple-600">{stats.clients}</p>
                <p className="text-xs text-gray-500">+2 ce mois</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Recherche de Leads (toujours visible par défaut) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recherche de Leads</CardTitle>
              <CardDescription>
                Trouvez automatiquement de nouveaux prospects (max 10 résultats par recherche)
              </CardDescription>
            </div>
            <div className="w-72">
              <QuotaDisplay variant="compact" showOnlyType="lead_searches" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LeadSearchForm 
            onSearch={handleSearch}
            isSearching={isSearching}
            searchProgress={searchProgress}
            onCancel={handleCancelSearch}
          />
        </CardContent>
      </Card>


      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, catégorie, ville..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              />
            </div>
            
            {/* Filtres rapides */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtrer:</span>
              <Button 
                variant={filters.hasEmail ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilters({ ...filters, hasEmail: !filters.hasEmail })}
                className="gap-2"
              >
                <Mail className="w-4 h-4" /> Email {filters.hasEmail && <X className="w-3 h-3" />}
              </Button>
              <Button 
                variant={filters.hasPhone ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilters({ ...filters, hasPhone: !filters.hasPhone })}
                className="gap-2"
              >
                <Phone className="w-4 h-4" /> Téléphone {filters.hasPhone && <X className="w-3 h-3" />}
              </Button>
              <Button 
                variant={filters.hasSocial ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilters({ ...filters, hasSocial: !filters.hasSocial })}
                className="gap-2"
              >
                <Instagram className="w-4 h-4" /> Réseaux sociaux {filters.hasSocial && <X className="w-3 h-3" />}
              </Button>
              {(filters.hasEmail || filters.hasPhone || filters.hasSocial || filters.searchTerm) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilters({ status: 'all', hasEmail: false, hasPhone: false, hasSocial: false, searchTerm: '' })}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* États conditionnels pour l'affichage */}
      
      {/* 1. Loader pendant la recherche */}
      {isSearching && searchResults.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Recherche en cours...</h3>
                <p className="text-sm text-muted-foreground">
                  Nous recherchons les meilleurs prospects pour vous
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Cela peut prendre quelques secondes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Résultats de recherche */}
      {!isSearching && searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Leads trouvés ({searchResults.length})</CardTitle>
              <CardDescription>
                Résultats de votre recherche
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <LeadsGrid
              leads={searchResults}
              loading={false}
              error={searchError}
              onAddToLeads={handleAddToLeads}
              onRetry={() => setShowSearchForm(true)}
            />
          </CardContent>
        </Card>
      )}

      {/* 3. État vide (aucune recherche) */}
      {!isSearching && searchResults.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune recherche lancée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Remplissez les critères ci-dessus et lancez une recherche pour trouver des prospects
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Mes Leads */}
      <Dialog open={showMyLeadsModal} onOpenChange={setShowMyLeadsModal}>
        <DialogContent className="max-w-6xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Mes Leads ({filteredLeads.length})</DialogTitle>
            <DialogDescription>
              Gérez vos prospects et suivez leur progression
            </DialogDescription>
          </DialogHeader>
          
          {/* Barre de recherche et filtres */}
          <div className="space-y-4">
            {/* Recherche */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, catégorie, ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setShowMyLeadsModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Filtres de statut */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Tous ({leads.length})
              </Button>
              <Button
                variant={filterStatus === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('new')}
              >
                Nouveaux ({leads.filter(l => l.status === 'new').length})
              </Button>
              <Button
                variant={filterStatus === 'contacted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('contacted')}
              >
                Contactés ({leads.filter(l => l.status === 'contacted').length})
              </Button>
              <Button
                variant={filterStatus === 'interested' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('interested')}
              >
                Intéressés ({leads.filter(l => l.status === 'interested').length})
              </Button>
              <Button
                variant={filterStatus === 'client' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('client')}
              >
                Clients ({leads.filter(l => l.status === 'client').length})
              </Button>
            </div>
          </div>
          
          {/* Tableau des leads (scrollable) */}
          <div className="overflow-y-auto max-h-[calc(85vh-250px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === filteredLeads.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={() => handleSelectLead(lead.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {lead.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{lead.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {lead.city}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(lead.status)}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.addedAt), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <QuickActionsButtons
                        lead={lead}
                        onViewDetails={() => handleViewLead(lead)}
                        onOpenMessageModal={(channel) => handleOpenMessageModal(lead, channel)}
                        onMarkAsCompetitor={() => handleMarkAsCompetitor(lead)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredLeads.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun lead</h3>
                <p className="text-sm text-muted-foreground">
                  Commencez par rechercher des prospects
                </p>
              </div>
            )}
          </div>
          
          {/* Footer avec actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedLeads.length > 0 && (
                <span>{selectedLeads.length} lead(s) sélectionné(s)</span>
              )}
            </div>
            <div className="flex gap-2">
              {selectedLeads.length > 0 && (
                <Button variant="destructive" size="sm">
                  <Trash className="w-4 h-4 mr-2" />
                  Supprimer la sélection
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'envoi de message */}
      {selectedLead && (
        <SendMessageModal
          open={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          channel={messageChannel}
        />
      )}
    </div>
  );
};

// Composant pour une ligne de lead
interface LeadRowProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  getStatusColor: (status: LeadStatus) => string;
  getStatusLabel: (status: LeadStatus) => string;
}

const LeadRow: React.FC<LeadRowProps> = ({ 
  lead, 
  isSelected, 
  onSelect, 
  onView, 
  getStatusColor, 
  getStatusLabel 
}) => {
  // Fonction pour formater les nombres
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Configuration des icônes de réseaux sociaux
  const socialIcons = {
    instagram: { icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-50' },
    facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    linkedin: { icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
    twitter: { icon: Twitter, color: 'text-blue-400', bg: 'bg-blue-50' }
  };

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      isSelected && "ring-2 ring-blue-500 bg-blue-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 text-blue-600"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                <Badge className={cn("text-xs", getStatusColor(lead.status))}>
                  {getStatusLabel(lead.status)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {lead.category}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{lead.city}</span>
                </div>
                
                {lead.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                
                {lead.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{lead.email}</span>
                  </div>
                )}
              </div>
              
              {/* Réseaux sociaux avec métriques */}
              {lead.socialMedia && (
                <div className="flex items-center gap-2 mt-2">
                  {Object.entries(lead.socialMedia).map(([platform, handle]) => {
                    const config = socialIcons[platform as keyof typeof socialIcons];
                    if (!config || !handle) return null;
                    
                    const Icon = config.icon;
                    const metrics = lead.metrics;
                    const followerKey = `${platform}Followers` as keyof typeof metrics;
                    const likeKey = `${platform}Likes` as keyof typeof metrics;
                    const followers = metrics?.[followerKey] || metrics?.[likeKey] || 0;
                    
                    return (
                      <div key={platform} className="flex items-center gap-1">
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center",
                          config.bg
                        )}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <span className="text-xs text-gray-500">
                          {followers > 0 ? formatNumber(followers) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="w-4 h-4 mr-2" />
              Voir
            </Button>
            
            {lead.email && (
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4" />
              </Button>
            )}
            
            {lead.phone && (
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsPage;
