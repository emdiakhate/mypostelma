/**
 * Tab Ajustements - Gestion des ajustements manuels de stock
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
import { Plus, Search, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useAdjustments } from '@/hooks/useInventory';
import { useWarehouses } from '@/hooks/useStock';
import {
  getAdjustmentTypeLabel,
  getAdjustmentTypeColor,
  getAdjustmentReasonLabel,
  type AdjustmentReason,
} from '@/types/inventory';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import AdjustmentForm from './AdjustmentForm';

export default function AdjustmentsTab() {
  const { toast } = useToast();
  const { warehouses } = useWarehouses();

  // Filtres
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<AdjustmentReason | 'all'>('all');

  const filters = useMemo(
    () => ({
      warehouse_id: warehouseFilter !== 'all' ? warehouseFilter : undefined,
      reason: reasonFilter !== 'all' ? reasonFilter : undefined,
    }),
    [warehouseFilter, reasonFilter]
  );

  const { adjustments, loading } = useAdjustments(filters);

  // Filtrer localement par recherche (produit)
  const filteredAdjustments = useMemo(() => {
    if (!search) return adjustments;
    const searchLower = search.toLowerCase();
    return adjustments.filter((adj) =>
      adj.product?.name?.toLowerCase().includes(searchLower)
    );
  }, [adjustments, search]);

  // Dialog
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const handleCreate = () => {
    setFormDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Actions et filtres */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
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
            value={reasonFilter}
            onValueChange={(value) => setReasonFilter(value as AdjustmentReason | 'all')}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Raison" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les raisons</SelectItem>
              <SelectItem value="damaged">Endommagé</SelectItem>
              <SelectItem value="lost">Perdu</SelectItem>
              <SelectItem value="found">Retrouvé</SelectItem>
              <SelectItem value="error">Erreur de saisie</SelectItem>
              <SelectItem value="theft">Vol</SelectItem>
              <SelectItem value="expired">Périmé</SelectItem>
              <SelectItem value="return_supplier">Retour fournisseur</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel ajustement
        </Button>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Chargement des ajustements...
        </div>
      ) : filteredAdjustments.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Aucun ajustement trouvé</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || warehouseFilter !== 'all' || reasonFilter !== 'all'
              ? 'Aucun ajustement ne correspond à vos critères'
              : 'Aucun ajustement manuel n\'a été effectué'}
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Créer un ajustement
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Entrepôt</TableHead>
                <TableHead className="text-right">Avant</TableHead>
                <TableHead className="text-right">Changement</TableHead>
                <TableHead className="text-right">Après</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead>Par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdjustments.map((adjustment) => (
                <TableRow key={adjustment.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(adjustment.performed_at), 'dd/MM/yyyy HH:mm', {
                        locale: fr,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {adjustment.product?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{adjustment.warehouse?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{adjustment.quantity_before}</TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`flex items-center justify-end gap-1 ${
                        adjustment.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {adjustment.quantity_change > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          +{adjustment.quantity_change}
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          {adjustment.quantity_change}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {adjustment.quantity_after}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getAdjustmentReasonLabel(adjustment.reason)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {adjustment.performed_by}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog formulaire */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvel ajustement de stock</DialogTitle>
            <DialogDescription>
              Créez un ajustement manuel pour corriger le stock d'un produit
            </DialogDescription>
          </DialogHeader>
          <AdjustmentForm
            onSuccess={handleFormSuccess}
            onCancel={() => setFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
