/**
 * Composant LeadCard pour afficher les résultats de recherche de leads
 * Phase 4: Lead Generation System - Affichage des leads
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ExternalLink, 
  Plus,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Interface pour les données reçues du webhook N8N
export interface N8NLeadData {
  Titre: string;
  Categorie: string;
  Addresse: string;
  Telephone: string;
  Horaires: string;
  Lien: string;
  ImageUrl: string;
  LinkedIns: string; // JSON stringified array
  twitters: string;  // JSON stringified array
  instagrams: string; // JSON stringified array
  facebooks: string; // JSON stringified array
}

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
  console.log('LeadCard rendered for:', lead.Titre);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Parser les réseaux sociaux depuis les arrays JSON stringifiés
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

  // Formater le numéro de téléphone pour l'affichage
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = cleanPhoneNumber(phone);
    if (!cleaned) return '';
    
    // Format: +221 33 822 49 70
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length >= 8) {
      return `+${digits}`;
    }
    return cleaned;
  };

  // Obtenir le jour actuel pour mettre en évidence
  const getCurrentDay = (): string => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[new Date().getDay() - 1] || 'Lundi';
  };

  // Parser les horaires
  const parseHoraires = (horaires: string): Array<{day: string, hours: string}> => {
    if (!horaires || horaires === 'undefined') return [];
    
    try {
      // Format attendu: "Lundi: 9h-18h, Mardi: 9h-18h, ..."
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
  const currentDay = getCurrentDay();

  const handleAddToLeads = () => {
    if (onAddToLeads) {
      onAddToLeads(lead);
      setIsAdded(true);
      toast.success('Lead ajouté à votre liste !');
    }
  };

  const handleOpenMaps = () => {
    if (lead.Lien) {
      window.open(lead.Lien, '_blank');
    }
  };

  const handleSocialClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Image du lead */}
          <div className="flex-shrink-0">
            {lead.ImageUrl && lead.ImageUrl !== 'undefined' ? (
              <img
                src={lead.ImageUrl}
                alt={lead.Titre}
                className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <Building className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Informations principales */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {lead.Titre}
            </CardTitle>
            <Badge variant="secondary" className="mt-1">
              {lead.Categorie}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Adresse */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-700">{lead.Addresse}</span>
        </div>

        {/* Téléphone */}
        {cleanPhoneNumber(lead.Telephone) && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <a 
              href={`tel:${cleanPhoneNumber(lead.Telephone)}`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {formatPhoneNumber(lead.Telephone)}
            </a>
          </div>
        )}

        {/* Réseaux sociaux */}
        {(linkedinUrls.length > 0 || twitterUrls.length > 0 || instagramUrls.length > 0 || facebookUrls.length > 0) && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Réseaux sociaux
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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

        {/* Horaires */}
        {horairesList.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between p-0 h-auto text-left"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Horaires</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1">
                {horairesList.map((horaire, index) => (
                  <div
                    key={index}
                    className={cn(
                      "text-xs flex justify-between items-center py-1 px-2 rounded",
                      horaire.day === currentDay 
                        ? "bg-blue-100 text-blue-800 font-medium" 
                        : "bg-gray-50 text-gray-700"
                    )}
                  >
                    <span className="font-medium">{horaire.day}</span>
                    <span>{horaire.hours || 'Fermé'}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenMaps}
            className="flex-1"
            disabled={!lead.Lien}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Voir sur Maps
          </Button>
          <Button
            size="sm"
            onClick={handleAddToLeads}
            className={cn(
              "flex-1 transition-colors",
              isAdded && "bg-green-600 hover:bg-green-700"
            )}
            disabled={isAdded}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAdded ? 'Ajouté' : 'Ajouter aux leads'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadCard;