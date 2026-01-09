/**
 * Dialog pour recevoir la marchandise d'une commande d'achat
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, CheckCircle2 } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/useSuppliers';
import type { PurchaseOrder, PurchaseOrderItem } from '@/types/suppliers';
import { useToast } from '@/hooks/use-toast';

interface ReceiveOrderDialogProps {
  order: PurchaseOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ReceiveItem {
  item_id: string;
  product_name: string;
  quantity_ordered: number;
  quantity_already_received: number;
  quantity_to_receive: number;
  max_receivable: number;
}

export default function ReceiveOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: ReceiveOrderDialogProps) {
  const { toast } = useToast();
  const { receivePurchaseOrder } = usePurchaseOrders();
  const [loading, setLoading] = useState(false);

  // État pour les quantités à recevoir
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>(
    (order.items || []).map((item) => ({
      item_id: item.id,
      product_name: item.product?.name || 'N/A',
      quantity_ordered: item.quantity,
      quantity_already_received: item.quantity_received,
      quantity_to_receive: item.quantity - item.quantity_received,
      max_receivable: item.quantity - item.quantity_received,
    }))
  );

  const updateReceiveQuantity = (index: number, quantity: number) => {
    setReceiveItems((prev) => {
      const newItems = [...prev];
      const item = newItems[index];
      // Limiter à la quantité max restante
      const validQuantity = Math.max(0, Math.min(quantity, item.max_receivable));
      newItems[index] = { ...item, quantity_to_receive: validQuantity };
      return newItems;
    });
  };

  const receiveAll = () => {
    setReceiveItems((prev) =>
      prev.map((item) => ({
        ...item,
        quantity_to_receive: item.max_receivable,
      }))
    );
  };

  const receiveNone = () => {
    setReceiveItems((prev) =>
      prev.map((item) => ({
        ...item,
        quantity_to_receive: 0,
      }))
    );
  };

  const handleSubmit = async () => {
    // Filtrer uniquement les items avec quantité > 0
    const itemsToReceive = receiveItems
      .filter((item) => item.quantity_to_receive > 0)
      .map((item) => ({
        item_id: item.item_id,
        quantity_received: item.quantity_already_received + item.quantity_to_receive,
      }));

    if (itemsToReceive.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer au moins une quantité à recevoir',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      await receivePurchaseOrder(order.id, itemsToReceive);

      const totalReceived = receiveItems.reduce(
        (sum, item) => sum + item.quantity_to_receive,
        0
      );

      toast({
        title: 'Réception enregistrée',
        description: `${totalReceived} unité(s) reçue(s) pour la commande ${order.order_number}`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error receiving order:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la réception',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalToReceive = receiveItems.reduce((sum, item) => sum + item.quantity_to_receive, 0);
  const allReceived = receiveItems.every((item) => item.max_receivable === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recevoir la marchandise
          </DialogTitle>
          <DialogDescription>
            Commande {order.order_number} - {order.supplier?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {allReceived ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Commande entièrement reçue</h3>
              <p className="text-sm text-muted-foreground">
                Tous les produits de cette commande ont déjà été reçus.
              </p>
            </div>
          ) : (
            <>
              {/* Actions rapides */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={receiveAll}>
                  Tout recevoir
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={receiveNone}>
                  Rien recevoir
                </Button>
              </div>

              {/* Table des produits */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Commandé</TableHead>
                      <TableHead className="text-right">Déjà reçu</TableHead>
                      <TableHead className="text-right">Restant</TableHead>
                      <TableHead className="text-right w-32">À recevoir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiveItems.map((item, index) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity_ordered}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.quantity_already_received}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.max_receivable}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.max_receivable === 0 ? (
                            <span className="text-sm text-green-600 flex items-center justify-end gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Complet
                            </span>
                          ) : (
                            <Input
                              type="number"
                              min="0"
                              max={item.max_receivable}
                              value={item.quantity_to_receive}
                              onChange={(e) =>
                                updateReceiveQuantity(index, parseInt(e.target.value) || 0)
                              }
                              className="text-right"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Résumé */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total à recevoir maintenant:</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalToReceive} unité{totalToReceive > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <strong>Note:</strong> Après la réception, le statut de la commande sera
                automatiquement mis à jour selon les quantités reçues (partiellement reçue ou
                totalement reçue).
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            {!allReceived && (
              <Button onClick={handleSubmit} disabled={loading || totalToReceive === 0}>
                {loading ? 'Enregistrement...' : 'Valider la réception'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
