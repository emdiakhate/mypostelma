import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useCaisseJournaliere } from '@/hooks/useCaisseJournaliere';
import type { CaisseOuvertureFormData, CaisseClotureFormData, MouvementCaisseFormData, MoyenPaiement, MouvementCaisseType } from '@/types/caisse';

const CaisseJournalierePage = () => {
  const navigate = useNavigate();
  const { warehouses } = useWarehouses('STORE'); // Filter for STORE type (boutiques)
  const { caisseActive, mouvements, ouvrirCaisse, cloturerCaisse, ajouterMouvement, getStatistiquesCaisse } = useCaisseJournaliere();

  const [ouvertureOpen, setOuvertureOpen] = useState(false);
  const [clotureOpen, setClotureOpen] = useState(false);
  const [mouvementOpen, setMouvementOpen] = useState(false);

  const [ouvertureForm, setOuvertureForm] = useState<CaisseOuvertureFormData>({
    warehouse_id: '',
    solde_ouverture: 0,
    notes_ouverture: '',
  });

  const [clotureForm, setClotureForm] = useState<CaisseClotureFormData>({
    solde_cloture: 0,
    notes_cloture: '',
  });

  const [mouvementForm, setMouvementForm] = useState<MouvementCaisseFormData>({
    caisse_id: '',
    type: 'entree',
    montant: 0,
    moyen_paiement: 'cash',
    description: '',
  });

  const stats = caisseActive ? getStatistiquesCaisse(caisseActive.id) : null;

  const handleOuverture = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await ouvrirCaisse(ouvertureForm);
    if (result) {
      setOuvertureOpen(false);
      setOuvertureForm({
        warehouse_id: '',
        solde_ouverture: 0,
        notes_ouverture: '',
      });
    }
  };

  const handleCloture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caisseActive) return;
    const success = await cloturerCaisse(caisseActive.id, clotureForm);
    if (success) {
      setClotureOpen(false);
      setClotureForm({
        solde_cloture: 0,
        notes_cloture: '',
      });
    }
  };

  const handleMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caisseActive) return;
    const result = await ajouterMouvement({
      ...mouvementForm,
      caisse_id: caisseActive.id,
    });
    if (result) {
      setMouvementOpen(false);
      setMouvementForm({
        caisse_id: '',
        type: 'entree',
        montant: 0,
        moyen_paiement: 'cash',
        description: '',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Caisse Journalière</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {!caisseActive ? (
          <Dialog open={ouvertureOpen} onOpenChange={setOuvertureOpen}>
            <Button onClick={() => setOuvertureOpen(true)}>
              <Unlock className="mr-2 h-4 w-4" />
              Ouvrir la caisse
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ouverture de caisse</DialogTitle>
                <DialogDescription>
                  Ouvrez la caisse pour commencer la journée
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleOuverture} className="space-y-4">
                <div>
                  <Label htmlFor="warehouse">Boutique *</Label>
                  <Select
                    value={ouvertureForm.warehouse_id}
                    onValueChange={(value) =>
                      setOuvertureForm({ ...ouvertureForm, warehouse_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une boutique" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.filter(w => w.is_active).map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="solde_ouverture">Solde d'ouverture (FCFA) *</Label>
                  <Input
                    id="solde_ouverture"
                    type="number"
                    step="0.01"
                    value={ouvertureForm.solde_ouverture}
                    onChange={(e) =>
                      setOuvertureForm({
                        ...ouvertureForm,
                        solde_ouverture: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes_ouverture">Notes</Label>
                  <Textarea
                    id="notes_ouverture"
                    value={ouvertureForm.notes_ouverture}
                    onChange={(e) =>
                      setOuvertureForm({
                        ...ouvertureForm,
                        notes_ouverture: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOuvertureOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Ouvrir la caisse</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={() => navigate('/app/caisse/nouvelle-vente')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nouvelle Vente
            </Button>
            <Dialog open={mouvementOpen} onOpenChange={setMouvementOpen}>
              <Button variant="outline" onClick={() => setMouvementOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter mouvement
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau mouvement de caisse</DialogTitle>
                  <DialogDescription>
                    Enregistrez une entrée ou sortie de caisse
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleMouvement} className="space-y-4">
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={mouvementForm.type}
                      onValueChange={(value) =>
                        setMouvementForm({ ...mouvementForm, type: value as MouvementCaisseType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entree">Entrée</SelectItem>
                        <SelectItem value="sortie">Sortie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="montant">Montant (FCFA) *</Label>
                    <Input
                      id="montant"
                      type="number"
                      step="0.01"
                      value={mouvementForm.montant}
                      onChange={(e) =>
                        setMouvementForm({
                          ...mouvementForm,
                          montant: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="moyen_paiement">Moyen de paiement *</Label>
                    <Select
                      value={mouvementForm.moyen_paiement}
                      onValueChange={(value) =>
                        setMouvementForm({ ...mouvementForm, moyen_paiement: value as MoyenPaiement })
                      }
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
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={mouvementForm.description}
                      onChange={(e) =>
                        setMouvementForm({
                          ...mouvementForm,
                          description: e.target.value,
                        })
                      }
                      required
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setMouvementOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Enregistrer</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={clotureOpen} onOpenChange={setClotureOpen}>
              <Button variant="destructive" onClick={() => setClotureOpen(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Clôturer la caisse
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clôture de caisse</DialogTitle>
                  <DialogDescription>
                    Comptez l'argent et clôturez la journée
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCloture} className="space-y-4">
                  {stats && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="text-sm">
                        <strong>Solde théorique:</strong> {formatCurrency(stats.solde_theorique)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ouverture: {formatCurrency(caisseActive?.solde_ouverture || 0)} + Ventes: {formatCurrency(stats.total_ventes)} + Entrées: {formatCurrency(stats.total_entrees)} - Sorties: {formatCurrency(stats.total_sorties)}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="solde_cloture">Solde réel compté (FCFA) *</Label>
                    <Input
                      id="solde_cloture"
                      type="number"
                      step="0.01"
                      value={clotureForm.solde_cloture}
                      onChange={(e) =>
                        setClotureForm({
                          ...clotureForm,
                          solde_cloture: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                    {stats && clotureForm.solde_cloture > 0 && (
                      <p className={`text-sm mt-1 ${
                        Math.abs(clotureForm.solde_cloture - stats.solde_theorique) > 1000
                          ? 'text-red-500'
                          : 'text-green-500'
                      }`}>
                        Écart: {formatCurrency(clotureForm.solde_cloture - stats.solde_theorique)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes_cloture">Notes de clôture</Label>
                    <Textarea
                      id="notes_cloture"
                      value={clotureForm.notes_cloture}
                      onChange={(e) =>
                        setClotureForm({
                          ...clotureForm,
                          notes_cloture: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Expliquez tout écart significatif..."
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setClotureOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" variant="destructive">Clôturer</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Status */}
      {caisseActive ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Solde d'ouverture</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(caisseActive.solde_ouverture)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {caisseActive.heure_ouverture && formatTime(caisseActive.heure_ouverture)}
                </p>
              </CardContent>
            </Card>

            {stats && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ventes du jour</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.total_ventes)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.nombre_ventes} vente(s)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Entrées / Sorties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        +{formatCurrency(stats.total_entrees)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">
                        -{formatCurrency(stats.total_sorties)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardHeader className="pb-2">
                    <CardDescription>Solde théorique</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(stats.solde_theorique)}
                    </div>
                    <p className="text-xs text-muted-foreground">En temps réel</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Breakdown by payment method */}
          {stats && stats.total_ventes > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Répartition par moyen de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Cash</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(stats.total_ventes_cash)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Mobile Money</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(stats.total_ventes_mobile_money)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Carte</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(stats.total_ventes_carte)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Autres</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(stats.total_ventes_autres)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mouvements */}
          <Card>
            <CardHeader>
              <CardTitle>Mouvements du jour</CardTitle>
              <CardDescription>{mouvements.length} mouvement(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {mouvements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun mouvement enregistré
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Heure</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Moyen</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mouvements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-sm">
                          {formatTime(m.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              m.type === 'vente'
                                ? 'default'
                                : m.type === 'entree'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {m.type === 'vente' ? 'Vente' : m.type === 'entree' ? 'Entrée' : 'Sortie'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {m.description || m.reference_type}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.moyen_paiement.replace('_', ' ')}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            m.type === 'sortie' ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {m.type === 'sortie' ? '-' : '+'}
                          {formatCurrency(m.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Caisse fermée</p>
            <p className="text-muted-foreground mb-4">
              Ouvrez la caisse pour commencer la journée
            </p>
            <Button onClick={() => setOuvertureOpen(true)}>
              <Unlock className="mr-2 h-4 w-4" />
              Ouvrir la caisse
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CaisseJournalierePage;
