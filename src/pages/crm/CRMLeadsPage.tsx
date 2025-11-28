/**
 * Page CRM Leads avec vue Kanban
 * Gestion complète des leads avec drag & drop, filtres avancés
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Phone,
  Mail,
  Star,
  MapPin,
  Building,
  Filter,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  MessageSquare,
  Globe,
  TrendingUp,
  X,
  Upload,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCRMLeads, useSectors, useSegments, useLeadStatusHelpers } from '@/hooks/useCRM';
import { EnrichedLead, LeadStatus, LeadFilters, LeadFormData } from '@/types/crm';
import { cn } from '@/lib/utils';
import AddLeadModal from '@/components/crm/AddLeadModal';
import ImportCSVModal from '@/components/crm/ImportCSVModal';

const CRMLeadsPage: React.FC = () => {
  const { getStatusColor, getStatusLabel, getStatusIcon } = useLeadStatusHelpers();
  const { sectors } = useSectors();
  const { segments } = useSegments();

  // Filtres
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    sector_ids: [],
    segment_ids: [],
    status: [],
    cities: [],
    tags: [],
  });

  // Charger les leads avec filtres
  const { leads, loading, createLead, updateLeadStatus, deleteLead } = useCRMLeads(filters);

  // Vue sélectionnée
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Lead sélectionné pour détails
  const [selectedLead, setSelectedLead] = useState<EnrichedLead | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Drag & Drop state
  const [draggedLead, setDraggedLead] = useState<EnrichedLead | null>(null);

  // Grouper les leads par statut pour la vue Kanban
  const leadsByStatus = useMemo(() => {
    const statuses: LeadStatus[] = ['new', 'contacted', 'interested', 'qualified', 'client'];
    return statuses.reduce((acc, status) => {
      acc[status] = leads.filter((lead) => lead.status === status);
      return acc;
    }, {} as Record<LeadStatus, EnrichedLead[]>);
  }, [leads]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: leads.length,
      new: leadsByStatus['new']?.length || 0,
      contacted: leadsByStatus['contacted']?.length || 0,
      interested: leadsByStatus['interested']?.length || 0,
      qualified: leadsByStatus['qualified']?.length || 0,
      client: leadsByStatus['client']?.length || 0,
      avgScore:
        leads.length > 0
          ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length
          : 0,
    };
  }, [leads, leadsByStatus]);

  // Villes uniques pour le filtre
  const uniqueCities = useMemo(() => {
    return [...new Set(leads.map((l) => l.city).filter(Boolean))].sort();
  }, [leads]);

  // Changement de statut
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, lead: EnrichedLead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();

    if (!draggedLead) return;

    // Ne rien faire si on drop sur la même colonne
    if (draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    // Mettre à jour le statut
    try {
      await handleStatusChange(draggedLead.id, newStatus);
    } catch (error) {
      console.error('Error during drop:', error);
    } finally {
      setDraggedLead(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
  };

  // Modal handlers
  const handleAddLead = async (leadData: LeadFormData) => {
    await createLead(leadData);
  };

  const handleImportLeads = async (leads: LeadFormData[]) => {
    // Import leads one by one
    for (const leadData of leads) {
      try {
        await createLead(leadData);
      } catch (error) {
        console.error('Error importing lead:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-full mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Leads</h1>
          <p className="text-gray-600">
            Suivez et qualifiez vos prospects jusqu'à la conversion
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importer CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-xs text-muted-foreground">Nouveaux</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
            <div className="text-xs text-muted-foreground">Contactés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.interested}</div>
            <div className="text-xs text-muted-foreground">Intéressés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.qualified}</div>
            <div className="text-xs text-muted-foreground">Qualifiés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.client}</div>
            <div className="text-xs text-muted-foreground">Clients</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-10"
              />
            </div>

            {/* Secteur */}
            <Select
              value={filters.sector_ids?.[0] || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  sector_ids: value !== 'all' ? [value] : [],
                  segment_ids: [], // Reset segments
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous secteurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous secteurs</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Segment */}
            {filters.sector_ids && filters.sector_ids.length > 0 && (
              <Select
                value={filters.segment_ids?.[0] || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    segment_ids: value !== 'all' ? [value] : [],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous segments</SelectItem>
                  {segments
                    .filter((s) => s.sector_id === filters.sector_ids?.[0])
                    .map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            {/* Ville */}
            <Select
              value={filters.cities?.[0] || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  cities: value !== 'all' ? [value] : [],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes villes</SelectItem>
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset filters */}
          {(filters.search ||
            filters.sector_ids?.length ||
            filters.cities?.length) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() =>
                setFilters({
                  search: '',
                  sector_ids: [],
                  segment_ids: [],
                  status: [],
                  cities: [],
                  tags: [],
                })
              }
            >
              <X className="w-4 h-4 mr-2" />
              Réinitialiser les filtres
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Vue Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Colonnes par statut */}
        {(['new', 'contacted', 'interested', 'qualified', 'client'] as LeadStatus[]).map(
          (status) => (
            <Card
              key={status}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getStatusIcon(status)}</span>
                    <div>
                      <CardTitle className="text-sm">
                        {getStatusLabel(status)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {leadsByStatus[status]?.length || 0} lead(s)
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 max-h-[600px] overflow-y-auto">
                {leadsByStatus[status]?.map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "hover:shadow-md transition-shadow cursor-move",
                      draggedLead?.id === lead.id && "opacity-50"
                    )}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <CardContent className="p-3 space-y-2">
                      {/* Nom */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm line-clamp-2">
                          {lead.name}
                        </h4>
                        {lead.score && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {lead.score}/5
                          </Badge>
                        )}
                      </div>

                      {/* Secteur/Segment */}
                      {lead.sector && (
                        <Badge
                          style={{
                            backgroundColor: lead.sector.color || '#3B82F6',
                            color: 'white',
                          }}
                          className="text-xs"
                        >
                          {lead.sector.name}
                          {lead.segment && ` - ${lead.segment.name}`}
                        </Badge>
                      )}

                      {/* Ville */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{lead.city}</span>
                      </div>

                      {/* Rating Google */}
                      {lead.google_rating && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{lead.google_rating.toFixed(1)}</span>
                          {lead.google_reviews_count && (
                            <span className="text-muted-foreground">
                              ({lead.google_reviews_count})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1 pt-1">
                        {lead.phone && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${lead.phone}`);
                            }}
                          >
                            <Phone className="w-3 h-3" />
                          </Button>
                        )}
                        {lead.email && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`mailto:${lead.email}`);
                            }}
                          >
                            <Mail className="w-3 h-3" />
                          </Button>
                        )}
                        {lead.whatsapp && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`
                              );
                            }}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        )}

                        {/* Menu actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 ml-auto"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Changer de statut */}
                            {(['new', 'contacted', 'interested', 'qualified', 'client'] as LeadStatus[])
                              .filter((s) => s !== status)
                              .map((newStatus) => (
                                <DropdownMenuItem
                                  key={newStatus}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(lead.id, newStatus);
                                  }}
                                >
                                  <TrendingUp className="w-4 h-4 mr-2" />
                                  Marquer comme {getStatusLabel(newStatus)}
                                </DropdownMenuItem>
                              ))}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLead(lead.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Empty state */}
                {leadsByStatus[status]?.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Aucun lead
                  </div>
                )}
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Lead Detail Modal - TO DO: Create separate component */}
      {/* For now, clicking a lead just logs it */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLead(null)}
        >
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedLead.name}</CardTitle>
                  <CardDescription>{selectedLead.city}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLead(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Détails complets du lead - À implémenter
              </p>
              {/* TO DO: Add full lead details */}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Lead Modal */}
      <AddLeadModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddLead}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportLeads}
      />
    </div>
  );
};

export default CRMLeadsPage;
