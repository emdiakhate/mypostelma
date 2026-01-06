/**
 * Stock - Transferts Page
 *
 * Interface simplifiée pour les transferts inter-entrepôts.
 * Avec vérification de stock disponible avant transfert.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowRightLeft,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Calendar,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useStockMovements,
  useStockProducts,
  useWarehouses,
  useStockLevels,
} from '@/hooks/useStock';
import { CreateStockMovementInput } from '@/types/stock';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StockTransfertsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Hooks
  const {
    movements,
    loading: loadingMovements,
    createMovement,
    loadMovements,
  } = useStockMovements({ movement_type: 'TRANSFER' });

  const {
    products,
    loading: loadingProducts,
    loadProducts,
  } = useStockProducts({ status: 'active', is_stockable: true });

  const {
    warehouses,
    loading: loadingWarehouses,
    loadWarehouses,
  } = useWarehouses({ is_active: true });

  const { checkStockAvailable, getProductStock } = useStockLevels();

  const [newTransfer, setNewTransfer] = useState({
    product_id: '',
    quantity: 0,
    warehouse_from_id: '',
    warehouse_to_id: '',
    reason: '',
    reference_number: '',
    notes: '',
  });

  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [checkingStock, setCheckingStock] = useState(false);


  // Vérifier le stock disponible quand produit et entrepôt source changent
  useEffect(() => {
    const checkStock = async () => {
      if (newTransfer.product_id && newTransfer.warehouse_from_id) {
        setCheckingStock(true);
        try {
          const stock = await getProductStock(
            newTransfer.product_id,
            newTransfer.warehouse_from_id
          );
          setAvailableStock(stock);
        } catch (err) {
          console.error('Erreur vérification stock:', err);
          setAvailableStock(null);
        } finally {
          setCheckingStock(false);
        }
      } else {
        setAvailableStock(null);
      }
    };

    checkStock();
  }, [newTransfer.product_id, newTransfer.warehouse_from_id]);

  const handleCreateTransfer = async () => {
    try {
      // Validations
      if (!newTransfer.product_id) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un produit.',
          variant: 'destructive',
        });
        return;
      }

      if (!newTransfer.warehouse_from_id || !newTransfer.warehouse_to_id) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner les entrepôts source et destination.',
          variant: 'destructive',
        });
        return;
      }

      if (newTransfer.warehouse_from_id === newTransfer.warehouse_to_id) {
        toast({
          title: 'Erreur',
          description: 'Les entrepôts source et destination doivent être différents.',
          variant: 'destructive',
        });
        return;
      }

      if (!newTransfer.quantity || newTransfer.quantity <= 0) {
        toast({
          title: 'Erreur',
          description: 'La quantité doit être supérieure à 0.',
          variant: 'destructive',
        });
        return;
      }

      // Vérifier stock disponible
      if (availableStock !== null && newTransfer.quantity > availableStock) {
        toast({
          title: 'Stock insuffisant',
          description: `Stock disponible: ${availableStock}. Vous ne pouvez pas transférer ${newTransfer.quantity}.`,
          variant: 'destructive',
        });
        return;
      }

      if (!newTransfer.reason) {
        toast({
          title: 'Erreur',
          description: 'Veuillez spécifier une raison.',
          variant: 'destructive',
        });
        return;
      }

      // Créer le mouvement de transfert
      const movementInput: CreateStockMovementInput = {
        product_id: newTransfer.product_id,
        movement_type: 'TRANSFER',
        quantity: newTransfer.quantity,
        warehouse_from_id: newTransfer.warehouse_from_id,
        warehouse_to_id: newTransfer.warehouse_to_id,
        reason: newTransfer.reason,
        reference_type: 'MANUAL',
        reference_number: newTransfer.reference_number || undefined,
        notes: newTransfer.notes || undefined,
      };

      await createMovement(movementInput);
      toast({
        title: 'Transfert créé',
        description: 'Le transfert de stock a été enregistré avec succès.',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadMovements();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le transfert.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewTransfer({
      product_id: '',
      quantity: 0,
      warehouse_from_id: '',
      warehouse_to_id: '',
      reason: '',
      reference_number: '',
      notes: '',
    });
    setAvailableStock(null);
  };

  const filteredTransfers = movements.filter((movement) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      movement.product?.name.toLowerCase().includes(query) ||
      movement.reason.toLowerCase().includes(query) ||
      movement.warehouse_from?.name.toLowerCase().includes(query) ||
      movement.warehouse_to?.name.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: movements.length,
    thisMonth: movements.filter((m) => {
      const date = new Date(m.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  const getSelectedProduct = () => {
    return products.find((p) => p.id === newTransfer.product_id);
  };

  const getSelectedWarehouseFrom = () => {
    return warehouses.find((w) => w.id === newTransfer.warehouse_from_id);
  };

  const getSelectedWarehouseTo = () => {
    return warehouses.find((w) => w.id === newTransfer.warehouse_to_id);
  };

  const isStockSufficient =
    availableStock !== null && newTransfer.quantity > 0 && newTransfer.quantity <= availableStock;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ArrowRightLeft className="h-8 w-8" />
            Transferts de Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Transferts inter-entrepôts avec vérification de stock
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau transfert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau transfert de stock</DialogTitle>
                <DialogDescription>
                  Transférez du stock d'un entrepôt vers un autre
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div>
                  <Label>Produit *</Label>
                  <Select
                    value={newTransfer.product_id}
                    onValueChange={(value) =>
                      setNewTransfer({ ...newTransfer, product_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} {product.sku && `(${product.sku})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>De l'entrepôt *</Label>
                    <Select
                      value={newTransfer.warehouse_from_id}
                      onValueChange={(value) =>
                        setNewTransfer({ ...newTransfer, warehouse_from_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vers l'entrepôt *</Label>
                    <Select
                      value={newTransfer.warehouse_to_id}
                      onValueChange={(value) =>
                        setNewTransfer({ ...newTransfer, warehouse_to_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Destination..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses
                          .filter((w) => w.id !== newTransfer.warehouse_from_id)
                          .map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name} ({warehouse.city})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stock disponible */}
                {availableStock !== null && newTransfer.warehouse_from_id && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        Stock disponible à {getSelectedWarehouseFrom()?.name}:
                      </span>
                      <Badge variant="outline" className="bg-white">
                        {availableStock} {availableStock > 1 ? 'unités' : 'unité'}
                      </Badge>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Quantité à transférer *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={newTransfer.quantity}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  {newTransfer.quantity > 0 &&
                    availableStock !== null &&
                    newTransfer.quantity > availableStock && (
                      <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>Quantité supérieure au stock disponible</span>
                      </div>
                    )}
                  {isStockSufficient && (
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Stock suffisant pour ce transfert</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Raison du transfert *</Label>
                  <Input
                    value={newTransfer.reason}
                    onChange={(e) => setNewTransfer({ ...newTransfer, reason: e.target.value })}
                    placeholder="Ex: Réapprovisionnement boutique, Réorganisation..."
                  />
                </div>

                <div>
                  <Label>Numéro de référence (optionnel)</Label>
                  <Input
                    value={newTransfer.reference_number}
                    onChange={(e) =>
                      setNewTransfer({ ...newTransfer, reference_number: e.target.value })
                    }
                    placeholder="Ex: TRF-001..."
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newTransfer.notes}
                    onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                    placeholder="Notes additionnelles..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreateTransfer} disabled={!isStockSufficient}>
                  Créer le transfert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Transferts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
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
                  placeholder="Rechercher par produit, entrepôt, raison..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfers Table */}
      {loadingMovements ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p>Chargement...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Vers</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead>Référence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        {format(new Date(transfer.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transfer.product?.name || 'N/A'}</div>
                      {transfer.product?.sku && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {transfer.product.sku}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {transfer.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{transfer.warehouse_from?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {transfer.warehouse_from?.city}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{transfer.warehouse_to?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {transfer.warehouse_to?.city}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{transfer.reason}</div>
                  </TableCell>
                  <TableCell>
                    {transfer.reference_number && (
                      <div className="text-xs font-mono">{transfer.reference_number}</div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredTransfers.length === 0 && !loadingMovements && (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun transfert</h3>
            <p className="text-muted-foreground mb-6">
              Créez votre premier transfert inter-entrepôts
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un transfert
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
