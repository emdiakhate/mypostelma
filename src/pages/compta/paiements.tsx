/**
 * Paiements Page - Module Compta
 * 
 * Connecté à la base de données via usePayments
 */

import { useState, useMemo } from 'react';
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
import { Euro, CreditCard, Landmark, Banknote, Download, FileText, Search } from 'lucide-react';
import { usePayments, useInvoices } from '@/hooks/useCompta';
import { formatCurrency, type Payment } from '@/types/compta';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'card':
    case 'stripe':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case 'transfer':
    case 'bank_transfer':
      return <Landmark className="h-4 w-4 text-purple-600" />;
    case 'cash':
      return <Banknote className="h-4 w-4 text-green-600" />;
    default:
      return <Euro className="h-4 w-4" />;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'card':
    case 'stripe':
      return 'Carte bancaire';
    case 'transfer':
    case 'bank_transfer':
      return 'Virement';
    case 'cash':
      return 'Espèces';
    case 'check':
      return 'Chèque';
    default:
      return method;
  }
};

export default function PaiementsPage() {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const { payments, loading } = usePayments();
  const { invoices } = useInvoices();

  // Stats
  const stats = useMemo(() => {
    const totalEncaissé = payments.reduce((sum, p) => sum + p.amount, 0);
    const cardPayments = payments.filter((p) => ['card', 'stripe', 'credit_card'].includes(p.payment_method));
    const transferPayments = payments.filter((p) => ['transfer', 'bank_transfer', 'wire'].includes(p.payment_method));
    const cashPayments = payments.filter((p) => p.payment_method === 'cash');

    const cardTotal = cardPayments.reduce((sum, p) => sum + p.amount, 0);
    const transferTotal = transferPayments.reduce((sum, p) => sum + p.amount, 0);
    const cashTotal = cashPayments.reduce((sum, p) => sum + p.amount, 0);

    // En attente = solde restant sur les factures non payées
    const enAttente = invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.balance_due, 0);

    const cardPercent = totalEncaissé > 0 ? Math.round((cardTotal / totalEncaissé) * 100) : 0;
    const transferPercent = totalEncaissé > 0 ? Math.round((transferTotal / totalEncaissé) * 100) : 0;

    return { totalEncaissé, enAttente, cardTotal, transferTotal, cashTotal, cardPercent, transferPercent };
  }, [payments, invoices]);

  // Filtrer les paiements
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch = search
        ? payment.reference?.toLowerCase().includes(search.toLowerCase()) ||
          payment.notes?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [payments, search, methodFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Euro className="h-8 w-8" />
            Paiements
          </h1>
          <p className="text-muted-foreground mt-1">Encaissements et rapprochement bancaire</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Encaissé ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalEncaissé, 'EUR')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.enAttente, 'EUR')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">CB / Stripe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.cardPercent}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Virements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.transferPercent}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé par moyen de paiement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Moyens de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Carte bancaire</div>
                  <div className="text-sm text-muted-foreground">Stripe</div>
                </div>
              </div>
              <Badge className="bg-green-600">
                {formatCurrency(stats.cardTotal, 'EUR')}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Virement</div>
                  <div className="text-sm text-muted-foreground">SEPA</div>
                </div>
              </div>
              <Badge variant="outline">
                {formatCurrency(stats.transferTotal, 'EUR')}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Espèces</div>
                  <div className="text-sm text-muted-foreground">Cash</div>
                </div>
              </div>
              <Badge variant="outline">
                {formatCurrency(stats.cashTotal, 'EUR')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Exporter écritures comptables
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Landmark className="mr-2 h-4 w-4" />
              Rapprochement bancaire
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Générer rapport financier
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les moyens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les moyens</SelectItem>
                <SelectItem value="card">Carte bancaire</SelectItem>
                <SelectItem value="transfer">Virement</SelectItem>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="check">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredPayments.length} paiement(s)</CardTitle>
          <CardDescription>Historique des encaissements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des paiements...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Euro className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun paiement trouvé</h3>
              <p className="text-sm text-muted-foreground">
                Les paiements enregistrés apparaîtront ici
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Moyen</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-mono">
                      {payment.reference || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.payment_method)}
                        {getPaymentMethodLabel(payment.payment_method)}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(payment.amount, 'EUR')}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {payment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
