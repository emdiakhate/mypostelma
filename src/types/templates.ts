/**
 * Types pour les templates de factures et devis
 */

export type TemplateType = 'invoice' | 'quote';
export type TemplateId = 'classic' | 'minimal' | 'modern';

export interface InvoiceTemplateData {
  // Entreprise
  logo_url?: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;

  // Document
  document_type: 'FACTURE' | 'DEVIS';
  document_number: string;
  invoice_date: string; // Format: "DD/MM/YYYY"
  due_date?: string; // Pour factures
  expiration_date?: string; // Pour devis

  // Client
  client_name: string;
  client_company?: string;
  client_address?: string;
  client_phone?: string;
  client_email?: string;

  // Lignes
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    total: number;
  }>;

  // Totaux
  subtotal: number;
  discount_amount?: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;

  // Paiements (pour factures)
  amount_paid?: number;
  balance_due?: number;

  // Mentions légales
  notes?: string;
  terms?: string;
}

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  thumbnail: string;
  html: string;
  css: string;
  isDefault?: boolean;
}

export interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  logo_url?: string;
  default_invoice_template: TemplateId;
  default_quote_template: TemplateId;
  created_at: Date;
  updated_at: Date;
}

/**
 * Fonction pour rendre un template avec des données
 */
export const renderTemplate = (template: Template, data: InvoiceTemplateData): string => {
  let html = template.html;

  // Remplacer toutes les variables {{variable}}
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'items') {
      // Traitement spécial pour les items
      const itemsHtml = (value as InvoiceTemplateData['items'])
        .map(
          (item) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unit_price, data.currency)}</td>
          <td>${formatCurrency(item.total, data.currency)}</td>
        </tr>
      `
        )
        .join('');
      html = html.replace('{{items}}', itemsHtml);
    } else if (typeof value === 'string' || typeof value === 'number') {
      // Remplacer les variables simples
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value || ''));
    }
  });

  // Nettoyer les variables non remplacées
  html = html.replace(/{{[^}]+}}/g, '');

  // Injecter le CSS
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${template.css}</style>
</head>
<body>
  ${html}
</body>
</html>
  `;

  return fullHtml;
};

/**
 * Helper pour formater la monnaie
 */
const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'XOF') {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  } else if (currency === 'EUR') {
    return `${amount.toLocaleString('fr-FR')} €`;
  } else if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US')}`;
  }
  return `${amount} ${currency}`;
};

export default {
  renderTemplate,
  formatCurrency,
};
