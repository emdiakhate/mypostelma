/**
 * Modal pour importer des leads depuis un fichier CSV
 */

import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeadFormData } from '@/types/crm';
import { toast } from 'sonner';

interface ImportCSVModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (leads: LeadFormData[]) => Promise<void>;
}

interface ImportResult {
  success: number;
  errors: number;
  errorDetails: string[];
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ open, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier le type de fichier
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    setFile(selectedFile);
    setResult(null);
    parseCSVPreview(selectedFile);
  };

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error('Le fichier CSV est vide ou mal formaté');
        return;
      }

      // Afficher un aperçu des 3 premières lignes
      const headers = lines[0].split(',').map((h) => h.trim().replace(/['"]/g, ''));
      const previewData = lines.slice(1, 4).map((line) => {
        const values = parseCSVLine(line);
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      setPreview(previewData);
    };

    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    const importErrors: string[] = [];

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error('Le fichier CSV est vide ou mal formaté');
        setLoading(false);
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

      // Mapping des colonnes CSV vers LeadFormData
      const columnMapping: Record<string, string> = {
        nom: 'name',
        name: 'name',
        entreprise: 'name',
        company: 'name',
        adresse: 'address',
        address: 'address',
        ville: 'city',
        city: 'city',
        code_postal: 'postal_code',
        postal_code: 'postal_code',
        cp: 'postal_code',
        telephone: 'phone',
        phone: 'phone',
        tel: 'phone',
        whatsapp: 'whatsapp',
        email: 'email',
        mail: 'email',
        site: 'website',
        website: 'website',
        web: 'website',
        notes: 'notes',
        note: 'notes',
      };

      // Parse data lines
      const leads: LeadFormData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const values = parseCSVLine(line);
          const leadData: any = {
            name: '',
            address: '',
            city: '',
            source: 'csv_import',
            status: 'new',
          };

          // Map CSV columns to lead fields
          headers.forEach((header, index) => {
            const fieldName = columnMapping[header];
            if (fieldName && values[index]) {
              leadData[fieldName] = values[index].trim();
            }
          });

          // Validation
          if (!leadData.name) {
            importErrors.push(`Ligne ${i + 1}: Nom manquant`);
            continue;
          }
          if (!leadData.city) {
            importErrors.push(`Ligne ${i + 1}: Ville manquante`);
            continue;
          }
          if (!leadData.address) {
            importErrors.push(`Ligne ${i + 1}: Adresse manquante`);
            continue;
          }

          leads.push(leadData as LeadFormData);
        } catch (error) {
          importErrors.push(`Ligne ${i + 1}: Erreur de parsing`);
        }
      }

      if (leads.length === 0) {
        toast.error('Aucun lead valide trouvé dans le fichier CSV');
        setResult({
          success: 0,
          errors: importErrors.length,
          errorDetails: importErrors,
        });
        setLoading(false);
        return;
      }

      // Import leads
      await onImport(leads);

      setResult({
        success: leads.length,
        errors: importErrors.length,
        errorDetails: importErrors,
      });

      toast.success(`${leads.length} lead(s) importé(s) avec succès`);

      // Auto-close après 3 secondes si pas d'erreurs
      if (importErrors.length === 0) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import du fichier CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des Leads depuis CSV</DialogTitle>
          <DialogDescription>
            Importez vos leads en masse depuis un fichier CSV. Le fichier doit contenir au minimum les colonnes : Nom, Ville, Adresse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format attendu */}
          <Alert>
            <FileText className="w-4 h-4" />
            <AlertDescription>
              <strong>Format CSV attendu :</strong>
              <div className="mt-2 text-xs font-mono bg-gray-50 p-2 rounded">
                nom,ville,adresse,telephone,email,website<br />
                Restaurant ABC,Dakar,123 Rue Example,+221771234567,contact@abc.com,abc.com
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <strong>Colonnes acceptées :</strong> nom/name/entreprise/company, ville/city, adresse/address,
                code_postal/cp, telephone/phone/tel, whatsapp, email/mail, site/website/web, notes/note
              </div>
            </AlertDescription>
          </Alert>

          {/* File upload */}
          {!result && (
            <div>
              <Label htmlFor="csv-file">Fichier CSV</Label>
              <div className="mt-2">
                <label
                  htmlFor="csv-file"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {file ? file.name : 'Cliquez pour sélectionner un fichier CSV'}
                    </span>
                  </div>
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Aperçu (3 premières lignes)</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.values(row).map((value: any, j) => (
                          <td key={j} className="px-3 py-2 text-gray-600">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <Alert className={result.errors > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}>
                {result.errors > 0 ? (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                <AlertDescription>
                  <div className="font-semibold">
                    {result.success} lead(s) importé(s) avec succès
                  </div>
                  {result.errors > 0 && (
                    <div className="text-sm text-yellow-700 mt-1">
                      {result.errors} erreur(s) détectée(s)
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {result.errorDetails.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Détails des erreurs :</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <ul className="text-xs text-red-700 space-y-1">
                      {result.errorDetails.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {result ? 'Fermer' : 'Annuler'}
            </Button>
            {!result && (
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading ? 'Import en cours...' : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCSVModal;
