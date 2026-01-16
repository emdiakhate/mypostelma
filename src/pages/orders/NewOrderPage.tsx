/**
 * Page de création de nouvelle commande
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { EnrichedLead } from '@/types/crm';

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const client: EnrichedLead | undefined = location.state?.client;
  const [saving, setSaving] = useState(false);

  const [orderData, setOrderData] = useState({
    client_name: client?.name || '',
    client_email: client?.email || '',
    client_phone: client?.phone || '',
    client_address: client?.address || '',
    notes: '',
    status: 'pending',
  });

  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  const handleAddItem = () => {
    const newId = (Math.max(...items.map(i => parseInt(i.id)), 0) + 1).toString();
    setItems([
      ...items,
      { id: newId, description: '', quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSaveOrder = async () => {
    // Validation
    if (!orderData.client_name) {
      toast.error('Le nom du client est requis');
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0)) {
      toast.error('Veuillez remplir tous les articles correctement');
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Vous devez être connecté pour créer une commande');
        return;
      }

      const totalHT = calculateTotal();
      const tvaRate = 18; // TVA 18%
      const totalTTC = totalHT * (1 + tvaRate / 100);

      // Créer la commande
      const { data: orderResult, error: orderError } = await supabase
        .from('vente_orders' as any)
        .insert([{
          user_id: userData.user.id,
          lead_id: client?.id || null,
          client_name: orderData.client_name,
          client_email: orderData.client_email || '',
          client_phone: orderData.client_phone,
          client_address: orderData.client_address,
          shipping_address: orderData.client_address,
          status: 'pending',
          payment_status: 'pending',
          total_ht: totalHT,
          total_ttc: totalTTC,
          tva_rate: tvaRate,
          notes: orderData.notes,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les articles de la commande
      const orderResultData = orderResult as any;
      const orderItems = items.map((item, index) => ({
        order_id: orderResultData.id,
        product_name: item.description,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        order_index: index,
      }));

      const { error: itemsError } = await supabase
        .from('vente_order_items' as any)
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success(`Commande ${orderResultData.number} créée avec succès`);
      
      // Redirection vers la page des commandes ou du client
      if (client) {
        navigate('/app/crm/clients');
      } else {
        navigate('/app/vente/commandes');
      }
    } catch (error: any) {
      console.error('Error saving order:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde de la commande');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Commande</h1>
          <p className="text-gray-600 mt-1">
            {client ? `Commande pour ${client.name}` : 'Créer une nouvelle commande'}
          </p>
        </div>
      </div>

      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Client</CardTitle>
          <CardDescription>Détails du client pour cette commande</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_name">Nom du client *</Label>
              <Input
                id="client_name"
                value={orderData.client_name}
                onChange={(e) => setOrderData({ ...orderData, client_name: e.target.value })}
                placeholder="Nom complet"
              />
            </div>
            <div>
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                type="email"
                value={orderData.client_email}
                onChange={(e) => setOrderData({ ...orderData, client_email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <Label htmlFor="client_phone">Téléphone</Label>
              <Input
                id="client_phone"
                value={orderData.client_phone}
                onChange={(e) => setOrderData({ ...orderData, client_phone: e.target.value })}
                placeholder="+221 77 123 45 67"
              />
            </div>
            <div>
              <Label htmlFor="client_address">Adresse</Label>
              <Input
                id="client_address"
                value={orderData.client_address}
                onChange={(e) => setOrderData({ ...orderData, client_address: e.target.value })}
                placeholder="Adresse de livraison"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Articles de la commande</CardTitle>
              <CardDescription>Ajoutez les produits ou services</CardDescription>
            </div>
            <Button onClick={handleAddItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`desc-${item.id}`}>Description *</Label>
                    <Input
                      id={`desc-${item.id}`}
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="Nom du produit ou service"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`qty-${item.id}`}>Quantité *</Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-${item.id}`}>Prix unitaire (FCFA) *</Label>
                    <Input
                      id={`price-${item.id}`}
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold">
                    {item.total.toLocaleString()} FCFA
                  </span>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total général */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total général</span>
              <span className="text-2xl text-primary">
                {calculateTotal().toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes et instructions</CardTitle>
          <CardDescription>Informations complémentaires sur la commande</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={orderData.notes}
            onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
            placeholder="Instructions de livraison, conditions spéciales, etc."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pb-8">
        <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSaveOrder} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Enregistrement...' : 'Enregistrer la commande'}
        </Button>
      </div>
    </div>
  );
};

export default NewOrderPage;
