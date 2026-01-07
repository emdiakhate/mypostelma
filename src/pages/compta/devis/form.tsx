/**
 * Compta - Formulaire Devis
 *
 * Création et édition de devis avec calculs automatiques
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Save,
  Send,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Eye,
} from 'lucide-react';
import PreviewModal from '@/components/compta/PreviewModal';
import { useQuotes } from '@/hooks/useCompta';
import { useLeads } from '@/hooks/useLeads';
import { useProducts } from '@/hooks/useVente';
import {
  calculateLineAmounts,
  calculateDocumentTotals,
  formatCurrency,
  type CreateQuoteInput,
  type CreateQuoteItemInput,
} from '@/types/compta';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface QuoteLineItem extends CreateQuoteItemInput {
  id: string; // Temporary ID for UI
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export default function DevisFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const isEdit = !!id;
  const { quotes, loading: quotesLoading, createQuote } = useQuotes();
  const { leads } = useLeads();
  const { products } = useProducts();

  // État du formulaire
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expirationDate, setExpirationDate] = useState(
    format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') // +30 jours
  );
  const [currency, setCurrency] = useState('XOF');
  const [taxRate, setTaxRate] = useState(18); // TVA 18% par défaut
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<QuoteLineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Charger le devis en mode édition
  useEffect(() => {
    if (isEdit && !quotesLoading) {
      const quote = quotes.find((q) => q.id === id);
      if (quote) {
        setClientId(quote.client_id);
        setIssueDate(format(quote.issue_date, 'yyyy-MM-dd'));
        setExpirationDate(format(quote.expiration_date, 'yyyy-MM-dd'));
        setCurrency(quote.currency);
        setTaxRate(quote.tax_rate);
        setNotes(quote.notes || '');
        setTerms(quote.terms || '');

        if (quote.items) {
          setItems(
            quote.items.map((item) => ({
              id: item.id,
              product_id: item.product_id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent,
              tax_rate: item.tax_rate,
              subtotal: item.subtotal,
              discountAmount: item.discount_amount || 0,
              taxAmount: item.tax_amount,
              total: item.total,
            }))
          );
        }
      }
    }
  }, [isEdit, id, quotes, quotesLoading]);

  // Ajouter une ligne
  const addLine = () => {
    const newLine: QuoteLineItem = {
      id: `temp-${Date.now()}`,
      product_id: undefined,
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      tax_rate: taxRate,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
    };
    setItems([...items, newLine]);
  };

  // Supprimer une ligne
  const removeLine = (lineId: string) => {
    setItems(items.filter((item) => item.id !== lineId));
  };

  // Mettre à jour une ligne
  const updateLine = (lineId: string, field: keyof QuoteLineItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id !== lineId) return item;

        const updated = { ...item, [field]: value };

        // Si on sélectionne un produit, pré-remplir
        if (field === 'product_id' && value) {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.description = product.name;
            updated.unit_price = product.price;
            updated.tax_rate = taxRate;
          }
        }

        // Recalculer les montants
        const amounts = calculateLineAmounts(
          updated.quantity,
          updated.unit_price,
          updated.tax_rate || 0,
          updated.discount_percent || 0
        );

        return {
          ...updated,
          subtotal: amounts.subtotal,
          discountAmount: amounts.discountAmount,
          taxAmount: amounts.taxAmount,
          total: amounts.total,
        };
      })
    );
  };

  // Calculer les totaux
  const totals = calculateDocumentTotals(items);

  // Valider le formulaire
  const validate = (): boolean => {
    if (!clientId) {
      toast({
        title: 'Client requis',
        description: 'Veuillez sélectionner un client',
        variant: 'destructive',
      });
      return false;
    }

    if (items.length === 0) {
      toast({
        title: 'Lignes requises',
        description: 'Ajoutez au moins une ligne au devis',
        variant: 'destructive',
      });
      return false;
    }

    const emptyLines = items.filter((item) => !item.description.trim());
    if (emptyLines.length > 0) {
      toast({
        title: 'Description requise',
        description: 'Toutes les lignes doivent avoir une description',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Sauvegarder
  const handleSave = async (sendDirectly = false) => {
    if (!validate()) return;

    setSaving(true);

    try {
      const input: CreateQuoteInput = {
        client_id: clientId,
        issue_date: new Date(issueDate),
        expiration_date: new Date(expirationDate),
        currency,
        tax_rate: taxRate,
        notes: notes || undefined,
        terms: terms || undefined,
        items: items.map((item) => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          tax_rate: item.tax_rate,
        })),
      };

      if (isEdit) {
        // Mode édition - juste naviguer pour l'instant
        // updateQuote n'existe pas encore dans le hook
        toast({
          title: 'Mode édition',
          description: 'La mise à jour des devis sera disponible prochainement',
        });
      } else {
        const newQuote = await createQuote(input);
        toast({
          title: 'Devis créé',
          description: `Le devis a été créé avec succès`,
        });

        // TODO: Si sendDirectly, marquer comme 'sent'
      }

      navigate('/app/compta/devis');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer le devis",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/compta/devis')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8" />
              {isEdit ? 'Modifier le devis' : 'Nouveau devis'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit ? 'Modifiez les informations du devis' : 'Créez une proposition commerciale'}
            </p>
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Client et dates du devis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Sélectionnez un client" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Devise */}
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF (FCFA)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date émission */}
            <div className="space-y-2">
              <Label htmlFor="issue_date">Date d'émission *</Label>
              <Input
                id="issue_date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            {/* Date expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiration_date">Date d'expiration *</Label>
              <Input
                id="expiration_date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>

            {/* Taux de TVA */}
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Taux de TVA (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lignes du devis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lignes du devis</CardTitle>
              <CardDescription>Produits et services proposés</CardDescription>
            </div>
            <Button onClick={addLine} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune ligne ajoutée</p>
              <Button onClick={addLine} variant="outline" size="sm" className="mt-3">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter la première ligne
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Produit</TableHead>
                    <TableHead className="w-[250px]">Description</TableHead>
                    <TableHead className="w-[100px]">Qté</TableHead>
                    <TableHead className="w-[120px]">Prix unitaire</TableHead>
                    <TableHead className="w-[100px]">Remise %</TableHead>
                    <TableHead className="w-[100px]">TVA %</TableHead>
                    <TableHead className="w-[120px] text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.product_id || 'none'}
                          onValueChange={(value) => updateLine(item.id, 'product_id', value === 'none' ? undefined : value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Produit..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun</SelectItem>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLine(item.id, 'description', e.target.value)}
                          placeholder="Description..."
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLine(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLine(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discount_percent || 0}
                          onChange={(e) => updateLine(item.id, 'discount_percent', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.tax_rate}
                          onChange={(e) => updateLine(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.total, currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totaux */}
          {items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal, currency)}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Remise totale:</span>
                    <span className="font-medium">-{formatCurrency(totals.totalDiscount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>TVA:</span>
                  <span className="font-medium">{formatCurrency(totals.totalTax, currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.grandTotal, currency)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes et conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Notes et conditions</CardTitle>
          <CardDescription>Informations complémentaires</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes visibles uniquement pour vous..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Conditions générales</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Conditions de paiement, délais de livraison, garanties..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          disabled={items.length === 0 || !clientId}
        >
          <Eye className="mr-2 h-4 w-4" />
          Aperçu
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/app/compta/devis')} disabled={saving}>
            Annuler
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer brouillon
            </>
          )}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enregistrer et envoyer
            </>
          )}
        </Button>
        </div>
      </div>

      {/* Modal d'aperçu */}
      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        documentType="DEVIS"
        data={{
          client_name: leads.find((l) => l.id === clientId)?.name,
          client_company: leads.find((l) => l.id === clientId)?.name,
          client_address: leads.find((l) => l.id === clientId)?.address,
          client_phone: leads.find((l) => l.id === clientId)?.phone,
          issue_date: new Date(issueDate),
          expiration_date: new Date(expirationDate),
          items: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            total: item.total,
          })),
          subtotal: totals.subtotal,
          discount_amount: totals.totalDiscount,
          tax_rate: taxRate,
          tax_amount: totals.totalTax,
          total: totals.grandTotal,
          currency,
          notes,
          terms,
        }}
      />
    </div>
  );
}
