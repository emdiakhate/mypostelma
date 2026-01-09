/**
 * PDF Generator - Génération de PDFs pour factures/devis
 *
 * Utilise html2pdf.js pour convertir les templates HTML en PDF
 */

import html2pdf from 'html2pdf.js';
import type { Invoice, Quote } from '@/types/compta';
import type { CompanySettings } from '@/types/templates';

interface PDFOptions {
  margin?: number;
  filename?: string;
  image?: { type: string; quality: number };
  html2canvas?: { scale: number };
  jsPDF?: { unit: string; format: string; orientation: string };
}

/**
 * Génère un PDF pour une facture
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  settings: CompanySettings | null
): Promise<void> {
  const html = generateInvoiceHTML(invoice, settings);

  const options: PDFOptions = {
    margin: 10,
    filename: `Facture_${invoice.invoice_number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  await html2pdf().set(options).from(html).save();
}

/**
 * Génère un PDF pour un devis
 */
export async function generateQuotePDF(
  quote: Quote,
  settings: CompanySettings | null
): Promise<void> {
  const html = generateQuoteHTML(quote, settings);

  const options: PDFOptions = {
    margin: 10,
    filename: `Devis_${quote.quote_number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  await html2pdf().set(options).from(html).save();
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'XOF') return `${amount.toLocaleString('fr-FR')} FCFA`;
  if (currency === 'EUR') return `${amount.toLocaleString('fr-FR')} €`;
  if (currency === 'USD') return `$${amount.toLocaleString('en-US')}`;
  return `${amount} ${currency}`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR');
}

function generateInvoiceHTML(invoice: Invoice, settings: CompanySettings | null): string {
  const itemsRows = invoice.items
    ?.map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price, invoice.currency)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.total, invoice.currency)}</td>
    </tr>
  `
    )
    .join('') || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #1f2937;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .logo {
      max-height: 80px;
      max-width: 200px;
    }
    .company {
      text-align: right;
    }
    .company h2 {
      font-size: 20px;
      margin-bottom: 8px;
      color: #2563eb;
    }
    .company p {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 8px;
    }
    .doc-number {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 30px;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .info-block {
      flex: 1;
    }
    .info-block h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .info-block p {
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .total-row.grand-total {
      border-top: 2px solid #2563eb;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
    }
    .notes {
      margin-top: 40px;
      padding: 20px;
      background: #f9fafb;
      border-left: 4px solid #2563eb;
    }
    .notes h4 {
      font-size: 14px;
      margin-bottom: 8px;
      color: #2563eb;
    }
    .notes p {
      font-size: 12px;
      line-height: 1.6;
      color: #4b5563;
    }
    .signature-section {
      margin-top: 40px;
      text-align: right;
    }
    .signature-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .signature {
      max-height: 80px;
      max-width: 200px;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${settings?.logo_url ? `<img src="${settings.logo_url}" class="logo" alt="Logo" crossorigin="anonymous" />` : ''}
    </div>
    <div class="company">
      <h2>${settings?.company_name || 'Mon Entreprise'}</h2>
      ${settings?.company_address ? `<p>${settings.company_address}</p>` : ''}
      ${settings?.company_phone ? `<p>Tél: ${settings.company_phone}</p>` : ''}
      ${settings?.company_email ? `<p>Email: ${settings.company_email}</p>` : ''}
    </div>
  </div>

  <h1 class="title">FACTURE</h1>
  <p class="doc-number">N° ${invoice.invoice_number}</p>

  <div class="info-section">
    <div class="info-block">
      <h3>Client</h3>
      <p><strong>${invoice.client?.name || 'Client inconnu'}</strong></p>
      ${invoice.client?.address ? `<p>${invoice.client.address}</p>` : ''}
      ${invoice.client?.phone ? `<p>Tél: ${invoice.client.phone}</p>` : ''}
      ${invoice.client?.email ? `<p>Email: ${invoice.client.email}</p>` : ''}
    </div>
    <div class="info-block" style="text-align: right;">
      <h3>Dates</h3>
      <p><strong>Date d'émission:</strong> ${formatDate(invoice.issue_date)}</p>
      <p><strong>Date d'échéance:</strong> ${formatDate(invoice.due_date)}</p>
      ${invoice.balance_due > 0 ? `<p style="color: #dc2626; font-weight: 600; margin-top: 8px;">Reste à payer: ${formatCurrency(invoice.balance_due, invoice.currency)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center; width: 80px;">Qté</th>
        <th style="text-align: right; width: 120px;">Prix unit.</th>
        <th style="text-align: right; width: 120px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Sous-total:</span>
      <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
    </div>
    <div class="total-row">
      <span>TVA (${invoice.tax_rate}%):</span>
      <span>${formatCurrency(invoice.tax_amount, invoice.currency)}</span>
    </div>
    <div class="total-row grand-total">
      <span>Total:</span>
      <span>${formatCurrency(invoice.total, invoice.currency)}</span>
    </div>
  </div>

  ${
    invoice.notes || invoice.terms
      ? `
  <div class="notes">
    ${invoice.notes ? `<h4>Notes</h4><p>${invoice.notes}</p>` : ''}
    ${invoice.terms ? `<h4 style="margin-top: ${invoice.notes ? '16px' : '0'};">Conditions</h4><p>${invoice.terms}</p>` : ''}
  </div>
  `
      : ''
  }

  ${
    settings?.signature_url
      ? `
  <div class="signature-section">
    <p class="signature-label">Signature:</p>
    <img src="${settings.signature_url}" class="signature" alt="Signature" crossorigin="anonymous" />
  </div>
  `
      : ''
  }

  <div class="footer">
    <p>Merci pour votre confiance !</p>
    <p>Document généré le ${formatDate(new Date())}</p>
  </div>
</body>
</html>
  `;
}

function generateQuoteHTML(quote: Quote, settings: CompanySettings | null): string {
  const itemsRows = quote.items
    ?.map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price, quote.currency)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.total, quote.currency)}</td>
    </tr>
  `
    )
    .join('') || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #1f2937;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    .logo {
      max-height: 80px;
      max-width: 200px;
    }
    .company {
      text-align: right;
    }
    .company h2 {
      font-size: 20px;
      margin-bottom: 8px;
      color: #10b981;
    }
    .company p {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 8px;
    }
    .doc-number {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 30px;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .info-block {
      flex: 1;
    }
    .info-block h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .info-block p {
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .total-row.grand-total {
      border-top: 2px solid #10b981;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: bold;
      color: #10b981;
    }
    .notes {
      margin-top: 40px;
      padding: 20px;
      background: #f9fafb;
      border-left: 4px solid #10b981;
    }
    .notes h4 {
      font-size: 14px;
      margin-bottom: 8px;
      color: #10b981;
    }
    .notes p {
      font-size: 12px;
      line-height: 1.6;
      color: #4b5563;
    }
    .signature-section {
      margin-top: 40px;
      text-align: right;
    }
    .signature-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .signature {
      max-height: 80px;
      max-width: 200px;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${settings?.logo_url ? `<img src="${settings.logo_url}" class="logo" alt="Logo" crossorigin="anonymous" />` : ''}
    </div>
    <div class="company">
      <h2>${settings?.company_name || 'Mon Entreprise'}</h2>
      ${settings?.company_address ? `<p>${settings.company_address}</p>` : ''}
      ${settings?.company_phone ? `<p>Tél: ${settings.company_phone}</p>` : ''}
      ${settings?.company_email ? `<p>Email: ${settings.company_email}</p>` : ''}
    </div>
  </div>

  <h1 class="title">DEVIS</h1>
  <p class="doc-number">N° ${quote.quote_number}</p>

  <div class="info-section">
    <div class="info-block">
      <h3>Client</h3>
      <p><strong>${quote.client?.name || 'Client inconnu'}</strong></p>
      ${quote.client?.address ? `<p>${quote.client.address}</p>` : ''}
      ${quote.client?.phone ? `<p>Tél: ${quote.client.phone}</p>` : ''}
      ${quote.client?.email ? `<p>Email: ${quote.client.email}</p>` : ''}
    </div>
    <div class="info-block" style="text-align: right;">
      <h3>Dates</h3>
      <p><strong>Date d'émission:</strong> ${formatDate(quote.issue_date)}</p>
      <p><strong>Valable jusqu'au:</strong> ${formatDate(quote.expiration_date)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center; width: 80px;">Qté</th>
        <th style="text-align: right; width: 120px;">Prix unit.</th>
        <th style="text-align: right; width: 120px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Sous-total:</span>
      <span>${formatCurrency(quote.subtotal, quote.currency)}</span>
    </div>
    <div class="total-row">
      <span>TVA (${quote.tax_rate}%):</span>
      <span>${formatCurrency(quote.tax_amount, quote.currency)}</span>
    </div>
    <div class="total-row grand-total">
      <span>Total:</span>
      <span>${formatCurrency(quote.total, quote.currency)}</span>
    </div>
  </div>

  ${
    quote.notes || quote.terms
      ? `
  <div class="notes">
    ${quote.notes ? `<h4>Notes</h4><p>${quote.notes}</p>` : ''}
    ${quote.terms ? `<h4 style="margin-top: ${quote.notes ? '16px' : '0'};">Conditions</h4><p>${quote.terms}</p>` : ''}
  </div>
  `
      : ''
  }

  ${
    settings?.signature_url
      ? `
  <div class="signature-section">
    <p class="signature-label">Signature:</p>
    <img src="${settings.signature_url}" class="signature" alt="Signature" crossorigin="anonymous" />
  </div>
  `
      : ''
  }

  <div class="footer">
    <p>Merci pour votre confiance !</p>
    <p>Devis valable jusqu'au ${formatDate(quote.expiration_date)}</p>
    <p>Document généré le ${formatDate(new Date())}</p>
  </div>
</body>
</html>
  `;
}
