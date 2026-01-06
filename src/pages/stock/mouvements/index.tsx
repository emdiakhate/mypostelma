/**
 * Stock - Mouvements Page
 *
 * Historique et création de mouvements de stock.
 * IN (entrée), OUT (sortie), TRANSFER (transfert), ADJUSTMENT (ajustement).
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
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  ArrowRightLeft,
  Package,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStock } from '@/hooks/useStock';
import {
  StockMovement,
  MovementType,
  ReferenceType,
  MOVEMENT_TYPES,
  REFERENCE_TYPES,
  getMovementTypeLabel,
  getMovementTypeColor,
  CreateStockMovementInput,
} from '@/types/stock';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StockMouvementsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMovementType, setFilterMovementType] = useState<MovementType | 'all'>('all');
  const [filterReferenceType, setFilterReferenceType] = useState<ReferenceType | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Hooks
  const { products, warehouses, movements } = useStock();

  const {
    movements: stockMovements,
    loading: loadingMovements,
    createMovement,
    loadMovements,
  } = movements;

  const { warehouses: warehousesList, loading: loadingWarehouses, loadWarehouses } = warehouses;

  // Filtrer uniquement les produits physiques (type='product')
  const stockableProducts = products.products.filter((p) => p.type === 'product' && p.status === 'active');

  const [newMovement, setNewMovement] = useState<Partial<CreateStockMovementInput>>({
    product_id: '',
    movement_type: 'IN',
    quantity: 0,
    warehouse_from_id: undefined,
    warehouse_to_id: undefined,
    reason: '',
    reference_type: 'MANUAL',
    reference_number: '',
    unit_cost: 0,
    notes: '',
  });

  useEffect(() => {
    loadMovements();
  }, [filterMovementType, filterReferenceType]);

  const handleCreateMovement = async () => {
    try {
      // Validation
      if (!newMovement.product_id) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un produit.',
          variant: 'destructive',
        });
        return;
      }

      if (!newMovement.quantity || newMovement.quantity <= 0) {
        toast({
          title: 'Erreur',
          description: 'La quantité doit être supérieure à 0.',
          variant: 'destructive',
        });
        return;
      }

      if (!newMovement.reason) {
        toast({
          title: 'Erreur',
          description: 'Veuillez spécifier une raison.',
          variant: 'destructive',
        });
        return;
      }

      // Validation spécifique par type
      if (newMovement.movement_type === 'IN' && !newMovement.warehouse_to_id) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un entrepôt de destination (entrée).',
          variant: 'destructive',
        });
        return;
      }

      if (newMovement.movement_type === 'OUT' && !newMovement.warehouse_from_id) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un entrepôt source (sortie).',
          variant: 'destructive',
        });
        return;
      }

      if (
        newMovement.movement_type === 'TRANSFER' &&
        (!newMovement.warehouse_from_id || !newMovement.warehouse_to_id)
      ) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner les entrepôts source et destination.',
          variant: 'destructive',
        });
        return;
      }

      await createMovement(newMovement as CreateStockMovementInput);
      toast({
        title: 'Mouvement créé',
        description: 'Le mouvement de stock a été enregistré avec succès.',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadMovements();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le mouvement de stock.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewMovement({
      product_id: '',
      movement_type: 'IN',
      quantity: 0,
      warehouse_from_id: undefined,
      warehouse_to_id: undefined,
      reason: '',
      reference_type: 'MANUAL',
      reference_number: '',
      unit_cost: 0,
      notes: '',
    });
  };

  const filteredMovements = stockMovements.filter((movement) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      movement.product?.name.toLowerCase().includes(query) ||
      movement.reason.toLowerCase().includes(query) ||
      movement.reference_number?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: stockMovements.length,
    in: stockMovements.filter((m) => m.movement_type === 'IN').length,
    out: stockMovements.filter((m) => m.movement_type === 'OUT').length,
    transfer: stockMovements.filter((m) => m.movement_type === 'TRANSFER').length,
  };

  const getMovementIcon = (type: MovementType) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4" />;
      case 'OUT':
        return <TrendingDown className="h-4 w-4" />;
      case 'TRANSFER':
        return <ArrowRightLeft className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ArrowRightLeft className="h-8 w-8" />
            Mouvements de Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Historique et création de mouvements (entrées, sorties, transferts)
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
                Nouveau mouvement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau mouvement de stock</DialogTitle>
                <DialogDescription>
                  Enregistrez une entrée, sortie, transfert ou ajustement de stock
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type de mouvement *</Label>
                    <Select
                      value={newMovement.movement_type}
                      onValueChange={(value) =>
                        setNewMovement({
                          ...newMovement,
                          movement_type: value as MovementType,
                          warehouse_from_id: undefined,
                          warehouse_to_id: undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOVEMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getMovementTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Produit *</Label>
                    <Select
                      value={newMovement.product_id}
                      onValueChange={(value) =>
                        setNewMovement({ ...newMovement, product_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un produit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {stockableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} {product.sku && `(${product.sku})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Warehouses selon type */}
                {newMovement.movement_type === 'IN' && (
                  <div>
                    <Label>Entrepôt de destination *</Label>
                    <Select
                      value={newMovement.warehouse_to_id}
                      onValueChange={(value) =>
                        setNewMovement({ ...newMovement, warehouse_to_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un entrepôt..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehousesList.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newMovement.movement_type === 'OUT' && (
                  <div>
                    <Label>Entrepôt source *</Label>
                    <Select
                      value={newMovement.warehouse_from_id}
                      onValueChange={(value) =>
                        setNewMovement({ ...newMovement, warehouse_from_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un entrepôt..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehousesList.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newMovement.movement_type === 'TRANSFER' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>De l'entrepôt *</Label>
                      <Select
                        value={newMovement.warehouse_from_id}
                        onValueChange={(value) =>
                          setNewMovement({ ...newMovement, warehouse_from_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {warehousesList.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Vers l'entrepôt *</Label>
                      <Select
                        value={newMovement.warehouse_to_id}
                        onValueChange={(value) =>
                          setNewMovement({ ...newMovement, warehouse_to_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Destination..." />
                        </SelectTrigger>
                        <SelectContent>
                          {warehousesList.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {newMovement.movement_type === 'ADJUSTMENT' && (
                  <div>
                    <Label>Entrepôt *</Label>
                    <Select
                      value={newMovement.warehouse_to_id}
                      onValueChange={(value) =>
                        setNewMovement({ ...newMovement, warehouse_to_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un entrepôt..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehousesList.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantité *</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={newMovement.quantity}
                      onChange={(e) =>
                        setNewMovement({
                          ...newMovement,
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Coût unitaire (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMovement.unit_cost}
                      onChange={(e) =>
                        setNewMovement({
                          ...newMovement,
                          unit_cost: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label>Raison *</Label>
                  <Input
                    value={newMovement.reason}
                    onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
                    placeholder="Ex: Achat fournisseur, Vente, Inventaire..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type de référence</Label>
                    <Select
                      value={newMovement.reference_type}
                      onValueChange={(value) =>
                        setNewMovement({ ...newMovement, reference_type: value as ReferenceType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERENCE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Numéro de référence</Label>
                    <Input
                      value={newMovement.reference_number}
                      onChange={(e) =>
                        setNewMovement({ ...newMovement, reference_number: e.target.value })
                      }
                      placeholder="Ex: CMD-001, FAC-123..."
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newMovement.notes}
                    onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })}
                    placeholder="Notes additionnelles..."
                    rows={2}
                  />
                </div>

                {newMovement.movement_type === 'ADJUSTMENT' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      Les ajustements modifient directement le stock. Utilisez-les pour corriger
                      des erreurs d'inventaire.
                    </div>
                  </div>
                )}
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
                <Button onClick={handleCreateMovement}>Créer le mouvement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Mouvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Entrées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.in}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sorties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.out}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Transferts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.transfer}</div>
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
                  placeholder="Rechercher par produit, raison, référence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filterMovementType}
              onValueChange={(value: any) => setFilterMovementType(value)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous mouvements</SelectItem>
                {MOVEMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getMovementTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterReferenceType}
              onValueChange={(value: any) => setFilterReferenceType(value)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes références</SelectItem>
                {REFERENCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
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
                <TableHead>Type</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Entrepôt(s)</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Coût</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getMovementTypeColor(movement.movement_type)}>
                      <span className="flex items-center gap-1">
                        {getMovementIcon(movement.movement_type)}
                        {getMovementTypeLabel(movement.movement_type)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{movement.product?.name || 'N/A'}</div>
                      {movement.product?.sku && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {movement.product.sku}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{movement.quantity}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {movement.warehouse_from && (
                        <div className="text-muted-foreground">De: {movement.warehouse_from.name}</div>
                      )}
                      {movement.warehouse_to && (
                        <div className="text-muted-foreground">À: {movement.warehouse_to.name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{movement.reason}</div>
                  </TableCell>
                  <TableCell>
                    {movement.reference_type && (
                      <div className="text-xs">
                        <div className="text-muted-foreground">{movement.reference_type}</div>
                        {movement.reference_number && (
                          <div className="font-mono">{movement.reference_number}</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {movement.total_cost ? (
                      <div className="text-sm font-medium">{movement.total_cost.toFixed(2)}€</div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredMovements.length === 0 && !loadingMovements && (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun mouvement</h3>
            <p className="text-muted-foreground mb-6">
              Créez votre premier mouvement de stock
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un mouvement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
