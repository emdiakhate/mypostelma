/**
 * Utilitaires pour l'export des leads en CSV/Excel
 */

import { Lead } from '@/types/leads';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ExportOptions {
  format: 'csv' | 'excel';
  fields: string[];
  includeHeaders?: boolean;
}

/**
 * Exporte les leads en CSV
 */
export const exportLeadsToCSV = (leads: Lead[], filename: string = 'leads') => {
  if (leads.length === 0) {
    throw new Error('Aucun lead à exporter');
  }

  // En-têtes
  const headers = [
    'Nom',
    'Catégorie',
    'Ville',
    'Adresse',
    'Code Postal',
    'Téléphone',
    'Email',
    'Site Web',
    'Statut',
    'Tags',
    'Notes',
    'Source',
    'Ajouté le',
    'Dernier contact',
    'Instagram',
    'Facebook',
    'LinkedIn',
    'Twitter',
  ];

  // Conversion des données
  const rows = leads.map(lead => [
    lead.name,
    lead.category,
    lead.city,
    lead.address,
    lead.postalCode || '',
    lead.phone || '',
    lead.email || '',
    lead.website || '',
    lead.status,
    lead.tags.join(', '),
    lead.notes,
    lead.source,
    format(lead.addedAt, 'dd/MM/yyyy', { locale: fr }),
    lead.lastContactedAt ? format(lead.lastContactedAt, 'dd/MM/yyyy', { locale: fr }) : '',
    lead.socialMedia?.instagram || '',
    lead.socialMedia?.facebook || '',
    lead.socialMedia?.linkedin || '',
    lead.socialMedia?.twitter || '',
  ]);

  // Créer le CSV
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  // Télécharger le fichier
  downloadFile(csvContent, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Exporte les leads en Excel (format CSV compatible Excel)
 */
export const exportLeadsToExcel = (leads: Lead[], filename: string = 'leads') => {
  // Pour Excel, on utilise le même format CSV mais avec BOM UTF-8
  if (leads.length === 0) {
    throw new Error('Aucun lead à exporter');
  }

  const headers = [
    'Nom',
    'Catégorie',
    'Ville',
    'Adresse',
    'Code Postal',
    'Téléphone',
    'Email',
    'Site Web',
    'Statut',
    'Tags',
    'Notes',
    'Source',
    'Ajouté le',
    'Dernier contact',
    'Instagram',
    'Facebook',
    'LinkedIn',
    'Twitter',
  ];

  const rows = leads.map(lead => [
    lead.name,
    lead.category,
    lead.city,
    lead.address,
    lead.postalCode || '',
    lead.phone || '',
    lead.email || '',
    lead.website || '',
    lead.status,
    lead.tags.join(', '),
    lead.notes,
    lead.source,
    format(lead.addedAt, 'dd/MM/yyyy', { locale: fr }),
    lead.lastContactedAt ? format(lead.lastContactedAt, 'dd/MM/yyyy', { locale: fr }) : '',
    lead.socialMedia?.instagram || '',
    lead.socialMedia?.facebook || '',
    lead.socialMedia?.linkedin || '',
    lead.socialMedia?.twitter || '',
  ]);

  // Créer le CSV avec BOM pour Excel
  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  downloadFile(csvContent, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Télécharge un fichier
 */
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
