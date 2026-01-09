/**
 * Compta - Dashboard
 *
 * Vue d'ensemble du module Devis & Factures
 * - KPIs (facturé, payé, impayé, en retard)
 * - Graphique évolution factures
 * - Listes rapides (dernières factures, devis en attente)
 * - Relances nécessaires
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Receipt,
  Euro,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
} from 'lucide-react';
import { useCompta } from '@/hooks/useCompta';
import { formatCurrency, getQuoteStatusColor, getInvoiceStatusColor } from '@/types/compta';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
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
} from 'recharts';

export default function ComptaDashboardPage() {
  const { quotes, invoices } = useCompta();

  const [stats, setStats] = useState({
    // Mois en cours
    totalInvoiced: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    quotesCount: 0,
    invoicesCount: 0,
    // Mois précédent pour comparaison
    prevMonthInvoiced: 0,
    prevMonthPaid: 0,
    // Conversion
    quotesAccepted: 0,
    conversionRate: 0,
  });

  // Graphique évolution (6 derniers mois)
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthInvoices = invoices.invoices.filter((inv) => {
        const issueDate = new Date(inv.issue_date);
        return issueDate >= monthStart && issueDate <= monthEnd;
      });

      const monthQuotes = quotes.quotes.filter((q) => {
        const issueDate = new Date(q.issue_date);
        return issueDate >= monthStart && issueDate <= monthEnd;
      });

      const invoiced = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const paid = monthInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

      const quoted = monthQuotes.reduce((sum, q) => sum + q.total, 0);

      months.push({
        month: format(month, 'MMM yyyy', { locale: fr }),
        invoiced,
        paid,
        quoted,
      });
    }
    return months;
  }, [invoices.invoices, quotes.quotes]);

  // Calculer les stats
  useEffect(() => {
    const thisMonth = startOfMonth(new Date());
    const prevMonth = startOfMonth(subMonths(new Date(), 1));
    const prevMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const monthInvoices = invoices.invoices.filter((inv) => {
      const issueDate = new Date(inv.issue_date);
      return issueDate >= thisMonth;
    });

    const prevMonthInvoices = invoices.invoices.filter((inv) => {
      const issueDate = new Date(inv.issue_date);
      return issueDate >= prevMonth && issueDate <= prevMonthEnd;
    });

    const totalInvoiced = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = monthInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const totalPending = monthInvoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'partial')
      .reduce((sum, inv) => sum + inv.balance_due, 0);
    const totalOverdue = invoices.invoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.balance_due, 0);

    const prevMonthInvoiced = prevMonthInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const prevMonthPaid = prevMonthInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    // Calcul taux de conversion
    const quotesAccepted = quotes.quotes.filter((q) => q.status === 'accepted').length;
    const totalQuotes = quotes.quotes.length;
    const conversionRate = totalQuotes > 0 ? (quotesAccepted / totalQuotes) * 100 : 0;

    setStats({
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      quotesCount: quotes.quotes.filter((q) => q.status === 'sent').length,
      invoicesCount: invoices.invoices.length,
      prevMonthInvoiced,
      prevMonthPaid,
      quotesAccepted,
      conversionRate,
    });
  }, [quotes.quotes, invoices.invoices]);

  // Dernières factures
  const recentInvoices = invoices.invoices.slice(0, 5);

  // Devis en attente
  const pendingQuotes = quotes.quotes.filter((q) => q.status === 'sent').slice(0, 5);

  // Factures nécessitant une relance (en retard de plus de 7 jours)
  const invoicesNeedingReminder = useMemo(() => {
    const now = new Date();
    return invoices.invoices
      .filter((inv) => {
        if (inv.status === 'paid' || inv.status === 'cancelled') return false;
        const dueDate = new Date(inv.due_date);
        const daysOverdue = differenceInDays(now, dueDate);
        return daysOverdue >= 7;
      })
      .slice(0, 5);
  }, [invoices.invoices]);

  // Calcul variations
  const invoicedChange = stats.prevMonthInvoiced > 0
    ? ((stats.totalInvoiced - stats.prevMonthInvoiced) / stats.prevMonthInvoiced) * 100
    : 0;
  const paidChange = stats.prevMonthPaid > 0
    ? ((stats.totalPaid - stats.prevMonthPaid) / stats.prevMonthPaid) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="h-8 w-8" />
            Devis & Factures
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos devis, factures et paiements
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/compta/devis/new">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Nouveau devis
            </Button>
          </Link>
          <Link to="/app/compta/factures/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Facturé ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalInvoiced)}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">
                {stats.invoicesCount} factures émises
              </p>
              {invoicedChange !== 0 && (
                <Badge variant={invoicedChange > 0 ? 'default' : 'destructive'} className="text-xs">
                  {invoicedChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(invoicedChange).toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Montant payé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">
                {((stats.totalPaid / (stats.totalInvoiced || 1)) * 100).toFixed(0)}% du total
              </p>
              {paidChange !== 0 && (
                <Badge variant={paidChange > 0 ? 'default' : 'destructive'} className="text-xs">
                  {paidChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(paidChange).toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.totalPending)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              À recevoir prochainement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Factures en retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {invoicesNeedingReminder.length} factures nécessitent relance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Supplémentaire - Conversion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taux de conversion Devis → Factures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-blue-600">
                {stats.conversionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.quotesAccepted} devis acceptés sur {quotes.quotes.length} total
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Devis en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-orange-600">
                {stats.quotesCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Devis envoyés en attente de réponse
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique évolution */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution sur 6 mois</CardTitle>
          <CardDescription>
            Suivi de vos devis, factures émises et montants encaissés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
                dataKey="quoted"
                stroke="#f97316"
                name="Devis émis"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="invoiced"
                stroke="#2563eb"
                name="Facturé"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="paid"
                stroke="#16a34a"
                name="Encaissé"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Relances nécessaires */}
      {invoicesNeedingReminder.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900">Relances nécessaires</CardTitle>
              </div>
              <Link to="/app/compta/factures?filter=overdue">
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              </Link>
            </div>
            <CardDescription>
              Factures en retard nécessitant une action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoicesNeedingReminder.map((invoice) => {
                const daysOverdue = differenceInDays(new Date(), new Date(invoice.due_date));
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{invoice.invoice_number}</span>
                        <Badge variant="destructive" className="text-xs">
                          {daysOverdue} jours de retard
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {invoice.client?.name || 'Client inconnu'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Échéance: {format(invoice.due_date, 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {formatCurrency(invoice.balance_due, invoice.currency)}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        <Bell className="h-3 w-3 mr-1" />
                        Relancer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grille 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières factures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dernières factures</CardTitle>
              <Link to="/app/compta/factures">
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              </Link>
            </div>
            <CardDescription>
              Suivi de vos factures récentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.loading ? (
              <p className="text-center py-8 text-muted-foreground">Chargement...</p>
            ) : recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Aucune facture pour le moment</p>
                <Link to="/app/compta/factures/new">
                  <Button size="sm" className="mt-3">
                    Créer ma première facture
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/app/compta/factures/${invoice.id}/edit`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{invoice.invoice_number}</span>
                          <Badge className={getInvoiceStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.client?.name || 'Client inconnu'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(invoice.issue_date, 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.total, invoice.currency)}</p>
                        {invoice.balance_due > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Reste: {formatCurrency(invoice.balance_due, invoice.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devis en attente */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Devis en attente</CardTitle>
              <Link to="/app/compta/devis">
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              </Link>
            </div>
            <CardDescription>
              Devis envoyés à vos clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quotes.loading ? (
              <p className="text-center py-8 text-muted-foreground">Chargement...</p>
            ) : pendingQuotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Aucun devis en attente</p>
                <Link to="/app/compta/devis/new">
                  <Button size="sm" className="mt-3">
                    Créer un devis
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    to={`/app/compta/devis/${quote.id}/edit`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{quote.quote_number}</span>
                          <Badge className={getQuoteStatusColor(quote.status)}>
                            {quote.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {quote.client?.name || 'Client inconnu'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Expire le {format(quote.expiration_date, 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(quote.total, quote.currency)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accédez rapidement aux fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/app/compta/devis/new" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all cursor-pointer">
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Créer un devis</h3>
                <p className="text-xs text-muted-foreground">
                  Nouveau devis personnalisé
                </p>
              </div>
            </Link>

            <Link to="/app/compta/factures/new" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all cursor-pointer">
                <Receipt className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Créer une facture</h3>
                <p className="text-xs text-muted-foreground">
                  Nouvelle facture client
                </p>
              </div>
            </Link>

            <Link to="/app/compta/scanner" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all cursor-pointer">
                <div className="h-8 w-8 mb-2 flex items-center justify-center text-2xl">📸</div>
                <h3 className="font-semibold mb-1">Scanner un document</h3>
                <p className="text-xs text-muted-foreground">
                  OCR facture/devis papier
                </p>
              </div>
            </Link>

            <Link to="/app/crm/clients" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all cursor-pointer">
                <div className="h-8 w-8 mb-2 flex items-center justify-center text-2xl">👥</div>
                <h3 className="font-semibold mb-1">Gérer mes clients</h3>
                <p className="text-xs text-muted-foreground">
                  Liste des clients actifs
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
