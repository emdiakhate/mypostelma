/**
 * Analyse Comparative Page
 *
 * Analyse comparative détaillée entre votre business et vos concurrents.
 * Fournit des insights IA, recommandations stratégiques et visualisations.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Building2,
  Target,
  Users,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { useCompetitors } from '@/hooks/useCompetitors';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface AnalysisInsight {
  dimension: string;
  myScore: number;
  avgCompetitorScore: number;
  status: 'ahead' | 'behind' | 'equal';
  recommendation: string;
}

export default function AnalyseComparativePage() {
  const navigate = useNavigate();
  const { business, loading: businessLoading } = useMyBusiness();
  const { competitors, loading: competitorsLoading } = useCompetitors();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);

  useEffect(() => {
    if (!businessLoading && !competitorsLoading) {
      generateInsights();
      setLoading(false);
    }
  }, [businessLoading, competitorsLoading, business, competitors]);

  const generateInsights = () => {
    if (!business) return;

    // Calcul des scores moyens des concurrents
    const competitorAvgs = {
      followers: competitors.reduce((sum, c) => sum + (c.instagram_followers || 0), 0) / (competitors.length || 1),
      engagement: 3.5, // Mock - À calculer depuis les données réelles
      contentQuality: 75, // Mock - À calculer avec IA
      postingFrequency: 4.2, // Mock - posts par semaine
    };

    const myMetrics = {
      followers: business.instagram_followers || 0,
      engagement: 2.8, // Mock
      contentQuality: 68, // Mock
      postingFrequency: 3.1, // Mock
    };

    const analysisInsights: AnalysisInsight[] = [
      {
        dimension: 'Nombre d\'abonnés',
        myScore: myMetrics.followers,
        avgCompetitorScore: competitorAvgs.followers,
        status: myMetrics.followers > competitorAvgs.followers ? 'ahead' : 'behind',
        recommendation: myMetrics.followers < competitorAvgs.followers
          ? 'Augmentez votre visibilité via des collaborations et du contenu viral'
          : 'Maintenez votre avance en publiant du contenu de qualité régulièrement',
      },
      {
        dimension: 'Taux d\'engagement',
        myScore: myMetrics.engagement,
        avgCompetitorScore: competitorAvgs.engagement,
        status: myMetrics.engagement > competitorAvgs.engagement ? 'ahead' : 'behind',
        recommendation: myMetrics.engagement < competitorAvgs.engagement
          ? 'Posez plus de questions, créez des sondages et encouragez les interactions'
          : 'Excellent engagement ! Continuez à interagir avec votre communauté',
      },
      {
        dimension: 'Qualité du contenu',
        myScore: myMetrics.contentQuality,
        avgCompetitorScore: competitorAvgs.contentQuality,
        status: myMetrics.contentQuality > competitorAvgs.contentQuality ? 'ahead' : 'behind',
        recommendation: myMetrics.contentQuality < competitorAvgs.contentQuality
          ? 'Investissez dans de meilleurs visuels et du storytelling percutant'
          : 'Votre contenu est de qualité supérieure, continuez ainsi !',
      },
      {
        dimension: 'Fréquence de publication',
        myScore: myMetrics.postingFrequency,
        avgCompetitorScore: competitorAvgs.postingFrequency,
        status: myMetrics.postingFrequency > competitorAvgs.postingFrequency ? 'ahead' : 'behind',
        recommendation: myMetrics.postingFrequency < competitorAvgs.postingFrequency
          ? 'Publiez plus régulièrement pour rester visible (objectif: 4-5 posts/semaine)'
          : 'Bonne fréquence de publication, maintenez ce rythme',
      },
    ];

    setInsights(analysisInsights);
  };

  // Données pour le radar chart
  const radarData = insights.map(insight => ({
    dimension: insight.dimension.split(' ')[0], // Premier mot pour gagner de la place
    Vous: (insight.myScore / Math.max(insight.myScore, insight.avgCompetitorScore)) * 100,
    Concurrents: (insight.avgCompetitorScore / Math.max(insight.myScore, insight.avgCompetitorScore)) * 100,
  }));

  // Données pour le bar chart
  const barData = insights.map(insight => ({
    name: insight.dimension,
    Vous: insight.myScore,
    Moyenne: insight.avgCompetitorScore,
  }));

  if (!business) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/reporting/concurrence/competitors')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analyse Comparative</h1>
          </div>
        </div>

        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Vous devez d'abord configurer votre profil business pour accéder à l'analyse comparative.
            <div className="mt-4">
              <Button onClick={() => navigate('/reporting/concurrence/competitors')}>
                Configurer mon business
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/reporting/concurrence/competitors')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analyse Comparative</h1>
          </div>
        </div>

        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Vous devez ajouter au moins un concurrent pour accéder à l'analyse comparative.
            <div className="mt-4">
              <Button onClick={() => navigate('/reporting/concurrence/competitors')}>
                Ajouter des concurrents
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/reporting/concurrence/competitors')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analyse Comparative</h1>
            <p className="text-muted-foreground">
              Comparez votre performance avec {competitors.length} concurrent{competitors.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {business.business_name}
        </Badge>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Points forts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {insights.filter(i => i.status === 'ahead').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dimensions où vous surpassez vos concurrents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600" />
              Points d'amélioration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {insights.filter(i => i.status === 'behind').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dimensions à améliorer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Score global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((insights.filter(i => i.status === 'ahead').length / insights.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Performance vs concurrence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualisations */}
      <Tabs defaultValue="radar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="radar">Vue Radar</TabsTrigger>
          <TabsTrigger value="bars">Comparaison Détaillée</TabsTrigger>
          <TabsTrigger value="insights">Insights & Recommandations</TabsTrigger>
        </TabsList>

        <TabsContent value="radar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Multi-dimensionnelle</CardTitle>
              <CardDescription>
                Comparez votre performance sur différentes dimensions clés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Vous"
                    dataKey="Vous"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Concurrents (moyenne)"
                    dataKey="Concurrents"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bars" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison par Métrique</CardTitle>
              <CardDescription>
                Détail des performances par dimension
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Vous" fill="#8b5cf6" />
                  <Bar dataKey="Moyenne" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{insight.dimension}</CardTitle>
                  <Badge
                    variant={insight.status === 'ahead' ? 'default' : 'secondary'}
                    className={
                      insight.status === 'ahead'
                        ? 'bg-green-600'
                        : 'bg-orange-600 text-white'
                    }
                  >
                    {insight.status === 'ahead' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {insight.status === 'ahead' ? 'Devant' : 'Derrière'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Votre score</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {typeof insight.myScore === 'number' && insight.myScore > 100
                        ? insight.myScore.toLocaleString()
                        : insight.myScore.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moyenne concurrents</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {typeof insight.avgCompetitorScore === 'number' && insight.avgCompetitorScore > 100
                        ? insight.avgCompetitorScore.toLocaleString()
                        : insight.avgCompetitorScore.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Progression</p>
                  <Progress
                    value={
                      (insight.myScore / (insight.myScore + insight.avgCompetitorScore)) * 100
                    }
                    className="h-2"
                  />
                </div>

                <Alert className={insight.status === 'ahead' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommandation:</strong> {insight.recommendation}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Actions recommandées */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Plan d'action prioritaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights
            .filter(i => i.status === 'behind')
            .sort((a, b) => (b.avgCompetitorScore - b.myScore) - (a.avgCompetitorScore - a.myScore))
            .slice(0, 3)
            .map((insight, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-blue-900">{insight.dimension}</p>
                  <p className="text-sm text-blue-700">{insight.recommendation}</p>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
