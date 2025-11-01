/**
 * Page principale de Lead Generation
 * Phase 4: Lead Generation System
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  BarChart3, 
  Target,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeads, useLeadStatus } from '@/hooks/useLeads';
import { useLeadGeneration } from '@/hooks/useLeadGeneration';
import { Lead, LeadStatus } from '@/types/leads';
import { LeadGenerationWidget } from '@/components/LeadGenerationWidget';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LeadGenerationPage: React.FC = () => {
  const { leads, loading, error, loadLeads } = useLeads();
  const { getStatusColor, getStatusLabel } = useLeadStatus();
  const { canGenerate, incrementCount } = useLeadGeneration();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddLead, setShowAddLead] = useState(false);

  const handleGenerateLead = async () => {
    if (!canGenerate) {
      toast.error('Vous avez atteint la limite de génération de leads');
      return;
    }

    const success = await incrementCount();
    if (success) {
      // Logique de génération de lead ici
      setShowAddLead(true);
    }
  };

  // Filtrer les leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || lead.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Statistiques rapides
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    interested: leads.filter(l => l.status === 'interested').length,
    clients: leads.filter(l => l.status === 'client').length
  };

  const conversionRate = stats.total > 0 ? ((stats.clients / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
          <Button onClick={handleGenerateLead} disabled={!canGenerate}>
            <Plus className="w-4 h-4 mr-2" />
            Générer un Lead
          </Button>
        </div>
      </div>

      {/* Widget de limite de génération */}
      <LeadGenerationWidget />

      {/* Statistiques KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nouveaux</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contactés</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.contacted}</p>
              </div>
              <Phone className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Intéressés</p>
                <p className="text-2xl font-bold text-green-600">{stats.interested}</p>
              </div>
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-purple-600">{stats.clients}</p>
                <p className="text-xs text-gray-500">{conversionRate}% conversion</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, catégorie, ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="contacted">Contacté</SelectItem>
                <SelectItem value="interested">Intéressé</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="not_interested">Pas intéressé</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="salon">Salon</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="boutique">Boutique</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={loadLeads}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des leads */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            Gérez vos prospects et suivez leur progression
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Erreur: {error.message}</p>
              <Button onClick={loadLeads} className="mt-4">
                Réessayer
              </Button>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun lead trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Aucun lead ne correspond à vos critères de recherche'
                  : 'Commencez par ajouter votre premier lead'
                }
              </p>
              <Button onClick={() => setShowAddLead(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un lead
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <LeadCard 
                  key={lead.id} 
                  lead={lead} 
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Composant pour afficher un lead
interface LeadCardProps {
  lead: Lead;
  getStatusColor: (status: LeadStatus) => string;
  getStatusLabel: (status: LeadStatus) => string;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, getStatusColor, getStatusLabel }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
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
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(lead.addedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informations</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Adresse:</strong> {lead.address}</p>
                      {lead.postalCode && <p><strong>Code postal:</strong> {lead.postalCode}</p>}
                      {lead.website && <p><strong>Site web:</strong> {lead.website}</p>}
                      <p><strong>Source:</strong> {lead.source}</p>
                    </div>
                  </div>
                  
                  {lead.socialMedia && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Réseaux sociaux</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {lead.socialMedia.instagram && <p><strong>Instagram:</strong> @{lead.socialMedia.instagram}</p>}
                        {lead.socialMedia.facebook && <p><strong>Facebook:</strong> {lead.socialMedia.facebook}</p>}
                        {lead.socialMedia.linkedin && <p><strong>LinkedIn:</strong> {lead.socialMedia.linkedin}</p>}
                      </div>
                    </div>
                  )}
                </div>
                
                {lead.notes && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{lead.notes}</p>
                  </div>
                )}
                
                {lead.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Réduire' : 'Détails'}
            </Button>
            
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadGenerationPage;
