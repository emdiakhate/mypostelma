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
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLeads, useLeadStatus } from '@/hooks/useLeads';
import { Lead, LeadStatus } from '@/types/leads';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import LeadSearchForm from '@/components/LeadSearchForm';

const LEADS_PER_PAGE = 10;

const LeadsPage: React.FC = () => {
  const { leads, loading, error, loadLeads, addLead, updateLead, deleteLead } = useLeads();
  const { getStatusColor, getStatusLabel } = useLeadStatus();
  
  // États de recherche
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ found: 0, percentage: 0, elapsed: 0 });
  const [showSearchForm, setShowSearchForm] = useState(false);
  
  // États de sélection
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
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

  // Calcul des statistiques
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    interested: leads.filter(l => l.status === 'interested').length,
    clients: leads.filter(l => l.status === 'client').length,
    toContact: leads.filter(l => l.status === 'new' && (l.email || l.phone)).length
  };

  // Filtrage des leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesStatus = filters.status === 'all' || lead.status === filters.status;
      const matchesSearch = lead.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           lead.category.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           lead.city.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesEmail = !filters.hasEmail || !!lead.email;
      const matchesPhone = !filters.hasPhone || !!lead.phone;
      const matchesSocial = !filters.hasSocial || !!(lead.socialMedia?.instagram || lead.socialMedia?.facebook || lead.socialMedia?.linkedin || lead.socialMedia?.twitter);
      
      return matchesStatus && matchesSearch && matchesEmail && matchesPhone && matchesSocial;
    });
  }, [leads, filters]);

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
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map(lead => lead.id));
    }
  };

  // Gestion de la recherche avec webhook N8N
  const handleSearch = async (searchParams: any) => {
    setIsSearching(true);
    setSearchProgress({ found: 0, percentage: 0, elapsed: 0 });

    try {
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
      
      // Process results
      if (result.leads && Array.isArray(result.leads)) {
        const newLeads: Lead[] = result.leads.map((lead: any) => ({
          id: lead.id || `lead_${Date.now()}_${Math.random()}`,
          name: lead.name || lead.business_name || 'Sans nom',
          category: searchParams.query || 'Non catégorisé',
          address: lead.address || '',
          city: searchParams.city || lead.city || '',
          postalCode: lead.postal_code || lead.postalCode,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
          socialMedia: lead.social_media || lead.socialMedia,
          status: 'new' as LeadStatus,
          notes: '',
          tags: ['recherche_automatique', 'n8n'],
          addedAt: new Date(),
          source: 'google_maps'
        }));

        // Merge with existing leads (avoid duplicates)
        const mergedLeads = mergeLeads(leads, newLeads);
        
        // Save to localStorage
        localStorage.setItem('postelma_leads', JSON.stringify(mergedLeads));
        loadLeads();
        
        toast.success(
          `✓ ${newLeads.length} nouveaux leads trouvés !`,
          { description: `Recherche: ${searchParams.query} à ${searchParams.city}` }
        );
      }
      
      setIsSearching(false);
    } catch (error) {
      setIsSearching(false);
      console.error('Error with N8N search:', error);
      toast.error('Erreur lors de la recherche', {
        description: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  };

  const cancelSearch = () => {
    setIsSearching(false);
    setSearchProgress({ found: 0, percentage: 0, elapsed: 0 });
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
          <Button onClick={() => setShowSearchForm(!showSearchForm)}>
            <Search className="w-4 h-4 mr-2" />
            Rechercher
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

      {/* Formulaire de recherche (collapsible) */}
      <Collapsible open={showSearchForm} onOpenChange={setShowSearchForm}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recherche de Leads</CardTitle>
                  <CardDescription>
                    Trouvez automatiquement de nouveaux prospects
                  </CardDescription>
                </div>
                {showSearchForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent>
              <LeadSearchForm 
                onSearch={handleSearch}
                isSearching={isSearching}
                searchProgress={searchProgress}
                onCancel={cancelSearch}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>


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

      {/* Table des résultats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads ({filteredLeads.length})</CardTitle>
              <CardDescription>
                Gérez vos prospects et suivez leur progression
              </CardDescription>
            </div>
            
            {filteredLeads.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedLeads.length === paginatedLeads.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
                
                {selectedLeads.length > 0 && (
                  <Button size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Contacter ({selectedLeads.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Erreur: {error}</p>
              <Button onClick={loadLeads} className="mt-4">
                Réessayer
              </Button>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {leads.length === 0 ? 'Aucun lead trouvé' : 'Aucun lead ne correspond à vos critères'}
              </h3>
              <p className="text-gray-600 mb-4">
                {leads.length === 0 
                  ? 'Commencez par rechercher vos premiers leads'
                  : 'Ajustez vos filtres pour voir plus de résultats'
                }
              </p>
              <Button onClick={() => setShowSearchForm(true)}>
                <Search className="w-4 h-4 mr-2" />
                Rechercher des leads
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedLeads.map((lead) => (
                  <LeadRow 
                    key={lead.id} 
                    lead={lead}
                    isSelected={selectedLeads.includes(lead.id)}
                    onSelect={() => handleSelectLead(lead.id)}
                    onView={() => setSelectedLead(lead)}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages}
                    <span className="ml-2">({startIndex + 1}-{Math.min(endIndex, filteredLeads.length)} sur {filteredLeads.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                        .map((page, index, arr) => {
                          const prevPage = arr[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && (<span className="px-2 text-muted-foreground">...</span>)}
                              <Button 
                                variant={currentPage === page ? 'default' : 'outline'} 
                                size="sm" 
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                    >
                      Suivant <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
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
