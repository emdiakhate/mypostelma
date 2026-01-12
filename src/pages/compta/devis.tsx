/**
 * Devis Comptables Page - Module Compta
 * 
 * Synchronisé avec le hook useQuotes de useCompta
 */

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Search,
  Send,
  Download,
  Eye,
  Edit,
  Copy,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
} from 'lucide-react';
import { useQuotes } from '@/hooks/useCompta';
import {
  formatCurrency,
  getQuoteStatusLabel,
  getQuoteStatusColor,
  type QuoteStatus,
  type Quote,
} from '@/types/compta';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function DevisComptaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [search, statusFilter]
  );

  const { quotes, loading, updateQuoteStatus } = useQuotes(filters);

  // Stats
  const stats = useMemo(() => {
    const total = quotes.length;
    const draft = quotes.filter((q) => q.status === 'draft').length;
    const sent = quotes.filter((q) => q.status === 'sent').length;
    const accepted = quotes.filter((q) => q.status === 'accepted').length;
    const revenue = quotes
      .filter((q) => q.status === 'accepted')
      .reduce((sum, q) => sum + q.total, 0);
    const conversionRate = sent + accepted > 0
      ? ((accepted / (sent + accepted)) * 100).toFixed(1)
      : '0';
    return { total, draft, sent, accepted, revenue, conversionRate };
  }, [quotes]);

  const handleView = (quoteId: string) => {
    navigate(`/app/compta/devis/${quoteId}`);
  };

  const handleEdit = (quoteId: string) => {
    navigate(`/app/compta/devis/${quoteId}/edit`);
  };

  const handleSend = async (quoteId: string) => {
    try {
      await updateQuoteStatus(quoteId, 'sent');
      toast({
        title: 'Devis envoyé',
        description: 'Le devis a été marqué comme envoyé.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
      });
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const colorClass = getQuoteStatusColor(status);
    const label = getQuoteStatusLabel(status);
    return <Badge className={colorClass}>{label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Devis Comptables
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des devis avant facturation</p>
        </div>
        <Link to="/app/compta/devis/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Devis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Envoyés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Acceptés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taux: {stats.conversionRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">CA Signé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.revenue, 'EUR')}
            </div>
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
                  placeholder="Rechercher par numéro, client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="sent">Envoyés</SelectItem>
                <SelectItem value="accepted">Acceptés</SelectItem>
                <SelectItem value="rejected">Refusés</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des devis */}
      <Card>
        <CardHeader>
          <CardTitle>
            {quotes.length} devis
            {statusFilter !== 'all' && ` - ${getQuoteStatusLabel(statusFilter)}`}
          </CardTitle>
          <CardDescription>
            Liste de tous vos devis comptables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des devis...
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun devis trouvé</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter !== 'all'
                  ? 'Aucun devis ne correspond à vos critères'
                  : 'Créez votre premier devis'}
              </p>
              <Link to="/app/compta/devis/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un devis
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="font-mono font-semibold">{quote.quote_number}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quote.client?.name || 'Client'}</div>
                        <div className="text-xs text-muted-foreground">
                          {quote.client?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(quote.subtotal, quote.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(quote.total, quote.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(quote.expiration_date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(quote.issue_date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(quote.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(quote.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          {quote.status === 'draft' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSend(quote.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Envoyer
                              </DropdownMenuItem>
                            </>
                          )}
                          {quote.status === 'accepted' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => navigate(`/app/compta/factures/new?from_quote=${quote.id}`)}
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                Convertir en facture
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
