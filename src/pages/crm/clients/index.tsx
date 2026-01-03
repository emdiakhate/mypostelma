/**
 * Page Clients - Leads convertis
 * Liste les leads avec statut 'client' uniquement
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRMLeads, useLeadStatusHelpers } from '@/hooks/useCRM';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, TrendingUp, Eye, Phone, Mail, MessageSquare, Star, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getStatusColor, getStatusLabel } = useLeadStatusHelpers();

  // Charger uniquement les clients (statut 'client')
  const { leads, loading } = useCRMLeads({ status: ['client'] });

  // Statistiques
  const stats = useMemo(() => {
    const avgScore = leads.length > 0
      ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length
      : 0;

    const withRating = leads.filter(l => l.google_rating).length;
    const avgRating = withRating > 0
      ? leads.reduce((sum, l) => sum + (l.google_rating || 0), 0) / withRating
      : 0;

    return {
      total: leads.length,
      avgScore: avgScore.toFixed(1),
      avgRating: avgRating.toFixed(1),
      withRating,
    };
  }, [leads]);

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
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">
            Leads convertis en clients actifs
          </p>
        </div>
        <Button onClick={() => navigate('/app/crm/leads')}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Vue complète
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Leads convertis
                </p>
              </div>
              <UserCheck className="w-12 h-12 text-emerald-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score Moyen</p>
                <p className="text-3xl font-bold text-blue-600">{stats.avgScore}/5</p>
                <p className="text-xs text-gray-500 mt-1">
                  Qualité des clients
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Note Google</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.avgRating}/5</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.withRating} clients notés
                </p>
              </div>
              <Star className="w-12 h-12 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des clients */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            Gérez vos relations clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Aucun client</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par convertir vos leads en clients
              </p>
              <Button onClick={() => navigate('/app/crm/leads')}>
                Voir les leads
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Client depuis</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      {lead.sector && (
                        <Badge
                          style={{
                            backgroundColor: lead.sector.color || '#3B82F6',
                            color: 'white',
                          }}
                        >
                          {lead.sector.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{lead.city}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(`tel:${lead.phone}`)}
                          >
                            <Phone className="w-3 h-3 text-green-600" />
                          </Button>
                        )}
                        {lead.email && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(`mailto:${lead.email}`)}
                          >
                            <Mail className="w-3 h-3 text-blue-600" />
                          </Button>
                        )}
                        {lead.whatsapp && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              window.open(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`)
                            }
                          >
                            <MessageSquare className="w-3 h-3 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.score && (
                        <Badge variant="secondary">{lead.score}/5</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.google_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{lead.google_rating.toFixed(1)}</span>
                          {lead.google_reviews_count && (
                            <span className="text-xs text-muted-foreground">
                              ({lead.google_reviews_count})
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.added_at && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(lead.added_at), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/app/crm/leads/${lead.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage;
