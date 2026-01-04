/**
 * Devis Comptables Page - Module Compta
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function DevisComptaPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Devis Comptables
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des devis avant facturation</p>
        </div>
        <Button><FileText className="mr-2 h-4 w-4" />Nouveau devis</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Devis envoyés</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">12</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Acceptés</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">8</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Taux conversion</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">66%</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Module Devis Comptables</h3>
          <p className="text-muted-foreground mb-6">Synchronisé avec le module Vente pour conversion en factures</p>
          <Button>Créer un devis</Button>
        </CardContent>
      </Card>
    </div>
  );
}
