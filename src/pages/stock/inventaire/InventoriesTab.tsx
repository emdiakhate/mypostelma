/**
 * Tab Inventaires - Gestion des comptages d'inventaire
 */

import { useState, useMemo } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Eye,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useInventories } from '@/hooks/useInventory';
import { useWarehouses } from '@/hooks/useStock';
import {
  getInventoryStatusLabel,
  getInventoryStatusColor,
  type StockInventory,
  type InventoryStatus,
} from '@/types/inventory';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import InventoryForm from './InventoryForm';
import InventoryCountDialog from './InventoryCountDialog';

export default function InventoriesTab() {
  const { toast } = useToast();
  const { warehouses } = useWarehouses();

  // Filtres
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | 'all'>('all');

  const filters = useMemo(
    () => ({
      warehouse_id: warehouseFilter !== 'all' ? warehouseFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [warehouseFilter, statusFilter]
  );

  const { inventories, loading, deleteInventory, completeInventory } = useInventories(filters);

  // Filtrer localement par recherche
  const filteredInventories = useMemo(() => {
    if (!search) return inventories;
    const searchLower = search.toLowerCase();
    return inventories.filter((inv) =>
      inv.inventory_number.toLowerCase().includes(searchLower)
    );
  }, [inventories, search]);

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [countDialogOpen, setCountDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<StockInventory | null>(null);

  const handleCreate = () => {
    setSelectedInventory(null);
    setFormDialogOpen(true);
  };

  const handleView = (inventory: StockInventory) => {
    setSelectedInventory(inventory);
    setCountDialogOpen(true);
  };

  const handleComplete = async (inventory: StockInventory) => {
    if (inventory.status !== 'in_progress') {
      toast({
        title: 'Erreur',
        description: 'Seuls les inventaires "En cours" peuvent être finalisés',
        variant: 'destructive',
      });
      return;
    }

    try {
      await completeInventory(inventory.id);
      toast({
        title: 'Inventaire finalisé',
        description: `L'inventaire ${inventory.inventory_number} a été finalisé avec succès`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de finaliser l\'inventaire',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setSelectedInventory(null);
  };

  const handleCountSuccess = () => {
    setCountDialogOpen(false);
    setSelectedInventory(null);
  };

  return (
    <div className="space-y-6">
      {/* Actions et filtres */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un inventaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Entrepôt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les entrepôts</SelectItem>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as InventoryStatus | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel inventaire
        </Button>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Chargement des inventaires...
        </div>
      ) : filteredInventories.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Aucun inventaire trouvé</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || warehouseFilter !== 'all' || statusFilter !== 'all'
              ? 'Aucun inventaire ne correspond à vos critères'
              : 'Commencez par créer votre premier inventaire'}
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Créer un inventaire
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Entrepôt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Compté par</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventories.map((inventory) => (
                <TableRow key={inventory.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{inventory.inventory_number}</TableCell>
                  <TableCell>{inventory.warehouse?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(inventory.inventory_date), 'dd/MM/yyyy', {
                        locale: fr,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>{inventory.counted_by || '-'}</TableCell>
                  <TableCell>
                    {inventory.items?.length || 0} produit
                    {(inventory.items?.length || 0) > 1 ? 's' : ''}
                  </TableCell>
                  <TableCell>
                    <Badge className={getInventoryStatusColor(inventory.status)}>
                      {getInventoryStatusLabel(inventory.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(inventory)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {inventory.status === 'in_progress' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleComplete(inventory)}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog formulaire création */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvel inventaire</DialogTitle>
            <DialogDescription>
              Créez un nouvel inventaire physique pour un entrepôt
            </DialogDescription>
          </DialogHeader>
          <InventoryForm onSuccess={handleFormSuccess} onCancel={() => setFormDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog comptage */}
      {selectedInventory && (
        <InventoryCountDialog
          inventory={selectedInventory}
          open={countDialogOpen}
          onOpenChange={setCountDialogOpen}
          onSuccess={handleCountSuccess}
        />
      )}
    </div>
  );
}
