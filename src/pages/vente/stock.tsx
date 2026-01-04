/**
 * Gestion de Stock Page
 *
 * Gestion des stocks pour les produits physiques.
 * Suivi des quantités, mouvements et alertes de réapprovisionnement.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Package,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Archive,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StockItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number;
  location: string;
  lastRestocked?: Date;
  movements: StockMovement[];
}

interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: Date;
  user: string;
}

const LOCATIONS = ['Entrepôt A', 'Entrepôt B', 'Magasin', 'Stock de sécurité'];

export default function StockPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok' | 'out'>('all');
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: '1',
      productName: 'Pack Starter',
      sku: 'PACK-001',
      category: 'Kits',
      quantity: 45,
      minQuantity: 20,
      location: 'Entrepôt A',
      lastRestocked: new Date(2026, 0, 5),
      movements: [
        {
          id: '1',
          type: 'in',
          quantity: 50,
          reason: 'Réception commande fournisseur',
          date: new Date(2026, 0, 5),
          user: 'Admin',
        },
        {
          id: '2',
          type: 'out',
          quantity: 5,
          reason: 'Vente CMD-2026-003',
          date: new Date(2026, 0, 7),
          user: 'System',
        },
      ],
    },
    {
      id: '2',
      productName: 'Licence Pro',
      sku: 'LIC-PRO',
      category: 'Licences',
      quantity: 15,
      minQuantity: 10,
      location: 'Stock de sécurité',
      lastRestocked: new Date(2025, 11, 20),
      movements: [
        {
          id: '1',
          type: 'in',
          quantity: 25,
          reason: 'Génération licences',
          date: new Date(2025, 11, 20),
          user: 'Tech',
        },
        {
          id: '2',
          type: 'out',
          quantity: 10,
          reason: 'Vente CMD-2026-004',
          date: new Date(2025, 11, 28),
          user: 'System',
        },
      ],
    },
    {
      id: '3',
      productName: 'Guide Marketing PDF',
      sku: 'GUIDE-001',
      category: 'Documentation',
      quantity: 8,
      minQuantity: 15,
      location: 'Magasin',
      lastRestocked: new Date(2025, 10, 15),
      movements: [
        {
          id: '1',
          type: 'in',
          quantity: 30,
          reason: 'Impression nouvelle édition',
          date: new Date(2025, 10, 15),
          user: 'Admin',
        },
        {
          id: '2',
          type: 'out',
          quantity: 22,
          reason: 'Ventes multiples',
          date: new Date(2025, 11, 20),
          user: 'System',
        },
      ],
    },
    {
      id: '4',
      productName: 'Support USB personnalisé',
      sku: 'USB-CUSTOM',
      category: 'Goodies',
      quantity: 0,
      minQuantity: 50,
      location: 'Entrepôt B',
      movements: [
        {
          id: '1',
          type: 'out',
          quantity: 100,
          reason: 'Événement marketing',
          date: new Date(2026, 0, 8),
          user: 'Marketing',
        },
      ],
    },
  ]);

  const [newMovement, setNewMovement] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: '',
  });

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = filterLocation === 'all' || item.location === filterLocation;

    let matchesStatus = true;
    if (filterStatus === 'low') {
      matchesStatus = item.quantity > 0 && item.quantity <= item.minQuantity;
    } else if (filterStatus === 'out') {
      matchesStatus = item.quantity === 0;
    } else if (filterStatus === 'ok') {
      matchesStatus = item.quantity > item.minQuantity;
    }

    return matchesSearch && matchesLocation && matchesStatus;
  });

  const stats = {
    totalItems: stockItems.length,
    lowStock: stockItems.filter((i) => i.quantity > 0 && i.quantity <= i.minQuantity).length,
    outOfStock: stockItems.filter((i) => i.quantity === 0).length,
    totalValue: stockItems.reduce((sum, item) => sum + item.quantity * 50, 0), // Mock prix unitaire 50€
  };

  const getStockStatus = (item: StockItem) => {
    if (item.quantity === 0) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Rupture
        </Badge>
      );
    }
    if (item.quantity <= item.minQuantity) {
      return (
        <Badge variant="outline" className="bg-orange-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Stock faible
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-600">
        <Package className="h-3 w-3 mr-1" />
        En stock
      </Badge>
    );
  };

  const handleAddMovement = () => {
    if (!selectedItem) return;

    const movement: StockMovement = {
      id: Date.now().toString(),
      type: newMovement.type,
      quantity: newMovement.quantity,
      reason: newMovement.reason,
      date: new Date(),
      user: 'Current User',
    };

    let newQuantity = selectedItem.quantity;
    if (newMovement.type === 'in' || newMovement.type === 'adjustment') {
      newQuantity += newMovement.quantity;
    } else if (newMovement.type === 'out') {
      newQuantity -= newMovement.quantity;
    }

    setStockItems(
      stockItems.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              quantity: Math.max(0, newQuantity),
              movements: [movement, ...item.movements],
              lastRestocked: newMovement.type === 'in' ? new Date() : item.lastRestocked,
            }
          : item
      )
    );

    setIsMovementDialogOpen(false);
    setSelectedItem(null);
    setNewMovement({
      type: 'in',
      quantity: 0,
      reason: '',
    });

    toast({
      title: 'Mouvement enregistré',
      description: 'Le mouvement de stock a été enregistré avec succès.',
    });
  };

  const handleOpenMovementDialog = (item: StockItem, type: 'in' | 'out') => {
    setSelectedItem(item);
    setNewMovement({ ...newMovement, type });
    setIsMovementDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8" />
            Gestion de Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez vos stocks et mouvements
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rupture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalValue.toLocaleString()}€
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
                  placeholder="Rechercher par nom ou SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous emplacements</SelectItem>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="ok">En stock</SelectItem>
                <SelectItem value="low">Stock faible</SelectItem>
                <SelectItem value="out">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Min/Alerte</TableHead>
              <TableHead>Emplacement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernier Réappro</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.productName}</div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{item.sku}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-lg">{item.quantity}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">{item.minQuantity}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{item.location}</div>
                </TableCell>
                <TableCell>{getStockStatus(item)}</TableCell>
                <TableCell>
                  {item.lastRestocked ? (
                    <div className="text-sm">
                      {format(item.lastRestocked, 'dd MMM yyyy', { locale: fr })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Entrée de stock"
                      onClick={() => handleOpenMovementDialog(item, 'in')}
                    >
                      <Plus className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Sortie de stock"
                      onClick={() => handleOpenMovementDialog(item, 'out')}
                      disabled={item.quantity === 0}
                    >
                      <Minus className="h-4 w-4 text-red-600" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Historique">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun article en stock</h3>
            <p className="text-muted-foreground">
              Ajoutez des produits physiques au catalogue pour gérer leur stock
            </p>
          </CardContent>
        </Card>
      )}

      {/* Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newMovement.type === 'in' ? 'Entrée de stock' : 'Sortie de stock'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && `Mouvement pour: ${selectedItem.productName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Type de mouvement</Label>
              <Select
                value={newMovement.type}
                onValueChange={(value: 'in' | 'out' | 'adjustment') =>
                  setNewMovement({ ...newMovement, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Entrée
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Sortie
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-blue-600" />
                      Ajustement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                value={newMovement.quantity}
                onChange={(e) =>
                  setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) })
                }
                placeholder="0"
                min="1"
              />
            </div>

            <div>
              <Label>Raison / Commentaire</Label>
              <Input
                value={newMovement.reason}
                onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
                placeholder="Ex: Réception commande fournisseur"
              />
            </div>

            {selectedItem && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Stock actuel:</span>
                    <span className="font-semibold">{selectedItem.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock après mouvement:</span>
                    <span className="font-semibold">
                      {newMovement.type === 'in' || newMovement.type === 'adjustment'
                        ? selectedItem.quantity + (newMovement.quantity || 0)
                        : Math.max(0, selectedItem.quantity - (newMovement.quantity || 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddMovement} disabled={!newMovement.quantity || !newMovement.reason}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
