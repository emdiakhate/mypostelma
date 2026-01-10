import { useState, useEffect } from 'react';
import { Store, DollarSign, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBoutiques } from '@/hooks/useBoutiques';
import { useCaisseJournaliere } from '@/hooks/useCaisseJournaliere';
import { useStockMovements } from '@/hooks/useStockMovements';
import type { StatistiquesBoutique } from '@/types/caisse';

const DashboardMultiBoutiques = () => {
  const { boutiques } = useBoutiques();
  const { caisses } = useCaisseJournaliere();
  const { stockActuel } = useStockMovements();
  const [statsBoutiques, setStatsBoutiques] = useState<StatistiquesBoutique[]>([]);

  useEffect(() => {
    // Calculer les stats pour chaque boutique
    const today = new Date().toISOString().split('T')[0];

    const stats = boutiques
      .filter((b) => b.statut === 'active')
      .map((boutique) => {
        // Caisse du jour
        const caisseDuJour = caisses.find(
          (c) =>
            c.boutique_id === boutique.id &&
            c.date.toISOString().split('T')[0] === today
        );

        // Stock de la boutique
        const stockBoutique = stockActuel.filter(
          (s) => s.boutique_id === boutique.id
        );

        // Valeur totale du stock
        const stock_total_value = stockBoutique.reduce((total, s) => {
          const price = s.produit?.price || 0;
          return total + s.quantite_disponible * price;
        }, 0);

        // Produits en stock bas (< 10)
        const produits_stock_bas = stockBoutique.filter(
          (s) => s.quantite_disponible < 10
        ).length;

        return {
          boutique_id: boutique.id,
          boutique_nom: boutique.nom,
          ventes_jour: 0, // Sera calculé via les mouvements de caisse
          nombre_ventes: 0,
          stock_total_value,
          produits_stock_bas,
          caisse_statut: caisseDuJour?.statut || 'fermee',
          caisse_solde: caisseDuJour?.solde_theorique || 0,
        };
      });

    setStatsBoutiques(stats);
  }, [boutiques, caisses, stockActuel]);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const totalVentes = statsBoutiques.reduce((sum, s) => sum + s.ventes_jour, 0);
  const totalStock = statsBoutiques.reduce((sum, s) => sum + s.stock_total_value, 0);
  const boutiquesActives = statsBoutiques.length;
  const caissesOuvertes = statsBoutiques.filter((s) => s.caisse_statut === 'ouverte').length;
  const alertesStockBas = statsBoutiques.reduce((sum, s) => sum + s.produits_stock_bas, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Multi-Boutiques</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble en temps réel de toutes vos boutiques
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center">
              <Store className="mr-2 h-4 w-4" />
              Boutiques actives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boutiquesActives}</div>
            <p className="text-xs text-muted-foreground">
              {caissesOuvertes} caisse(s) ouverte(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Ventes du jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalVentes)}
            </div>
            <p className="text-xs text-muted-foreground">Toutes boutiques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Valeur stock total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStock)}</div>
            <p className="text-xs text-muted-foreground">Inventaire total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Alertes stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${alertesStockBas > 0 ? 'text-orange-600' : ''}`}>
              {alertesStockBas}
            </div>
            <p className="text-xs text-muted-foreground">Produits en rupture</p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Panier moyen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalVentes / Math.max(1, statsBoutiques.reduce((sum, s) => sum + s.nombre_ventes, 0)))}
            </div>
            <p className="text-xs text-muted-foreground">Par transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Boutiques Table */}
      <Card>
        <CardHeader>
          <CardTitle>État des boutiques</CardTitle>
          <CardDescription>Vue détaillée par boutique</CardDescription>
        </CardHeader>
        <CardContent>
          {statsBoutiques.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Aucune boutique active</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Caisse</TableHead>
                  <TableHead className="text-right">Ventes du jour</TableHead>
                  <TableHead className="text-right">Solde caisse</TableHead>
                  <TableHead className="text-right">Valeur stock</TableHead>
                  <TableHead className="text-center">Alertes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsBoutiques.map((stat) => (
                  <TableRow key={stat.boutique_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Store className="mr-2 h-4 w-4 text-muted-foreground" />
                        {stat.boutique_nom}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={stat.caisse_statut === 'ouverte' ? 'default' : 'secondary'}
                      >
                        {stat.caisse_statut === 'ouverte' ? 'Ouverte' : 'Fermée'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(stat.ventes_jour)}
                      {stat.nombre_ventes > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({stat.nombre_ventes})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {stat.caisse_statut === 'ouverte' ? (
                        <span className="font-mono">{formatCurrency(stat.caisse_solde)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(stat.stock_total_value)}
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.produits_stock_bas > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {stat.produits_stock_bas}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alertes section */}
      {alertesStockBas > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Alertes de stock bas
            </CardTitle>
            <CardDescription>
              {alertesStockBas} produit(s) nécessitent un réapprovisionnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statsBoutiques
                .filter((s) => s.produits_stock_bas > 0)
                .map((stat) => (
                  <div
                    key={stat.boutique_id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <Store className="mr-2 h-4 w-4 text-orange-600" />
                      <span className="font-medium">{stat.boutique_nom}</span>
                    </div>
                    <Badge variant="destructive">
                      {stat.produits_stock_bas} produit(s)
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardMultiBoutiques;
