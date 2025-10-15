/**
 * Composant LeadsGrid pour afficher les résultats de recherche en grille
 * Phase 4: Lead Generation System - Grille des leads avec pagination
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Building, 
  AlertCircle, 
  RefreshCw, 
  MapPin, 
  Phone, 
  Clock, 
  ExternalLink, 
  Plus, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Mail,
  Share2,
  X,
  Filter
} from 'lucide-react';
import { N8NLeadData } from './LeadCard';
import { cn } from '@/lib/utils';

interface LeadsGridProps {
  leads: N8NLeadData[];
  loading?: boolean;
  error?: string;
  onAddToLeads?: (lead: N8NLeadData) => void;
  onRetry?: () => void;
  className?: string;
}

const LeadsGrid: React.FC<LeadsGridProps> = ({
  leads,
  loading = false,
  error,
  onAddToLeads,
  onRetry,
  className
}) => {
  console.log('LeadsGrid rendered with:', { leads: leads.length, loading, error });
  
  // Filtres
  const [activeFilters, setActiveFilters] = useState({
    hasPhone: false,
    hasEmail: false,
    hasSocial: false
  });
  
  // Pagination
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtrage des résultats
  const filteredResults = useMemo(() => {
    let results = leads;
    
    // Filtre téléphone
    if (activeFilters.hasPhone) {
      results = results.filter(lead => 
        lead.Telephone && lead.Telephone !== 'undefined' && lead.Telephone.trim() !== ''
      );
    }
    
    // Filtre email (si le champ existe)
    if (activeFilters.hasEmail) {
      results = results.filter(lead => 
        lead.email && lead.email.trim() !== ''
      );
    }
    
    // Filtre réseaux sociaux
    if (activeFilters.hasSocial) {
      results = results.filter(lead => {
        const hasLinkedIn = lead.LinkedIns !== '[]';
        const hasTwitter = lead.twitters !== '[]';
        const hasInstagram = lead.instagrams !== '[]';
        const hasFacebook = lead.facebooks !== '[]';
        
        return hasLinkedIn || hasTwitter || hasInstagram || hasFacebook;
      });
    }
    
    return results;
  }, [leads, activeFilters]);
  
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredResults.length);
  const paginatedLeads = filteredResults.slice(startIndex, endIndex);

  // Statistiques
  const phoneCount = leads.filter(lead => lead.Telephone && lead.Telephone !== 'undefined').length;
  const socialCount = leads.filter(lead => {
    const hasSocial = lead.LinkedIns !== '[]' || lead.twitters !== '[]' || 
                     lead.instagrams !== '[]' || lead.facebooks !== '[]';
    return hasSocial;
  }).length;
  
  // Reset pagination quand les filtres changent
  useMemo(() => {
    setCurrentPage(1);
  }, [activeFilters]);

  // État de chargement
  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse overflow-hidden">
              <div className="flex items-start gap-4 p-4 border-b">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="p-4 bg-muted/30 flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erreur lors de la recherche
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Aucun résultat
  if (leads.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun lead trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Nouvelle recherche
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage des résultats
  return (
    <div className={cn("space-y-6", className)}>

      {/* Affichage des résultats ou message vide */}
      {filteredResults.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Aucun lead ne correspond aux filtres sélectionnés
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setActiveFilters({ hasPhone: false, hasEmail: false, hasSocial: false });
              setCurrentPage(1);
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedLeads.map((lead, index) => (
            <LeadCard
              key={`${lead.Titre}-${index}`}
              lead={lead}
              onAddToLeads={onAddToLeads}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Affichage {startIndex + 1}-{endIndex} sur {filteredResults.length} résultats
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            
            <span className="text-sm">
              Page {currentPage} / {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant LeadCard refait avec le nouveau design
interface LeadCardProps {
  lead: N8NLeadData;
  onAddToLeads?: (lead: N8NLeadData) => void;
  className?: string;
}

const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  onAddToLeads,
  className 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fonction pour générer les initiales
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  // Parser les réseaux sociaux
  const parseSocialMedia = (jsonString: string): string[] => {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed.filter(url => url && url.trim() !== '') : [];
    } catch (error) {
      console.warn('Erreur parsing réseaux sociaux:', error);
      return [];
    }
  };

  const linkedinUrls = parseSocialMedia(lead.LinkedIns);
  const twitterUrls = parseSocialMedia(lead.twitters);
  const instagramUrls = parseSocialMedia(lead.instagrams);
  const facebookUrls = parseSocialMedia(lead.facebooks);

  // Nettoyer le numéro de téléphone
  const cleanPhoneNumber = (phone: string): string => {
    if (!phone || phone === 'undefined') return '';
    return phone.replace(/['"]/g, '').trim();
  };

  // Parser les horaires
  const parseHoraires = (horaires: string): Array<{day: string, hours: string}> => {
    if (!horaires || horaires === 'undefined') return [];
    
    try {
      if (Array.isArray(horaires)) {
        return horaires;
      }
      const lines = horaires.split(',').map(line => line.trim());
      return lines.map(line => {
        const [day, hours] = line.split(':').map(part => part.trim());
        return { day, hours: hours || '' };
      });
    } catch (error) {
      console.warn('Erreur parsing horaires:', error);
      return [];
    }
  };

  const horairesList = parseHoraires(lead.Horaires);
  const currentDay = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

  const handleAddToLeads = () => {
    if (onAddToLeads) {
      onAddToLeads(lead);
    }
  };

  const handleSocialClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className={cn("overflow-hidden hover:shadow-lg transition-all duration-200", className)}>
      {/* Header avec image et titre */}
      <div className="flex items-start gap-4 p-4 border-b">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          {lead.ImageUrl ? (
            <img 
              src={lead.ImageUrl}
              alt={lead.Titre}
              className="w-full h-full object-cover"
              onError={(e) => {
                // En cas d'erreur de chargement, masquer l'image et afficher le fallback
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar');
                fallback?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback avec initiales */}
          <div className={`fallback-avatar absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 ${lead.ImageUrl ? 'hidden' : ''}`}>
            <span className="text-white font-semibold text-lg">
              {getInitials(lead.Titre)}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{lead.Titre}</h3>
          <p className="text-sm text-muted-foreground">{lead.Categorie}</p>
        </div>
      </div>

      {/* Corps avec infos */}
      <div className="p-4 space-y-3">
        {/* Adresse */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-muted-foreground line-clamp-2">{lead.Addresse}</span>
        </div>

        {/* Téléphone */}
        {cleanPhoneNumber(lead.Telephone) && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <a 
              href={`tel:${cleanPhoneNumber(lead.Telephone)}`}
              className="text-blue-600 hover:underline"
            >
              {cleanPhoneNumber(lead.Telephone)}
            </a>
          </div>
        )}

        {/* Réseaux sociaux */}
        {(linkedinUrls.length > 0 || twitterUrls.length > 0 || instagramUrls.length > 0 || facebookUrls.length > 0) && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground mr-1">Réseaux :</span>
            <div className="flex gap-2">
              {linkedinUrls.length > 0 && (
                <button
                  onClick={() => handleSocialClick(linkedinUrls[0])}
                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" />
                </button>
              )}
              {twitterUrls.length > 0 && (
                <button
                  onClick={() => handleSocialClick(twitterUrls[0])}
                  className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors"
                  title="Twitter/X"
                >
                  <Twitter className="w-4 h-4 text-sky-500" />
                </button>
              )}
              {instagramUrls.length > 0 && (
                <button
                  onClick={() => handleSocialClick(instagramUrls[0])}
                  className="p-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4 text-pink-600" />
                </button>
              )}
              {facebookUrls.length > 0 && (
                <button
                  onClick={() => handleSocialClick(facebookUrls[0])}
                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4 text-blue-700" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Horaires (Collapsible) */}
        {horairesList.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full">
              <Clock className="w-4 h-4" />
              <span>Horaires</span>
              <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", isExpanded && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 text-xs text-muted-foreground">
              <div className="space-y-1">
                {horairesList.map((horaire, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex justify-between items-center py-1 px-2 rounded",
                      horaire.day.toLowerCase() === currentDay 
                        ? "bg-blue-100 text-blue-800 font-medium" 
                        : "bg-muted/50"
                    )}
                  >
                    <span className="font-medium capitalize">{horaire.day}</span>
                    <span>{horaire.hours || 'Fermé'}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Footer avec actions */}
      <div className="p-4 bg-muted/30 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => window.open(lead.Lien, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Voir sur Maps
        </Button>
        <Button 
          size="sm" 
          className="flex-1"
          onClick={handleAddToLeads}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>
    </Card>
  );
};

export default LeadsGrid;
