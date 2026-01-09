/**
 * Composant PreviewDocument
 *
 * Affiche un aperçu en temps réel d'un devis ou d'une facture
 * en utilisant les templates HTML/CSS
 */

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { TEMPLATES, getTemplateById, getDefaultTemplate } from '@/data/invoiceTemplates';
import { renderTemplate } from '@/types/templates';
import { getSignedStorageUrlFromPublicUrl } from './getSignedStorageUrl';
import type { InvoiceTemplateData, TemplateId } from '@/types/templates';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PreviewDocumentProps {
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
  className?: string;
}

export default function PreviewDocument({
  documentType,
  data,
  templateId,
  className = '',
}: PreviewDocumentProps) {
  const { settings, loading } = useCompanySettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (loading || !settings) return;

    let cancelled = false;

    const writeToIframe = (html: string) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // srcDoc est plus fiable que document.write dans certains contextes
      iframe.srcdoc = html;

      // Fallback au cas où srcdoc n'est pas supporté
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    };

    const writeError = (message: string) => {
      const safe = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      writeToIframe(`<!doctype html><html><head><meta charset="utf-8" />
        <style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px}pre{white-space:pre-wrap}</style>
        </head><body><h2>Impossible d'afficher l’aperçu</h2><pre>${safe}</pre></body></html>`);
    };

    (async () => {
      // Sélectionner le template
      const template = templateId
        ? getTemplateById(templateId)
        : getTemplateById(
            documentType === 'FACTURE' ? settings.default_invoice_template : settings.default_quote_template
          ) || getDefaultTemplate();

      const [logoUrl, signatureUrl] = await Promise.all([
        getSignedStorageUrlFromPublicUrl(settings.logo_url, 'logos'),
        getSignedStorageUrlFromPublicUrl(settings.signature_url, 'logos'),
      ]);

      if (cancelled) return;

      // Préparer les données pour le template
      const templateData: InvoiceTemplateData = {
        logo_url: logoUrl,
        signature_url: signatureUrl,
        company_name: settings.company_name,
        company_address: settings.company_address,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        bank_name: settings.bank_name || '',
        bank_iban: settings.bank_iban || '',
        bank_bic: settings.bank_bic || '',

        document_type: documentType,
        document_number: documentType === 'FACTURE' ? 'FAC-2026-XXXX' : 'DEV-2026-XXXX',
        invoice_date: format(
          typeof data.issue_date === 'string' ? new Date(data.issue_date) : data.issue_date,
          'dd/MM/yyyy',
          { locale: fr }
        ),
        due_date: data.due_date
          ? format(typeof data.due_date === 'string' ? new Date(data.due_date) : data.due_date, 'dd/MM/yyyy', {
              locale: fr,
            })
          : undefined,
        expiration_date: data.expiration_date
          ? format(
              typeof data.expiration_date === 'string'
                ? new Date(data.expiration_date)
                : data.expiration_date,
              'dd/MM/yyyy',
              { locale: fr }
            )
          : undefined,

        client_name: data.client_name || 'Client Example',
        client_company: data.client_company,
        client_address: data.client_address,
        client_phone: data.client_phone,

        items: data.items.map((item) => ({
          description: item.description || 'Produit/Service',
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          discount_percent: item.discount_percent,
          total: item.total || 0,
        })),

        subtotal: data.subtotal || 0,
        discount_amount: data.discount_amount,
        tax_rate: data.tax_rate || 0,
        tax_amount: data.tax_amount || 0,
        total: data.total || 0,
        currency: data.currency || 'XOF',

        amount_paid: data.amount_paid,
        balance_due: data.balance_due,

        notes: data.notes,
        terms: data.terms,
      };

      const html = renderTemplate(template, templateData);
      setHtmlContent(html);
      writeToIframe(html);
    })().catch((err) => {
      console.error('PreviewDocument render error:', err);
      writeError(err instanceof Error ? err.message : String(err));
    });

    return () => {
      cancelled = true;
    };
  }, [settings, loading, data, documentType, templateId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Chargement de l'aperçu...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <CardTitle>Aperçu temps réel</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {TEMPLATES.find(
              (t) =>
                t.id ===
                (templateId ||
                  (documentType === 'FACTURE'
                    ? settings?.default_invoice_template
                    : settings?.default_quote_template))
            )?.name || 'Classic'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <iframe
            ref={iframeRef}
            title="Aperçu du document"
            className="w-full min-h-[1000px] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </CardContent>
    </Card>
  );
}
