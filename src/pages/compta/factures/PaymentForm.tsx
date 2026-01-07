/**
 * Formulaire d'ajout de paiement
 *
 * Permet d'enregistrer un paiement pour une facture
 */

import { useState } from 'react';
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
import { DollarSign, Loader2 } from 'lucide-react';
import { usePayments } from '@/hooks/useCompta';
import {
  formatCurrency,
  getPaymentMethodLabel,
  type Invoice,
  type PaymentMethod,
  type CreatePaymentInput,
} from '@/types/compta';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PaymentFormProps {
  invoice: Invoice;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ invoice, onSuccess, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const { createPayment } = usePayments(invoice.id);

  const [amount, setAmount] = useState(invoice.balance_due);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast({
        title: 'Montant invalide',
        description: 'Le montant doit être supérieur à 0',
        variant: 'destructive',
      });
      return;
    }

    if (amount > invoice.balance_due) {
      toast({
        title: 'Montant trop élevé',
        description: `Le montant ne peut pas dépasser le reste dû (${formatCurrency(invoice.balance_due, invoice.currency)})`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const input: CreatePaymentInput = {
        invoice_id: invoice.id,
        amount,
        payment_method: paymentMethod,
        reference: reference || undefined,
        payment_date: new Date(paymentDate),
        notes: notes || undefined,
      };

      await createPayment(input);

      toast({
        title: 'Paiement enregistré',
        description: `Le paiement de ${formatCurrency(amount, invoice.currency)} a été enregistré`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer le paiement",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Récapitulatif facture */}
      <div className="p-4 bg-muted rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Facture:</span>
          <span className="font-medium">{invoice.invoice_number}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Montant total:</span>
          <span className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Déjà payé:</span>
          <span className="font-medium text-green-600">
            {formatCurrency(invoice.amount_paid, invoice.currency)}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Reste dû:</span>
          <span className="text-orange-600">
            {formatCurrency(invoice.balance_due, invoice.currency)}
          </span>
        </div>
      </div>

      {/* Montant du paiement */}
      <div className="space-y-2">
        <Label htmlFor="amount">Montant du paiement *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            max={invoice.balance_due}
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="pl-9"
            required
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAmount(invoice.balance_due / 2)}
          >
            50%
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAmount(invoice.balance_due)}
          >
            Tout payer
          </Button>
        </div>
      </div>

      {/* Méthode de paiement */}
      <div className="space-y-2">
        <Label htmlFor="payment_method">Méthode de paiement *</Label>
        <Select
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
        >
          <SelectTrigger id="payment_method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">{getPaymentMethodLabel('cash')}</SelectItem>
            <SelectItem value="bank_transfer">{getPaymentMethodLabel('bank_transfer')}</SelectItem>
            <SelectItem value="mobile_money">{getPaymentMethodLabel('mobile_money')}</SelectItem>
            <SelectItem value="check">{getPaymentMethodLabel('check')}</SelectItem>
            <SelectItem value="other">{getPaymentMethodLabel('other')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Référence */}
      <div className="space-y-2">
        <Label htmlFor="reference">Référence transaction</Label>
        <Input
          id="reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ex: Numéro transaction Wave, chèque..."
        />
      </div>

      {/* Date de paiement */}
      <div className="space-y-2">
        <Label htmlFor="payment_date">Date de paiement *</Label>
        <Input
          id="payment_date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes additionnelles..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <DollarSign className="mr-2 h-4 w-4" />
              Enregistrer le paiement
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
