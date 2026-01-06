/**
 * Stock - Entrepôts/Boutiques Page
 *
 * Gestion des entrepôts, boutiques et points de vente.
 * Support multi-location pour la gestion du stock.
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
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Store,
  Truck,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWarehouses } from '@/hooks/useStock';
import {
  Warehouse,
  WarehouseType,
  WAREHOUSE_TYPES,
  getWarehouseTypeLabel,
  CreateWarehouseInput,
} from '@/types/stock';

const CITIES = [
  'Dakar',
  'Thiès',
  'Saint-Louis',
  'Kaolack',
  'Ziguinchor',
  'Touba',
  'Rufisque',
  'Mbour',
  'Diourbel',
  'Louga',
  'Autre',
];

export default function StockEntrepotsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<WarehouseType | 'all'>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Hook Warehouses
  const {
    warehouses,
    loading,
    error,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    loadWarehouses,
  } = useWarehouses({
    type: filterType === 'all' ? undefined : filterType,
    city: filterCity === 'all' ? undefined : filterCity,
    is_active: filterActive === 'all' ? undefined : filterActive === 'active',
    search: searchQuery || undefined,
  });

  const [newWarehouse, setNewWarehouse] = useState<Partial<CreateWarehouseInput>>({
    name: '',
    type: 'STORE',
    address: '',
    city: CITIES[0],
    country: 'Senegal',
    gps_lat: undefined,
    gps_lng: undefined,
    manager_name: '',
    phone: '',
    email: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    loadWarehouses();
  }, [filterType, filterCity, filterActive, searchQuery]);

  const filteredWarehouses = warehouses;

  const handleCreateWarehouse = async () => {
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, newWarehouse as CreateWarehouseInput);
        toast({
          title: 'Entrepôt mis à jour',
          description: 'L\'entrepôt a été mis à jour avec succès.',
        });
      } else {
        await createWarehouse(newWarehouse as CreateWarehouseInput);
        toast({
          title: 'Entrepôt créé',
          description: 'L\'entrepôt a été ajouté avec succès.',
        });
      }

      setIsCreateDialogOpen(false);
      setEditingWarehouse(null);
      resetForm();
      loadWarehouses();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer/modifier l\'entrepôt.',
        variant: 'destructive',
      });
    }
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setNewWarehouse({
      name: warehouse.name,
      type: warehouse.type,
      address: warehouse.address,
      city: warehouse.city,
      country: warehouse.country,
      gps_lat: warehouse.gps_lat,
      gps_lng: warehouse.gps_lng,
      manager_name: warehouse.manager_name,
      phone: warehouse.phone,
      email: warehouse.email,
      notes: warehouse.notes,
      is_active: warehouse.is_active,
    });
    setIsCreateDialogOpen(true);
  };

  const handleToggleActive = async (warehouse: Warehouse) => {
    try {
      await updateWarehouse(warehouse.id, {
        ...warehouse,
        is_active: !warehouse.is_active,
      });
      toast({
        title: 'Statut modifié',
        description: 'Le statut de l\'entrepôt a été modifié.',
      });
      loadWarehouses();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    try {
      await deleteWarehouse(warehouseId);
      toast({
        title: 'Entrepôt supprimé',
        description: 'L\'entrepôt a été supprimé avec succès.',
      });
      loadWarehouses();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'entrepôt (vérifiez les mouvements liés).',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewWarehouse({
      name: '',
      type: 'STORE',
      address: '',
      city: CITIES[0],
      country: 'Senegal',
      gps_lat: undefined,
      gps_lng: undefined,
      manager_name: '',
      phone: '',
      email: '',
      notes: '',
      is_active: true,
    });
  };

  const stats = {
    total: warehouses.filter((w) => w.is_active).length,
    stores: warehouses.filter((w) => w.type === 'STORE' && w.is_active).length,
    warehouses: warehouses.filter((w) => w.type === 'WAREHOUSE' && w.is_active).length,
    mobile: warehouses.filter((w) => w.type === 'MOBILE' && w.is_active).length,
  };

  const getWarehouseIcon = (type: WarehouseType) => {
    switch (type) {
      case 'STORE':
        return <Store className="h-4 w-4" />;
      case 'WAREHOUSE':
        return <Building2 className="h-4 w-4" />;
      case 'MOBILE':
        return <Truck className="h-4 w-4" />;
      default:
        return <WarehouseIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <WarehouseIcon className="h-8 w-8" />
            Entrepôts & Boutiques
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des points de stockage et de vente
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingWarehouse(null);
                  resetForm();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvel entrepôt/boutique
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingWarehouse ? 'Modifier l\'entrepôt/boutique' : 'Nouvel entrepôt/boutique'}
                </DialogTitle>
                <DialogDescription>
                  Renseignez les informations de l'entrepôt, boutique ou point de vente
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type *</Label>
                    <Select
                      value={newWarehouse.type}
                      onValueChange={(value) =>
                        setNewWarehouse({ ...newWarehouse, type: value as WarehouseType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WAREHOUSE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getWarehouseTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nom *</Label>
                    <Input
                      value={newWarehouse.name}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                      placeholder="Ex: Boutique Dakar Centre..."
                    />
                  </div>
                </div>

                <div>
                  <Label>Adresse</Label>
                  <Input
                    value={newWarehouse.address}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                    placeholder="Rue, avenue..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ville</Label>
                    <Select
                      value={newWarehouse.city}
                      onValueChange={(value) => setNewWarehouse({ ...newWarehouse, city: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pays</Label>
                    <Input
                      value={newWarehouse.country}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, country: e.target.value })}
                      placeholder="Senegal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GPS Latitude (optionnel)</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={newWarehouse.gps_lat || ''}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          gps_lat: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="14.6937"
                    />
                  </div>
                  <div>
                    <Label>GPS Longitude (optionnel)</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={newWarehouse.gps_lng || ''}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          gps_lng: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="-17.4441"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Contact & Responsable</h4>
                  <div className="grid gap-4">
                    <div>
                      <Label>Nom du responsable</Label>
                      <Input
                        value={newWarehouse.manager_name}
                        onChange={(e) =>
                          setNewWarehouse({ ...newWarehouse, manager_name: e.target.value })
                        }
                        placeholder="Prénom Nom"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Téléphone</Label>
                        <Input
                          value={newWarehouse.phone}
                          onChange={(e) =>
                            setNewWarehouse({ ...newWarehouse, phone: e.target.value })
                          }
                          placeholder="+221 77 123 45 67"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newWarehouse.email}
                          onChange={(e) =>
                            setNewWarehouse({ ...newWarehouse, email: e.target.value })
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newWarehouse.notes}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, notes: e.target.value })}
                    placeholder="Notes additionnelles..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newWarehouse.is_active}
                    onChange={(e) =>
                      setNewWarehouse({ ...newWarehouse, is_active: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Entrepôt/Boutique actif
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingWarehouse(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreateWarehouse} disabled={!newWarehouse.name}>
                  {editingWarehouse ? 'Mettre à jour' : 'Créer'}
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
            <CardTitle className="text-sm font-medium">Boutiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.stores}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Entrepôts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.warehouses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mobiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.mobile}</div>
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
                  placeholder="Rechercher par nom, ville..."
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
                {WAREHOUSE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getWarehouseTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes villes</SelectItem>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterActive} onValueChange={(value: any) => setFilterActive(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Warehouses List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p>Chargement...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getWarehouseIcon(warehouse.type)}
                      {warehouse.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getWarehouseTypeLabel(warehouse.type)}
                    </CardDescription>
                  </div>
                  {warehouse.is_active ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {warehouse.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{warehouse.address}</div>
                      <div className="text-muted-foreground">
                        {warehouse.city}, {warehouse.country}
                      </div>
                    </div>
                  </div>
                )}

                {warehouse.manager_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{warehouse.manager_name}</span>
                  </div>
                )}

                {warehouse.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{warehouse.phone}</span>
                  </div>
                )}

                {warehouse.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{warehouse.email}</span>
                  </div>
                )}

                {warehouse.notes && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    {warehouse.notes}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditWarehouse(warehouse)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(warehouse)}
                  >
                    {warehouse.is_active ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWarehouse(warehouse.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredWarehouses.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <WarehouseIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun entrepôt/boutique</h3>
            <p className="text-muted-foreground mb-6">
              Ajoutez votre premier point de stockage ou de vente
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un entrepôt/boutique
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
