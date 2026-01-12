/**
 * Commandes Page
 *
 * Gestion des commandes clients - Connecté à la base de données
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ShoppingCart,
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MoreVertical,
} from 'lucide-react';
import { useOrders } from '@/hooks/useVente';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Order } from '@/types/vente';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CommandesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    status: filterStatus !== 'all' ? filterStatus as Order['status'] : undefined,
    payment_status: filterPayment !== 'all' ? filterPayment as Order['payment_status'] : undefined,
  }), [searchQuery, filterStatus, filterPayment]);

  const { orders, loading, updateOrderStatus, updatePaymentStatus } = useOrders(filters);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    revenue: orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total_ttc, 0),
  }), [orders]);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge className="bg-blue-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmée
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-purple-600">
            <Package className="h-3 w-3 mr-1" />
            En préparation
          </Badge>
        );
      case 'shipped':
        return (
          <Badge className="bg-orange-600">
            <Truck className="h-3 w-3 mr-1" />
            Expédiée
          </Badge>
        );
      case 'delivered':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Livrée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        );
    }
  };

  const getPaymentBadge = (status: Order['payment_status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'paid':
        return <Badge className="bg-green-600">Payée</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Remboursé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de la commande a été modifié.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Commandes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez et suivez vos commandes clients
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En traitement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expédiées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">CA Réalisé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.revenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="processing">En préparation</SelectItem>
                <SelectItem value="shipped">Expédiées</SelectItem>
                <SelectItem value="delivered">Livrées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous paiements</SelectItem>
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>{orders.length} commande(s)</CardTitle>
          <CardDescription>Liste de toutes vos commandes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des commandes...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
              <p className="text-muted-foreground">
                Les commandes apparaîtront ici une fois créées
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Suivi</TableHead>
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
                      <div>
                        <div className="font-medium">{order.client_name}</div>
                        <div className="text-xs text-muted-foreground">{order.client_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(order.total_ttc)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(order.created_at, 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.tracking_number ? (
                        <div className="text-xs">
                          <div className="font-mono">{order.tracking_number}</div>
                          {order.shipped_at && (
                            <div className="text-muted-foreground">
                              {format(order.shipped_at, 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/app/vente/commandes/${order.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmed')}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Confirmer
                            </DropdownMenuItem>
                          )}
                          {order.status === 'confirmed' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'processing')}>
                              <Package className="mr-2 h-4 w-4" />
                              En préparation
                            </DropdownMenuItem>
                          )}
                          {order.status === 'processing' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipped')}>
                              <Truck className="mr-2 h-4 w-4" />
                              Expédier
                            </DropdownMenuItem>
                          )}
                          {order.status === 'shipped' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Livré
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Générer facture
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
}
