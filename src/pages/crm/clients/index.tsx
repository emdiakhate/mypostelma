/**
 * Page CRM Clients
 * Leads convertis en clients actifs
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
  DollarSign,
  Users,
  Calendar,
  Package,
  Heart,
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
import ClientHistoryModal from '@/components/crm/ClientHistoryModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getStatusColor, getStatusLabel } = useLeadStatusHelpers();
  const { sectors } = useSectors();

  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    sector_ids: [],
    segment_ids: [],
    status: ['client'],
    cities: [],
    tags: [],
  });

  const { leads: clients, loading, updateLeadStatus, loadLeads, deleteLead, updateLead } = useCRMLeads(filters);
  const [selectedClient, setSelectedClient] = useState<EnrichedLead | null>(null);
  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    lead: EnrichedLead | null;
    channel: 'whatsapp' | 'email';
  }>({ open: false, lead: null, channel: 'whatsapp' });
  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    client: EnrichedLead | null;
    type: 'orders' | 'invoices';
  }>({ open: false, client: null, type: 'orders' });

  const stats = useMemo(() => ({
    total: clients.length,
    avgScore: clients.length > 0 ? clients.reduce((sum, l) => sum + (l.score || 0), 0) / clients.length : 0,
    withEmail: clients.filter((l) => l.email).length,
    withPhone: clients.filter((l) => l.phone).length,
    topRated: clients.filter((l) => (l.google_rating || 0) >= 4.5).length,
  }), [clients]);

  const uniqueCities = useMemo(() => [...new Set(clients.map((l) => l.city).filter(Boolean))].sort(), [clients]);

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
            <Heart className="h-8 w-8 text-emerald-600" />
            Gestion des Clients
          </h1>
          <p className="text-gray-600 mt-1">Leads convertis en clients actifs</p>
        </div>
        <Button onClick={() => navigate('/app/orders/new')}>
          <Package className="w-4 h-4 mr-2" />
          Nouvelle commande
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-emerald-600">{stats.total}</div><div className="text-xs text-muted-foreground">Total Clients</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{stats.avgScore.toFixed(1)}/5</div><div className="text-xs text-muted-foreground">Score moyen</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{stats.withEmail}</div><div className="text-xs text-muted-foreground">Avec email</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-orange-600">{stats.withPhone}</div><div className="text-xs text-muted-foreground">Avec téléphone</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-purple-600">{stats.topRated}</div><div className="text-xs text-muted-foreground">Top notés (4.5+)</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Rechercher un client..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="pl-10" />
            </div>
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
          <CardTitle>Mes Clients ({clients.length})</CardTitle>
          <CardDescription>Cliquez sur un client pour voir son historique complet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClient(client)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{client.city}</span>
                            {client.sector && (<><span>•</span><Badge style={{ backgroundColor: client.sector.color || '#3B82F6', color: 'white' }} className="text-xs">{client.sector.name}</Badge></>)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {client.score && (<Badge variant="secondary"><Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />{client.score}/5</Badge>)}
                          <Badge className="bg-emerald-600">Client</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {client.phone && (<div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-4 h-4" /><span>{client.phone}</span></div>)}
                        {client.email && (<div className="flex items-center gap-1 text-muted-foreground"><Mail className="w-4 h-4" /><span>{client.email}</span></div>)}
                        {client.google_rating && (<div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-medium">{client.google_rating.toFixed(1)}</span>{client.google_reviews_count && (<span className="text-muted-foreground">({client.google_reviews_count})</span>)}</div>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.phone && (<Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.open(`tel:${client.phone}`); }}><Phone className="w-4 h-4 mr-2" />Appeler</Button>)}
                      {client.email && (<Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setMessageModal({ open: true, lead: client, channel: 'email' }); }}><Mail className="w-4 h-4 mr-2" />Email</Button>)}
                      <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); navigate('/app/orders/new', { state: { client } }); }}><Package className="w-4 h-4 mr-2" />Commander</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setHistoryModal({ open: true, client, type: 'orders' }); }}>
                            <Package className="w-4 h-4 mr-2" />Historique commandes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setHistoryModal({ open: true, client, type: 'invoices' }); }}>
                            <DollarSign className="w-4 h-4 mr-2" />Voir factures
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async (e) => {
                            e.stopPropagation();
                            await updateLeadStatus(client.id, 'interested');
                            await loadLeads();
                            toast.success('Client retourné dans les prospects');
                          }}>
                            <TrendingUp className="w-4 h-4 mr-2" />Retour en prospect
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteLead(client.id); }} className="text-red-600">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {clients.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Aucun client trouvé</h3>
                <p className="text-sm text-muted-foreground mt-2">Les leads convertis en clients apparaîtront ici</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <LeadDetailModal open={!!selectedClient} onClose={() => setSelectedClient(null)} lead={selectedClient}
          onSendEmail={() => { setMessageModal({ open: true, lead: selectedClient, channel: 'email' }); setSelectedClient(null); }}
          onSendWhatsApp={() => { setMessageModal({ open: true, lead: selectedClient, channel: 'whatsapp' }); setSelectedClient(null); }}
          onUpdate={async (leadId, data) => { await updateLead(leadId, data); await loadLeads(); setSelectedClient(null); }}
        />
      )}

      {messageModal.lead && (
        <SendMessageModal open={messageModal.open} onClose={() => setMessageModal({ open: false, lead: null, channel: 'whatsapp' })} lead={messageModal.lead} channel={messageModal.channel} />
      )}

      {historyModal.client && (
        <ClientHistoryModal
          open={historyModal.open}
          onClose={() => setHistoryModal({ open: false, client: null, type: 'orders' })}
          client={historyModal.client}
          type={historyModal.type}
        />
      )}
    </div>
  );
};

export default ClientsPage;
