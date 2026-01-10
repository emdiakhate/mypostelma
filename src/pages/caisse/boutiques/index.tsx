import { useState } from 'react';
import { Plus, Store, MapPin, Phone, User, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBoutiques } from '@/hooks/useBoutiques';
import type { BoutiqueFormData, BoutiqueStatut } from '@/types/caisse';

const BoutiquesPage = () => {
  const { boutiques, loading, createBoutique, updateBoutique, deleteBoutique } = useBoutiques();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BoutiqueFormData>({
    nom: '',
    adresse: '',
    ville: '',
    telephone: '',
    email: '',
    responsable_nom: '',
    responsable_telephone: '',
    statut: 'active',
  });

  const resetForm = () => {
    setFormData({
      nom: '',
      adresse: '',
      ville: '',
      telephone: '',
      email: '',
      responsable_nom: '',
      responsable_telephone: '',
      statut: 'active',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const success = await updateBoutique(editingId, formData);
      if (success) {
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const result = await createBoutique(formData);
      if (result) {
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (boutique: any) => {
    setEditingId(boutique.id);
    setFormData({
      nom: boutique.nom,
      adresse: boutique.adresse || '',
      ville: boutique.ville || '',
      telephone: boutique.telephone || '',
      email: boutique.email || '',
      responsable_nom: boutique.responsable_nom || '',
      responsable_telephone: boutique.responsable_telephone || '',
      statut: boutique.statut,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      await deleteBoutique(id);
    }
  };

  const getStatusColor = (statut: BoutiqueStatut) => {
    switch (statut) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-orange-500';
      case 'closed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (statut: BoutiqueStatut) => {
    switch (statut) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'closed':
        return 'Fermée';
      default:
        return statut;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Boutiques</h1>
          <p className="text-muted-foreground">
            Gérez vos boutiques physiques et leurs informations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Boutique
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Modifier la boutique' : 'Nouvelle boutique'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations de la boutique
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nom">Nom de la boutique *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Textarea
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) =>
                      setFormData({ ...formData, adresse: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) =>
                      setFormData({ ...formData, ville: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="responsable_nom">Nom du responsable</Label>
                  <Input
                    id="responsable_nom"
                    value={formData.responsable_nom}
                    onChange={(e) =>
                      setFormData({ ...formData, responsable_nom: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="responsable_telephone">
                    Téléphone du responsable
                  </Label>
                  <Input
                    id="responsable_telephone"
                    value={formData.responsable_telephone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsable_telephone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) =>
                      setFormData({ ...formData, statut: value as BoutiqueStatut })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="closed">Fermée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingId ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Boutiques Grid */}
      {boutiques.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucune boutique enregistrée
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer votre première boutique
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boutiques.map((boutique) => (
            <Card key={boutique.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Store className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{boutique.nom}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(boutique.statut)}>
                    {getStatusLabel(boutique.statut)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {boutique.ville && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    {boutique.ville}
                  </div>
                )}
                {boutique.telephone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-2 h-4 w-4" />
                    {boutique.telephone}
                  </div>
                )}
                {boutique.responsable_nom && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    {boutique.responsable_nom}
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(boutique)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(boutique.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoutiquesPage;
