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
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 12; // 3 rows x 4 columns

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

  // Calcul pagination
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = searchResults.slice(startIndex, endIndex);

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
      setCurrentPage(1); // Reset to first page

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedResults.map((lead, index) => {
                const absoluteIndex = startIndex + index;
                return (
                <Card
                  key={absoluteIndex}
                  className={`transition-all ${
                    selectedLeads.has(absoluteIndex)
                      ? 'ring-2 ring-green-500 bg-green-50'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Checkbox + Image */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedLeads.has(absoluteIndex)}
                        onCheckedChange={() => handleToggleLead(absoluteIndex)}
                        className="mt-1"
                      />
                      {lead.image_url && (
                        <img
                          src={lead.image_url}
                          alt={lead.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base line-clamp-2">
                          {lead.name}
                        </h3>
                        <Badge
                          variant={lead.source === 'apify' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {lead.source === 'apify' ? 'Maps' : 'Search'}
                        </Badge>
                      </div>
                    </div>

                    {/* Google Rating avec étoiles stylisées */}
                    {lead.google_rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const rating = lead.google_rating || 0;
                            const isFilled = star <= Math.floor(rating);
                            const isHalf = star === Math.ceil(rating) && rating % 1 !== 0;

                            return (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  isFilled
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : isHalf
                                    ? 'fill-yellow-200 text-yellow-400'
                                    : 'fill-gray-200 text-gray-300'
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span className="text-sm font-medium">
                          {lead.google_rating.toFixed(1)}
                        </span>
                        {lead.google_reviews_count && (
                          <span className="text-xs text-muted-foreground">
                            ({lead.google_reviews_count.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Adresse + Google Maps */}
                    <div className="space-y-1">
                      {(lead.address || lead.city) && (
                        <div className="flex items-start gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{lead.address || lead.city}</span>
                        </div>
                      )}
                      {lead.google_maps_url && (
                        <a
                          href={lead.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MapPin className="w-3 h-3" />
                          Voir sur Maps
                        </a>
                      )}
                    </div>

                    {/* Contacts rapides */}
                    <div className="flex flex-wrap gap-1.5">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title={lead.phone}
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      )}
                      {lead.whatsapp && (
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-xs transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageCircle className="w-3 h-3 text-green-700" />
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title={lead.email}
                        >
                          <Mail className="w-3 h-3 text-blue-700" />
                        </a>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded text-xs transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="w-3 h-3 text-purple-700" />
                        </a>
                      )}
                    </div>

                    {/* Réseaux sociaux */}
                    {lead.social_media && (
                      <div className="flex flex-wrap gap-1.5">
                        {lead.social_media.facebook && (
                          <a
                            href={lead.social_media.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Facebook"
                          >
                            <Facebook className="w-3 h-3 text-blue-600" />
                          </a>
                        )}
                        {lead.social_media.instagram && (
                          <a
                            href={lead.social_media.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 hover:bg-pink-200 rounded text-xs transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Instagram"
                          >
                            <Instagram className="w-3 h-3 text-pink-600" />
                          </a>
                        )}
                        {lead.social_media.linkedin && (
                          <a
                            href={lead.social_media.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="LinkedIn"
                          >
                            <Linkedin className="w-3 h-3 text-blue-700" />
                          </a>
                        )}
                        {lead.social_media.twitter && (
                          <a
                            href={lead.social_media.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 hover:bg-sky-200 rounded text-xs transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Twitter"
                          >
                            <Twitter className="w-3 h-3 text-sky-600" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Score */}
                    {lead.score && (
                      <Badge variant="secondary" className="text-xs">
                        Score: {lead.score}/5
                      </Badge>
                    )}

                    {/* Tags */}
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.slice(0, 2).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {lead.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lead.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  Affichage {startIndex + 1}-{Math.min(endIndex, searchResults.length)} sur {searchResults.length} résultats
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
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
                    <SelectItem value="none">Aucun segment</SelectItem>
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
