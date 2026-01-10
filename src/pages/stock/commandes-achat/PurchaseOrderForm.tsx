/**
 * Form de création/édition d'une commande d'achat
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { usePurchaseOrders, useSuppliers } from '@/hooks/useSuppliers';
import { useWarehouses } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useVente';
import type { PurchaseOrder } from '@/types/suppliers';
import { formatCurrency } from '@/types/compta';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrderFormProps {
  order?: PurchaseOrder | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface OrderItem {
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  subtotal: number;
  total: number;
}

export default function PurchaseOrderForm({
  order,
  onSuccess,
  onCancel,
}: PurchaseOrderFormProps) {
  const { toast } = useToast();
  const { createPurchaseOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);

  const isReadOnly = order !== null && order !== undefined;

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    warehouse_id: '',
    tax_rate: 0,
    shipping_cost: 0,
    notes: '',
  });

  const [items, setItems] = useState<OrderItem[]>([]);

  // Charger les données de la commande si visualisation
  useEffect(() => {
    if (order) {
      setFormData({
        supplier_id: order.supplier_id,
        order_date: order.order_date,
        expected_delivery_date: order.expected_delivery_date || '',
        warehouse_id: order.warehouse_id || '',
        tax_rate: order.tax_rate,
        shipping_cost: order.shipping_cost,
        notes: order.notes || '',
      });

      if (order.items) {
        setItems(
          order.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product?.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            discount_percent: item.discount_percent,
            subtotal: item.subtotal,
            total: item.total,
          }))
        );
      }
    }
  }, [order]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: formData.tax_rate,
        discount_percent: 0,
        subtotal: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };

      // Recalculer les montants
      const subtotal = item.quantity * item.unit_price;
      const discount = subtotal * (item.discount_percent / 100);
      const afterDiscount = subtotal - discount;
      const total = afterDiscount * (1 + item.tax_rate / 100);

      // Si changement de produit, mettre à jour le nom
      if (field === 'product_id') {
        const product = products.find((p) => p.id === value);
        if (product) {
          item.product_name = product.name;
          // Pré-remplir le prix si disponible
          if (product.cost && item.unit_price === 0) {
            item.unit_price = product.cost;
          }
        }
      }

      item.subtotal = afterDiscount;
      item.total = total;
      newItems[index] = item;
      return newItems;
    });
  };

  // Calculs totaux
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount + formData.shipping_cost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fournisseur',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Ajoutez au moins un produit à la commande',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier que tous les produits sont sélectionnés
    const hasInvalidItems = items.some((item) => !item.product_id || item.quantity <= 0);
    if (hasInvalidItems) {
      toast({
        title: 'Erreur',
        description: 'Tous les produits doivent être sélectionnés avec une quantité valide',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      await createPurchaseOrder({
        supplier_id: formData.supplier_id,
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        warehouse_id: formData.warehouse_id || undefined,
        tax_rate: formData.tax_rate,
        shipping_cost: formData.shipping_cost,
        notes: formData.notes,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount_percent: item.discount_percent,
        })),
      });

      toast({
        title: 'Commande créée',
        description: 'La commande d\'achat a été créée avec succès',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isReadOnly) {
    return (
      <div className="space-y-6">
        {/* Informations générales */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Fournisseur</Label>
            <p className="font-medium">{order?.supplier?.name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Entrepôt</Label>
            <p className="font-medium">{order?.warehouse?.name || '-'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Date commande</Label>
            <p className="font-medium">{order?.order_date}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Livraison prévue</Label>
            <p className="font-medium">{order?.expected_delivery_date || '-'}</p>
          </div>
        </div>

        {/* Produits */}
        <div>
          <Label className="text-lg font-semibold mb-3 block">Produits commandés</Label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="text-right">Remise %</TableHead>
                <TableHead className="text-right">TVA %</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.product_name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right">{item.discount_percent}%</TableCell>
                  <TableCell className="text-right">{item.tax_rate}%</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sous-total:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>TVA ({formData.tax_rate}%):</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frais de port:</span>
              <span className="font-medium">{formatCurrency(formData.shipping_cost)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {formData.notes && (
          <div>
            <Label className="text-muted-foreground">Notes</Label>
            <p className="mt-1">{formData.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button type="button" onClick={onCancel}>
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <div className="space-y-4">
        <h3 className="font-semibold">Informations générales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplier_id">
              Fournisseur <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(v) => handleChange('supplier_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers
                  .filter((s) => s.is_active)
                  .map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse_id">Entrepôt de réception</Label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(v) => handleChange('warehouse_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un entrepôt..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses
                  .filter((w) => w.is_active)
                  .map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_date">
              Date de commande <span className="text-red-500">*</span>
            </Label>
            <Input
              id="order_date"
              type="date"
              value={formData.order_date}
              onChange={(e) => handleChange('order_date', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_delivery_date">Livraison prévue</Label>
            <Input
              id="expected_delivery_date"
              type="date"
              value={formData.expected_delivery_date}
              onChange={(e) => handleChange('expected_delivery_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Produits</h3>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un produit
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="w-24">Qté</TableHead>
                  <TableHead className="w-32">Prix unit.</TableHead>
                  <TableHead className="w-24">Remise %</TableHead>
                  <TableHead className="w-24">TVA %</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.product_id}
                        onValueChange={(v) => updateItem(index, 'product_id', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Produit..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', parseInt(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount_percent}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'discount_percent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.tax_rate}
                        onChange={(e) =>
                          updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Frais et taxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tax_rate">TVA globale (%)</Label>
          <Input
            id="tax_rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.tax_rate}
            onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shipping_cost">Frais de port (FCFA)</Label>
          <Input
            id="shipping_cost"
            type="number"
            min="0"
            step="0.01"
            value={formData.shipping_cost}
            onChange={(e) => handleChange('shipping_cost', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Totaux */}
      <div className="flex justify-end">
        <div className="w-80 space-y-2 bg-muted/30 p-4 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Sous-total:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>TVA ({formData.tax_rate}%):</span>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frais de port:</span>
            <span className="font-medium">{formatCurrency(formData.shipping_cost)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Informations complémentaires..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer la commande'}
        </Button>
      </div>
    </form>
  );
}
