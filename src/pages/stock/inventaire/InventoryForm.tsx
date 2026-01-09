/**
 * Form de création d'un inventaire
 */

import { useState } from 'react';
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
import { useInventories } from '@/hooks/useInventory';
import { useWarehouses } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useVente';
import { useToast } from '@/hooks/use-toast';

interface InventoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InventoryForm({ onSuccess, onCancel }: InventoryFormProps) {
  const { toast } = useToast();
  const { createInventory, startInventory } = useInventories();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    warehouse_id: '',
    inventory_date: new Date().toISOString().split('T')[0],
    counted_by: '',
    notes: '',
    product_ids: [] as string[],
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.warehouse_id) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un entrepôt',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Créer l'inventaire
      const inventory = await createInventory({
        warehouse_id: formData.warehouse_id,
        inventory_date: formData.inventory_date,
        counted_by: formData.counted_by || undefined,
        notes: formData.notes || undefined,
      });

      // Si des produits sont sélectionnés, démarrer l'inventaire
      if (formData.product_ids.length > 0) {
        await startInventory(inventory.id, formData.product_ids);
      }

      toast({
        title: 'Inventaire créé',
        description: `L'inventaire a été créé avec succès`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating inventory:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'inventaire',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter((id) => id !== productId)
        : [...prev.product_ids, productId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="warehouse_id">
          Entrepôt <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.warehouse_id} onValueChange={(v) => handleChange('warehouse_id', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un entrepôt..." />
          </SelectTrigger>
          <SelectContent>
            {warehouses.filter((w) => w.is_active).map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inventory_date">Date</Label>
          <Input
            id="inventory_date"
            type="date"
            value={formData.inventory_date}
            onChange={(e) => handleChange('inventory_date', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="counted_by">Compté par</Label>
          <Input
            id="counted_by"
            value={formData.counted_by}
            onChange={(e) => handleChange('counted_by', e.target.value)}
            placeholder="Nom de la personne"
          />
        </div>
      </div>

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

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
