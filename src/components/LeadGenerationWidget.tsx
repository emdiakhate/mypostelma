import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { useLeadGeneration } from '@/hooks/useLeadGeneration';

export const LeadGenerationWidget: React.FC = () => {
  const { count, limit, remaining, canGenerate, isLoading } = useLeadGeneration();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (count / limit) * 100;
  
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Génération de Leads</h3>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {count}/{limit} utilisées
          </span>
        </div>

        <Progress value={progressPercentage} className="h-2" />

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Restantes</span>
          <span className={`font-bold ${
            remaining === 0 ? 'text-red-600' :
            remaining <= 2 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {remaining}
          </span>
        </div>

        {!canGenerate && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Limite atteinte ! Vous avez utilisé toutes vos générations de leads.
            </AlertDescription>
          </Alert>
        )}

        {canGenerate && remaining <= 2 && (
          <Alert className="mt-2 border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Attention ! Plus que {remaining} génération{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
