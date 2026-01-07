/**
 * Générateur de PDF pour devis et factures
 *
 * Utilise jsPDF pour créer des PDFs professionnels
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, Invoice, formatCurrency } from '@/types/compta';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration entreprise (à déplacer dans settings plus tard)
const COMPANY_INFO = {
  name: 'MyPostelma',
  address: 'Dakar, Sénégal',
  phone: '+221 XX XXX XX XX',
  email: 'contact@mypostelma.com',
  website: 'www.mypostelma.com',
  logo: null, // TODO: Ajouter le logo
};

/**
 * Génère un PDF pour un devis
 */
export const generateQuotePDF = (quote: Quote): void => {
  const doc = new jsPDF();

  // Marges
  const margin = 20;
  let yPos = margin;

  // En-tête entreprise
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, margin, yPos);
  yPos += 5;
  doc.text(`Tél: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, margin, yPos);
  yPos += 15;

  // Titre DEVIS
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185); // Bleu
  doc.text('DEVIS', margin, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  // Numéro et dates
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${quote.quote_number}`, margin, yPos);
  yPos += 6;
  doc.text(`Date d'émission: ${format(quote.issue_date, 'dd/MM/yyyy', { locale: fr })}`, margin, yPos);
  yPos += 6;
  doc.text(`Date d'expiration: ${format(quote.expiration_date, 'dd/MM/yyyy', { locale: fr })}`, margin, yPos);
  yPos += 15;

  // Informations client
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', margin, yPos);
  yPos += 7;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  if (quote.client) {
    doc.text(quote.client.name, margin, yPos);
    yPos += 6;
    if (quote.client.company) {
      doc.text(quote.client.company, margin, yPos);
      yPos += 6;
    }
    if (quote.client.email) {
      doc.text(`Email: ${quote.client.email}`, margin, yPos);
      yPos += 6;
    }
    if (quote.client.phone) {
      doc.text(`Tél: ${quote.client.phone}`, margin, yPos);
      yPos += 6;
    }
  }
  yPos += 10;

  // Tableau des lignes
  const tableData = (quote.items || []).map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price, quote.currency),
    item.discount_percent ? `${item.discount_percent}%` : '-',
    `${item.tax_rate}%`,
    formatCurrency(item.total, quote.currency),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Prix unit.', 'Remise', 'TVA', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });

  // Position après le tableau
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totaux à droite
  const totalsX = 140;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total:', totalsX, yPos);
  doc.text(formatCurrency(quote.subtotal, quote.currency), 185, yPos, { align: 'right' });
  yPos += 6;

  if (quote.discount_amount && quote.discount_amount > 0) {
    doc.setTextColor(34, 139, 34); // Vert
    doc.text('Remise:', totalsX, yPos);
    doc.text(`-${formatCurrency(quote.discount_amount, quote.currency)}`, 185, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }

  doc.text('TVA:', totalsX, yPos);
  doc.text(formatCurrency(quote.tax_amount, quote.currency), 185, yPos, { align: 'right' });
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(formatCurrency(quote.total, quote.currency), 185, yPos, { align: 'right' });
  yPos += 15;

  // Notes
  if (quote.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(quote.notes, 170);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5 + 5;
  }

  // Conditions générales
  if (quote.terms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Conditions générales:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const splitTerms = doc.splitTextToSize(quote.terms, 170);
    doc.text(splitTerms, margin, yPos);
  }

  // Pied de page
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `${COMPANY_INFO.name} - ${COMPANY_INFO.website}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );

  // Télécharger
  doc.save(`Devis_${quote.quote_number}.pdf`);
};

/**
 * Génère un PDF pour une facture
 */
export const generateInvoicePDF = (invoice: Invoice): void => {
  const doc = new jsPDF();

  // Marges
  const margin = 20;
  let yPos = margin;

  // En-tête entreprise
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, margin, yPos);
  yPos += 5;
  doc.text(`Tél: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, margin, yPos);
  yPos += 15;

  // Titre FACTURE
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69); // Rouge
  doc.text('FACTURE', margin, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  // Numéro et dates
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoice.invoice_number}`, margin, yPos);
  yPos += 6;
  doc.text(`Date d'émission: ${format(invoice.issue_date, 'dd/MM/yyyy', { locale: fr })}`, margin, yPos);
  yPos += 6;
  doc.text(`Date d'échéance: ${format(invoice.due_date, 'dd/MM/yyyy', { locale: fr })}`, margin, yPos);
  yPos += 6;

  // Statut de paiement
  if (invoice.status === 'paid') {
    doc.setTextColor(34, 139, 34);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ PAYÉE', margin, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  } else if (invoice.balance_due > 0) {
    doc.setTextColor(220, 53, 69);
    doc.text(`Reste dû: ${formatCurrency(invoice.balance_due, invoice.currency)}`, margin, yPos);
    doc.setTextColor(0, 0, 0);
  }
  yPos += 15;

  // Informations client
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURER À', margin, yPos);
  yPos += 7;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  if (invoice.client) {
    doc.text(invoice.client.name, margin, yPos);
    yPos += 6;
    if (invoice.client.company) {
      doc.text(invoice.client.company, margin, yPos);
      yPos += 6;
    }
    if (invoice.client.email) {
      doc.text(`Email: ${invoice.client.email}`, margin, yPos);
      yPos += 6;
    }
    if (invoice.client.phone) {
      doc.text(`Tél: ${invoice.client.phone}`, margin, yPos);
      yPos += 6;
    }
  }
  yPos += 10;

  // Tableau des lignes
  const tableData = (invoice.items || []).map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price, invoice.currency),
    item.discount_percent ? `${item.discount_percent}%` : '-',
    `${item.tax_rate}%`,
    formatCurrency(item.total, invoice.currency),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Prix unit.', 'Remise', 'TVA', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [220, 53, 69],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });

  // Position après le tableau
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totaux à droite
  const totalsX = 140;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total:', totalsX, yPos);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), 185, yPos, { align: 'right' });
  yPos += 6;

  if (invoice.discount_amount && invoice.discount_amount > 0) {
    doc.setTextColor(34, 139, 34);
    doc.text('Remise:', totalsX, yPos);
    doc.text(`-${formatCurrency(invoice.discount_amount, invoice.currency)}`, 185, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }

  doc.text('TVA:', totalsX, yPos);
  doc.text(formatCurrency(invoice.tax_amount, invoice.currency), 185, yPos, { align: 'right' });
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(formatCurrency(invoice.total, invoice.currency), 185, yPos, { align: 'right' });
  yPos += 8;

  // Montants payés et reste dû
  if (invoice.amount_paid > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 139, 34);
    doc.text('Payé:', totalsX, yPos);
    doc.text(formatCurrency(invoice.amount_paid, invoice.currency), 185, yPos, { align: 'right' });
    yPos += 6;

    doc.setTextColor(220, 53, 69);
    doc.setFont('helvetica', 'bold');
    doc.text('RESTE DÛ:', totalsX, yPos);
    doc.text(formatCurrency(invoice.balance_due, invoice.currency), 185, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  }

  // Paiements enregistrés
  if (invoice.payments && invoice.payments.length > 0) {
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Paiements reçus:', margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    invoice.payments.forEach((payment) => {
      const paymentText = `• ${format(payment.payment_date, 'dd/MM/yyyy', { locale: fr })} - ${formatCurrency(payment.amount, invoice.currency)} (${payment.payment_method})`;
      doc.text(paymentText, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 5;
  }

  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5 + 5;
  }

  // Conditions de paiement
  if (invoice.terms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Conditions de paiement:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const splitTerms = doc.splitTextToSize(invoice.terms, 170);
    doc.text(splitTerms, margin, yPos);
  }

  // Pied de page
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `${COMPANY_INFO.name} - ${COMPANY_INFO.website}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );

  // Télécharger
  doc.save(`Facture_${invoice.invoice_number}.pdf`);
};
