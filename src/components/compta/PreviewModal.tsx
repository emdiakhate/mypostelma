/**
 * Modal d'aperçu de document
 *
 * Affiche un aperçu en plein écran d'un devis ou d'une facture
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X, Printer } from 'lucide-react';
import PreviewDocument from './PreviewDocument';
import type { TemplateId } from '@/types/templates';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'FACTURE' | 'DEVIS';
  data: {
    client_name?: string;
    client_company?: string;
    client_address?: string;
    client_phone?: string;
    issue_date: Date | string;
    due_date?: Date | string;
    expiration_date?: Date | string;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      discount_percent?: number;
      total: number;
    }>;
    subtotal: number;
    discount_amount?: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    currency: string;
    amount_paid?: number;
    balance_due?: number;
    notes?: string;
    terms?: string;
  };
  templateId?: TemplateId;
  onDownloadPDF?: () => void;
}

export default function PreviewModal({
  open,
  onOpenChange,
  documentType,
  data,
  templateId,
  onDownloadPDF,
}: PreviewModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Aperçu du {documentType.toLowerCase()}</DialogTitle>
              <Badge variant="secondary">Temps réel</Badge>
            </div>
            <div className="flex items-center gap-2">
              {onDownloadPDF && (
                <Button variant="outline" size="sm" onClick={onDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <PreviewDocument
            documentType={documentType}
            data={data}
            templateId={templateId}
            className="border-0 shadow-lg mx-auto max-w-4xl bg-white"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
