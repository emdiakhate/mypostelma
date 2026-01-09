/**
 * Stock - Liste des Commandes d'Achat
 *
 * Page de gestion des commandes d'achat fournisseurs
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/useSuppliers';
import {
  getPurchaseOrderStatusLabel,
  getPurchaseOrderStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '@/types/suppliers';
import { formatCurrency } from '@/types/compta';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import PurchaseOrderForm from './PurchaseOrderForm';
import ReceiveOrderDialog from './ReceiveOrderDialog';

export default function CommandesAchatListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');

  const filters = useMemo(
    () => ({
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [statusFilter]
  );

  const { purchaseOrders, loading, deletePurchaseOrder, updatePurchaseOrderStatus } =
    usePurchaseOrders(filters);

  // Filtrer localement par recherche (numéro commande ou fournisseur)
  const filteredOrders = useMemo(() => {
    if (!search) return purchaseOrders;
    const searchLower = search.toLowerCase();
    return purchaseOrders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(searchLower) ||
        order.supplier?.name.toLowerCase().includes(searchLower)
    );
  }, [purchaseOrders, search]);

  // Dialog de confirmation suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);

  // Dialog formulaire
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  // Dialog réception
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null);

  // Actions
  const handleView = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setFormDialogOpen(true);
  };

  const handleEdit = (order: PurchaseOrder) => {
    if (order.status !== 'draft') {
      toast({
        title: 'Modification impossible',
        description: 'Seules les commandes en brouillon peuvent être modifiées',
        variant: 'destructive',
      });
      return;
    }
    setEditingOrder(order);
    setFormDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingOrder(null);
    setFormDialogOpen(true);
  };

  const handleReceive = (order: PurchaseOrder) => {
    setOrderToReceive(order);
    setReceiveDialogOpen(true);
  };

  const handleSendOrder = async (order: PurchaseOrder) => {
    try {
      await updatePurchaseOrderStatus(order.id, 'sent');
      toast({
        title: 'Commande envoyée',
        description: `La commande ${order.order_number} a été marquée comme envoyée`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmOrder = async (order: PurchaseOrder) => {
    try {
      await updatePurchaseOrderStatus(order.id, 'confirmed');
      toast({
        title: 'Commande confirmée',
        description: `La commande ${order.order_number} a été confirmée`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (order: PurchaseOrder) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;

    try {
      await deletePurchaseOrder(orderToDelete.id);
      toast({
        title: 'Commande supprimée',
        description: `La commande ${orderToDelete.order_number} a été supprimée`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la commande',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingOrder(null);
  };

  const handleReceiveSuccess = () => {
    setReceiveDialogOpen(false);
    setOrderToReceive(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Commandes d'Achat
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos commandes aux fournisseurs
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle commande
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par n° ou fournisseur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtre statut */}
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as PurchaseOrderStatus | 'all')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyée</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="partially_received">Partiellement reçue</SelectItem>
                <SelectItem value="received">Reçue</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>

            {/* Bouton reset */}
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
          </CardTitle>
          <CardDescription>Liste de toutes vos commandes d'achat</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des commandes...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande trouvée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter !== 'all'
                  ? 'Aucune commande ne correspond à vos critères'
                  : 'Commencez par créer votre première commande d\'achat'}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une commande
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date commande</TableHead>
                    <TableHead>Livraison prévue</TableHead>
                    <TableHead>Montant total</TableHead>
                    <TableHead>Statut commande</TableHead>
                    <TableHead>Statut paiement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.supplier?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.order_date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.expected_delivery_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(order.expected_delivery_date),
                              'dd/MM/yyyy',
                              { locale: fr }
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPurchaseOrderStatusColor(order.status)}>
                          {getPurchaseOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          {getPaymentStatusLabel(order.payment_status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(order)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </DropdownMenuItem>
                            {order.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleEdit(order)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />

                            {/* Actions selon statut */}
                            {order.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSendOrder(order)}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" />
                                Marquer comme envoyée
                              </DropdownMenuItem>
                            )}
                            {order.status === 'sent' && (
                              <DropdownMenuItem onClick={() => handleConfirmOrder(order)}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-purple-600" />
                                Marquer comme confirmée
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'confirmed' ||
                              order.status === 'partially_received') && (
                              <DropdownMenuItem onClick={() => handleReceive(order)}>
                                <Package className="mr-2 h-4 w-4 text-green-600" />
                                Recevoir marchandise
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => confirmDelete(order)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog confirmation suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la commande{' '}
              <strong>{orderToDelete?.order_number}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog formulaire */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? 'Voir la commande' : 'Nouvelle commande d\'achat'}
            </DialogTitle>
            <DialogDescription>
              {editingOrder
                ? `Commande ${editingOrder.order_number}`
                : 'Créez une nouvelle commande d\'achat fournisseur'}
            </DialogDescription>
          </DialogHeader>
          <PurchaseOrderForm
            order={editingOrder}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog réception */}
      {orderToReceive && (
        <ReceiveOrderDialog
          order={orderToReceive}
          open={receiveDialogOpen}
          onOpenChange={setReceiveDialogOpen}
          onSuccess={handleReceiveSuccess}
        />
      )}
    </div>
  );
}
