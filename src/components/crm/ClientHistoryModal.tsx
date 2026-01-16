/**
 * Modal pour afficher l'historique d'un client (commandes, factures, etc.)
 */

import React from 'react';
import { Package, FileText, Calendar, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EnrichedLead } from '@/types/crm';

interface ClientHistoryModalProps {
  open: boolean;
  onClose: () => void;
  client: EnrichedLead;
  type: 'orders' | 'invoices';
}

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  open,
  onClose,
  client,
  type,
}) => {
  const isOrders = type === 'orders';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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

        <div className="space-y-4 mt-4">
          {/* Message - Fonctionnalité en développement */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {isOrders ? (
                    <Package className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Fonctionnalité en cours de développement
                  </h3>
                  <p className="text-sm text-blue-800">
                    {isOrders
                      ? 'L\'historique des commandes sera bientôt disponible. Cette fonctionnalité permettra de voir toutes les commandes passées par ce client, leur statut, et les détails de chaque commande.'
                      : 'La gestion des factures sera bientôt disponible. Cette fonctionnalité permettra de voir toutes les factures émises pour ce client, leur statut de paiement, et de télécharger les PDF.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu de ce qui sera disponible */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">
              Fonctionnalités à venir :
            </h4>
            <div className="grid gap-2">
              {isOrders ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Liste chronologique des commandes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Badge variant="outline" className="w-fit">Statut</Badge>
                    <span>Suivi du statut (En cours, Livrée, Annulée)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Montant total et détails des articles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>Génération automatique de factures</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Liste de toutes les factures</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Badge variant="outline" className="w-fit">Statut</Badge>
                    <span>Statut de paiement (Payée, En attente, En retard)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Montants, dates d'échéance et historique des paiements</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>Téléchargement des PDF et envoi par email</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Informations client */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-700 mb-3">
                Informations du client
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom:</span>
                  <span className="font-medium">{client.name}</span>
                </div>
                {client.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="font-medium">{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ville:</span>
                    <span className="font-medium">{client.city}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientHistoryModal;
