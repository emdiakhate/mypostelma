/**
 * Templates de factures et devis
 *
 * 5 templates professionnels basés sur des designs modernes
 */

import { Template, TemplateId } from '@/types/templates';

export const TEMPLATES: Template[] = [
  // ============================================================================
  // TEMPLATE 1: BLUE STRIPE (Bande bleue élégante)
  // ============================================================================
  {
    id: 'classic',
    name: 'Blue Stripe',
    description: 'Design professionnel avec bandes bleues élégantes',
    thumbnail: '/templates/blue-stripe.png',
    isDefault: true,
    html: `
<div class="invoice">
  <div class="left-stripe"></div>
  
  <div class="content">
    <header>
      <div class="company-info">
        <h2 class="company-name">{{company_name}}</h2>
        <p>{{company_address}}</p>
        <p>{{company_phone}}</p>
      </div>
    </header>

    <div class="info-grid">
      <div class="bill-to">
        <h4>FACTURÉ À</h4>
        <p class="name">{{client_name}}</p>
        <p>{{client_address}}</p>
      </div>
      <div class="ship-to">
        <h4>ENVOYÉ À</h4>
        <p class="name">{{client_name}}</p>
        <p>{{client_address}}</p>
      </div>
      <div class="doc-info">
        <div class="info-row">
          <span class="label">{{document_type}} N°</span>
          <span class="value">{{document_number}}</span>
        </div>
        <div class="info-row">
          <span class="label">DATE</span>
          <span class="value">{{invoice_date}}</span>
        </div>
        <div class="info-row">
          <span class="label">ÉCHÉANCE</span>
          <span class="value">{{due_date}}</span>
        </div>
      </div>
    </div>

    <div class="total-highlight">
      <span class="total-label">Total de la facture</span>
      <span class="total-value">{{total}}</span>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>QTÉ</th>
          <th>DÉSIGNATION</th>
          <th>PRIX UNIT. HT</th>
          <th>MONTANT HT</th>
        </tr>
      </thead>
      <tbody>
        {{items}}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Total HT</span>
        <span>{{subtotal}}</span>
      </div>
      <div class="summary-row">
        <span>TVA {{tax_rate}}%</span>
        <span>{{tax_amount}}</span>
      </div>
    </div>

    {{#if signature_url}}
    <div class="signature">
      <img src="{{signature_url}}" alt="Signature" />
    </div>
    {{/if}}

    <footer>
      <div class="conditions">
        <h4>CONDITIONS ET MODALITÉS DE PAIEMENT</h4>
        <p>{{terms}}</p>
        <p>{{bank_name}}</p>
        <p>IBAN: {{bank_iban}}</p>
        <p>SWIFT/BIC: {{bank_bic}}</p>
      </div>
    </footer>
  </div>
  
  <div class="bottom-stripe"></div>
</div>
    `,
    css: `
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  background: white;
}

.invoice {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

.left-stripe {
  position: absolute;
  left: 0;
  top: 0;
  width: 8px;
  height: 100%;
  background: #4A90D9;
}

.bottom-stripe {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: #4A90D9;
}

.content {
  padding: 40px 40px 60px 50px;
}

header {
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

.company-name {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: #333;
}

.company-info p {
  margin: 2px 0;
  font-size: 13px;
  color: #666;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #E8F0F8;
}

.bill-to h4,
.ship-to h4 {
  font-size: 11px;
  font-weight: bold;
  color: #666;
  margin: 0 0 8px 0;
}

.bill-to .name,
.ship-to .name {
  font-weight: bold;
  margin: 0 0 5px 0;
}

.bill-to p,
.ship-to p {
  margin: 2px 0;
  font-size: 13px;
}

.doc-info {
  text-align: right;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.info-row .label {
  font-weight: bold;
  font-size: 12px;
  color: #666;
}

.info-row .value {
  font-size: 13px;
}

.total-highlight {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
}

.total-label {
  font-size: 28px;
  font-weight: 300;
  color: #333;
}

.total-value {
  font-size: 32px;
  font-weight: bold;
  color: #4A90D9;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.items-table thead tr {
  border-bottom: 1px solid #ddd;
}

.items-table th {
  text-align: left;
  padding: 10px 8px;
  font-size: 11px;
  font-weight: bold;
  color: #666;
}

.items-table th:nth-child(3),
.items-table th:nth-child(4) {
  text-align: right;
}

.items-table td {
  padding: 12px 8px;
  font-size: 14px;
  border-bottom: 1px solid #eee;
}

.items-table td:first-child {
  width: 50px;
}

.items-table td:nth-child(3),
.items-table td:nth-child(4) {
  text-align: right;
}

.summary {
  max-width: 250px;
  margin-left: auto;
  margin-bottom: 30px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.signature {
  text-align: right;
  margin-bottom: 40px;
}

.signature img {
  max-height: 60px;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.conditions h4 {
  font-size: 12px;
  font-weight: bold;
  margin: 0 0 10px 0;
}

.conditions p {
  margin: 3px 0;
  font-size: 12px;
  color: #666;
}
    `,
  },

  // ============================================================================
  // TEMPLATE 2: RED SIDEBAR (Barre latérale rouge moderne)
  // ============================================================================
  {
    id: 'minimal',
    name: 'Red Sidebar',
    description: 'Design moderne avec barre latérale rouge et numéro de facture vertical',
    thumbnail: '/templates/red-sidebar.png',
    html: `
<div class="invoice">
  <div class="sidebar">
    <span class="doc-type">Facture</span>
    <span class="doc-number">{{document_number}}</span>
  </div>
  
  <div class="content">
    <header>
      <div class="company-section">
        <h2 class="company-name">{{company_name}}</h2>
        <p>{{company_address}}</p>
        <p>{{company_phone}}</p>
      </div>
      {{#if logo_url}}
      <div class="logo-section">
        <img src="{{logo_url}}" alt="Logo" class="logo" />
      </div>
      {{/if}}
    </header>

    <div class="info-grid">
      <div class="bill-section">
        <div class="bill-to">
          <h4>Facturé à</h4>
          <p class="name">{{client_name}}</p>
          <p>{{client_address}}</p>
        </div>
        <div class="ship-to">
          <h4>Envoyé à</h4>
          <p class="name">{{client_name}}</p>
          <p>{{client_address}}</p>
        </div>
      </div>
      <div class="doc-info">
        <div class="info-row">
          <span class="label">Date</span>
          <span class="value">{{invoice_date}}</span>
        </div>
        <div class="info-row">
          <span class="label">Commande n°</span>
          <span class="value">{{document_number}}</span>
        </div>
        <div class="info-row">
          <span class="label">Échéance</span>
          <span class="value">{{due_date}}</span>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Qté</th>
          <th>Désignation</th>
          <th>Prix Unit. HT</th>
          <th>Montant HT</th>
        </tr>
      </thead>
      <tbody>
        {{items}}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Total HT</span>
        <span>{{subtotal}}</span>
      </div>
      <div class="summary-row">
        <span>TVA {{tax_rate}}%</span>
        <span>{{tax_amount}}</span>
      </div>
      <div class="summary-total">
        <span>Total</span>
        <span>{{total}}</span>
      </div>
    </div>

    {{#if signature_url}}
    <div class="signature">
      <img src="{{signature_url}}" alt="Signature" />
    </div>
    {{/if}}

    <footer>
      <div class="conditions">
        <h4>Conditions et modalités de paiement</h4>
        <p>{{terms}}</p>
        <p>{{bank_name}}</p>
        <p>IBAN: {{bank_iban}}</p>
        <p>SWIFT/BIC: {{bank_bic}}</p>
      </div>
    </footer>
  </div>
</div>
    `,
    css: `
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  background: white;
}

.invoice {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 40px;
  background: #D94545;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 5px;
  color: white;
}

.doc-type,
.doc-number {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
}

.doc-type {
  margin-bottom: 10px;
}

.content {
  flex: 1;
  padding: 40px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.company-name {
  font-size: 24px;
  color: #D94545;
  margin: 0 0 10px 0;
}

.company-section p {
  margin: 2px 0;
  font-size: 13px;
  color: #666;
}

.logo {
  max-height: 80px;
  max-width: 120px;
  object-fit: contain;
  background: #666;
  border-radius: 50%;
  padding: 20px;
}

.info-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

.bill-section {
  display: flex;
  gap: 40px;
}

.bill-to h4,
.ship-to h4 {
  font-size: 12px;
  color: #D94545;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.bill-to .name,
.ship-to .name {
  font-weight: 600;
  margin: 0 0 5px 0;
}

.bill-to p,
.ship-to p {
  margin: 2px 0;
  font-size: 13px;
}

.doc-info {
  text-align: right;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 5px;
}

.info-row .label {
  color: #D94545;
  font-size: 12px;
}

.info-row .value {
  font-size: 13px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.items-table thead tr {
  background: #D94545;
  color: white;
}

.items-table th {
  text-align: left;
  padding: 12px 10px;
  font-size: 12px;
  font-weight: 500;
}

.items-table th:nth-child(3),
.items-table th:nth-child(4) {
  text-align: right;
}

.items-table td {
  padding: 12px 10px;
  font-size: 14px;
  border-bottom: 1px solid #eee;
}

.items-table td:first-child {
  width: 50px;
}

.items-table td:nth-child(3),
.items-table td:nth-child(4) {
  text-align: right;
}

.summary {
  max-width: 250px;
  margin-left: auto;
  margin-bottom: 30px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 18px;
  font-weight: bold;
  border-top: 2px solid #333;
}

.signature {
  text-align: right;
  margin-bottom: 40px;
}

.signature img {
  max-height: 60px;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #D94545;
}

.conditions h4 {
  font-size: 12px;
  color: #D94545;
  margin: 0 0 10px 0;
}

.conditions p {
  margin: 3px 0;
  font-size: 12px;
  color: #666;
}
    `,
  },

  // ============================================================================
  // TEMPLATE 3: WAVE GREEN (Vagues vertes/jaunes créatives)
  // ============================================================================
  {
    id: 'modern',
    name: 'Wave Green',
    description: 'Design créatif avec vagues colorées vert et jaune',
    thumbnail: '/templates/wave-green.png',
    html: `
<div class="invoice">
  <div class="wave-left"></div>
  <div class="wave-right"></div>
  
  <div class="content">
    <header>
      <h1 class="doc-title">FACTURE</h1>
    </header>

    <div class="company-section">
      <h2 class="company-name">{{company_name}}</h2>
      <p>{{company_address}}</p>
      <p>{{company_phone}}</p>
    </div>

    <div class="info-grid">
      <div class="bill-to">
        <h4>FACTURÉ À</h4>
        <p class="name">{{client_name}}</p>
        <p>{{client_address}}</p>
      </div>
      <div class="ship-to">
        <h4>ENVOYÉ À</h4>
        <p class="name">{{client_name}}</p>
        <p>{{client_address}}</p>
      </div>
      <div class="doc-info">
        <div class="info-row">
          <span class="label">{{document_type}} N°</span>
          <span class="value">{{document_number}}</span>
        </div>
        <div class="info-row">
          <span class="label">DATE</span>
          <span class="value">{{invoice_date}}</span>
        </div>
        <div class="info-row">
          <span class="label">ÉCHÉANCE</span>
          <span class="value">{{due_date}}</span>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>QTÉ</th>
          <th>DÉSIGNATION</th>
          <th>PRIX UNIT. HT</th>
          <th>MONTANT HT</th>
        </tr>
      </thead>
      <tbody>
        {{items}}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Total HT</span>
        <span>{{subtotal}}</span>
      </div>
      <div class="summary-row">
        <span>TVA {{tax_rate}}%</span>
        <span>{{tax_amount}}</span>
      </div>
      <div class="summary-total">
        <span>TOTAL</span>
        <span>{{total}}</span>
      </div>
    </div>

    {{#if signature_url}}
    <div class="signature">
      <img src="{{signature_url}}" alt="Signature" />
    </div>
    {{/if}}

    <footer>
      <div class="conditions">
        <h4>CONDITIONS ET MODALITÉS DE PAIEMENT</h4>
        <p>{{terms}}</p>
        <p>{{bank_name}}</p>
        <p>IBAN: {{bank_iban}}</p>
        <p>SWIFT/BIC: {{bank_bic}}</p>
      </div>
    </footer>
  </div>
</div>
    `,
    css: `
body {
  font-family: 'Georgia', serif;
  color: #333;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  background: white;
}

.invoice {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.wave-left {
  position: absolute;
  left: -50px;
  top: 0;
  bottom: 0;
  width: 150px;
  background: linear-gradient(180deg, #B8D4A3 0%, #D4E4C4 30%, #E8D574 60%, #8DB87D 100%);
  border-radius: 0 100% 100% 0 / 0 50% 50% 0;
  opacity: 0.6;
}

.wave-right {
  position: absolute;
  right: -50px;
  top: 0;
  bottom: 0;
  width: 120px;
  background: linear-gradient(180deg, #8DB87D 0%, #E8D574 40%, #D4E4C4 70%, #B8D4A3 100%);
  border-radius: 100% 0 0 100% / 50% 0 0 50%;
  opacity: 0.5;
}

.content {
  position: relative;
  z-index: 1;
  padding: 40px 80px;
}

header {
  text-align: left;
  margin-bottom: 20px;
}

.doc-title {
  font-size: 42px;
  font-weight: normal;
  font-style: italic;
  color: #4A6741;
  margin: 0;
  letter-spacing: 4px;
}

.company-section {
  margin-bottom: 30px;
}

.company-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 5px 0;
}

.company-section p {
  margin: 2px 0;
  font-size: 13px;
  color: #666;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #F0F5EC;
  border-left: 3px solid #4A6741;
}

.bill-to h4,
.ship-to h4 {
  font-size: 11px;
  font-weight: bold;
  color: #4A6741;
  margin: 0 0 8px 0;
}

.bill-to .name,
.ship-to .name {
  font-weight: bold;
  margin: 0 0 5px 0;
}

.bill-to p,
.ship-to p {
  margin: 2px 0;
  font-size: 13px;
}

.doc-info {
  text-align: right;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.info-row .label {
  font-weight: bold;
  font-size: 11px;
  color: #4A6741;
}

.info-row .value {
  font-size: 13px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.items-table thead tr {
  border-bottom: 2px solid #4A6741;
  border-top: 2px solid #4A6741;
}

.items-table th {
  text-align: left;
  padding: 12px 8px;
  font-size: 11px;
  font-weight: bold;
  color: #4A6741;
}

.items-table th:nth-child(3),
.items-table th:nth-child(4) {
  text-align: right;
}

.items-table td {
  padding: 12px 8px;
  font-size: 14px;
  border-bottom: 1px solid #ddd;
}

.items-table td:first-child {
  width: 50px;
}

.items-table td:nth-child(3),
.items-table td:nth-child(4) {
  text-align: right;
}

.summary {
  max-width: 250px;
  margin-left: auto;
  margin-bottom: 30px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 20px;
  font-weight: bold;
  color: #4A6741;
  border-top: 2px solid #4A6741;
}

.signature {
  text-align: right;
  margin-bottom: 40px;
}

.signature img {
  max-height: 60px;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #4A6741;
}

.conditions h4 {
  font-size: 12px;
  font-weight: bold;
  font-style: italic;
  color: #4A6741;
  margin: 0 0 10px 0;
}

.conditions p {
  margin: 3px 0;
  font-size: 12px;
  color: #666;
}
    `,
  },

  // ============================================================================
  // TEMPLATE 4: WAVE BLUE (Vagues bleues élégantes)
  // ============================================================================
  {
    id: 'wave-blue' as TemplateId,
    name: 'Wave Blue',
    description: 'Design élégant avec vagues bleues douces',
    thumbnail: '/templates/wave-blue.png',
    html: `
<div class="invoice">
  <div class="wave-top"></div>
  <div class="wave-bottom"></div>
  
  <div class="content">
    <header>
      <div class="header-left">
        <h2 class="company-name">{{company_name}}</h2>
        <p>{{company_address}}</p>
        <p>{{company_phone}}</p>
      </div>
      {{#if logo_url}}
      <div class="logo-section">
        <img src="{{logo_url}}" alt="Logo" class="logo" />
      </div>
      {{/if}}
    </header>

    <div class="info-grid">
      <div class="bill-section">
        <div class="bill-to">
          <h4>Facturé à</h4>
          <p class="name">{{client_name}}</p>
          <p>{{client_address}}</p>
        </div>
        <div class="ship-to">
          <h4>Envoyé à</h4>
          <p class="name">{{client_name}}</p>
          <p>{{client_address}}</p>
        </div>
      </div>
      <div class="doc-info">
        <div class="info-row">
          <span class="label">Facture n°</span>
          <span class="value">{{document_number}}</span>
        </div>
        <div class="info-row">
          <span class="label">Date</span>
          <span class="value">{{invoice_date}}</span>
        </div>
        <div class="info-row">
          <span class="label">Commande n°</span>
          <span class="value">{{document_number}}</span>
        </div>
        <div class="info-row">
          <span class="label">Échéance</span>
          <span class="value">{{due_date}}</span>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Qté</th>
          <th>Désignation</th>
          <th>Prix Unit. HT</th>
          <th>Montant HT</th>
        </tr>
      </thead>
      <tbody>
        {{items}}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Total HT</span>
        <span>{{subtotal}}</span>
      </div>
      <div class="summary-row">
        <span>TVA {{tax_rate}}%</span>
        <span>{{tax_amount}}</span>
      </div>
      <div class="summary-total">
        <span>Total de la facture</span>
        <span>{{total}}</span>
      </div>
    </div>

    {{#if signature_url}}
    <div class="signature">
      <img src="{{signature_url}}" alt="Signature" />
    </div>
    {{/if}}

    <footer>
      <div class="conditions">
        <h4>Conditions et modalités de paiement</h4>
        <p>{{terms}}</p>
        <p>{{bank_name}}</p>
        <p>IBAN: {{bank_iban}}</p>
        <p>SWIFT/BIC: {{bank_bic}}</p>
      </div>
    </footer>
  </div>
</div>
    `,
    css: `
body {
  font-family: 'Brush Script MT', 'Segoe UI', Arial, sans-serif;
  color: #333;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  background: white;
}

.invoice {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.wave-top {
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(135deg, #E8F4F8 0%, #B8D8E8 50%, #8BBFD8 100%);
  border-radius: 0 0 50% 50% / 0 0 100% 100%;
  opacity: 0.5;
}

.wave-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: 
    radial-gradient(ellipse 120% 100% at 30% 100%, #4A9AC9 0%, transparent 50%),
    radial-gradient(ellipse 100% 80% at 70% 100%, #7BB8D4 0%, transparent 60%),
    radial-gradient(ellipse 80% 60% at 50% 100%, #A8D4E8 0%, transparent 70%);
}

.content {
  position: relative;
  z-index: 1;
  padding: 60px 50px 200px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.company-name {
  font-family: 'Brush Script MT', cursive;
  font-size: 32px;
  color: #4A9AC9;
  margin: 0 0 10px 0;
  font-weight: normal;
  text-decoration: underline;
}

.header-left p {
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 2px 0;
  font-size: 13px;
  color: #666;
}

.logo {
  max-height: 80px;
  max-width: 120px;
  object-fit: contain;
  background: #666;
  border-radius: 50%;
  padding: 15px;
}

.info-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.bill-section {
  display: flex;
  gap: 40px;
}

.bill-to h4,
.ship-to h4 {
  font-size: 12px;
  color: #4A9AC9;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.bill-to .name,
.ship-to .name {
  font-weight: 600;
  margin: 0 0 5px 0;
}

.bill-to p,
.ship-to p {
  margin: 2px 0;
  font-size: 13px;
}

.doc-info {
  text-align: right;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 5px;
}

.info-row .label {
  color: #4A9AC9;
  font-size: 12px;
}

.info-row .value {
  font-size: 13px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.items-table thead tr {
  background: #4A9AC9;
  color: white;
}

.items-table th {
  text-align: left;
  padding: 12px 10px;
  font-size: 12px;
  font-weight: 500;
}

.items-table th:nth-child(3),
.items-table th:nth-child(4) {
  text-align: right;
}

.items-table td {
  padding: 12px 10px;
  font-size: 14px;
  border-bottom: 1px solid #eee;
}

.items-table td:first-child {
  width: 50px;
}

.items-table td:nth-child(3),
.items-table td:nth-child(4) {
  text-align: right;
}

.summary {
  max-width: 280px;
  margin-left: auto;
  margin-bottom: 30px;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 16px;
  font-weight: bold;
  color: #4A9AC9;
  border-top: 2px solid #4A9AC9;
}

.signature {
  text-align: right;
  margin-bottom: 40px;
}

.signature img {
  max-height: 60px;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.conditions h4 {
  font-size: 12px;
  color: #4A9AC9;
  margin: 0 0 10px 0;
}

.conditions p {
  margin: 3px 0;
  font-size: 12px;
  color: #666;
}
    `,
  },

  // ============================================================================
  // TEMPLATE 5: STRIPE MINIMAL (Rayures minimalistes noir et blanc)
  // ============================================================================
  {
    id: 'stripe-minimal' as TemplateId,
    name: 'Stripe Minimal',
    description: 'Design minimaliste avec rayures élégantes noir et blanc',
    thumbnail: '/templates/stripe-minimal.png',
    html: `
<div class="invoice">
  <header>
    <div class="stripes"></div>
    <h1 class="doc-title">facture</h1>
    {{#if logo_url}}
    <div class="logo-section">
      <img src="{{logo_url}}" alt="Logo" class="logo" />
    </div>
    {{/if}}
  </header>

  <div class="content">
    <div class="info-grid">
      <div class="from-section">
        <h4>DE</h4>
        <p class="name">{{company_name}}</p>
        <p>{{company_address}}</p>
        <p>{{company_phone}}</p>
      </div>
      <div class="doc-info">
        <div class="info-row">
          <span class="label">{{document_type}} N°</span>
          <span class="value">{{document_number}}</span>
        </div>
        <div class="info-row">
          <span class="label">DATE</span>
          <span class="value">{{invoice_date}}</span>
        </div>
        <div class="info-row">
          <span class="label">COMMANDE N°</span>
          <span class="value">{{document_number}}</span>
        </div>
        <div class="info-row">
          <span class="label">ÉCHÉANCE</span>
          <span class="value">{{due_date}}</span>
        </div>
      </div>
    </div>

    <div class="addresses">
      <div class="bill-to">
        <h4>FACTURÉ À</h4>
        <p class="name">{{client_name}}</p>
        <p>{{client_address}}</p>
      </div>
      <div class="ship-to">
        <h4>ENVOYÉ À</h4>
        <p class="name">{{client_name}}</p>
        <p>{{client_address}}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>QTÉ</th>
          <th>DÉSIGNATION</th>
          <th>PRIX UNIT. HT</th>
          <th>MONTANT HT</th>
        </tr>
      </thead>
      <tbody>
        {{items}}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Total HT</span>
        <span>{{subtotal}}</span>
      </div>
      <div class="summary-row">
        <span>TVA {{tax_rate}}%</span>
        <span>{{tax_amount}}</span>
      </div>
    </div>

    <div class="total-box">
      <span class="total-label">TOTAL</span>
      <span class="total-value">{{total}}</span>
    </div>

    {{#if signature_url}}
    <div class="signature">
      <img src="{{signature_url}}" alt="Signature" />
    </div>
    {{/if}}

    <footer>
      <div class="conditions">
        <h4>CONDITIONS ET MODALITÉS DE PAIEMENT</h4>
        <p>{{terms}}</p>
        <p>{{bank_name}}</p>
        <p>IBAN: {{bank_iban}}</p>
        <p>SWIFT/BIC: {{bank_bic}}</p>
      </div>
    </footer>
  </div>
</div>
    `,
    css: `
body {
  font-family: 'Courier New', Courier, monospace;
  color: #333;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  background: white;
}

.invoice {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

header {
  padding: 30px 40px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.stripes {
  position: absolute;
  top: 0;
  left: 40px;
  width: 60px;
  height: 80px;
  background: repeating-linear-gradient(
    90deg,
    #333 0px,
    #333 3px,
    transparent 3px,
    transparent 8px
  );
}

.doc-title {
  font-family: 'Brush Script MT', cursive;
  font-size: 48px;
  font-weight: normal;
  font-style: italic;
  margin: 0 0 0 80px;
  color: #333;
}

.logo {
  max-height: 80px;
  max-width: 100px;
  object-fit: contain;
  background: #666;
  border-radius: 50%;
  padding: 15px;
}

.content {
  padding: 20px 40px 40px;
}

.info-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

.from-section h4 {
  font-size: 11px;
  font-weight: bold;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.from-section .name {
  font-weight: bold;
  margin: 0 0 5px 0;
}

.from-section p {
  margin: 2px 0;
  font-size: 13px;
}

.doc-info {
  text-align: right;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 5px;
}

.info-row .label {
  font-weight: bold;
  font-size: 11px;
  letter-spacing: 1px;
}

.info-row .value {
  font-size: 13px;
}

.addresses {
  display: flex;
  gap: 60px;
  margin-bottom: 30px;
}

.bill-to h4,
.ship-to h4 {
  font-size: 11px;
  font-weight: bold;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.bill-to .name,
.ship-to .name {
  font-weight: bold;
  margin: 0 0 5px 0;
}

.bill-to p,
.ship-to p {
  margin: 2px 0;
  font-size: 13px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.items-table thead tr {
  border: 2px solid #333;
}

.items-table th {
  text-align: left;
  padding: 12px 10px;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
}

.items-table th:nth-child(3),
.items-table th:nth-child(4) {
  text-align: right;
}

.items-table td {
  padding: 12px 10px;
  font-size: 14px;
  border-bottom: 1px solid #ddd;
}

.items-table td:first-child {
  width: 50px;
}

.items-table td:nth-child(3),
.items-table td:nth-child(4) {
  text-align: right;
}

.summary {
  max-width: 250px;
  margin-left: auto;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.total-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #333;
  color: white;
  max-width: 350px;
  margin-left: auto;
  margin-bottom: 30px;
}

.total-label {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 3px;
}

.total-value {
  font-size: 24px;
  font-weight: bold;
  color: #F5A623;
}

.signature {
  text-align: right;
  margin-bottom: 40px;
}

.signature img {
  max-height: 60px;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.conditions h4 {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 0 0 10px 0;
}

.conditions p {
  margin: 3px 0;
  font-size: 12px;
  color: #666;
}
    `,
  },
];

// Helpers pour récupérer les templates
export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find((t) => t.id === id);
};

export const getDefaultTemplate = (): Template => {
  return TEMPLATES.find((t) => t.isDefault) || TEMPLATES[0];
};
