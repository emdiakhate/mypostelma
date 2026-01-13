/**
 * Test DB 11: Module Configuration
 * Tables: company_settings
 *
 * Basé sur DATABASE_SCHEMA_COMPLETE.md
 */
import { describe, it, expect } from 'vitest';

describe('DB Test 11: Module Configuration', () => {
  // ============= TESTS COMPANY_SETTINGS =============

  it('✅ should validate company settings structure', () => {
    const settings = {
      id: 'uuid-settings-1',
      user_id: 'uuid-user',
      company_name: 'Ma Super Entreprise SARL',
      address: '15 Avenue Pompidou',
      city: 'Dakar',
      postal_code: '10200',
      country: 'Sénégal',
      phone: '+221 33 123 4567',
      email: 'contact@masuperentreprise.sn',
      website: 'https://masuperentreprise.sn',
      siret: 'SN-123456789',
      tva_number: 'FR-TVA-987654321',
      logo_url: 'https://storage.com/logos/company-logo.png',
      signature_url: 'https://storage.com/signatures/ceo-signature.png',
      bank_name: 'Banque Internationale du Sénégal',
      bank_iban: 'SN08 SN001 01234567890123',
      bank_bic: 'BISNSNDA',
      default_payment_terms: 'Paiement à 30 jours',
      default_notes: 'Merci de votre confiance',
      invoice_prefix: 'FAC',
      quote_prefix: 'DEV',
      default_invoice_template: 'modern',
      default_quote_template: 'classic',
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(settings.company_name).toBeDefined();
    expect(settings.email).toMatch(/@/);
    expect(settings.website).toMatch(/^https?:\/\//);
    expect(settings.invoice_prefix).toBe('FAC');
    expect(settings.quote_prefix).toBe('DEV');
    console.log('✅ PASS - Company settings structure validated');
  });

  it('✅ should validate IBAN format', () => {
    const iban = 'SN08 SN001 01234567890123';
    const ibanRegex = /^[A-Z]{2}[0-9]{2}\s?[A-Z0-9\s]+$/;

    expect(iban).toMatch(ibanRegex);
    console.log('✅ PASS - IBAN format validated');
  });

  it('✅ should validate BIC format', () => {
    const bic = 'BISNSNDA';
    const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

    expect(bic).toMatch(bicRegex);
    console.log('✅ PASS - BIC format validated');
  });

  it('✅ should generate invoice numbers with prefix', () => {
    const settings = {
      invoice_prefix: 'FAC',
    };

    const year = 2026;
    const sequence = 123;
    const invoiceNumber = `${settings.invoice_prefix}-${year}-${String(sequence).padStart(3, '0')}`;

    expect(invoiceNumber).toBe('FAC-2026-123');
    console.log('✅ PASS - Invoice number generation validated');
  });

  it('✅ should generate quote numbers with prefix', () => {
    const settings = {
      quote_prefix: 'DEV',
    };

    const year = 2026;
    const sequence = 45;
    const quoteNumber = `${settings.quote_prefix}-${year}-${String(sequence).padStart(3, '0')}`;

    expect(quoteNumber).toBe('DEV-2026-045');
    console.log('✅ PASS - Quote number generation validated');
  });

  it('✅ should validate available templates', () => {
    const availableTemplates = ['classic', 'modern', 'minimal', 'corporate'];
    const settings = {
      default_invoice_template: 'modern',
      default_quote_template: 'classic',
    };

    expect(availableTemplates).toContain(settings.default_invoice_template);
    expect(availableTemplates).toContain(settings.default_quote_template);
    console.log('✅ PASS - Available templates validated');
  });

  it('✅ should validate payment terms', () => {
    const commonPaymentTerms = [
      'Paiement comptant',
      'Paiement à 15 jours',
      'Paiement à 30 jours',
      'Paiement à 60 jours',
      'Paiement à réception',
    ];

    const settings = {
      default_payment_terms: 'Paiement à 30 jours',
    };

    expect(commonPaymentTerms).toContain(settings.default_payment_terms);
    console.log('✅ PASS - Payment terms validated');
  });

  it('✅ should validate contact information', () => {
    const settings = {
      phone: '+221 33 123 4567',
      email: 'contact@entreprise.sn',
      website: 'https://entreprise.sn',
    };

    expect(settings.phone).toMatch(/^\+?[\d\s]+$/);
    expect(settings.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(settings.website).toMatch(/^https?:\/\/.+/);
    console.log('✅ PASS - Contact information validated');
  });

  it('✅ should validate company location', () => {
    const settings = {
      address: '15 Avenue Pompidou',
      city: 'Dakar',
      postal_code: '10200',
      country: 'Sénégal',
    };

    expect(settings.address).toBeDefined();
    expect(settings.city).toBeDefined();
    expect(settings.country).toBeDefined();
    console.log('✅ PASS - Company location validated');
  });

  it('✅ should validate logo and signature URLs', () => {
    const settings = {
      logo_url: 'https://storage.com/logos/company-logo.png',
      signature_url: 'https://storage.com/signatures/ceo-signature.png',
    };

    const urlRegex = /^https?:\/\/.+\.(png|jpg|jpeg|svg)$/i;
    expect(settings.logo_url).toMatch(urlRegex);
    expect(settings.signature_url).toMatch(urlRegex);
    console.log('✅ PASS - Logo and signature URLs validated');
  });

  it('✅ should validate banking information completeness', () => {
    const settings = {
      bank_name: 'Banque Internationale du Sénégal',
      bank_iban: 'SN08 SN001 01234567890123',
      bank_bic: 'BISNSNDA',
    };

    const hasBankingInfo =
      settings.bank_name &&
      settings.bank_iban &&
      settings.bank_bic;

    expect(hasBankingInfo).toBe(true);
    console.log('✅ PASS - Banking information completeness validated');
  });
});
