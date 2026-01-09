/**
 * Stock - Inventaire et Ajustements
 *
 * Page combinée pour gérer les inventaires et ajustements de stock
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package } from 'lucide-react';
import InventoriesTab from './InventoriesTab';
import AdjustmentsTab from './AdjustmentsTab';

export default function InventairePage() {
  const [activeTab, setActiveTab] = useState('inventaires');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="h-8 w-8" />
          Inventaire et Ajustements
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos inventaires physiques et ajustements de stock
        </p>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inventaires">Inventaires</TabsTrigger>
              <TabsTrigger value="ajustements">Ajustements</TabsTrigger>
            </TabsList>

            <TabsContent value="inventaires" className="mt-6">
              <InventoriesTab />
            </TabsContent>

            <TabsContent value="ajustements" className="mt-6">
              <AdjustmentsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
