/**
 * Contrats Page - Module Compta
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, RefreshCw } from 'lucide-react';

export default function ContratsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Contrats
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des contrats et abonnements</p>
        </div>
        <Button><FileText className="mr-2 h-4 w-4" />Nouveau contrat</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Contrats actifs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">24</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Abonnements</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">18</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">À renouveler</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">5</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">MRR</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">4.5K€</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestion des Contrats</h3>
          <p className="text-muted-foreground mb-6">Contrats clients, abonnements récurrents et renouvellements automatiques</p>
          <div className="flex gap-3 justify-center">
            <Button><FileText className="mr-2 h-4 w-4" />Contrat ponctuel</Button>
            <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Abonnement</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
