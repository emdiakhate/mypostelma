import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparativeAnalysisView } from '@/components/competitor/ComparativeAnalysisView';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { useCompetitors } from '@/hooks/useCompetitors';
import { ArrowLeft, Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ComparativeAnalysis } from '@/types/competitor';

export default function ComparativeAnalysisPage() {
  const navigate = useNavigate();
  const { business, loading: businessLoading } = useMyBusiness();
  const { competitors, loading: competitorsLoading } = useCompetitors();
  const [analysis, setAnalysis] = useState<ComparativeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!businessLoading && !competitorsLoading) {
      loadLatestAnalysis();
    }
  }, [businessLoading, competitorsLoading, business]);

  const loadLatestAnalysis = async () => {
    if (!business) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comparative_analysis' as any)
        .select('*')
        .eq('my_business_id', business.id)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setAnalysis(data as any);
    } catch (error) {
      console.error('Error loading analysis:', error);
      toast.error('Erreur lors du chargement de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const generateComparativeAnalysis = async () => {
    if (!business) {
      toast.error('Vous devez d\'abord configurer votre profil business');
      return;
    }

    if (!competitors || competitors.length === 0) {
      toast.error('Vous devez avoir au moins un concurrent pour générer une analyse comparative');
      return;
    }

    setGenerating(true);
    try {
      toast.info('Génération de l\'analyse comparative en cours...');

      const { data, error } = await supabase.functions.invoke('generate-comparative-analysis', {
        body: {
          my_business_id: business.id,
          competitor_ids: competitors.map(c => c.id),
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors de la génération');
      }

      toast.success('Analyse comparative générée avec succès !');
      await loadLatestAnalysis();
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      toast.error(error.message || 'Erreur lors de la génération de l\'analyse');
    } finally {
      setGenerating(false);
    }
  };

  if (businessLoading || competitorsLoading || loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Button
          onClick={() => navigate('/competitors')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux concurrents
        </Button>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-900">
            Vous devez d'abord configurer votre profil business pour accéder à l'analyse comparative.
            <Button
              onClick={() => navigate('/competitors')}
              className="ml-4"
              size="sm"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Configurer mon business
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!competitors || competitors.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Button
          onClick={() => navigate('/competitors')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux concurrents
        </Button>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-900">
            Vous devez avoir au moins un concurrent pour générer une analyse comparative.
            <Button
              onClick={() => navigate('/competitors')}
              className="ml-4"
              size="sm"
            >
              Ajouter un concurrent
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            onClick={() => navigate('/competitors')}
            variant="ghost"
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux concurrents
          </Button>
          <h1 className="text-3xl font-bold">Analyse Comparative</h1>
          <p className="text-muted-foreground mt-2">
            Comparez {business.business_name} avec {competitors.length} concurrent{competitors.length > 1 ? 's' : ''}
          </p>
        </div>

        <Button
          onClick={generateComparativeAnalysis}
          disabled={generating}
          size="lg"
        >
          {generating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {analysis ? 'Régénérer l\'analyse' : 'Générer l\'analyse'}
            </>
          )}
        </Button>
      </div>

      {/* Analysis Content */}
      {analysis ? (
        <ComparativeAnalysisView
          analysis={analysis}
          businessName={business.business_name}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Aucune analyse disponible</CardTitle>
            <CardDescription>
              Générez votre première analyse comparative pour obtenir des insights détaillés sur votre position
              par rapport à vos concurrents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateComparativeAnalysis} disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                'Générer l\'analyse maintenant'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
