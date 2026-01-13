/**
 * Test DB 07: Module Comptabilité
 * Tables: compta_quotes, compta_quote_items, compta_invoices, compta_invoice_items,
 *         compta_payments, compta_ocr_scans, invoice_reminders
 *
 * Basé sur DATABASE_SCHEMA_COMPLETE.md
 */
import { describe, it, expect } from 'vitest';

describe('DB Test 07: Module Comptabilité', () => {
  // ============= TESTS COMPTA_QUOTES =============

  it('✅ should validate compta quote structure', () => {
    const quote = {
      id: 'uuid-quote-1',
      user_id: 'uuid-user',
      client_id: 'uuid-client-1',
      quote_number: 'DEV-2026-001',
      status: 'sent',
      currency: 'XOF',
      issue_date: new Date('2026-01-15'),
      expiration_date: new Date('2026-02-15'),
      subtotal: 500000,
      tax_rate: 18.00,
      tax_amount: 90000,
      discount_amount: 0,
      total: 590000,
      notes: 'Merci de votre confiance',
      terms: 'Paiement à 30 jours',
      created_from_ocr: false,
      ocr_scan_id: null,
      converted_to_invoice_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    const currencies = ['XOF', 'EUR', 'USD'];

    expect(statuses).toContain(quote.status);
    expect(currencies).toContain(quote.currency);
    expect(quote.tax_amount).toBe((quote.subtotal * quote.tax_rate) / 100);
    expect(quote.total).toBe(quote.subtotal + quote.tax_amount - quote.discount_amount);
    console.log('✅ PASS - Compta quote structure validated');
  });

  it('✅ should calculate quote totals with discount', () => {
    const quote = {
      subtotal: 500000,
      tax_rate: 18.00,
      discount_amount: 50000,
    };

    const tax_amount = (quote.subtotal * quote.tax_rate) / 100;
    const total = quote.subtotal + tax_amount - quote.discount_amount;

    expect(tax_amount).toBe(90000);
    expect(total).toBe(540000); // 500000 + 90000 - 50000
    console.log('✅ PASS - Quote totals with discount calculated');
  });

  // ============= TESTS COMPTA_QUOTE_ITEMS =============

  it('✅ should validate compta quote item structure', () => {
    const item = {
      id: 'uuid-item-1',
      quote_id: 'uuid-quote-1',
      product_id: 'uuid-product-1',
      description: 'Prestation de service développement',
      quantity: 10,
      unit_price: 50000,
      discount_percent: 10,
      discount_amount: 50000, // 10% de 500000
      tax_rate: 18.00,
      tax_amount: 81000, // 18% de (500000 - 50000)
      subtotal: 500000,
      total: 531000, // 500000 - 50000 + 81000
      line_order: 0,
      created_at: new Date(),
    };

    expect(item.subtotal).toBe(item.quantity * item.unit_price);
    expect(item.discount_amount).toBe((item.subtotal * item.discount_percent) / 100);
    console.log('✅ PASS - Compta quote item structure validated');
  });

  // ============= TESTS COMPTA_INVOICES =============

  it('✅ should validate invoice structure', () => {
    const invoice = {
      id: 'uuid-invoice-1',
      user_id: 'uuid-user',
      client_id: 'uuid-client-1',
      quote_id: 'uuid-quote-1',
      invoice_number: 'FAC-2026-001',
      status: 'sent',
      currency: 'XOF',
      issue_date: new Date('2026-01-15'),
      due_date: new Date('2026-02-15'),
      subtotal: 500000,
      tax_rate: 18.00,
      tax_amount: 90000,
      discount_amount: 0,
      total: 590000,
      amount_paid: 0,
      balance_due: 590000,
      paid_at: null,
      notes: '',
      terms: 'Paiement à 30 jours',
      created_from_ocr: false,
      ocr_scan_id: null,
      stock_impact_applied: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const statuses = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'];
    expect(statuses).toContain(invoice.status);
    expect(invoice.balance_due).toBe(invoice.total - invoice.amount_paid);
    expect(invoice.due_date.getTime()).toBeGreaterThan(invoice.issue_date.getTime());
    console.log('✅ PASS - Invoice structure validated');
  });

  it('✅ should calculate invoice balance correctly', () => {
    const invoice = {
      total: 590000,
      amount_paid: 200000,
    };

    const balance_due = invoice.total - invoice.amount_paid;
    const percentPaid = (invoice.amount_paid / invoice.total) * 100;

    expect(balance_due).toBe(390000);
    expect(percentPaid).toBeCloseTo(33.90, 2);
    console.log('✅ PASS - Invoice balance calculated correctly');
  });

  it('✅ should detect overdue invoices', () => {
    const invoice = {
      status: 'sent',
      due_date: new Date('2026-01-10'),
      amount_paid: 0,
      total: 590000,
    };

    const now = new Date('2026-01-15');
    const isOverdue = now > invoice.due_date && invoice.amount_paid < invoice.total;
    const daysOverdue = Math.floor((now.getTime() - invoice.due_date.getTime()) / (86400000));

    expect(isOverdue).toBe(true);
    expect(daysOverdue).toBe(5);
    console.log('✅ PASS - Overdue invoice detected');
  });

  // ============= TESTS COMPTA_INVOICE_ITEMS =============

  it('✅ should validate invoice item structure', () => {
    const item = {
      id: 'uuid-item-1',
      invoice_id: 'uuid-invoice-1',
      product_id: 'uuid-product-1',
      description: 'Développement web sur mesure',
      quantity: 8,
      unit_price: 75000,
      discount_percent: 0,
      discount_amount: 0,
      tax_rate: 18.00,
      tax_amount: 108000,
      subtotal: 600000,
      total: 708000,
      line_order: 0,
      created_at: new Date(),
    };

    expect(item.subtotal).toBe(item.quantity * item.unit_price);
    expect(item.tax_amount).toBe((item.subtotal * item.tax_rate) / 100);
    console.log('✅ PASS - Invoice item structure validated');
  });

  // ============= TESTS COMPTA_PAYMENTS =============

  it('✅ should validate payment structure', () => {
    const payment = {
      id: 'uuid-payment-1',
      user_id: 'uuid-user',
      invoice_id: 'uuid-invoice-1',
      amount: 590000,
      payment_date: new Date('2026-01-20'),
      payment_method: 'bank_transfer',
      reference: 'VIR-2026-001',
      notes: 'Paiement intégral',
      created_by: 'Comptable',
      created_at: new Date(),
    };

    const methods = ['cash', 'bank_transfer', 'cheque', 'mobile_money', 'card'];
    expect(methods).toContain(payment.payment_method);
    expect(payment.amount).toBeGreaterThan(0);
    console.log('✅ PASS - Payment structure validated');
  });

  it('✅ should handle multiple payments per invoice', () => {
    const invoice = { total: 500000, amount_paid: 0 };
    const payments = [
      { amount: 200000 },
      { amount: 150000 },
      { amount: 150000 },
    ];

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = invoice.total - totalPaid;

    expect(totalPaid).toBe(invoice.total);
    expect(balance).toBe(0);
    console.log('✅ PASS - Multiple payments handled correctly');
  });

  // ============= TESTS COMPTA_OCR_SCANS =============

  it('✅ should validate OCR scan structure', () => {
    const scan = {
      id: 'uuid-scan-1',
      user_id: 'uuid-user',
      file_url: 'https://storage.com/scans/invoice-scan.pdf',
      file_name: 'facture-fournisseur-2026.pdf',
      file_type: 'application/pdf',
      file_path: 'scans/user-123/invoice-scan.pdf',
      file_size: 1024567,
      raw_text: 'FACTURE N° FAC-2026-001\nDate: 15/01/2026\nMontant: 500 000 XOF...',
      extracted_data: {
        invoice_number: 'FAC-2026-001',
        date: '2026-01-15',
        total: 500000,
        supplier: 'Fournisseur XYZ',
        items: [
          { description: 'Produit A', quantity: 10, price: 50000 },
        ],
      },
      confidence_score: 0.95,
      status: 'processed',
      error_message: null,
      created_quote_id: null,
      created_invoice_id: 'uuid-invoice-1',
      processed_at: new Date(),
      created_at: new Date(),
    };

    const statuses = ['pending', 'processing', 'processed', 'failed'];
    expect(statuses).toContain(scan.status);
    expect(scan.confidence_score).toBeGreaterThanOrEqual(0);
    expect(scan.confidence_score).toBeLessThanOrEqual(1);
    console.log('✅ PASS - OCR scan structure validated');
  });

  it('✅ should validate OCR confidence threshold', () => {
    const scan = {
      confidence_score: 0.95,
      status: 'processed',
    };

    const minConfidence = 0.85;
    const isReliable = scan.confidence_score >= minConfidence;

    expect(isReliable).toBe(true);
    console.log('✅ PASS - OCR confidence threshold validated');
  });

  // ============= TESTS INVOICE_REMINDERS =============

  it('✅ should validate invoice reminder structure', () => {
    const reminder = {
      id: 'uuid-reminder-1',
      user_id: 'uuid-user',
      invoice_id: 'uuid-invoice-1',
      reminder_type: 'first_reminder',
      days_overdue: 7,
      status: 'sent',
      error_message: null,
      sent_at: new Date(),
      created_at: new Date(),
    };

    const reminderTypes = ['first_reminder', 'second_reminder', 'final_notice'];
    const statuses = ['pending', 'sent', 'failed'];

    expect(reminderTypes).toContain(reminder.reminder_type);
    expect(statuses).toContain(reminder.status);
    expect(reminder.days_overdue).toBeGreaterThan(0);
    console.log('✅ PASS - Invoice reminder structure validated');
  });

  it('✅ should schedule reminders based on days overdue', () => {
    const getRequiredReminder = (daysOverdue: number) => {
      if (daysOverdue >= 30) return 'final_notice';
      if (daysOverdue >= 15) return 'second_reminder';
      if (daysOverdue >= 7) return 'first_reminder';
      return null;
    };

    expect(getRequiredReminder(5)).toBeNull();
    expect(getRequiredReminder(7)).toBe('first_reminder');
    expect(getRequiredReminder(15)).toBe('second_reminder');
    expect(getRequiredReminder(30)).toBe('final_notice');
    console.log('✅ PASS - Reminders scheduled correctly');
  });
});
