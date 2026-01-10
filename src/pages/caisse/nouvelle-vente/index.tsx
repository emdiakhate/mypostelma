import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useSales, type VenteSaleItem } from '@/hooks/useSales';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

const NouvelleVentePage = () => {
  const navigate = useNavigate();
  const { warehouses } = useWarehouses('STORE'); // Filter for STORE type (boutiques)
  const { createSale, loading } = useSales();

  const [products, setProducts] = useState<Product[]>([]);
  const [stockLevels, setStockLevels] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [moyenPaiement, setMoyenPaiement] = useState<'cash' | 'mobile_money' | 'carte' | 'cheque' | 'virement'>('cash');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<VenteSaleItem[]>([]);

  // Charger les produits
  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase
        .from('vente_products')
        .select('id, name, price, description')
        .eq('status', 'active')
        .eq('type', 'product')
        .order('name');

      if (data) {
        setProducts(data);
      }
    };

    loadProducts();
  }, []);

  // Charger les niveaux de stock pour le warehouse sélectionné
  useEffect(() => {
    const loadStockLevels = async () => {
      if (!warehouseId) {
        setStockLevels([]);
        return;
      }

      const { data } = await supabase
        .from('stock_levels')
        .select('product_id, current_quantity')
        .eq('warehouse_id', warehouseId);

      if (data) {
        setStockLevels(data);
      }
    };

    loadStockLevels();
  }, [warehouseId]);

  const addItem = () => {
    if (products.length === 0) return;

    const firstProduct = products[0];
    setItems([
      ...items,
      {
        product_id: firstProduct.id,
        product_name: firstProduct.name,
        description: firstProduct.description,
        quantity: 1,
        unit_price: firstProduct.price,
        total: firstProduct.price,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof VenteSaleItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculer le total si quantité ou prix change
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    // Si le produit change, mettre à jour les infos
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].description = product.description;
        newItems[index].unit_price = product.price;
        newItems[index].total = newItems[index].quantity * product.price;
      }
    }

    setItems(newItems);
  };

  const getStockDisponible = (productId: string): number => {
    if (!warehouseId) return 0;
    const stock = stockLevels.find((s) => s.product_id === productId);
    return stock?.current_quantity || 0;
  };

  const totalHT = items.reduce((sum, item) => sum + item.total, 0);
  const totalTTC = totalHT * 1.2; // TVA 20%

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId) {
      alert('Veuillez sélectionner une boutique');
      return;
    }

    if (items.length === 0) {
      alert('Veuillez ajouter au moins un produit');
      return;
    }

    const result = await createSale({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      client_address: clientAddress,
      warehouse_id: warehouseId,
      moyen_paiement: moyenPaiement,
      items,
      notes,
    });

    if (result) {
      // Rediriger vers la caisse journalière
      navigate('/app/caisse/journaliere');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Nouvelle Vente
          </h1>
          <p className="text-muted-foreground mt-1">
            Enregistrez une vente en boutique avec mise à jour automatique du stock et de la caisse
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/caisse/journaliere')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la caisse
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations boutique et client */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de vente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warehouse">Boutique *</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une boutique" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((w) => w.is_active)
                      .map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="moyen_paiement">Moyen de paiement *</Label>
                <Select
                  value={moyenPaiement}
                  onValueChange={(value: any) => setMoyenPaiement(value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="carte">Carte bancaire</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client_name">Nom du client *</Label>
                <Input
                  id="client_name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_email">Email du client *</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_phone">Téléphone</Label>
                <Input
                  id="client_phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="client_address">Adresse</Label>
                <Input
                  id="client_address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produits */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Produits</CardTitle>
                <CardDescription>Ajoutez les produits vendus</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un produit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="w-32">Quantité</TableHead>
                    <TableHead className="w-32">Stock dispo</TableHead>
                    <TableHead className="w-32">Prix unit.</TableHead>
                    <TableHead className="w-32">Total</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const stockDispo = getStockDisponible(item.product_id);
                    const isStockSuffisant = stockDispo >= item.quantity;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) =>
                              updateItem(index, 'product_id', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className={!isStockSuffisant ? 'border-red-500' : ''}
                          />
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              !isStockSuffisant ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {stockDispo}
                          </span>
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
                        <TableCell className="font-semibold">
                          {item.total.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Totaux */}
            {items.length > 0 && (
              <div className="mt-6 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total HT:</span>
                    <span className="font-semibold">
                      {totalHT.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA (20%):</span>
                    <span className="font-semibold">
                      {(totalTTC - totalHT).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC:</span>
                    <span className="text-primary">
                      {totalTTC.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes (optionnel)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajoutez des notes pour cette vente..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/app/caisse/journaliere')}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading || items.length === 0}>
            {loading ? 'Enregistrement...' : 'Enregistrer la vente'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NouvelleVentePage;
