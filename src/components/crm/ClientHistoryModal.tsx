/**
 * Modal pour afficher l'historique d'un client (commandes, factures, etc.)
 */

import React, { useMemo } from 'react';
import { Package, FileText, Calendar, DollarSign, Eye, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EnrichedLead } from '@/types/crm';
import { useOrders } from '@/hooks/useVente';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ClientHistoryModalProps {
  open: boolean;
  onClose: () => void;
  client: EnrichedLead;
  type: 'orders' | 'invoices';
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  open,
  onClose,
  client,
  type,
}) => {
  const navigate = useNavigate();
  const isOrders = type === 'orders';

  // Filtrer les commandes par nom de client
  const clientFilters = useMemo(() => ({
    client_name: client.name,
  }), [client.name]);

  const { orders, loading } = useOrders(clientFilters);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100">En attente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-600">Confirmée</Badge>;
      case 'processing':
        return <Badge className="bg-purple-600">En préparation</Badge>;
      case 'shipped':
        return <Badge className="bg-orange-600">Expédiée</Badge>;
      case 'delivered':
        return <Badge className="bg-green-600">Livrée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'paid':
        return <Badge className="bg-green-600">Payée</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Remboursée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = useMemo(() => ({
    total: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total_ttc, 0),
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }), [orders]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOrders ? (
              <>
                <Package className="w-5 h-5" />
                Historique des commandes
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Factures
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isOrders
              ? `Toutes les commandes de ${client.name}`
              : `Toutes les factures de ${client.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isOrders ? (
            <>
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Commandes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalSpent)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total dépensé</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-xs text-muted-foreground">En attente</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                    <div className="text-xs text-muted-foreground">Livrées</div>
                  </CardContent>
                </Card>
              </div>

              {/* Liste des commandes */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement des commandes...
                </div>
              ) : orders.length === 0 ? (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <Package className="w-12 h-12 mx-auto text-blue-600 mb-3" />
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Aucune commande
                    </h3>
                    <p className="text-sm text-blue-800">
                      Ce client n'a pas encore passé de commande.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Paiement</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div className="font-mono font-semibold">{order.number}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(order.created_at, 'dd MMM yyyy', { locale: fr })}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="font-semibold text-green-600">
                                {formatCurrency(order.total_ttc)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigate(`/app/vente/commandes/${order.id}`);
                                  onClose();
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Voir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Factures - lien vers module Compta */
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Gestion des factures
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                      Les factures sont gérées dans le module Comptabilité. Cliquez sur le bouton ci-dessous pour accéder à toutes les factures de ce client.
                    </p>
                    <Button
                      onClick={() => {
                        navigate(`/app/compta/factures?client=${encodeURIComponent(client.name)}`);
                        onClose();
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir les factures dans Compta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations client */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-700 mb-3">
                Informations du client
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom:</span>
                  <span className="font-medium">{client.name}</span>
                </div>
                {client.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="font-medium">{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ville:</span>
                    <span className="font-medium">{client.city}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientHistoryModal;
