/**
 * Types pour les templates de factures et devis
 */

export type TemplateType = 'invoice' | 'quote';
export type TemplateId = 'classic' | 'minimal' | 'modern' | 'wave-blue' | 'stripe-minimal';

export interface InvoiceTemplateData {
  // Entreprise
  logo_url?: string;
  signature_url?: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  
  // Coordonnées bancaires
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;

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
  signature_url?: string;
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
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

  // 1. Gérer les conditionnels {{#if variable}}...{{/if}}
  html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
    const value = (data as any)[varName];
    return value ? content : '';
  });

  // 2. Remplacer les items (tableau)
  if (data.items && data.items.length > 0) {
    const itemsHtml = data.items
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
  }

  // 3. Remplacer toutes les variables simples {{variable}}
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'items' && (typeof value === 'string' || typeof value === 'number')) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value || ''));
    }
  });

  // 4. Formater les montants avec devise
  html = html.replace(/{{subtotal}}/g, formatCurrency(data.subtotal, data.currency));
  html = html.replace(/{{tax_amount}}/g, formatCurrency(data.tax_amount, data.currency));
  html = html.replace(/{{total}}/g, formatCurrency(data.total, data.currency));
  if (data.discount_amount) {
    html = html.replace(/{{discount_amount}}/g, formatCurrency(data.discount_amount, data.currency));
  }
  if (data.balance_due) {
    html = html.replace(/{{balance_due}}/g, formatCurrency(data.balance_due, data.currency));
  }

  // 5. Nettoyer les variables non remplacées
  html = html.replace(/{{[^}]+}}/g, '');

  // 6. Injecter le CSS
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
