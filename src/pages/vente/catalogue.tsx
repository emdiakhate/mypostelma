/**
 * Catalogue Produits/Services Page
 *
 * Gestion du catalogue de produits et services.
 * Création, édition, archivage et organisation par catégories.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Archive,
  Tag,
  Euro,
  BarChart3,
  Grid3x3,
  List,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useVente';
import type { Product } from '@/types/vente';

const CATEGORIES = [
  'Formation',
  'Conseil',
  'Développement',
  'Design',
  'Marketing',
  'Produit Physique',
  'Abonnement',
  'Autre',
];

const UNITS = ['Unité', 'Heure', 'Jour', 'Mois', 'Forfait', 'Licence'];

export default function CataloguePage() {
  const { toast } = useToast();
  const { products, loading, loadProducts, createProduct, updateProduct, deleteProduct, toggleArchive } = useProducts();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    type: 'service' as 'product' | 'service',
    category: CATEGORIES[0],
    price: 0,
    cost: 0,
    stock: 0,
    unit: UNITS[0],
    sku: '',
  });

  // Charger les produits au montage (le hook le fait déjà automatiquement)
  
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || product.type === filterType;
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const handleCreateProduct = async () => {
    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: newProduct.name,
          description: newProduct.description,
          type: newProduct.type,
          category: newProduct.category,
          price: newProduct.price,
          cost: newProduct.cost || undefined,
          stock: newProduct.type === 'product' ? newProduct.stock : undefined,
          unit: newProduct.unit,
          sku: newProduct.sku || undefined,
        });
        toast({
          title: 'Produit mis à jour',
          description: 'Le produit a été mis à jour avec succès.',
        });
      } else {
        await createProduct({
          name: newProduct.name,
          description: newProduct.description,
          type: newProduct.type,
          category: newProduct.category,
          price: newProduct.price,
          cost: newProduct.cost || undefined,
          stock: newProduct.type === 'product' ? newProduct.stock : undefined,
          unit: newProduct.unit,
          sku: newProduct.sku || undefined,
          status: 'active',
        });
        toast({
          title: 'Produit créé',
          description: 'Le produit a été ajouté au catalogue.',
        });
      }

      setIsCreateDialogOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      description: '',
      type: 'service',
      category: CATEGORIES[0],
      price: 0,
      cost: 0,
      stock: 0,
      unit: UNITS[0],
      sku: '',
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      type: product.type,
      category: product.category,
      price: product.price,
      cost: product.cost || 0,
      stock: product.stock || 0,
      unit: product.unit,
      sku: product.sku || '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleToggleArchive = async (product: Product) => {
    try {
      await updateProduct(product.id, {
        status: product.status === 'active' ? 'archived' : 'active',
      });
      toast({
        title: 'Statut modifié',
        description: 'Le statut du produit a été modifié.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé du catalogue.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit.',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    total: products.filter((p) => p.status === 'active').length,
    products: products.filter((p) => p.type === 'product' && p.status === 'active').length,
    services: products.filter((p) => p.type === 'service' && p.status === 'active').length,
    revenue: products
      .filter((p) => p.status === 'active')
      .reduce((sum, p) => sum + p.price, 0),
  };

  const margin = (price: number, cost?: number) => {
    if (!cost) return null;
    return (((price - cost) / price) * 100).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8" />
            Catalogue Produits & Services
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos produits et services
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-accent' : ''}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  resetForm();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau produit/service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Modifier le produit/service' : 'Nouveau produit/service'}
                </DialogTitle>
                <DialogDescription>
                  Renseignez les informations du produit ou service
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newProduct.type}
                      onValueChange={(value) =>
                        setNewProduct({ ...newProduct, type: value as 'product' | 'service' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="product">Produit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Catégorie</Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Nom</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Ex: Formation Social Media..."
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Décrivez le produit ou service..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Prix de vente (€)</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Coût (€)</Label>
                    <Input
                      type="number"
                      value={newProduct.cost}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, cost: parseFloat(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Unité</Label>
                    <Select
                      value={newProduct.unit}
                      onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {newProduct.type === 'product' && (
                    <div>
                      <Label>Stock initial</Label>
                      <Input
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })
                        }
                        placeholder="0"
                      />
                    </div>
                  )}
                  <div>
                    <Label>SKU (optionnel)</Label>
                    <Input
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="REF-001"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={saving}>
                  Annuler
                </Button>
                <Button onClick={handleCreateProduct} disabled={!newProduct.name || !newProduct.price || saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProduct ? 'Mettre à jour' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.services}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valeur Catalogue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.revenue.toLocaleString()}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="service">Services</SelectItem>
                <SelectItem value="product">Produits</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="archived">Archivés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="mt-1">{product.description}</CardDescription>
                  </div>
                  <Badge variant={product.type === 'service' ? 'default' : 'secondary'}>
                    {product.type === 'service' ? 'Service' : 'Produit'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prix</span>
                  <span className="text-xl font-bold text-green-600">
                    {product.price.toLocaleString()}€
                    <span className="text-xs text-muted-foreground ml-1">/ {product.unit}</span>
                  </span>
                </div>

                {product.cost && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Marge</span>
                    <Badge variant="outline" className="bg-green-50">
                      {margin(product.price, product.cost)}%
                    </Badge>
                  </div>
                )}

                {product.type === 'product' && product.stock !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stock</span>
                    <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                      {product.stock} unités
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {product.category}
                  </Badge>
                  {product.sku && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {product.sku}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditProduct(product)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleArchive(product)}
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Marge</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Badge variant={product.type === 'service' ? 'default' : 'secondary'}>
                      {product.type === 'service' ? 'Service' : 'Produit'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{product.price.toLocaleString()}€</div>
                    <div className="text-xs text-muted-foreground">/ {product.unit}</div>
                  </TableCell>
                  <TableCell>
                    {product.cost && (
                      <Badge variant="outline" className="bg-green-50">
                        {margin(product.price, product.cost)}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.type === 'product' && product.stock !== undefined ? (
                      <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                        {product.stock}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleArchive(product)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit/service</h3>
            <p className="text-muted-foreground mb-6">
              Ajoutez votre premier produit ou service au catalogue
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit/service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
