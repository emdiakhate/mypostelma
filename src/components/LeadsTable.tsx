import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Mail, Phone, Share2, X, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lead } from '@/types/leads';
import LeadCard from './LeadCard';

const LEADS_PER_PAGE = 10;

interface LeadsTableProps {
  leads: Lead[];
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    hasEmail: false,
    hasPhone: false,
    hasSocial: false,
    searchTerm: ''
  });

  // Applique les filtres
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Filtre email
      if (filters.hasEmail && !lead.email) return false;
      
      // Filtre téléphone
      if (filters.hasPhone && !lead.phone) return false;
      
      // Filtre réseaux sociaux
      if (filters.hasSocial && !lead.socialMedia) return false;
      
      // Filtre recherche textuelle
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        return (
          lead.name.toLowerCase().includes(search) ||
          lead.category.toLowerCase().includes(search) ||
          lead.city.toLowerCase().includes(search) ||
          lead.email?.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }, [leads, filters]);

  // Calcule pagination
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const endIndex = startIndex + LEADS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset à page 1 si filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  const resetFilters = () => {
    setFilters({
      hasEmail: false,
      hasPhone: false,
      hasSocial: false,
      searchTerm: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
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
            <Mail className="w-4 h-4" />
            Email
            {filters.hasEmail && <X className="w-3 h-3" />}
          </Button>

          <Button
            variant={filters.hasPhone ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, hasPhone: !filters.hasPhone })}
            className="gap-2"
          >
            <Phone className="w-4 h-4" />
            Téléphone
            {filters.hasPhone && <X className="w-3 h-3" />}
          </Button>

          <Button
            variant={filters.hasSocial ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, hasSocial: !filters.hasSocial })}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Réseaux sociaux
            {filters.hasSocial && <X className="w-3 h-3" />}
          </Button>

          {/* Reset filtres */}
          {(filters.hasEmail || filters.hasPhone || filters.hasSocial || filters.searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

        {/* En-tête résultats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredLeads.length} lead{filteredLeads.length > 1 ? 's' : ''} trouvé{filteredLeads.length > 1 ? 's' : ''}
              {filteredLeads.length !== leads.length && (
                <span className="ml-1">
                  (sur {leads.length} total)
                </span>
              )}
            </div>
            
            {/* Badge résumé filtres actifs */}
            {(filters.hasEmail || filters.hasPhone || filters.hasSocial) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Filtres actifs:</span>
                {filters.hasEmail && (
                  <Badge variant="secondary" className="gap-1">
                    <Mail className="w-3 h-3" />
                    Avec email
                  </Badge>
                )}
                {filters.hasPhone && (
                  <Badge variant="secondary" className="gap-1">
                    <Phone className="w-3 h-3" />
                    Avec téléphone
                  </Badge>
                )}
                {filters.hasSocial && (
                  <Badge variant="secondary" className="gap-1">
                    <Share2 className="w-3 h-3" />
                    Avec réseaux
                  </Badge>
                )}
              </div>
            )}
          </div>

        {/* Actions groupées si sélection */}
        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedLeads.length} sélectionné{selectedLeads.length > 1 ? 's' : ''}
            </span>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        )}
      </div>

      {/* Checkbox tout sélectionner */}
      {paginatedLeads.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <input
            type="checkbox"
            checked={selectedLeads.length === paginatedLeads.length}
            onChange={handleSelectAll}
            className="rounded"
          />
          <span className="text-sm text-muted-foreground">
            Sélectionner tout ({paginatedLeads.length})
          </span>
        </div>
      )}

      {/* Liste des leads */}
      <div className="space-y-2">
        {paginatedLeads.map(lead => (
          <LeadCard 
            key={lead.id} 
            lead={lead}
            selected={selectedLeads.includes(lead.id)}
            onSelect={handleSelectLead}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
            <span className="ml-2">
              ({startIndex + 1}-{Math.min(endIndex, filteredLeads.length)} sur {filteredLeads.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Précédent */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>

            {/* Numéros de page */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Affiche: première, dernière, courante, et ±1 autour de la courante
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, arr) => {
                  // Ajoute "..." si saut
                  const prevPage = arr[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-1">
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
                    </div>
                  );
                })}
            </div>

            {/* Bouton Suivant */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty state si aucun résultat */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun lead trouvé</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Essayez de modifier vos filtres ou lancez une nouvelle recherche
          </p>
          <Button
            variant="outline"
            onClick={resetFilters}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
