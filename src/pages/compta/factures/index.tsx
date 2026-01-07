/**
 * Compta - Liste des Factures
 *
 * Tableau de toutes les factures avec suivi des paiements
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Receipt,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Download,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useInvoices, usePayments } from '@/hooks/useCompta';
import {
  formatCurrency,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
  type InvoiceStatus,
  type Invoice,
} from '@/types/compta';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import PaymentForm from './PaymentForm';

export default function FacturesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      overdue_only: overdueOnly || undefined,
    }),
    [search, statusFilter, overdueOnly]
  );

  const { invoices, loading, updateInvoiceStatus } = useInvoices(filters);

  // Dialog de confirmation suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Dialog ajout paiement
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState<Invoice | null>(null);

  // Actions
  const handleView = (invoiceId: string) => {
    navigate(`/app/compta/factures/${invoiceId}`);
  };

  const handleEdit = (invoiceId: string) => {
    navigate(`/app/compta/factures/${invoiceId}/edit`);
  };

  const handleAddPayment = (invoice: Invoice) => {
    setInvoiceForPayment(invoice);
    setPaymentDialogOpen(true);
  };

  const handleUpdateStatus = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      await updateInvoiceStatus(invoiceId, status);
      toast({
        title: 'Statut mis à jour',
        description: `La facture est maintenant "${getInvoiceStatusLabel(status)}"`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    // Pour l'instant, afficher un message - deleteInvoice sera ajouté plus tard
    toast({
      title: 'Fonctionnalité à venir',
      description: 'La suppression de facture sera disponible prochainement',
    });
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="h-8 w-8" />
            Factures
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos factures et suivez les paiements
          </p>
        </div>
        <Link to="/app/compta/factures/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une facture ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtre statut */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyée</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="partial">Paiement partiel</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>

            {/* Checkbox factures en retard */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="overdue"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="overdue" className="text-sm cursor-pointer">
                Uniquement les retards
              </label>
            </div>

            {/* Bouton reset */}
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setOverdueOnly(false);
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
            {invoices.length} facture{invoices.length > 1 ? 's' : ''}
            {statusFilter !== 'all' && ` - ${getInvoiceStatusLabel(statusFilter)}`}
          </CardTitle>
          <CardDescription>
            Liste de toutes vos factures avec suivi des paiements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des factures...
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune facture trouvée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter !== 'all' || overdueOnly
                  ? 'Aucune facture ne correspond à vos critères'
                  : 'Commencez par créer votre première facture'}
              </p>
              <Link to="/app/compta/factures/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une facture
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
                    <TableHead>Date échéance</TableHead>
                    <TableHead>Montant total</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Reste dû</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const isOverdue =
                      invoice.status !== 'paid' &&
                      invoice.status !== 'cancelled' &&
                      new Date(invoice.due_date) < new Date();

                    return (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            {invoice.invoice_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.client?.name || 'Client inconnu'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(invoice.issue_date, 'dd/MM/yyyy', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                            <Calendar className="h-3 w-3" />
                            {format(invoice.due_date, 'dd/MM/yyyy', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(invoice.amount_paid, invoice.currency)}
                        </TableCell>
                        <TableCell className={invoice.balance_due > 0 ? 'text-orange-600 font-semibold' : ''}>
                          {formatCurrency(invoice.balance_due, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getInvoiceStatusColor(invoice.status)}>
                            {getInvoiceStatusLabel(invoice.status)}
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
                              <DropdownMenuItem onClick={() => handleView(invoice.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(invoice.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              {/* Actions de paiement */}
                              {invoice.balance_due > 0 && (
                                <DropdownMenuItem onClick={() => handleAddPayment(invoice)}>
                                  <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                                  Ajouter un paiement
                                </DropdownMenuItem>
                              )}

                              {/* Actions de statut */}
                              {invoice.status === 'draft' && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(invoice.id, 'sent')}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Marquer comme envoyée
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => confirmDelete(invoice)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              Êtes-vous sûr de vouloir supprimer la facture{' '}
              <strong>{invoiceToDelete?.invoice_number}</strong> ?
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

      {/* Dialog ajout paiement */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement pour la facture {invoiceForPayment?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {invoiceForPayment && (
            <PaymentForm
              invoice={invoiceForPayment}
              onSuccess={() => {
                setPaymentDialogOpen(false);
                setInvoiceForPayment(null);
              }}
              onCancel={() => {
                setPaymentDialogOpen(false);
                setInvoiceForPayment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
