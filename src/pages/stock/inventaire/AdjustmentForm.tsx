/**
 * Form d'ajustement manuel de stock
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
import { useAdjustments } from '@/hooks/useInventory';
import { useWarehouses } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useVente';
import type { AdjustmentReason, AdjustmentType } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';

interface AdjustmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdjustmentForm({ onSuccess, onCancel }: AdjustmentFormProps) {
  const { toast } = useToast();
  const { createAdjustment } = useAdjustments();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    warehouse_id: '',
    product_id: '',
    adjustment_type: 'correction' as AdjustmentType,
    quantity_change: 0,
    reason: 'error' as AdjustmentReason,
    notes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.warehouse_id || !formData.product_id) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un entrepôt et un produit',
        variant: 'destructive',
      });
      return;
    }

    if (formData.quantity_change === 0) {
      toast({
        title: 'Erreur',
        description: 'La quantité de changement doit être différente de 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      await createAdjustment(formData);

      toast({
        title: 'Ajustement créé',
        description: 'L\'ajustement de stock a été enregistré avec succès',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating adjustment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'ajustement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="warehouse_id">
            Entrepôt <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.warehouse_id}
            onValueChange={(v) => handleChange('warehouse_id', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses.filter((w) => w.is_active).map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_id">
            Produit <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.product_id} onValueChange={(v) => handleChange('product_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity_change">
            Changement de quantité <span className="text-red-500">*</span>
          </Label>
          <Input
            id="quantity_change"
            type="number"
            value={formData.quantity_change}
            onChange={(e) => handleChange('quantity_change', parseInt(e.target.value) || 0)}
            placeholder="Ex: +5 ou -3"
          />
          <p className="text-xs text-muted-foreground">
            Nombre positif pour augmenter, négatif pour diminuer
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">
            Raison <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.reason} onValueChange={(v) => handleChange('reason', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="damaged">Produit endommagé</SelectItem>
              <SelectItem value="lost">Produit perdu</SelectItem>
              <SelectItem value="found">Produit retrouvé</SelectItem>
              <SelectItem value="error">Erreur de saisie</SelectItem>
              <SelectItem value="theft">Vol</SelectItem>
              <SelectItem value="expired">Périmé</SelectItem>
              <SelectItem value="return_supplier">Retour fournisseur</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Détails sur l'ajustement..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Créer l\'ajustement'}
        </Button>
      </div>
    </form>
  );
}
