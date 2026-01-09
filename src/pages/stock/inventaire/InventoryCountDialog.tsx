/**
 * Dialog pour compter les produits d'un inventaire
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { StockInventory } from '@/types/inventory';
import { getInventoryStatusLabel, getInventoryStatusColor } from '@/types/inventory';

interface InventoryCountDialogProps {
  inventory: StockInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function InventoryCountDialog({
  inventory,
  open,
  onOpenChange,
  onSuccess,
}: InventoryCountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Inventaire {inventory.inventory_number}
          </DialogTitle>
          <DialogDescription>
            Entrepôt: {inventory.warehouse?.name} - {' '}
            <Badge className={getInventoryStatusColor(inventory.status)}>
              {getInventoryStatusLabel(inventory.status)}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Comptage d'inventaire - Fonctionnalité en cours de développement
          </p>
          <div className="mt-4">
            <p className="text-sm">Produits: {inventory.items?.length || 0}</p>
            {inventory.notes && (
              <p className="text-sm mt-2">
                <strong>Notes:</strong> {inventory.notes}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
