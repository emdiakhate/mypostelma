/**
 * Page Prospects - Leads non qualifiés
 * Liste les leads avec statut 'new' uniquement
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRMLeads, useLeadStatusHelpers } from '@/hooks/useCRM';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Eye, Phone, Mail, MessageSquare } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const ProspectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getStatusColor, getStatusLabel } = useLeadStatusHelpers();

  // Charger uniquement les prospects (statut 'new')
  const { leads, loading } = useCRMLeads({ status: ['new'] });

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
          <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
          <p className="text-gray-600">
            Leads non encore contactés ou qualifiés
          </p>
        </div>
        <Button onClick={() => navigate('/app/crm/leads')}>
          <Users className="w-4 h-4 mr-2" />
          Voir tous les leads
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Prospects</p>
              <p className="text-3xl font-bold text-blue-600">{leads.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                À contacter rapidement
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Table des prospects */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Prospects</CardTitle>
          <CardDescription>
            Leads en attente de premier contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Aucun prospect</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tous vos leads ont été qualifiés !
              </p>
              <Button onClick={() => navigate('/app/crm/leads')}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un lead
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
                        {lead.phone && <Phone className="w-4 h-4 text-green-600" />}
                        {lead.email && <Mail className="w-4 h-4 text-blue-600" />}
                        {lead.whatsapp && (
                          <MessageSquare className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.score && (
                        <Badge variant="secondary">{lead.score}/5</Badge>
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

export default ProspectsPage;
