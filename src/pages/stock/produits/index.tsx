/**
 * Stock - Produits Page
 *
 * Gestion du référentiel produits pour le module Stock.
 * Produits physiques, digitaux et services avec gestion stock.
 */

import { useState } from 'react';
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
  Barcode,
  Grid3x3,
  List,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStockProducts } from '@/hooks/useStock';
import {
  StockProduct,
  ProductType,
  PRODUCT_TYPES,
  getProductTypeLabel,
  CreateStockProductInput,
} from '@/types/stock';

const CATEGORIES = [
  'Ordinateurs',
  'Téléphones',
  'Accessoires',
  'Logiciels',
  'Licences',
  'Services IT',
  'Formation',
  'Autre',
];

export default function StockProduitsPage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StockProduct | null>(null);

  // Hook Stock Products
  const {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    loadProducts,
  } = useStockProducts({
    status: filterStatus === 'all' ? undefined : filterStatus,
    type: filterType === 'all' ? undefined : filterType,
    category: filterCategory === 'all' ? undefined : filterCategory,
    search: searchQuery || undefined,
  });

  const [newProduct, setNewProduct] = useState<Partial<CreateStockProductInput>>({
    name: '',
    description: '',
    type: 'PHYSICAL',
    category: CATEGORIES[0],
    price: 0,
    cost_price: 0,
    tax_rate: 0.2,
    is_stockable: true,
    track_serial: false,
    sku: '',
    barcode: '',
    status: 'active',
  });


  const filteredProducts = products;

  const handleCreateProduct = async () => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, newProduct as CreateStockProductInput);
        toast({
          title: 'Produit mis à jour',
          description: 'Le produit a été mis à jour avec succès.',
        });
      } else {
        await createProduct(newProduct as CreateStockProductInput);
        toast({
          title: 'Produit créé',
          description: 'Le produit a été ajouté au référentiel.',
        });
      }

      setIsCreateDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer/modifier le produit.',
        variant: 'destructive',
      });
    }
  };

  const handleEditProduct = (product: StockProduct) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      type: product.type,
      category: product.category,
      price: product.price,
      cost_price: product.cost_price,
      tax_rate: product.tax_rate,
      is_stockable: product.is_stockable,
      track_serial: product.track_serial,
      sku: product.sku,
      barcode: product.barcode,
      status: product.status,
    });
    setIsCreateDialogOpen(true);
  };

  const handleToggleArchive = async (product: StockProduct) => {
    try {
      await updateProduct(product.id, {
        status: product.status === 'active' ? 'archived' : 'active',
      } as CreateStockProductInput);
      toast({
        title: 'Statut modifié',
        description: 'Le statut du produit a été modifié.',
      });
      loadProducts();
    } catch (err) {
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
        description: 'Le produit a été supprimé du référentiel.',
      });
      loadProducts();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      description: '',
      type: 'PHYSICAL',
      category: CATEGORIES[0],
      price: 0,
      cost_price: 0,
      tax_rate: 0.2,
      is_stockable: true,
      track_serial: false,
      sku: '',
      barcode: '',
      status: 'active',
    });
  };

  const stats = {
    total: products.filter((p) => p.status === 'active').length,
    physical: products.filter((p) => p.type === 'PHYSICAL' && p.status === 'active').length,
    digital: products.filter((p) => p.type === 'DIGITAL' && p.status === 'active').length,
    services: products.filter((p) => p.type === 'SERVICE' && p.status === 'active').length,
  };

  const margin = (price?: number, cost?: number) => {
    if (!price || !cost) return null;
    return (((price - cost) / price) * 100).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8" />
            Produits Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Référentiel produits pour la gestion du stock
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
                Nouveau produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                </DialogTitle>
                <DialogDescription>
                  Renseignez les informations du produit (physique, digital ou service)
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newProduct.type}
                      onValueChange={(value) =>
                        setNewProduct({
                          ...newProduct,
                          type: value as ProductType,
                          is_stockable: value !== 'SERVICE',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getProductTypeLabel(type)}
                          </SelectItem>
                        ))}
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
                  <Label>Nom du produit *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Ex: iPhone 15 Pro..."
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Décrivez le produit..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Prix de vente (€) *</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Coût d'achat (€)</Label>
                    <Input
                      type="number"
                      value={newProduct.cost_price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, cost_price: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Taux TVA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProduct.tax_rate}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, tax_rate: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SKU (Référence)</Label>
                    <Input
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="SKU-001"
                    />
                  </div>
                  <div>
                    <Label>Code-barres</Label>
                    <Input
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                      placeholder="123456789..."
                    />
                  </div>
                </div>

                {newProduct.type !== 'SERVICE' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_stockable"
                      checked={newProduct.is_stockable}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, is_stockable: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_stockable" className="cursor-pointer">
                      Gérer le stock pour ce produit
                    </Label>
                  </div>
                )}

                {newProduct.type === 'PHYSICAL' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="track_serial"
                      checked={newProduct.track_serial}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, track_serial: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <Label htmlFor="track_serial" className="cursor-pointer">
                      Suivre les numéros de série (Phase 2)
                    </Label>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreateProduct} disabled={!newProduct.name || !newProduct.price}>
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
            <CardTitle className="text-sm font-medium">Physiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.physical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Digitaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.digital}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.services}</div>
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
                  placeholder="Rechercher par nom, SKU, code-barres..."
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
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getProductTypeLabel(type)}
                  </SelectItem>
                ))}
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
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p>Chargement...</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="mt-1">{product.description}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      product.type === 'PHYSICAL'
                        ? 'default'
                        : product.type === 'DIGITAL'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {getProductTypeLabel(product.type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prix</span>
                  <span className="text-xl font-bold text-green-600">
                    {product.price?.toLocaleString() || 0}€
                  </span>
                </div>

                {product.cost_price && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Marge</span>
                    <Badge variant="outline" className="bg-green-50">
                      {margin(product.price, product.cost_price)}%
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {product.category && (
                    <Badge variant="outline">
                      <Tag className="h-3 w-3 mr-1" />
                      {product.category}
                    </Badge>
                  )}
                  {product.sku && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {product.sku}
                    </Badge>
                  )}
                  {product.is_stockable && (
                    <Badge variant="outline" className="text-xs">
                      Géré en stock
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleArchive(product)}>
                    <Archive className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
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
                <TableHead>SKU</TableHead>
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
                    <Badge
                      variant={
                        product.type === 'PHYSICAL'
                          ? 'default'
                          : product.type === 'DIGITAL'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {getProductTypeLabel(product.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category && <Badge variant="outline">{product.category}</Badge>}
                  </TableCell>
                  <TableCell>
                    {product.sku && (
                      <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{product.price?.toLocaleString() || 0}€</div>
                  </TableCell>
                  <TableCell>
                    {product.cost_price && (
                      <Badge variant="outline" className="bg-green-50">
                        {margin(product.price, product.cost_price)}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.is_stockable ? (
                      <Badge variant="default">Géré</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Non géré</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleArchive(product)}>
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
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

      {filteredProducts.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
            <p className="text-muted-foreground mb-6">
              Ajoutez votre premier produit au référentiel stock
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
