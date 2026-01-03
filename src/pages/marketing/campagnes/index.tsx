/**
 * Page CRM Campagnes
 * Gestion des campagnes email/WhatsApp avec ciblage avancé
 * Sprint 2: Campagnes marketing multi-canal
 */

import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  Send,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCampaigns } from '@/hooks/useCRM';
import { CRMCampaign, CampaignStatus, CampaignChannel } from '@/types/crm';
import { cn } from '@/lib/utils';
import CampaignForm from '@/components/crm/CampaignForm';

const CampaignsPage: React.FC = () => {
  const { campaigns, loading, createCampaign, deleteCampaign } = useCampaigns();

  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CRMCampaign | null>(null);

  // Filtrer les campagnes
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || campaign.channel === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  // Grouper par statut
  const campaignsByStatus = {
    draft: filteredCampaigns.filter(c => c.status === 'draft'),
    scheduled: filteredCampaigns.filter(c => c.status === 'scheduled'),
    running: filteredCampaigns.filter(c => c.status === 'running'),
    completed: filteredCampaigns.filter(c => c.status === 'completed'),
    cancelled: filteredCampaigns.filter(c => c.status === 'cancelled'),
  };

  // Stats globales
  const stats = {
    total: campaigns.length,
    draft: campaignsByStatus.draft.length,
    scheduled: campaignsByStatus.scheduled.length,
    running: campaignsByStatus.running.length,
    completed: campaignsByStatus.completed.length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
    avgDeliveryRate: campaigns.length > 0
      ? campaigns.reduce((sum, c) => {
          const total = c.sent_count || 1;
          return sum + ((c.delivered_count / total) * 100);
        }, 0) / campaigns.length
      : 0,
  };

  const handleCreateCampaign = async (data: any) => {
    try {
      await createCampaign(data);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      try {
        await deleteCampaign(id);
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-primary" />
            Campagnes Marketing
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos campagnes email et WhatsApp
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle Campagne
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campagnes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.draft} brouillons, {stats.scheduled} planifiées
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Campagnes actives
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages envoyés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalSent}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Tous canaux confondus
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.avgDeliveryRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Moyenne globale
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une campagne..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="scheduled">Planifiée</SelectItem>
                <SelectItem value="running">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les canaux</SelectItem>
                <SelectItem value="email">Email uniquement</SelectItem>
                <SelectItem value="whatsapp">WhatsApp uniquement</SelectItem>
                <SelectItem value="both">Email + WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Campaigns List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Chargement des campagnes...</p>
          </CardContent>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune campagne</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première campagne pour commencer à engager vos leads
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Créer une campagne
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDelete={() => handleDeleteCampaign(campaign.id)}
              onView={() => setSelectedCampaign(campaign)}
            />
          ))}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Campagne</DialogTitle>
          </DialogHeader>
          <CampaignForm
            onSubmit={handleCreateCampaign}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Campaign Details Dialog */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
            </DialogHeader>
            <CampaignDetails campaign={selectedCampaign} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// ============================================
// CampaignCard Component
// ============================================

interface CampaignCardProps {
  campaign: CRMCampaign;
  onDelete: () => void;
  onView: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onDelete, onView }) => {
  const getStatusBadge = (status: CampaignStatus) => {
    const config = {
      draft: { label: 'Brouillon', variant: 'secondary' as const, icon: Edit },
      scheduled: { label: 'Planifiée', variant: 'default' as const, icon: Clock },
      running: { label: 'En cours', variant: 'default' as const, icon: Play },
      completed: { label: 'Terminée', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Annulée', variant: 'destructive' as const, icon: XCircle },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getChannelIcon = (channel: CampaignChannel) => {
    if (channel === 'email') return <Mail className="w-4 h-4" />;
    if (channel === 'whatsapp') return <MessageSquare className="w-4 h-4" />;
    return (
      <div className="flex gap-1">
        <Mail className="w-3 h-3" />
        <MessageSquare className="w-3 h-3" />
      </div>
    );
  };

  const deliveryRate = campaign.sent_count > 0
    ? ((campaign.delivered_count / campaign.sent_count) * 100).toFixed(1)
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getChannelIcon(campaign.channel)}
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
            </div>
            {campaign.description && (
              <CardDescription className="line-clamp-2">
                {campaign.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and Date */}
        <div className="flex items-center justify-between">
          {getStatusBadge(campaign.status)}
          {campaign.scheduled_at && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(campaign.scheduled_at).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{campaign.total_leads}</div>
            <div className="text-xs text-muted-foreground">Leads ciblés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{campaign.sent_count}</div>
            <div className="text-xs text-muted-foreground">Envoyés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{deliveryRate}%</div>
            <div className="text-xs text-muted-foreground">Délivrés</div>
          </div>
        </div>

        {/* Engagement */}
        {campaign.sent_count > 0 && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded">
              <span className="text-muted-foreground">Lus</span>
              <span className="font-semibold">{campaign.read_count}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded">
              <span className="text-muted-foreground">Réponses</span>
              <span className="font-semibold">{campaign.replied_count}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// CampaignDetails Component
// ============================================

interface CampaignDetailsProps {
  campaign: CRMCampaign;
}

const CampaignDetails: React.FC<CampaignDetailsProps> = ({ campaign }) => {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="font-semibold mb-2">Informations générales</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Canal:</span>
            <span className="font-medium capitalize">{campaign.channel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Statut:</span>
            <span className="font-medium capitalize">{campaign.status}</span>
          </div>
          {campaign.scheduled_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Planifiée pour:</span>
              <span className="font-medium">
                {new Date(campaign.scheduled_at).toLocaleString('fr-FR')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <h3 className="font-semibold mb-2">Message</h3>
        {campaign.subject && (
          <div className="mb-2">
            <span className="text-sm text-muted-foreground">Sujet:</span>
            <p className="font-medium">{campaign.subject}</p>
          </div>
        )}
        <div className="bg-muted p-4 rounded-md">
          <p className="whitespace-pre-wrap text-sm">{campaign.message}</p>
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h3 className="font-semibold mb-2">Statistiques</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 p-3 rounded">
            <div className="text-2xl font-bold">{campaign.total_leads}</div>
            <div className="text-xs text-muted-foreground">Leads ciblés</div>
          </div>
          <div className="bg-muted/50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">{campaign.sent_count}</div>
            <div className="text-xs text-muted-foreground">Envoyés</div>
          </div>
          <div className="bg-muted/50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">{campaign.delivered_count}</div>
            <div className="text-xs text-muted-foreground">Délivrés</div>
          </div>
          <div className="bg-muted/50 p-3 rounded">
            <div className="text-2xl font-bold text-purple-600">{campaign.read_count}</div>
            <div className="text-xs text-muted-foreground">Lus</div>
          </div>
          <div className="bg-muted/50 p-3 rounded">
            <div className="text-2xl font-bold text-orange-600">{campaign.replied_count}</div>
            <div className="text-xs text-muted-foreground">Réponses</div>
          </div>
          <div className="bg-muted/50 p-3 rounded">
            <div className="text-2xl font-bold text-red-600">{campaign.failed_count}</div>
            <div className="text-xs text-muted-foreground">Échecs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
