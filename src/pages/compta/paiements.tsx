/**
 * Paiements Page - Module Compta
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Euro, CreditCard, Landmark, Banknote, Download, FileText } from 'lucide-react';

export default function PaiementsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Euro className="h-8 w-8" />
            Paiements
          </h1>
          <p className="text-muted-foreground mt-1">Encaissements et rapprochement bancaire</p>
        </div>
        <Button><Euro className="mr-2 h-4 w-4" />Enregistrer un paiement</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Encaissé ce mois</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">24.5K€</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">En attente</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">8.2K€</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">CB / Stripe</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">65%</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Virements</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">35%</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Moyens de paiement</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div><div className="font-medium">Carte bancaire</div><div className="text-sm text-muted-foreground">Stripe</div></div>
              </div>
              <Badge className="bg-green-600">16.2K€</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-purple-600" />
                <div><div className="font-medium">Virement</div><div className="text-sm text-muted-foreground">SEPA</div></div>
              </div>
              <Badge variant="outline">8.3K€</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-green-600" />
                <div><div className="font-medium">Espèces</div><div className="text-sm text-muted-foreground">Cash</div></div>
              </div>
              <Badge variant="outline">0€</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start"><Download className="mr-2 h-4 w-4" />Exporter écritures comptables</Button>
            <Button variant="outline" className="w-full justify-start"><Landmark className="mr-2 h-4 w-4" />Rapprochement bancaire</Button>
            <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" />Génerer rapport financier</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
