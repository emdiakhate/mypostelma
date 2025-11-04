/**
 * Composant de recherche de leads
 * Phase 4: Lead Generation System - Composant Recherche
 */

import React, { useState, FormEvent } from 'react';
import { 
  Search, 
  Loader2, 
  X, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Hash,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { LeadSearchParams } from '@/types/leads';
import { cn } from '@/lib/utils';
import { WEBHOOK_URLS, callWebhook, ScrappingWebhookPayload } from '@/config/webhooks';
import { toast } from 'sonner';

interface LeadSearchFormProps {
  onSearch: (params: LeadSearchParams) => void;
  isSearching: boolean;
  searchProgress: {
    found: number;
    percentage: number;
    elapsed: number;
  };
  onCancel: () => void;
}

const LeadSearchForm: React.FC<LeadSearchFormProps> = ({
  onSearch,
  isSearching,
  searchProgress,
  onCancel
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useState<LeadSearchParams>({
    query: '',
    city: '',
    maxResults: 50,
    includeEmail: true,
    includePhone: true,
    includeSocial: true
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.query.trim() || !searchParams.city.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Démarrer immédiatement la recherche pour changer le bouton
    onSearch(searchParams);
    
    try {
      const payload: ScrappingWebhookPayload = {
        query: searchParams.query,
        city: searchParams.city,
        maxResults: searchParams.maxResults,
        includeEmail: searchParams.includeEmail,
        includePhone: searchParams.includePhone,
        includeSocial: searchParams.includeSocial
      };

      const response = await callWebhook(WEBHOOK_URLS.SCRAPPING, payload);
      
      if (response && response.leads) {
        toast.success(`${response.leads.length} leads trouvés !`);
      } else {
        toast.error('Aucun lead trouvé');
      }
    } catch (error) {
      console.error('Erreur recherche leads:', error);
      toast.error('Erreur lors de la recherche de leads');
    }
  };

  const handleInputChange = (field: keyof LeadSearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Champs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="query">Type de business *</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="query"
              placeholder="Ex: restaurant, salon de coiffure, coach..."
              value={searchParams.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">Ville *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="city"
              placeholder="Ex: Paris, Lyon, Marseille..."
              value={searchParams.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      {/* Options avancées (collapsible) */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full justify-between"
          >
            <span>Options avancées</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxResults">Nombre de résultats</Label>
                  <Input
                    id="maxResults"
                    type="number"
                    min="10"
                    max="500"
                    value={searchParams.maxResults}
                    onChange={(e) => handleInputChange('maxResults', parseInt(e.target.value) || 50)}
                  />
                  <p className="text-xs text-gray-500">
                    Entre 10 et 500 résultats
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Label>Données à inclure</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeEmail"
                        checked={searchParams.includeEmail}
                        onCheckedChange={(checked) => handleInputChange('includeEmail', checked)}
                      />
                      <Label htmlFor="includeEmail" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Inclure emails (si disponible)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includePhone"
                        checked={searchParams.includePhone}
                        onCheckedChange={(checked) => handleInputChange('includePhone', checked)}
                      />
                      <Label htmlFor="includePhone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Inclure téléphones
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeSocial"
                        checked={searchParams.includeSocial}
                        onCheckedChange={(checked) => handleInputChange('includeSocial', checked)}
                      />
                      <Label htmlFor="includeSocial" className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Instagram className="w-3 h-3" />
                          <Facebook className="w-3 h-3" />
                          <Linkedin className="w-3 h-3" />
                        </div>
                        Inclure réseaux sociaux
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Boutons d'action */}
      <div className="flex gap-3">
        <Button 
          type="submit" 
          disabled={isSearching || !searchParams.query.trim() || !searchParams.city.trim()}
          className="flex-1"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Recherche en cours...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Lancer la recherche
            </>
          )}
        </Button>

        {isSearching && (
          <Button 
            type="button" 
            variant="destructive"
            onClick={onCancel}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        )}
      </div>

      {/* Progress bar pendant recherche */}
      {isSearching && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  Trouvés: {searchProgress.found}/{searchParams.maxResults}
                </span>
                <span className="text-gray-500">
                  ⏱️ {searchProgress.elapsed}s écoulées
                </span>
              </div>
              
              <Progress 
                value={searchProgress.percentage} 
                className="h-2"
              />
              
              <div className="text-xs text-gray-500">
                Recherche en cours... Les résultats s'afficheront automatiquement.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aperçu des paramètres */}
      {!isSearching && searchParams.query && searchParams.city && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-2">Aperçu de la recherche :</h4>
              <div className="space-y-1 text-blue-800">
                <p><strong>Recherche :</strong> {searchParams.query} à {searchParams.city}</p>
                <p><strong>Résultats :</strong> Jusqu'à {searchParams.maxResults} leads</p>
                <p><strong>Données :</strong> 
                  {searchParams.includeEmail && ' Email'}
                  {searchParams.includePhone && ' Téléphone'}
                  {searchParams.includeSocial && ' Réseaux sociaux'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
};

export default LeadSearchForm;
