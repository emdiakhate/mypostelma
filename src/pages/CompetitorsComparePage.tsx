import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, BarChart3, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CompetitorComparisonTable } from '@/components/CompetitorComparisonTable';
import { CompetitorMetricsChart } from '@/components/CompetitorMetricsChart';
import type { Tables } from '@/integrations/supabase/types';

type CompetitorComparison = Tables<'competitor_comparison'>;
type SentimentStats = Tables<'sentiment_statistics'>;
type LatestAnalysis = Tables<'competitor_latest_analysis'>;

export default function CompetitorsComparePage() {
  const navigate = useNavigate();
  const [competitors, setCompetitors] = useState<CompetitorComparison[]>([]);
  const [sentimentData, setSentimentData] = useState<Record<string, SentimentStats>>({});
  const [analysisData, setAnalysisData] = useState<Record<string, LatestAnalysis>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = async () => {
    try {
      const { data, error } = await supabase
        .from('competitor_comparison')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompetitors(data || []);

      // Load sentiment and analysis data for all competitors
      if (data && data.length > 0) {
        const competitorIds = data.map(c => c.id).filter(Boolean) as string[];
        
        // Load sentiment statistics
        const { data: sentimentStats } = await supabase
          .from('sentiment_statistics')
          .select('*')
          .in('competitor_id', competitorIds)
          .order('analyzed_at', { ascending: false });

        const sentimentMap: Record<string, SentimentStats> = {};
        sentimentStats?.forEach(stat => {
          if (!sentimentMap[stat.competitor_id]) {
            sentimentMap[stat.competitor_id] = stat;
          }
        });
        setSentimentData(sentimentMap);

        // Load latest analysis
        const { data: latestAnalyses } = await supabase
          .from('competitor_latest_analysis')
          .select('*')
          .in('competitor_id', competitorIds);

        const analysisMap: Record<string, LatestAnalysis> = {};
        latestAnalyses?.forEach(analysis => {
          if (analysis.competitor_id) {
            analysisMap[analysis.competitor_id] = analysis;
          }
        });
        setAnalysisData(analysisMap);
      }
    } catch (error) {
      console.error('Error loading competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompetitor = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    );
  };

  const selectedCompetitors = competitors.filter(c => c.id && selectedIds.includes(c.id));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app/competitors')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Comparaison de concurrents</h1>
            <p className="text-muted-foreground">
              Sélectionnez 2 à 4 concurrents pour les comparer
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {selectedIds.length} / 4 sélectionnés
        </Badge>
      </div>

      {/* Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sélection des concurrents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : competitors.length === 0 ? (
            <Alert>
              <AlertDescription>
                Aucun concurrent analysé trouvé. Ajoutez et analysez des concurrents depuis la page principale.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className={`
                    flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors
                    ${selectedIds.includes(competitor.id!)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                    }
                  `}
                  onClick={() => competitor.id && handleToggleCompetitor(competitor.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(competitor.id!)}
                    disabled={!selectedIds.includes(competitor.id!) && selectedIds.length >= 4}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{competitor.name}</div>
                    {competitor.industry && (
                      <Badge variant="secondary" className="mt-1">
                        {competitor.industry}
                      </Badge>
                    )}
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      {competitor.instagram_followers && (
                        <div>Instagram: {competitor.instagram_followers.toLocaleString()}</div>
                      )}
                      {competitor.avg_engagement_rate && (
                        <div>Engagement: {Number(competitor.avg_engagement_rate).toFixed(2)}%</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedIds.length >= 2 ? (
        <>
          <CompetitorComparisonTable 
            competitors={selectedCompetitors}
            sentimentData={sentimentData}
            analysisData={analysisData}
          />

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Évolution des métriques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedCompetitors.map((competitor) => {
                  // Create a compatible competitor object
                  const compatibleCompetitor = {
                    name: competitor.name || '',
                    instagram_followers: competitor.instagram_followers?.toString(),
                    facebook_likes: competitor.facebook_likes?.toString(),
                    linkedin_followers: competitor.linkedin_followers?.toString(),
                  };
                  return (
                    <div key={competitor.id}>
                      <h3 className="font-semibold mb-3">{competitor.name}</h3>
                      <CompetitorMetricsChart 
                        competitorId={competitor.id!}
                        competitor={compatibleCompetitor} 
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertDescription>
            Sélectionnez au moins 2 concurrents pour voir la comparaison détaillée.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
