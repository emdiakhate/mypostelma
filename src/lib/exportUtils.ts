/**
 * Export utilities - Excel & CSV
 */

import * as XLSX from 'xlsx';

/**
 * Exporte des données en fichier Excel (.xlsx)
 */
export function exportToExcel(data: any[], fileName: string = 'export'): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // Convertir les données en worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajuster automatiquement la largeur des colonnes
  const colWidths = Object.keys(data[0]).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws['!cols'] = colWidths;

  // Ajouter le worksheet au workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Données');

  // Générer le fichier et télécharger
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Exporte des données en fichier CSV
 */
export function exportToCSV(data: any[], fileName: string = 'export'): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Créer un worksheet depuis les données
  const ws = XLSX.utils.json_to_sheet(data);

  // Convertir en CSV
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Créer un blob et télécharger
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporte des données en fichier Excel avec plusieurs feuilles
 */
export function exportToExcelMultiSheet(
  sheets: { name: string; data: any[] }[],
  fileName: string = 'export'
): void {
  if (!sheets || sheets.length === 0) {
    throw new Error('No sheets to export');
  }

  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // Ajouter chaque feuille
  sheets.forEach((sheet) => {
    if (sheet.data && sheet.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(sheet.data);

      // Ajuster les colonnes
      const colWidths = Object.keys(sheet.data[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...sheet.data.map((row) => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }
  });

  // Générer le fichier et télécharger
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Convertit une table HTML en Excel
 */
export function exportTableToExcel(
  tableId: string,
  fileName: string = 'export'
): void {
  const table = document.getElementById(tableId);
  if (!table) {
    throw new Error(`Table with id "${tableId}" not found`);
  }

  const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' });
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Formate les données pour l'export (convertit les dates, nombres, etc.)
 */
export function formatDataForExport(data: any[]): any[] {
  return data.map((row) => {
    const formatted: any = {};

    Object.entries(row).forEach(([key, value]) => {
      // Formater les dates
      if (value instanceof Date) {
        formatted[key] = value.toLocaleDateString('fr-FR');
      }
      // Formater les nombres avec devise
      else if (
        typeof value === 'number' &&
        (key.includes('price') ||
          key.includes('total') ||
          key.includes('montant') ||
          key.includes('prix'))
      ) {
        formatted[key] = `${value.toFixed(2)} FCFA`;
      }
      // Valeurs normales
      else {
        formatted[key] = value;
      }
    });

    return formatted;
  });
}
