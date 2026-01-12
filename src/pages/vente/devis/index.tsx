/**
 * Devis Page - Module Vente
 *
 * Gestion des devis commerciaux - Connecté à la base de données
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
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  ShoppingCart,
} from 'lucide-react';
import { useQuotes } from '@/hooks/useVente';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Quote } from '@/types/vente';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function DevisPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    status: filterStatus !== 'all' ? filterStatus as Quote['status'] : undefined,
  }), [searchQuery, filterStatus]);

  const { quotes, loading, updateQuoteStatus } = useQuotes(filters);

  const stats = useMemo(() => ({
    total: quotes.length,
    draft: quotes.filter((d) => d.status === 'draft').length,
    sent: quotes.filter((d) => d.status === 'sent').length,
    accepted: quotes.filter((d) => d.status === 'accepted').length,
    revenue: quotes
      .filter((d) => d.status === 'accepted')
      .reduce((sum, d) => sum + d.total_ttc, 0),
  }), [quotes]);

  const conversionRate = stats.sent + stats.accepted > 0
    ? ((stats.accepted / (stats.sent + stats.accepted)) * 100).toFixed(1)
    : '0';

  const getStatusBadge = (status: Quote['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-gray-100">
            <Edit className="h-3 w-3 mr-1" />
            Brouillon
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-blue-600">
            <Send className="h-3 w-3 mr-1" />
            Envoyé
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepté
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Refusé
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-orange-100">
            <Clock className="h-3 w-3 mr-1" />
            Expiré
          </Badge>
        );
    }
  };

  const handleSendQuote = async (quoteId: string) => {
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

  const handleConvertToOrder = (quoteId: string) => {
    // Navigate to order creation with quote data
    navigate(`/app/vente/commandes/new?from_quote=${quoteId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Devis
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos devis commerciaux
          </p>
        </div>
        <Link to="/app/vente/devis/new">
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
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
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
              Taux: {conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">CA Signé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.revenue)}
            </div>
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
                  placeholder="Rechercher par numéro, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
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
          </div>
        </CardContent>
      </Card>

      {/* Devis List */}
      <Card>
        <CardHeader>
          <CardTitle>{quotes.length} devis</CardTitle>
          <CardDescription>Liste de tous vos devis commerciaux</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des devis...
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun devis</h3>
              <p className="text-muted-foreground mb-6">
                Créez votre premier devis pour vos clients
              </p>
              <Link to="/app/vente/devis/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
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
                  <TableHead>Valide jusqu'au</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="font-mono font-semibold">{quote.number}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quote.client_name}</div>
                        <div className="text-xs text-muted-foreground">{quote.client_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{formatCurrency(quote.total_ht)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(quote.total_ttc)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(quote.valid_until, 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(quote.created_at, 'dd MMM yyyy', { locale: fr })}
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
                          <DropdownMenuItem onClick={() => navigate(`/app/vente/devis/${quote.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/app/vente/devis/${quote.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          {quote.status === 'draft' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSendQuote(quote.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Envoyer
                              </DropdownMenuItem>
                            </>
                          )}
                          {quote.status === 'accepted' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleConvertToOrder(quote.id)}>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Convertir en commande
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliquer
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
