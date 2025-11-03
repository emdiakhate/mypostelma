import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus } from 'lucide-react';

function Analytics() {

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Analysez les performances de vos publications
          </p>
        </div>
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="py-16">
          <div className="text-center max-w-md mx-auto">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
            <p className="text-gray-600 mb-6">
              Commencez à publier du contenu pour voir vos statistiques apparaître ici
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/app/settings/accounts">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Connecter mes comptes
                </Button>
              </Link>
              <Link to="/app/calendar">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une publication
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Analytics;