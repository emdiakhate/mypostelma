/**
 * Modal d'aperçu de document
 *
 * Affiche un aperçu en plein écran d'un devis ou d'une facture
 */

import { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X, Printer } from 'lucide-react';
import { renderTemplate } from '@/types/templates';
import { TEMPLATES } from '@/data/invoiceTemplates';
import type { TemplateId, InvoiceTemplateData } from '@/types/templates';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const { settings } = useCompanySettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Préparer les données pour le template
  useEffect(() => {
    if (!iframeRef.current || !settings) return;

    const templateData: InvoiceTemplateData = {
      logo_url: settings.logo_url,
      company_name: settings.company_name,
      company_address: settings.company_address,
      company_phone: settings.company_phone,
      company_email: settings.company_email,

      document_type: documentType,
      document_number: '',
      invoice_date:
        typeof data.issue_date === 'string'
          ? data.issue_date
          : format(data.issue_date, 'dd/MM/yyyy', { locale: fr }),
      due_date:
        data.due_date
          ? typeof data.due_date === 'string'
            ? data.due_date
            : format(data.due_date, 'dd/MM/yyyy', { locale: fr })
          : undefined,
      expiration_date:
        data.expiration_date
          ? typeof data.expiration_date === 'string'
            ? data.expiration_date
            : format(data.expiration_date, 'dd/MM/yyyy', { locale: fr })
          : undefined,

      client_name: data.client_name || '',
      client_company: data.client_company,
      client_address: data.client_address,
      client_phone: data.client_phone,

      items: data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })),

      subtotal: data.subtotal,
      tax_rate: data.tax_rate,
      tax_amount: data.tax_amount,
      total: data.total,
      currency: data.currency,

      amount_paid: data.amount_paid,
      balance_due: data.balance_due,

      notes: data.notes,
      terms: data.terms,
    };

    const selectedTemplateId =
      templateId ||
      (documentType === 'FACTURE'
        ? settings.default_invoice_template
        : settings.default_quote_template);

    const template = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
    const html = renderTemplate(template, templateData);

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
    }
  }, [data, documentType, settings, templateId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-4 pb-3 border-b flex-shrink-0">
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

        <div className="flex-1 p-4 bg-gray-100 overflow-hidden flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
            <iframe
              ref={iframeRef}
              title="Aperçu du document"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
