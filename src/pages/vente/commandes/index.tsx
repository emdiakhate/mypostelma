/**
 * Commandes Page
 *
 * Gestion des commandes clients.
 * Suivi du traitement, livraison et facturation.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ShoppingCart,
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Order {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  totalHT: number;
  totalTTC: number;
  createdAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function CommandesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      number: 'CMD-2026-001',
      clientName: 'Entreprise ABC',
      clientEmail: 'contact@abc.com',
      status: 'confirmed',
      paymentStatus: 'paid',
      totalHT: 5000,
      totalTTC: 6000,
      createdAt: new Date(2026, 0, 4),
      items: [
        { id: '1', name: 'Formation Social Media Marketing', quantity: 1, unitPrice: 1500, total: 1500 },
        { id: '2', name: 'Audit Réseaux Sociaux', quantity: 1, unitPrice: 800, total: 800 },
        { id: '3', name: 'Gestion de Campagne', quantity: 20, unitPrice: 145, total: 2900 },
      ],
    },
    {
      id: '2',
      number: 'CMD-2026-002',
      clientName: 'Startup XYZ',
      clientEmail: 'hello@xyz.io',
      status: 'processing',
      paymentStatus: 'paid',
      totalHT: 3500,
      totalTTC: 4200,
      createdAt: new Date(2026, 0, 6),
      items: [
        { id: '1', name: 'Abonnement MyPostelma Pro', quantity: 12, unitPrice: 99, total: 1188 },
        { id: '2', name: 'Formation équipe', quantity: 1, unitPrice: 2312, total: 2312 },
      ],
    },
    {
      id: '3',
      number: 'CMD-2026-003',
      clientName: 'E-commerce Shop',
      clientEmail: 'team@shop.fr',
      status: 'shipped',
      paymentStatus: 'paid',
      totalHT: 450,
      totalTTC: 540,
      createdAt: new Date(2026, 0, 7),
      shippedAt: new Date(2026, 0, 8),
      trackingNumber: 'FR123456789',
      items: [
        { id: '1', name: 'Pack Starter', quantity: 3, unitPrice: 150, total: 450 },
      ],
    },
    {
      id: '4',
      number: 'CMD-2026-004',
      clientName: 'Agency Digital',
      clientEmail: 'info@agency.com',
      status: 'delivered',
      paymentStatus: 'paid',
      totalHT: 2800,
      totalTTC: 3360,
      createdAt: new Date(2025, 11, 28),
      shippedAt: new Date(2025, 11, 29),
      deliveredAt: new Date(2026, 0, 2),
      trackingNumber: 'FR987654321',
      items: [
        { id: '1', name: 'Licence Pro', quantity: 10, unitPrice: 280, total: 2800 },
      ],
    },
    {
      id: '5',
      number: 'CMD-2026-005',
      clientName: 'Commerce Local',
      clientEmail: 'info@local.com',
      status: 'pending',
      paymentStatus: 'pending',
      totalHT: 1200,
      totalTTC: 1440,
      createdAt: new Date(2026, 0, 9),
      items: [
        { id: '1', name: 'Consultation', quantity: 8, unitPrice: 150, total: 1200 },
      ],
    },
  ]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || order.paymentStatus === filterPayment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing' || o.status === 'confirmed').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    revenue: orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalTTC, 0),
  };

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

  const getPaymentBadge = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'paid':
        return <Badge className="bg-green-600">Payée</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
    }
  };

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          const updates: Partial<Order> = { status: newStatus };
          if (newStatus === 'shipped' && !o.shippedAt) {
            updates.shippedAt = new Date();
            updates.trackingNumber = `FR${Math.random().toString().slice(2, 11)}`;
          }
          if (newStatus === 'delivered' && !o.deliveredAt) {
            updates.deliveredAt = new Date();
          }
          return { ...o, ...updates };
        }
        return o;
      })
    );
    toast({
      title: 'Statut mis à jour',
      description: 'Le statut de la commande a été modifié.',
    });
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
              {stats.revenue.toLocaleString()}€
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
                <SelectItem value="failed">Échec</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-mono font-semibold">{order.number}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.clientName}</div>
                    <div className="text-xs text-muted-foreground">{order.clientEmail}</div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                <TableCell>
                  <div className="font-semibold text-green-600">
                    {order.totalTTC.toLocaleString()}€
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(order.createdAt, 'dd MMM yyyy', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>
                  {order.trackingNumber ? (
                    <div className="text-xs">
                      <div className="font-mono">{order.trackingNumber}</div>
                      {order.shippedAt && (
                        <div className="text-muted-foreground">
                          {format(order.shippedAt, 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" title="Voir détails">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status === 'confirmed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Marquer en préparation"
                        onClick={() => handleUpdateStatus(order.id, 'processing')}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                    )}
                    {order.status === 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Marquer comme expédiée"
                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Marquer comme livrée"
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" title="Générer facture">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-muted-foreground">
              Les commandes apparaîtront ici une fois créées
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
