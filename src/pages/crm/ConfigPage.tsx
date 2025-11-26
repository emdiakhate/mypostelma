/**
 * Page de configuration CRM
 * Gestion des secteurs, segments et tags
 */

import React, { useState } from 'react';
import {
  Building,
  Tag,
  Layers,
  Plus,
  Edit,
  Trash,
  Save,
  X,
  Palette,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useSectors, useSegments, useTags } from '@/hooks/useCRM';
import { CRMSector, SectorFormData, SegmentFormData, TagFormData } from '@/types/crm';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

// Liste d'icônes courantes pour les secteurs
const SECTOR_ICONS = [
  'Building',
  'Utensils',
  'ShoppingBag',
  'Home',
  'Briefcase',
  'Heart',
  'GraduationCap',
  'Car',
  'Plane',
  'Coffee',
];

// Couleurs prédéfinies
const SECTOR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const ConfigPage: React.FC = () => {
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuration CRM</h1>
        <p className="text-gray-600">
          Configurez vos secteurs, segments et tags pour organiser vos leads
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sectors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sectors" className="gap-2">
            <Building className="w-4 h-4" />
            Secteurs
          </TabsTrigger>
          <TabsTrigger value="segments" className="gap-2">
            <Layers className="w-4 h-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="w-4 h-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* Secteurs */}
        <TabsContent value="sectors">
          <SectorsTab />
        </TabsContent>

        {/* Segments */}
        <TabsContent value="segments">
          <SegmentsTab />
        </TabsContent>

        {/* Tags */}
        <TabsContent value="tags">
          <TagsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ==============================================
// Secteurs Tab
// ==============================================

const SectorsTab: React.FC = () => {
  const { sectors, loading, createSector, updateSector, deleteSector } = useSectors();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<CRMSector | null>(null);
  const [formData, setFormData] = useState<SectorFormData>({
    name: '',
    description: '',
    icon: 'Building',
    color: '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSector) {
        await updateSector(editingSector.id, formData);
        toast.success('Secteur mis à jour');
      } else {
        await createSector(formData);
        toast.success('Secteur créé');
      }
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (sector: CRMSector) => {
    setEditingSector(sector);
    setFormData({
      name: sector.name,
      description: sector.description,
      icon: sector.icon,
      color: sector.color,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce secteur ?')) return;

    try {
      await deleteSector(id);
      toast.success('Secteur supprimé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSector(null);
    setFormData({
      name: '',
      description: '',
      icon: 'Building',
      color: '#3B82F6',
    });
  };

  // Rendre l'icône dynamiquement
  const renderIcon = (iconName?: string) => {
    if (!iconName) return <Building className="w-5 h-5" />;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Building className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Secteurs d'activité</CardTitle>
              <CardDescription>
                Organisez vos leads par secteur (ex: Hôtellerie, Restauration)
              </CardDescription>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau secteur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sectors.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun secteur</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre premier secteur d'activité
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un secteur
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectors.map((sector) => (
                <Card key={sector.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: sector.color || '#3B82F6' }}
                      >
                        <div className="text-white">
                          {renderIcon(sector.icon)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(sector)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(sector.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{sector.name}</h3>
                    {sector.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {sector.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Secteur */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSector ? 'Modifier le secteur' : 'Nouveau secteur'}
            </DialogTitle>
            <DialogDescription>
              Configurez les informations du secteur d'activité
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Hôtellerie"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du secteur"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="icon">Icône</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTOR_ICONS.map((icon) => {
                    const IconComponent = (Icons as any)[icon];
                    return (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="w-4 h-4" />}
                          <span>{icon}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Couleur</Label>
              <div className="flex gap-2">
                {SECTOR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingSector ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==============================================
// Segments Tab
// ==============================================

const SegmentsTab: React.FC = () => {
  const { sectors } = useSectors();
  const { segments, createSegment, updateSegment, deleteSegment } = useSegments();
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SegmentFormData>({
    sector_id: '',
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSegment(formData);
      toast.success('Segment créé');
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce segment ?')) return;

    try {
      await deleteSegment(id);
      toast.success('Segment supprimé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      sector_id: selectedSectorId || '',
      name: '',
      description: '',
    });
  };

  const filteredSegments = selectedSectorId
    ? segments.filter((s) => s.sector_id === selectedSectorId)
    : segments;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Segments</CardTitle>
              <CardDescription>
                Créez des segments au sein de chaque secteur (ex: 5 étoiles, Budget)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les secteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les secteurs</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  setFormData({
                    sector_id: selectedSectorId || (sectors[0]?.id || ''),
                    name: '',
                    description: '',
                  });
                  setIsModalOpen(true);
                }}
                disabled={sectors.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau segment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sectors.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Créez d'abord un secteur</h3>
              <p className="text-sm text-muted-foreground">
                Vous devez créer au moins un secteur avant d'ajouter des segments
              </p>
            </div>
          ) : filteredSegments.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun segment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre premier segment pour ce secteur
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un segment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSegments.map((segment) => {
                  const sector = sectors.find((s) => s.id === segment.sector_id);
                  return (
                    <TableRow key={segment.id}>
                      <TableCell className="font-medium">{segment.name}</TableCell>
                      <TableCell>
                        {sector && (
                          <Badge
                            style={{
                              backgroundColor: sector.color || '#3B82F6',
                              color: 'white',
                            }}
                          >
                            {sector.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {segment.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(segment.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Segment */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau segment</DialogTitle>
            <DialogDescription>
              Créez un nouveau segment pour catégoriser vos leads
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="sector">Secteur *</Label>
              <Select
                value={formData.sector_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, sector_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: 5 étoiles"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du segment"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==============================================
// Tags Tab
// ==============================================

const TagsTab: React.FC = () => {
  const { sectors } = useSectors();
  const { tags, createTag, deleteTag } = useTags();
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [newTagName, setNewTagName] = useState('');

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTag({
        sector_id: selectedSectorId || undefined,
        name: newTagName.trim(),
      });
      setNewTagName('');
      toast.success('Tag créé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      await deleteTag(id);
      toast.success('Tag supprimé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const filteredTags = selectedSectorId
    ? tags.filter((t) => t.sector_id === selectedSectorId)
    : tags;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>
          Créez des tags pour caractériser vos leads (ex: wifi, piscine, livraison)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtre par secteur */}
        <div className="flex gap-2">
          <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous les secteurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les secteurs</SelectItem>
              {sectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Formulaire d'ajout rapide */}
        <form onSubmit={handleAddTag} className="flex gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nom du tag (ex: wifi)"
          />
          <Button type="submit">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </form>

        {/* Liste des tags */}
        <div className="flex flex-wrap gap-2">
          {filteredTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun tag</p>
          ) : (
            filteredTags.map((tag) => {
              const sector = sectors.find((s) => s.id === tag.sector_id);
              return (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-sm py-1 px-3 flex items-center gap-2"
                >
                  {tag.name}
                  {sector && (
                    <span
                      className="text-xs opacity-60"
                      style={{ color: sector.color || '#3B82F6' }}
                    >
                      ({sector.name})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag.id)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigPage;
