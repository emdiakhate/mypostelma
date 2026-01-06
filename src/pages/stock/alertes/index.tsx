/**
 * Stock - Alertes Page
 *
 * Alertes de stock bas et ruptures de stock.
 * Vue par produit et par entrepôt avec actions rapides.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  AlertTriangle,
  AlertCircle,
  Search,
  TrendingUp,
  Package,
  MapPin,
  XCircle,
} from 'lucide-react';
import { useStockLevels, useWarehouses } from '@/hooks/useStock';
import { StockLevel, getStockStatus, DEFAULT_MIN_STOCK_QUANTITY } from '@/types/stock';

export default function StockAlertesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');

  // Hooks
  const { levels, loading: loadingLevels } = useStockLevels();
  const { warehouses, loading: loadingWarehouses } = useWarehouses({
    is_active: true,
  });

  // Filtrer les niveaux de stock
  const filteredLevels = levels.filter((level) => {
    // Filtre recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !level.product_name.toLowerCase().includes(query) &&
        !level.sku?.toLowerCase().includes(query) &&
        !level.warehouse_name.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Filtre entrepôt
    if (filterWarehouse !== 'all' && level.warehouse_id !== filterWarehouse) {
      return false;
    }

    // Filtre statut
    const status = getStockStatus(level.current_quantity, DEFAULT_MIN_STOCK_QUANTITY);
    if (filterStatus !== 'all' && status !== filterStatus) {
      return false;
    }

    return true;
  });

  // Séparer en catégories
  const outOfStock = filteredLevels.filter(
    (l) => getStockStatus(l.current_quantity, DEFAULT_MIN_STOCK_QUANTITY) === 'out'
  );
  const lowStock = filteredLevels.filter(
    (l) => getStockStatus(l.current_quantity, DEFAULT_MIN_STOCK_QUANTITY) === 'low'
  );
  const okStock = filteredLevels.filter(
    (l) => getStockStatus(l.current_quantity, DEFAULT_MIN_STOCK_QUANTITY) === 'ok'
  );

  const stats = {
    total: levels.length,
    out: outOfStock.length,
    low: lowStock.length,
    ok: okStock.length,
  };

  const getStatusBadge = (quantity: number) => {
    const status = getStockStatus(quantity, DEFAULT_MIN_STOCK_QUANTITY);
    switch (status) {
      case 'out':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rupture
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Stock bas
          </Badge>
        );
      case 'ok':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            OK
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            Alertes Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Surveillance des ruptures et stocks bas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Ruptures de Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.out}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Stock Bas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.low}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">Stock OK</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
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
                  placeholder="Rechercher par produit, SKU, entrepôt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous entrepôts</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
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
                <SelectItem value="out">Ruptures</SelectItem>
                <SelectItem value="low">Stock bas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alertes Critiques (Ruptures) */}
      {outOfStock.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-900 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Ruptures de Stock ({outOfStock.length})
            </CardTitle>
            <CardDescription className="text-red-700">
              Produits en rupture nécessitant un réapprovisionnement urgent
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Entrepôt</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outOfStock.map((level) => (
                  <TableRow key={`${level.product_id}-${level.warehouse_id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{level.product_name}</div>
                        {level.sku && (
                          <div className="text-xs text-muted-foreground font-mono">{level.sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{level.warehouse_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-2xl font-bold text-red-600">
                        {level.current_quantity}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(level.current_quantity)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Créer entrée
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Alertes Stock Bas */}
      {lowStock.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Stock Bas ({lowStock.length})
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Produits approchant le seuil d'alerte (≤ {DEFAULT_MIN_STOCK_QUANTITY} unités)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Entrepôt</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((level) => (
                  <TableRow key={`${level.product_id}-${level.warehouse_id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{level.product_name}</div>
                        {level.sku && (
                          <div className="text-xs text-muted-foreground font-mono">{level.sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{level.warehouse_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl font-bold text-yellow-600">
                        {level.current_quantity}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(level.current_quantity)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Créer entrée
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Vue complète */}
      {filterStatus === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>Tous les niveaux de stock</CardTitle>
            <CardDescription>Vue complète des stocks par produit et entrepôt</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLevels ? (
              <div className="py-12 text-center">
                <p>Chargement...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entrepôt</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Coût moyen</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLevels.map((level) => (
                    <TableRow key={`${level.product_id}-${level.warehouse_id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{level.product_name}</div>
                          {level.sku && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {level.sku}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{level.product_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{level.warehouse_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{level.current_quantity}</span>
                      </TableCell>
                      <TableCell>
                        {level.average_cost ? (
                          <span className="text-sm">{level.average_cost.toFixed(2)}€</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {level.average_cost ? (
                          <span className="font-medium">
                            {(level.current_quantity * level.average_cost).toFixed(2)}€
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(level.current_quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {filteredLevels.length === 0 && !loadingLevels && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune alerte</h3>
            <p className="text-muted-foreground">
              Aucun produit ne correspond aux critères de filtrage
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
