/**
 * Dashboard Global - Vue d'ensemble de tous les modules
 *
 * Agrège les KPIs de CRM, Vente, Stock, Compta
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/types/compta';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useGlobalStats } from '@/hooks/useGlobalStats';

const COLORS = ['#2563eb', '#16a34a', '#f97316', '#dc2626', '#9333ea', '#0891b2'];

export default function GlobalDashboardPage() {
  const [period, setPeriod] = useState('30'); // jours

  const { stats, loading } = useGlobalStats({ days: parseInt(period) });

  // Données pour les graphiques d'évolution (6 derniers mois)
  const evolutionData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      months.push({
        month: format(month, 'MMM yyyy', { locale: fr }),
        ventes: stats?.monthlyRevenue?.[i] || 0,
        factures: stats?.monthlyInvoiced?.[i] || 0,
        clients: stats?.monthlyNewClients?.[i] || 0,
      });
    }
    return months;
  }, [stats]);

  // Données pour le graphique en camembert (répartition CA)
  const revenueBreakdown = useMemo(() => {
    if (!stats?.revenueByCategory) return [];
    return Object.entries(stats.revenueByCategory).map(([name, value]) => ({
      name,
      value,
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Dashboard Global
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
            <SelectItem value="365">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Chiffre d'affaires */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.revenueChange >= 0 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +{stats.revenueChange.toFixed(1)}% vs période précédente
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" />
                  {stats.revenueChange.toFixed(1)}% vs période précédente
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+{stats?.newClients || 0} nouveaux</span> cette période
            </p>
          </CardContent>
        </Card>

        {/* Commandes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Panier moyen: {formatCurrency(stats?.averageOrderValue || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.lowStockItems > 0 ? (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {stats.lowStockItems} alertes stock
                </span>
              ) : (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Stock sain
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution CA et Factures */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du chiffre d'affaires</CardTitle>
            <CardDescription>6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ background: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ventes"
                  stroke="#2563eb"
                  name="Ventes"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="factures"
                  stroke="#16a34a"
                  name="Facturé"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition CA par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition du CA</CardTitle>
            <CardDescription>Par catégorie de produits</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Indicateurs secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Taux de conversion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.conversionRate ? `${stats.conversionRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Devis → Commandes</p>
          </CardContent>
        </Card>

        {/* Délai moyen de paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Délai de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averagePaymentDelay || 0} jours
            </div>
            <p className="text-xs text-muted-foreground mt-1">Délai moyen</p>
          </CardContent>
        </Card>

        {/* Factures en attente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.pendingInvoices || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.pendingInvoicesCount || 0} facture(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et actions rapides */}
      {(stats?.lowStockItems > 0 || stats?.overdueInvoices > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Actions requises
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.lowStockItems > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">{stats.lowStockItems} produits en stock bas</p>
                    <p className="text-sm text-muted-foreground">
                      Nécessitent un réapprovisionnement
                    </p>
                  </div>
                </div>
                <Badge variant="destructive">{stats.lowStockItems}</Badge>
              </div>
            )}

            {stats.overdueInvoices > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">
                      {stats.overdueInvoices} factures en retard
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Montant total: {formatCurrency(stats.overdueAmount || 0)}
                    </p>
                  </div>
                </div>
                <Badge variant="destructive">{stats.overdueInvoices}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
