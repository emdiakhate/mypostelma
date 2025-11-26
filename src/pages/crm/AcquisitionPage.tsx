/**
 * Page d'acquisition de leads CRM IA
 * Scraping hybride (Jina.ai + Apify) avec assignation secteur/segment
 */

import React, { useState } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Check,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Building,
  Tag as TagIcon,
  Filter,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LeadScrapingService, ScrapingParams } from '@/services/leadScraping';
import { useSectors, useSegments, useTags, useCRMLeads } from '@/hooks/useCRM';
import { EnrichedLead } from '@/types/crm';
import { toast } from 'sonner';
import { QuotaDisplay } from '@/components/QuotaDisplay';

const AcquisitionPage: React.FC = () => {
  const { sectors } = useSectors();
  const { segments } = useSegments();
  const { tags } = useTags();
  const { createLead } = useCRMLeads();

  // États de recherche
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  // Résultats
  const [searchResults, setSearchResults] = useState<EnrichedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  // Modal d'import
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Filtrage des segments par secteur sélectionné
  const filteredSegments = selectedSectorId
    ? segments.filter((s) => s.sector_id === selectedSectorId)
    : [];

  // Filtrage des tags par secteur sélectionné
  const filteredTags = selectedSectorId
    ? tags.filter((t) => t.sector_id === selectedSectorId)
    : tags;

  // Recherche de leads
  const handleSearch = async () => {
    if (!query.trim() || !city.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsSearching(true);
      setSearchResults([]);
      setSelectedLeads(new Set());

      const params: ScrapingParams = {
        query: query.trim(),
        city: city.trim(),
        maxResults,
      };

      toast.loading('Recherche en cours...', { id: 'scraping' });

      const results = await LeadScrapingService.scrapeHybrid(params);

      toast.dismiss('scraping');

      if (results.length === 0) {
        toast.info('Aucun lead trouvé');
      } else {
        toast.success(`${results.length} leads trouvés !`);
        setSearchResults(results);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.dismiss('scraping');
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  // Sélection de leads
  const handleToggleLead = (index: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === searchResults.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(searchResults.map((_, i) => i)));
    }
  };

  // Import des leads sélectionnés
  const handleImport = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Sélectionnez au moins un lead');
      return;
    }

    if (!selectedSectorId) {
      toast.error('Sélectionnez un secteur');
      return;
    }

    try {
      const leadsToImport = Array.from(selectedLeads).map(
        (index) => searchResults[index]
      );

      toast.loading(`Import de ${leadsToImport.length} leads...`, {
        id: 'import',
      });

      // Importer chaque lead
      let imported = 0;
      for (const lead of leadsToImport) {
        try {
          await createLead({
            name: lead.name,
            sector_id: selectedSectorId,
            segment_id: selectedSegmentId || undefined,
            address: lead.address,
            city: lead.city,
            postal_code: lead.postal_code,
            phone: lead.phone,
            whatsapp: lead.whatsapp,
            email: lead.email,
            website: lead.website,
            social_media: lead.social_media,
            image_url: lead.image_url,
            google_rating: lead.google_rating,
            google_reviews_count: lead.google_reviews_count,
            google_maps_url: lead.google_maps_url,
            business_hours: lead.business_hours,
            status: 'new',
            score: lead.score,
            tags: [
              ...(lead.tags || []),
              ...selectedTagIds.map(
                (tagId) => tags.find((t) => t.id === tagId)?.name || ''
              ).filter(Boolean),
            ],
            source: lead.source,
          });
          imported++;
        } catch (error) {
          console.error('Error importing lead:', lead.name, error);
        }
      }

      toast.dismiss('import');
      toast.success(`${imported}/${leadsToImport.length} leads importés`);

      // Réinitialiser
      setImportModalOpen(false);
      setSelectedLeads(new Set());
      setSelectedSectorId('');
      setSelectedSegmentId('');
      setSelectedTagIds([]);
      setSearchResults([]);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.dismiss('import');
      toast.error('Erreur lors de l\'import');
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Acquisition de Leads</h1>
        <p className="text-gray-600">
          Trouvez automatiquement de nouveaux prospects via Google Search & Maps
        </p>
      </div>

      {/* Formulaire de recherche */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recherche de Leads</CardTitle>
              <CardDescription>
                Recherche hybride (Google Search + Google Maps) - Gratuit et illimité
              </CardDescription>
            </div>
            <QuotaDisplay variant="compact" showOnlyType="lead_searches" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="query">Secteur / Activité *</Label>
              <Input
                id="query"
                placeholder="Ex: restaurant, hôtel, salon"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                placeholder="Ex: Dakar"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <Label htmlFor="maxResults">Nombre de résultats</Label>
              <Select
                value={maxResults.toString()}
                onValueChange={(value) => setMaxResults(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 résultats</SelectItem>
                  <SelectItem value="10">10 résultats</SelectItem>
                  <SelectItem value="20">20 résultats</SelectItem>
                  <SelectItem value="50">50 résultats</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim() || !city.trim()}
              className="flex-1 md:flex-none"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>

            {searchResults.length > 0 && selectedLeads.size > 0 && (
              <Button
                variant="default"
                onClick={() => setImportModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Importer ({selectedLeads.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Résultats ({searchResults.length})</CardTitle>
                <CardDescription>
                  Sélectionnez les leads à importer
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedLeads.size === searchResults.length
                    ? 'Tout désélectionner'
                    : 'Tout sélectionner'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((lead, index) => (
                <Card
                  key={index}
                  className={`transition-all ${
                    selectedLeads.has(index)
                      ? 'ring-2 ring-green-500 bg-green-50'
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <Checkbox
                        checked={selectedLeads.has(index)}
                        onCheckedChange={() => handleToggleLead(index)}
                        className="mt-1"
                      />

                      {/* Image */}
                      {lead.image_url && (
                        <img
                          src={lead.image_url}
                          alt={lead.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {lead.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <MapPin className="w-4 h-4" />
                              <span>{lead.address || lead.city}</span>
                            </div>
                          </div>

                          {/* Score et Rating */}
                          <div className="flex flex-col items-end gap-1">
                            {lead.google_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">
                                  {lead.google_rating.toFixed(1)}
                                </span>
                                {lead.google_reviews_count && (
                                  <span className="text-xs text-muted-foreground">
                                    ({lead.google_reviews_count})
                                  </span>
                                )}
                              </div>
                            )}
                            {lead.score && (
                              <Badge variant="secondary">
                                Score: {lead.score}/5
                              </Badge>
                            )}
                            <Badge
                              variant={
                                lead.source === 'apify' ? 'default' : 'secondary'
                              }
                            >
                              {lead.source === 'apify' ? 'Maps' : 'Search'}
                            </Badge>
                          </div>
                        </div>

                        {/* Contacts */}
                        <div className="flex flex-wrap gap-3 mt-3">
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{lead.email}</span>
                            </div>
                          )}
                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>Site web</span>
                            </a>
                          )}
                        </div>

                        {/* Tags */}
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lead.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* État vide */}
      {!isSearching && searchResults.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Lancez une recherche
              </h3>
              <p className="text-sm text-muted-foreground">
                Remplissez les critères ci-dessus pour trouver des prospects
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal d'import */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Importer {selectedLeads.size} lead(s)
            </DialogTitle>
            <DialogDescription>
              Assignez un secteur et des tags aux leads sélectionnés
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sector">Secteur *</Label>
              {sectors.length === 0 ? (
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    Aucun secteur configuré. Vous devez créer au moins un secteur avant d'importer des leads.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = '/app/crm/config'}
                  >
                    Configurer les secteurs
                  </Button>
                </div>
              ) : (
                <Select
                  value={selectedSectorId}
                  onValueChange={(value) => {
                    setSelectedSectorId(value);
                    setSelectedSegmentId(''); // Reset segment
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedSectorId && filteredSegments.length > 0 && (
              <div>
                <Label htmlFor="segment">Segment (optionnel)</Label>
                <Select
                  value={selectedSegmentId}
                  onValueChange={setSelectedSegmentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun segment</SelectItem>
                    {filteredSegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedSectorId && filteredTags.length > 0 && (
              <div>
                <Label>Tags (optionnel)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filteredTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={
                        selectedTagIds.includes(tag.id) ? 'default' : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedTagIds.includes(tag.id)) {
                          setSelectedTagIds(
                            selectedTagIds.filter((id) => id !== tag.id)
                          );
                        } else {
                          setSelectedTagIds([...selectedTagIds, tag.id]);
                        }
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={sectors.length === 0 || !selectedSectorId}
            >
              <Check className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcquisitionPage;
