/**
 * Form de création/édition d'un fournisseur
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
import { useSuppliers } from '@/hooks/useSuppliers';
import type { Supplier } from '@/types/suppliers';
import { useToast } from '@/hooks/use-toast';

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const { toast } = useToast();
  const { createSupplier, updateSupplier } = useSuppliers();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Sénégal',
    tax_number: '',
    payment_terms: '',
    bank_account: '',
    notes: '',
    is_active: true,
  });

  // Charger les données du fournisseur si édition
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        company: supplier.company || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || 'Sénégal',
        tax_number: supplier.tax_number || '',
        payment_terms: supplier.payment_terms || '',
        bank_account: supplier.bank_account || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active ?? true,
      });
    }
  }, [supplier]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: 'Erreur',
        description: 'Le nom du fournisseur est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      if (supplier) {
        await updateSupplier(supplier.id, formData);
        toast({
          title: 'Fournisseur modifié',
          description: `Le fournisseur "${formData.name}" a été modifié avec succès`,
        });
      } else {
        await createSupplier(formData);
        toast({
          title: 'Fournisseur créé',
          description: `Le fournisseur "${formData.name}" a été créé avec succès`,
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le fournisseur',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <div className="space-y-4">
        <h3 className="font-semibold">Informations de base</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom du fournisseur <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: SARL Diallo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Nom commercial</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Ex: Matériaux Diallo"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@fournisseur.sn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+221 77 123 45 67"
            />
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="space-y-4">
        <h3 className="font-semibold">Adresse</h3>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse complète</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Ex: Rue 10, Plateau"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Ex: Dakar"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Ex: Sénégal"
            />
          </div>
        </div>
      </div>

      {/* Informations commerciales */}
      <div className="space-y-4">
        <h3 className="font-semibold">Informations commerciales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tax_number">N° Fiscal / NINEA</Label>
            <Input
              id="tax_number"
              value={formData.tax_number}
              onChange={(e) => handleChange('tax_number', e.target.value)}
              placeholder="Ex: 123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Conditions de paiement</Label>
            <Select value={formData.payment_terms} onValueChange={(v) => handleChange('payment_terms', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Comptant">Comptant</SelectItem>
                <SelectItem value="Net 15">Net 15 jours</SelectItem>
                <SelectItem value="Net 30">Net 30 jours</SelectItem>
                <SelectItem value="Net 60">Net 60 jours</SelectItem>
                <SelectItem value="Net 90">Net 90 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_account">Compte bancaire</Label>
          <Input
            id="bank_account"
            value={formData.bank_account}
            onChange={(e) => handleChange('bank_account', e.target.value)}
            placeholder="Ex: SN... (IBAN)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Statut</Label>
          <Select
            value={formData.is_active ? 'active' : 'inactive'}
            onValueChange={(v) => handleChange('is_active', v === 'active')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
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
          {loading ? 'Enregistrement...' : supplier ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
