/**
 * Compta - Dashboard
 *
 * Vue d'ensemble du module Devis & Factures
 * - KPIs (facturé, payé, impayé, en retard)
 * - Graphique évolution factures
 * - Listes rapides (dernières factures, devis en attente)
 */

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useCompta } from '@/hooks/useCompta';
import { formatCurrency, getQuoteStatusColor, getInvoiceStatusColor } from '@/types/compta';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ComptaDashboardPage() {
  const { quotes, invoices } = useCompta();

  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    quotesCount: 0,
    invoicesCount: 0,
  });

  // Calculer les stats
  useEffect(() => {
    const thisMonth = new Date();
    thisMonth.setDate(1);

    const monthInvoices = invoices.invoices.filter((inv) => {
      const issueDate = new Date(inv.issue_date);
      return issueDate >= thisMonth;
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

    setStats({
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      quotesCount: quotes.quotes.filter((q) => q.status === 'sent').length,
      invoicesCount: invoices.invoices.length,
    });
  }, [quotes.quotes, invoices.invoices]);

  // Dernières factures
  const recentInvoices = invoices.invoices.slice(0, 5);

  // Devis en attente
  const pendingQuotes = quotes.quotes.filter((q) => q.status === 'sent').slice(0, 5);

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
          <Link to="/compta/devis">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Nouveau devis
            </Button>
          </Link>
          <Link to="/compta/factures">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Facturé ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalInvoiced)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.invoicesCount} factures émises
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.totalPaid / (stats.totalInvoiced || 1)) * 100).toFixed(0)}% du total
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
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
            <p className="text-xs text-muted-foreground mt-1">
              Nécessite relance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grille 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières factures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dernières factures</CardTitle>
              <Link to="/compta/factures">
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
                <Link to="/compta/factures">
                  <Button size="sm" className="mt-3">
                    Créer ma première facture
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
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
              <Link to="/compta/devis">
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
                <Link to="/compta/devis">
                  <Button size="sm" className="mt-3">
                    Créer un devis
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
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
            <Link to="/compta/devis" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all cursor-pointer">
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Créer un devis</h3>
                <p className="text-xs text-muted-foreground">
                  Nouveau devis personnalisé
                </p>
              </div>
            </Link>

            <Link to="/compta/factures" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all cursor-pointer">
                <Receipt className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Créer une facture</h3>
                <p className="text-xs text-muted-foreground">
                  Nouvelle facture client
                </p>
              </div>
            </Link>

            <Link to="/compta/scanner" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all cursor-pointer">
                <div className="h-8 w-8 mb-2 flex items-center justify-center text-2xl">📸</div>
                <h3 className="font-semibold mb-1">Scanner un document</h3>
                <p className="text-xs text-muted-foreground">
                  OCR facture/devis papier
                </p>
              </div>
            </Link>

            <Link to="/crm/clients" className="group">
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
