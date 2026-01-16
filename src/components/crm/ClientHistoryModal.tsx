/**
 * Modal pour afficher l'historique d'un client (commandes, factures)
 * Connecté à Supabase pour récupérer les données réelles
 */

import React, { useEffect, useState } from 'react';
import { Package, FileText, Calendar, DollarSign, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { EnrichedLead } from '@/types/crm';

interface ClientHistoryModalProps {
  open: boolean;
  onClose: () => void;
  client: EnrichedLead;
  type: 'orders' | 'invoices';
}

interface Order {
  id: string;
  number: string;
  status: string;
  payment_status: string;
  total_ttc: number;
  created_at: string;
  client_name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  issue_date: string;
  due_date: string;
  balance_due: number;
}

const getOrderStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'secondary' },
    confirmed: { label: 'Confirmée', variant: 'default' },
    processing: { label: 'En préparation', variant: 'default' },
    shipped: { label: 'Expédiée', variant: 'default' },
    delivered: { label: 'Livrée', variant: 'default' },
    cancelled: { label: 'Annulée', variant: 'destructive' },
  };
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getInvoiceStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Brouillon', variant: 'secondary' },
    sent: { label: 'Envoyée', variant: 'outline' },
    paid: { label: 'Payée', variant: 'default' },
    partial: { label: 'Partielle', variant: 'secondary' },
    overdue: { label: 'En retard', variant: 'destructive' },
    cancelled: { label: 'Annulée', variant: 'destructive' },
  };
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  open,
  onClose,
  client,
  type,
}) => {
  const navigate = useNavigate();
  const isOrders = type === 'orders';
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vente_orders')
        .select('id, number, status, payment_status, total_ttc, created_at, client_name')
        .eq('lead_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compta_invoices')
        .select('id, invoice_number, status, total, issue_date, due_date, balance_due')
        .eq('client_id', client.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (isOrders) {
        loadOrders();
      } else {
        loadInvoices();
      }
    }
  }, [open, isOrders, client.id]);

  const handleViewOrder = (orderId: string) => {
    onClose();
    navigate(`/app/vente/commandes/${orderId}`);
  };

  const handleViewInvoice = (invoiceId: string) => {
    onClose();
    navigate(`/app/compta/factures/${invoiceId}`);
  };

  const handleCreateOrder = () => {
    onClose();
    navigate('/app/orders/new', { state: { client } });
  };

  const handleCreateInvoice = () => {
    onClose();
    navigate('/app/compta/factures/new', { state: { client } });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOrders ? (
              <>
                <Package className="w-5 h-5" />
                Historique des commandes
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Factures
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isOrders
              ? `Toutes les commandes de ${client.name}`
              : `Toutes les factures de ${client.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {isOrders ? (
                  orders.length === 0 ? (
                    <Card className="bg-muted/50">
                      <CardContent className="p-6 text-center">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-4">
                          Aucune commande trouvée pour ce client
                        </p>
                        <Button onClick={handleCreateOrder}>
                          Créer une commande
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleViewOrder(order.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{order.number}</span>
                                {getOrderStatusBadge(order.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {order.total_ttc.toLocaleString()} FCFA
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                ) : (
                  invoices.length === 0 ? (
                    <Card className="bg-muted/50">
                      <CardContent className="p-6 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-4">
                          Aucune facture trouvée pour ce client
                        </p>
                        <Button onClick={handleCreateInvoice}>
                          Créer une facture
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    invoices.map((invoice) => (
                      <Card key={invoice.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleViewInvoice(invoice.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{invoice.invoice_number}</span>
                                {getInvoiceStatusBadge(invoice.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: fr })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {invoice.total.toLocaleString()} FCFA
                                </span>
                                {invoice.balance_due > 0 && (
                                  <span className="text-destructive">
                                    Reste: {invoice.balance_due.toLocaleString()} FCFA
                                  </span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => isOrders ? loadOrders() : loadInvoices()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={isOrders ? handleCreateOrder : handleCreateInvoice}>
            {isOrders ? 'Nouvelle commande' : 'Nouvelle facture'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientHistoryModal;
