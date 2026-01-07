/**
 * Templates de factures et devis
 *
 * 3 templates prêts à l'emploi: Classic, Minimal, Modern
 */

import { Template } from '@/types/templates';

export const TEMPLATES: Template[] = [
  // ============================================================================
  // TEMPLATE 1: CLASSIQUE (le plus utilisé)
  // ============================================================================
  {
    id: 'classic',
    name: 'Classique',
    description: 'Template professionnel et polyvalent, parfait pour toutes les entreprises',
    thumbnail: '/templates/classic-thumb.png',
    isDefault: true,
    html: `
<div class="invoice">
  <header>
    <div class="logo-container">
      {{#if logo_url}}
      <img src="{{logo_url}}" class="logo" alt="Logo" />
      {{/if}}
    </div>
    <div class="company">
      <h2>{{company_name}}</h2>
      <p>{{company_address}}</p>
      <p>Tél: {{company_phone}}</p>
      <p>Email: {{company_email}}</p>
    </div>
  </header>

  <div class="document-info">
    <h1 class="document-title">{{document_type}}</h1>
    <div class="document-meta">
      <p><strong>N° {{document_number}}</strong></p>
      <p>Date: {{invoice_date}}</p>
      {{#if due_date}}
      <p>Échéance: {{due_date}}</p>
      {{/if}}
      {{#if expiration_date}}
      <p>Valable jusqu'au: {{expiration_date}}</p>
      {{/if}}
    </div>
  </div>

  <section class="client">
    <h3>Facturé à :</h3>
    <p class="client-name">{{client_name}}</p>
    {{#if client_company}}
    <p>{{client_company}}</p>
    {{/if}}
    {{#if client_address}}
    <p>{{client_address}}</p>
    {{/if}}
    {{#if client_phone}}
    <p>Tél: {{client_phone}}</p>
    {{/if}}
  </section>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qté</th>
        <th>Prix unitaire</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Sous-total:</span>
      <span>{{subtotal}}</span>
    </div>
    {{#if discount_amount}}
    <div class="totals-row discount">
      <span>Remise:</span>
      <span>-{{discount_amount}}</span>
    </div>
    {{/if}}
    <div class="totals-row">
      <span>TVA ({{tax_rate}}%):</span>
      <span>{{tax_amount}}</span>
    </div>
    <div class="totals-row total">
      <span><strong>Total:</strong></span>
      <span><strong>{{total}}</strong></span>
    </div>
    {{#if balance_due}}
    <div class="totals-row balance-due">
      <span><strong>Reste à payer:</strong></span>
      <span><strong>{{balance_due}}</strong></span>
    </div>
    {{/if}}
  </div>

  {{#if notes}}
  <div class="notes">
    <h4>Notes:</h4>
    <p>{{notes}}</p>
  </div>
  {{/if}}

  {{#if terms}}
  <div class="terms">
    <h4>Conditions de paiement:</h4>
    <p>{{terms}}</p>
  </div>
  {{/if}}

  <footer>
    <p>{{company_name}} - Merci de votre confiance</p>
  </footer>
</div>
    `,
    css: `
body {
  font-family: Arial, Helvetica, sans-serif;
  color: #333;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

.invoice {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 3px solid #2563eb;
}

.logo-container {
  flex: 0 0 auto;
}

.logo {
  max-height: 80px;
  max-width: 200px;
  object-fit: contain;
}

.company {
  text-align: right;
  flex: 1;
}

.company h2 {
  margin: 0 0 10px 0;
  color: #2563eb;
  font-size: 24px;
}

.company p {
  margin: 2px 0;
  font-size: 14px;
  color: #666;
}

.document-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.document-title {
  font-size: 32px;
  color: #2563eb;
  margin: 0;
}

.document-meta p {
  margin: 4px 0;
  font-size: 14px;
}

.client {
  background: #f8f9fa;
  padding: 20px;
  margin-bottom: 30px;
  border-left: 4px solid #2563eb;
}

.client h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  text-transform: uppercase;
  color: #666;
}

.client-name {
  font-weight: bold;
  font-size: 18px;
  color: #333;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.items-table thead {
  background: #2563eb;
  color: white;
}

.items-table th,
.items-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.items-table th {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 12px;
}

.items-table tbody tr:hover {
  background: #f8f9fa;
}

.items-table td:nth-child(2),
.items-table td:nth-child(3),
.items-table td:nth-child(4) {
  text-align: right;
}

.totals {
  margin-left: auto;
  max-width: 300px;
  margin-bottom: 30px;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.totals-row.discount {
  color: #10b981;
}

.totals-row.total {
  font-size: 20px;
  border-top: 2px solid #333;
  border-bottom: 2px solid #333;
  margin-top: 10px;
  padding-top: 15px;
  padding-bottom: 15px;
}

.totals-row.balance-due {
  color: #ef4444;
  font-size: 18px;
  background: #fef2f2;
  padding: 10px;
  margin-top: 10px;
}

.notes,
.terms {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-left: 4px solid #6b7280;
}

.notes h4,
.terms h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  text-transform: uppercase;
  color: #666;
}

.notes p,
.terms p {
  margin: 0;
  font-size: 13px;
  color: #555;
  white-space: pre-line;
}

footer {
  text-align: center;
  padding-top: 20px;
  margin-top: 40px;
  border-top: 1px solid #ddd;
  color: #999;
  font-size: 12px;
}

@media print {
  body {
    background: white;
    padding: 0;
  }
  .invoice {
    box-shadow: none;
    padding: 20px;
  }
}
    `,
  },

  // ============================================================================
  // TEMPLATE 2: MINIMALISTE
  // ============================================================================
  {
    id: 'minimal',
    name: 'Minimaliste',
    description: 'Design épuré et moderne, parfait pour les startups et agences créatives',
    thumbnail: '/templates/minimal-thumb.png',
    html: `
<div class="invoice">
  {{#if logo_url}}
  <div class="logo-container">
    <img src="{{logo_url}}" class="logo" alt="Logo" />
  </div>
  {{/if}}

  <h1 class="title">{{document_type}}</h1>

  <div class="meta">
    <div class="meta-row">
      <span class="label">Numéro:</span>
      <span class="value">{{document_number}}</span>
    </div>
    <div class="meta-row">
      <span class="label">Date:</span>
      <span class="value">{{invoice_date}}</span>
    </div>
    {{#if due_date}}
    <div class="meta-row">
      <span class="label">Échéance:</span>
      <span class="value">{{due_date}}</span>
    </div>
    {{/if}}
  </div>

  <div class="parties">
    <div class="party">
      <p class="party-label">De:</p>
      <p class="party-name">{{company_name}}</p>
      <p>{{company_phone}}</p>
      <p>{{company_email}}</p>
    </div>
    <div class="party">
      <p class="party-label">Pour:</p>
      <p class="party-name">{{client_name}}</p>
      {{#if client_company}}
      <p>{{client_company}}</p>
      {{/if}}
      {{#if client_phone}}
      <p>{{client_phone}}</p>
      {{/if}}
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qté</th>
        <th>Prix</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-line">
      <span>Sous-total</span>
      <span>{{subtotal}}</span>
    </div>
    <div class="summary-line">
      <span>TVA</span>
      <span>{{tax_amount}}</span>
    </div>
    <div class="summary-total">
      <span>Total à payer</span>
      <span>{{total}}</span>
    </div>
  </div>

  {{#if notes}}
  <div class="notes">{{notes}}</div>
  {{/if}}
</div>
    `,
    css: `
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.5;
  margin: 0;
  padding: 40px;
  background: white;
}

.invoice {
  max-width: 700px;
  margin: 0 auto;
}

.logo-container {
  margin-bottom: 40px;
}

.logo {
  max-height: 60px;
  max-width: 180px;
}

.title {
  font-size: 48px;
  font-weight: 300;
  letter-spacing: -2px;
  margin: 0 0 30px 0;
  color: #000;
}

.meta {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.meta-row {
  display: flex;
  margin-bottom: 8px;
}

.label {
  font-weight: 500;
  width: 100px;
  color: #666;
}

.value {
  color: #000;
}

.parties {
  display: flex;
  gap: 60px;
  margin-bottom: 50px;
}

.party {
  flex: 1;
}

.party-label {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 1px;
  color: #999;
  margin: 0 0 8px 0;
}

.party-name {
  font-weight: 600;
  font-size: 16px;
  margin: 0 0 4px 0;
  color: #000;
}

.party p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 40px;
}

.items thead th {
  text-align: left;
  padding: 12px 8px;
  border-bottom: 2px solid #000;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.items tbody td {
  padding: 12px 8px;
  border-bottom: 1px solid #e0e0e0;
}

.items td:nth-child(2),
.items td:nth-child(3),
.items td:nth-child(4),
.items th:nth-child(2),
.items th:nth-child(3),
.items th:nth-child(4) {
  text-align: right;
}

.summary {
  max-width: 300px;
  margin-left: auto;
  margin-bottom: 40px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  margin-top: 8px;
  border-top: 2px solid #000;
  font-size: 20px;
  font-weight: 600;
  color: #000;
}

.notes {
  padding: 20px;
  background: #f9f9f9;
  font-size: 13px;
  color: #666;
  white-space: pre-line;
}

@media print {
  body {
    padding: 20px;
  }
}
    `,
  },

  // ============================================================================
  // TEMPLATE 3: MODERNE / COLORÉ
  // ============================================================================
  {
    id: 'modern',
    name: 'Moderne',
    description: 'Design vibrant et coloré, idéal pour se démarquer',
    thumbnail: '/templates/modern-thumb.png',
    html: `
<div class="invoice">
  <div class="header">
    <div class="header-content">
      {{#if logo_url}}
      <img src="{{logo_url}}" class="logo" alt="Logo" />
      {{/if}}
      <h1 class="doc-title">{{document_type}}</h1>
    </div>
    <div class="header-stripe"></div>
  </div>

  <div class="info-grid">
    <div class="info-box company-box">
      <h3>Émetteur</h3>
      <p class="big">{{company_name}}</p>
      <p>{{company_address}}</p>
      <p>{{company_phone}}</p>
      <p>{{company_email}}</p>
    </div>

    <div class="info-box client-box">
      <h3>Client</h3>
      <p class="big">{{client_name}}</p>
      {{#if client_company}}
      <p>{{client_company}}</p>
      {{/if}}
      {{#if client_address}}
      <p>{{client_address}}</p>
      {{/if}}
      {{#if client_phone}}
      <p>{{client_phone}}</p>
      {{/if}}
    </div>

    <div class="info-box meta-box">
      <h3>Détails</h3>
      <p><strong>N° {{document_number}}</strong></p>
      <p>Date: {{invoice_date}}</p>
      {{#if due_date}}
      <p>Échéance: {{due_date}}</p>
      {{/if}}
      {{#if expiration_date}}
      <p>Expire le: {{expiration_date}}</p>
      {{/if}}
    </div>
  </div>

  <table class="modern-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qté</th>
        <th>P.U.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-box">
      <div class="total-line">
        <span>Sous-total</span>
        <span>{{subtotal}}</span>
      </div>
      {{#if discount_amount}}
      <div class="total-line discount">
        <span>Remise</span>
        <span>-{{discount_amount}}</span>
      </div>
      {{/if}}
      <div class="total-line">
        <span>TVA ({{tax_rate}}%)</span>
        <span>{{tax_amount}}</span>
      </div>
      <div class="total-line grand-total">
        <span>TOTAL</span>
        <span>{{total}}</span>
      </div>
      {{#if balance_due}}
      <div class="total-line due">
        <span>Reste à payer</span>
        <span>{{balance_due}}</span>
      </div>
      {{/if}}
    </div>
  </div>

  {{#if notes}}
  <div class="note-box">
    <strong>Notes:</strong>
    <p>{{notes}}</p>
  </div>
  {{/if}}

  {{#if terms}}
  <div class="terms-box">
    <strong>Conditions:</strong>
    <p>{{terms}}</p>
  </div>
  {{/if}}

  <div class="footer">
    <p>Merci de votre confiance !</p>
    <p>{{company_name}}</p>
  </div>
</div>
    `,
    css: `
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2d3748;
  margin: 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.invoice {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  max-height: 60px;
  max-width: 150px;
  filter: brightness(0) invert(1);
}

.doc-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 2px;
}

.header-stripe {
  height: 8px;
  background: rgba(255,255,255,0.3);
  margin-top: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  padding: 30px;
}

.info-box {
  padding: 20px;
  border-radius: 8px;
  background: #f7fafc;
}

.info-box h3 {
  margin: 0 0 12px 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #667eea;
  font-weight: 600;
}

.info-box p {
  margin: 4px 0;
  font-size: 14px;
  color: #4a5568;
}

.info-box p.big {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.modern-table {
  width: calc(100% - 60px);
  margin: 0 30px 30px 30px;
  border-collapse: collapse;
}

.modern-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modern-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.modern-table td {
  padding: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.modern-table tbody tr:hover {
  background: #f7fafc;
}

.modern-table td:nth-child(2),
.modern-table td:nth-child(3),
.modern-table td:nth-child(4),
.modern-table th:nth-child(2),
.modern-table th:nth-child(3),
.modern-table th:nth-child(4) {
  text-align: right;
}

.total-section {
  padding: 0 30px 30px 30px;
}

.total-box {
  max-width: 350px;
  margin-left: auto;
  background: #f7fafc;
  padding: 20px;
  border-radius: 8px;
}

.total-line {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 15px;
  color: #4a5568;
}

.total-line.discount {
  color: #48bb78;
  font-weight: 600;
}

.total-line.grand-total {
  margin-top: 10px;
  padding-top: 15px;
  border-top: 3px solid #667eea;
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.total-line.due {
  margin-top: 10px;
  padding: 12px;
  background: #fed7d7;
  color: #c53030;
  font-weight: 600;
  border-radius: 6px;
}

.note-box,
.terms-box {
  margin: 0 30px 20px 30px;
  padding: 20px;
  background: #edf2f7;
  border-left: 4px solid #667eea;
  border-radius: 4px;
}

.note-box strong,
.terms-box strong {
  display: block;
  margin-bottom: 8px;
  color: #667eea;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.note-box p,
.terms-box p {
  margin: 0;
  font-size: 14px;
  color: #4a5568;
  white-space: pre-line;
}

.footer {
  background: #2d3748;
  color: white;
  text-align: center;
  padding: 25px;
  font-size: 14px;
}

.footer p {
  margin: 5px 0;
}

@media print {
  body {
    background: white;
    padding: 0;
  }
  .invoice {
    box-shadow: none;
    border-radius: 0;
  }
}
    `,
  },
];

/**
 * Récupérer un template par son ID
 */
export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find((t) => t.id === id);
};

/**
 * Récupérer le template par défaut
 */
export const getDefaultTemplate = (): Template => {
  return TEMPLATES.find((t) => t.isDefault) || TEMPLATES[0];
};
