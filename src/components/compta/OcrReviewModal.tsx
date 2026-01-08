/**
 * Modal de révision des données OCR
 *
 * Permet à l'utilisateur de vérifier et éditer les données extraites
 * par l'OCR avant de créer un devis ou une facture
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  User,
  FileText,
  ShoppingCart,
  DollarSign,
  Plus,
  Trash2,
  FileInput,
  Receipt,
} from 'lucide-react';
import type { OcrExtractedData } from '@/types/compta';

interface OcrReviewModalProps {
  open: boolean;
  onClose: () => void;
  extractedData: OcrExtractedData | null;
  scanId: string;
  confidenceScore: number;
  fileUrl?: string;
  onCreateQuote: (editedData: OcrReviewData) => void;
  onCreateInvoice: (editedData: OcrReviewData) => void;
}

export interface OcrReviewData {
  // Client
  client_name: string;
  client_company?: string;
  client_address?: string;
  client_phone?: string;

  // Document
  document_type: 'quote' | 'invoice';
  document_number?: string;
  issue_date: string;
  due_date?: string;
  expiration_date?: string;

  // Montants
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;

  // Lignes
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;

  // Métadonnées
  confidence_score: number;
  scan_id: string;
}

// Helper pour obtenir l'indicateur de confiance
const getConfidenceIndicator = (value: any, threshold: number = 70) => {
  if (!value || value === null || value === '') {
    return <XCircle className="h-4 w-4 text-gray-400" />;
  }
  if (threshold >= 80) {
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
  if (threshold >= 50) {
    return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  }
  return <XCircle className="h-4 w-4 text-red-500" />;
};

export default function OcrReviewModal({
  open,
  onClose,
  extractedData,
  scanId,
  confidenceScore,
  fileUrl,
  onCreateQuote,
  onCreateInvoice,
}: OcrReviewModalProps) {
  // États pour les données éditables
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const [currency, setCurrency] = useState('XOF');
  const [taxRate, setTaxRate] = useState(18);
  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>>([]);

  // Initialiser les champs depuis extractedData
  useEffect(() => {
    if (extractedData) {
      setClientName(extractedData.client_name || '');
      setClientCompany(extractedData.client_company || '');
      setClientAddress(extractedData.client_address || '');
      setClientPhone(extractedData.client_phone || '');

      setDocumentNumber(extractedData.document_number || '');
      setIssueDate(extractedData.issue_date || new Date().toISOString().split('T')[0]);
      setDueDate(extractedData.due_date || '');
      setExpirationDate(extractedData.expiration_date || '');

      setCurrency(extractedData.currency || 'XOF');
      setTaxRate(extractedData.tax_rate || 18);
      setItems(extractedData.items || []);
    }
  }, [extractedData]);

  // Calculer les totaux
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  // Ajouter une ligne
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  // Supprimer une ligne
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Modifier une ligne
  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculer le total de la ligne
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  // Créer devis
  const handleCreateQuote = () => {
    const reviewData: OcrReviewData = {
      client_name: clientName,
      client_company: clientCompany,
      client_address: clientAddress,
      client_phone: clientPhone,
      document_type: 'quote',
      document_number: documentNumber,
      issue_date: issueDate,
      expiration_date: expirationDate,
      currency,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      items,
      confidence_score: confidenceScore,
      scan_id: scanId,
    };
    onCreateQuote(reviewData);
  };

  // Créer facture
  const handleCreateInvoice = () => {
    const reviewData: OcrReviewData = {
      client_name: clientName,
      client_company: clientCompany,
      client_address: clientAddress,
      client_phone: clientPhone,
      document_type: 'invoice',
      document_number: documentNumber,
      issue_date: issueDate,
      due_date: dueDate,
      currency,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      items,
      confidence_score: confidenceScore,
      scan_id: scanId,
    };
    onCreateInvoice(reviewData);
  };

  if (!extractedData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            Révision des données scannées
          </DialogTitle>
        </DialogHeader>

        {/* Score de confiance */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Confiance globale</span>
            <Badge variant={confidenceScore >= 80 ? 'default' : confidenceScore >= 50 ? 'secondary' : 'destructive'}>
              {confidenceScore}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                confidenceScore >= 80 ? 'bg-green-600' : confidenceScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
        </div>

        {/* Alert si confiance faible */}
        {confidenceScore < 70 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Certaines données sont incertaines. Veuillez vérifier attentivement tous les champs avant de continuer.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Informations Client */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Informations Client</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  Nom du client {getConfidenceIndicator(clientName, 80)}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nom du client"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  Entreprise {getConfidenceIndicator(clientCompany, 70)}
                </Label>
                <Input
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="Nom de l'entreprise"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  Adresse {getConfidenceIndicator(clientAddress, 70)}
                </Label>
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Adresse"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  Téléphone {getConfidenceIndicator(clientPhone, 70)}
                </Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+221 XX XXX XX XX"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Informations Document */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileInput className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Informations Document</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  Numéro {getConfidenceIndicator(documentNumber, 70)}
                </Label>
                <Input
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ex: FAC-2026-0001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  Date d'émission {getConfidenceIndicator(issueDate, 80)}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  Devise {getConfidenceIndicator(currency, 80)}
                </Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="XOF"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Lignes d'articles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-lg">Lignes d'articles</h3>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      size="sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Qté</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      size="sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Prix unit.</Label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      size="sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Total</Label>
                    <Input value={item.total.toLocaleString()} readOnly size="sm" className="bg-gray-50" />
                  </div>
                  <div className="col-span-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun article détecté</p>
                  <Button size="sm" variant="outline" onClick={handleAddItem} className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un article
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Totaux */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Totaux</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Sous-total HT</span>
                <span className="font-semibold">{subtotal.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">TVA</span>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-16 h-7 text-xs"
                  />
                  <span className="text-sm">%</span>
                </div>
                <span className="font-semibold">{taxAmount.toLocaleString()} {currency}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total TTC</span>
                <span className="font-bold text-lg text-blue-600">{total.toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCreateQuote}
              disabled={!clientName || !issueDate || items.length === 0}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Créer un Devis
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={!clientName || !issueDate || items.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Créer une Facture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
