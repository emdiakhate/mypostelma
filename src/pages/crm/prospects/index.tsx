/**
 * Page CRM Prospects
 * Leads qualifiés (interested, qualified) en cours de conversion
 */

import React, { useState, useMemo } from 'react';
import {
  Phone,
  Mail,
  Star,
  MapPin,
  Search,
  MoreVertical,
  TrendingUp,
  CheckCircle2,
  Target,
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
import { useCRMLeads, useSectors, useLeadStatusHelpers } from '@/hooks/useCRM';
import type { EnrichedLead, LeadFilters } from '@/types/crm';
import { SendMessageModal } from '@/components/leads/SendMessageModal';
import { LeadDetailModal } from '@/components/leads/LeadDetailModal';

const ProspectsPage: React.FC = () => {
  const { getStatusColor, getStatusLabel } = useLeadStatusHelpers();
  const { sectors } = useSectors();

  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    sector_ids: [],
    segment_ids: [],
    status: ['interested', 'qualified'],
    cities: [],
    tags: [],
  });

  const { leads, loading, updateLeadStatus, loadLeads, deleteLead, updateLead } = useCRMLeads(filters);
  const [selectedLead, setSelectedLead] = useState<EnrichedLead | null>(null);
  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    lead: EnrichedLead | null;
    channel: 'whatsapp' | 'email';
  }>({ open: false, lead: null, channel: 'whatsapp' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'interested' | 'qualified'>('all');

  const filteredLeads = useMemo(() => {
    if (statusFilter === 'all') return leads;
    return leads.filter((lead) => lead.status === statusFilter);
  }, [leads, statusFilter]);

  const stats = useMemo(() => ({
    total: leads.length,
    interested: leads.filter((l) => l.status === 'interested').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    avgScore: leads.length > 0 ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length : 0,
    withEmail: leads.filter((l) => l.email).length,
    withPhone: leads.filter((l) => l.phone).length,
  }), [leads]);

  const uniqueCities = useMemo(() => [...new Set(leads.map((l) => l.city).filter(Boolean))].sort(), [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-full mx-auto py-8 px-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="h-8 w-8 text-purple-600" />
            Gestion des Prospects
          </h1>
          <p className="text-gray-600 mt-1">Leads qualifiés en cours de conversion</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Total Prospects</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{stats.interested}</div><div className="text-xs text-muted-foreground">Intéressés</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-purple-600">{stats.qualified}</div><div className="text-xs text-muted-foreground">Qualifiés</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{stats.avgScore.toFixed(1)}/5</div><div className="text-xs text-muted-foreground">Score moyen</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{stats.withEmail}</div><div className="text-xs text-muted-foreground">Avec email</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-orange-600">{stats.withPhone}</div><div className="text-xs text-muted-foreground">Avec téléphone</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Rechercher..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="interested">Intéressés</SelectItem>
                <SelectItem value="qualified">Qualifiés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sector_ids?.[0] || 'all'} onValueChange={(value) => setFilters({ ...filters, sector_ids: value !== 'all' ? [value] : [], segment_ids: [] })}>
              <SelectTrigger><SelectValue placeholder="Tous secteurs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous secteurs</SelectItem>
                {sectors.map((sector) => (<SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filters.cities?.[0] || 'all'} onValueChange={(value) => setFilters({ ...filters, cities: value !== 'all' ? [value] : [] })}>
              <SelectTrigger><SelectValue placeholder="Toutes villes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes villes</SelectItem>
                {uniqueCities.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prospects ({filteredLeads.length})</CardTitle>
          <CardDescription>Cliquez sur un prospect pour voir les détails et l'historique</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLead(lead)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{lead.city}</span>
                            {lead.sector && (<><span>•</span><Badge style={{ backgroundColor: lead.sector.color || '#3B82F6', color: 'white' }} className="text-xs">{lead.sector.name}</Badge></>)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lead.score && (<Badge variant="secondary"><Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />{lead.score}/5</Badge>)}
                          <Badge className={getStatusColor(lead.status)}>{getStatusLabel(lead.status)}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {lead.phone && (<div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-4 h-4" /><span>{lead.phone}</span></div>)}
                        {lead.email && (<div className="flex items-center gap-1 text-muted-foreground"><Mail className="w-4 h-4" /><span>{lead.email}</span></div>)}
                        {lead.google_rating && (<div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-medium">{lead.google_rating.toFixed(1)}</span>{lead.google_reviews_count && (<span className="text-muted-foreground">({lead.google_reviews_count})</span>)}</div>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.phone && (<Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.open(`tel:${lead.phone}`); }}><Phone className="w-4 h-4 mr-2" />Appeler</Button>)}
                      {lead.email && (<Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setMessageModal({ open: true, lead, channel: 'email' }); }}><Mail className="w-4 h-4 mr-2" />Email</Button>)}
                      <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, 'client'); }}><CheckCircle2 className="w-4 h-4 mr-2" />Convertir en client</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, 'contacted'); }}><TrendingUp className="w-4 h-4 mr-2" />Marquer comme contacté</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, 'new'); }}>Retour en lead</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} className="text-red-600">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredLeads.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Aucun prospect trouvé</h3>
                <p className="text-sm text-muted-foreground mt-2">Les leads avec statut "Intéressé" ou "Qualifié" apparaîtront ici</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedLead && (
        <LeadDetailModal open={!!selectedLead} onClose={() => setSelectedLead(null)} lead={selectedLead}
          onSendEmail={() => { setMessageModal({ open: true, lead: selectedLead, channel: 'email' }); setSelectedLead(null); }}
          onSendWhatsApp={() => { setMessageModal({ open: true, lead: selectedLead, channel: 'whatsapp' }); setSelectedLead(null); }}
          onUpdate={async (leadId, data) => { await updateLead(leadId, data); await loadLeads(); setSelectedLead(null); }}
        />
      )}

      {messageModal.lead && (
        <SendMessageModal open={messageModal.open} onClose={() => setMessageModal({ open: false, lead: null, channel: 'whatsapp' })} lead={messageModal.lead} channel={messageModal.channel} />
      )}
    </div>
  );
};

export default ProspectsPage;
