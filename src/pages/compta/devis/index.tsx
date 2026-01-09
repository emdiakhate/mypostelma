/**
 * Compta - Liste des Devis
 *
 * Tableau de tous les devis avec filtres et actions
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Receipt,
  Send,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
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

export default function DevisListPage() {
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

  const { quotes, loading, updateQuoteStatus, deleteQuote } = useQuotes(filters);

  // Dialog de confirmation suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  // Actions
  const handleView = (quoteId: string) => {
    // Pour l'instant, rediriger vers l'édition car pas de page de vue détaillée
    navigate(`/app/compta/devis/${quoteId}/edit`);
  };

  const handleEdit = (quoteId: string) => {
    navigate(`/app/compta/devis/${quoteId}/edit`);
  };

  const handleConvertToInvoice = (quoteId: string) => {
    navigate(`/app/compta/factures/new?from_quote=${quoteId}`);
  };

  const handleDownloadPDF = (quote: Quote) => {
    // TODO: Implémenter la génération et téléchargement PDF
    toast({
      title: 'Fonctionnalité à venir',
      description: 'Le téléchargement PDF sera disponible prochainement',
    });
  };

  const handleUpdateStatus = async (quoteId: string, status: QuoteStatus) => {
    try {
      await updateQuoteStatus(quoteId, status);
      toast({
        title: 'Statut mis à jour',
        description: `Le devis est maintenant "${getQuoteStatusLabel(status)}"`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour le statut",
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (quote: Quote) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!quoteToDelete) return;

    try {
      await deleteQuote(quoteToDelete.id);
      toast({
        title: 'Devis supprimé',
        description: `Le devis ${quoteToDelete.quote_number} a été supprimé`,
      });
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le devis',
        variant: 'destructive',
      });
    }
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
            Gérez vos devis et propositions commerciales
          </p>
        </div>
        <Link to="/app/compta/devis/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un devis ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtre statut */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as QuoteStatus | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>

            {/* Bouton reset */}
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

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>
            {quotes.length} devis
            {statusFilter !== 'all' && ` - ${getQuoteStatusLabel(statusFilter)}`}
          </CardTitle>
          <CardDescription>
            Liste de tous vos devis avec leur statut actuel
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
                  : 'Commencez par créer votre premier devis'}
              </p>
              <Link to="/app/compta/devis/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un devis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date émission</TableHead>
                    <TableHead>Date expiration</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {quote.quote_number}
                      </TableCell>
                      <TableCell>
                        {quote.client?.name || 'Client inconnu'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(quote.issue_date, 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(quote.expiration_date, 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(quote.total, quote.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getQuoteStatusColor(quote.status)}>
                          {getQuoteStatusLabel(quote.status)}
                        </Badge>
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
                            <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Actions de statut */}
                            {quote.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(quote.id, 'sent')}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Marquer comme envoyé
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'sent' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(quote.id, 'accepted')}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Marquer accepté
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(quote.id, 'rejected')}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Marquer refusé
                                </DropdownMenuItem>
                              </>
                            )}
                            {quote.status === 'accepted' && (
                              <DropdownMenuItem
                                onClick={() => handleConvertToInvoice(quote.id)}
                              >
                                <Receipt className="mr-2 h-4 w-4 text-blue-600" />
                                Transformer en facture
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => confirmDelete(quote)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog confirmation suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le devis{' '}
              <strong>{quoteToDelete?.quote_number}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
