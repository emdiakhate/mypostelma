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
  documentNumber?: string;
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
  documentNumber = '',
  data,
  templateId,
  onDownloadPDF,
}: PreviewModalProps) {
  const { settings, loading: settingsLoading } = useCompanySettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  // Préparer les données pour le template
  useEffect(() => {
    if (!iframeRef.current || !open) return;

    // Utiliser des valeurs par défaut si settings n'est pas encore chargé
    const companySettings = settings || {
      company_name: 'Votre entreprise',
      company_address: '',
      company_phone: '',
      company_email: '',
      logo_url: undefined,
      signature_url: undefined,
      bank_name: '',
      bank_iban: '',
      bank_bic: '',
      default_invoice_template: 'classic',
      default_quote_template: 'classic',
    };

    const templateData: InvoiceTemplateData = {
      logo_url: companySettings.logo_url,
      signature_url: companySettings.signature_url,
      company_name: companySettings.company_name || 'Votre entreprise',
      company_address: companySettings.company_address,
      company_phone: companySettings.company_phone,
      company_email: companySettings.company_email,
      bank_name: settings?.bank_name || '',
      bank_iban: settings?.bank_iban || '',
      bank_bic: settings?.bank_bic || '',

      document_type: documentType,
      document_number: documentNumber || 'BROUILLON',
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

      client_name: data.client_name || 'Client',
      client_company: data.client_company,
      client_address: data.client_address,
      client_phone: data.client_phone,

      items: data.items.length > 0 ? data.items.map((item) => ({
        description: item.description || 'Article',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })) : [{
        description: 'Exemple d\'article',
        quantity: 1,
        unit_price: 100,
        total: 100,
      }],

      subtotal: data.subtotal || 0,
      tax_rate: data.tax_rate || 0,
      tax_amount: data.tax_amount || 0,
      total: data.total || 0,
      currency: data.currency || 'EUR',

      amount_paid: data.amount_paid,
      balance_due: data.balance_due,

      notes: data.notes,
      terms: data.terms || 'Le paiement est dû dans 15 jours',
    };

    const selectedTemplateId =
      templateId ||
      (documentType === 'FACTURE'
        ? companySettings.default_invoice_template
        : companySettings.default_quote_template);

    const template = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
    const html = renderTemplate(template, templateData);

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
    }
  }, [data, documentType, documentNumber, settings, templateId, open]);

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
