/**
 * Sélecteur de template avec affichage en grille de miniatures
 *
 * Affiche les templates comme des images miniatures cliquables
 * avec un modal pour voir en grand
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Eye } from 'lucide-react';
import { Template, renderTemplate, InvoiceTemplateData } from '@/types/templates';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface TemplateGridSelectorProps {
  templates: Template[];
  selectedId: string;
  onChange: (templateId: string) => void;
  companyName?: string;
  logoUrl?: string;
}

export default function TemplateGridSelector({
  templates,
  selectedId,
  onChange,
  companyName,
  logoUrl,
}: TemplateGridSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Données de démonstration pour les miniatures
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

    client_name: 'Client Example',
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

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {templates.map((template) => {
          const html = renderTemplate(template, demoData);
          const isSelected = template.id === selectedId;

          return (
            <div
              key={template.id}
              className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => onChange(template.id)}
            >
              {/* Miniature du template */}
              <div className="relative bg-white aspect-[1/1.414] overflow-hidden">
                <iframe
                  srcDoc={html}
                  title={template.name}
                  className="w-full h-full border-0 pointer-events-none scale-[0.25] origin-top-left"
                  style={{ width: '400%', height: '400%' }}
                  sandbox="allow-same-origin"
                />

                {/* Overlay au survol */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                {/* Bouton loupe pour preview */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                  }}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="h-4 w-4 text-gray-700" />
                </button>
              </div>

              {/* Nom et badge */}
              <div className="p-3 bg-white border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{template.name}</p>
                    {template.isDefault && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Recommandé
                      </Badge>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de prévisualisation en grand */}
      {previewTemplate && (
        <Dialog open={true} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>Aperçu: {previewTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto border rounded-lg">
              <iframe
                srcDoc={renderTemplate(previewTemplate, demoData)}
                title={`Aperçu ${previewTemplate.name}`}
                className="w-full h-[750px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
