/**
 * Composant d'aperçu de template
 *
 * Affiche une miniature du template avec un bouton pour voir en détail
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { Template, renderTemplate, InvoiceTemplateData } from '@/types/templates';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TemplatePreviewProps {
  template: Template;
  companyName?: string;
  logoUrl?: string;
}

export default function TemplatePreview({ template, companyName, logoUrl }: TemplatePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  // Données de démonstration pour l'aperçu
  const demoData: InvoiceTemplateData = {
    logo_url: logoUrl,
    company_name: companyName || 'Mon Entreprise SARL',
    company_address: 'Dakar, Sénégal',
    company_phone: '+221 XX XXX XX XX',
    company_email: 'contact@entreprise.com',

    document_type: 'FACTURE',
    document_number: 'FAC-2026-0001',
    invoice_date: format(new Date(), 'dd/MM/yyyy', { locale: fr }),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy', { locale: fr }),

    client_name: 'Client Example SARL',
    client_company: 'Entreprise Cliente',
    client_address: 'Adresse du client',
    client_phone: '+221 XX XXX XX XX',

    items: [
      {
        description: 'Produit ou Service 1',
        quantity: 2,
        unit_price: 50000,
        total: 100000,
      },
      {
        description: 'Produit ou Service 2',
        quantity: 1,
        unit_price: 75000,
        total: 75000,
      },
    ],

    subtotal: 175000,
    tax_rate: 18,
    tax_amount: 31500,
    total: 206500,
    currency: 'XOF',

    notes: 'Merci de votre confiance',
    terms: 'Paiement à 30 jours',
  };

  const html = renderTemplate(template, demoData);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPreviewOpen(true)}
        className="w-full mt-2"
      >
        <Eye className="mr-2 h-4 w-4" />
        Prévisualiser
      </Button>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Aperçu: {template.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg">
            <iframe
              srcDoc={html}
              title={`Aperçu ${template.name}`}
              className="w-full h-[600px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
