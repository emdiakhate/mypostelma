/**
 * ComparativeAnalysisView Component
 *
 * Displays comparative analysis between user's business and competitors
 * Highlights strengths, weaknesses, and opportunities with actionable recommendations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Trophy,
  Activity,
} from 'lucide-react';
import type { ComparativeAnalysis } from '@/types/competitor';

interface ComparativeAnalysisViewProps {
  analysis: ComparativeAnalysis;
  businessName: string;
}

export function ComparativeAnalysisView({ analysis, businessName }: ComparativeAnalysisViewProps) {
  return (
    <div className="space-y-6">
      {/* Header Alert - Market Position */}
      {analysis.overall_comparison?.market_position && (
        <Alert className="border-blue-200 bg-blue-50">
          <Trophy className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900">Votre position sur le marché</AlertTitle>
          <AlertDescription className="text-blue-800">
            {analysis.overall_comparison.market_position}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overall">Vue globale</TabsTrigger>
          <TabsTrigger value="domains">Par domaine</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overall Comparison Tab */}
        <TabsContent value="overall" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths vs Competitors */}
            {analysis.overall_comparison?.strengths_vs_competitors && analysis.overall_comparison.strengths_vs_competitors.length > 0 && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Vos forces par rapport aux concurrents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.overall_comparison.strengths_vs_competitors.map((strength, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Weaknesses vs Competitors */}
            {analysis.overall_comparison?.weaknesses_vs_competitors && analysis.overall_comparison.weaknesses_vs_competitors.length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Points à améliorer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.overall_comparison.weaknesses_vs_competitors.map((weakness, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            {analysis.overall_comparison?.opportunities_identified && analysis.overall_comparison.opportunities_identified.length > 0 && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Opportunités identifiées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.overall_comparison.opportunities_identified.map((opportunity, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Threats */}
            {analysis.overall_comparison?.threats_identified && analysis.overall_comparison.threats_identified.length > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Menaces à surveiller
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.overall_comparison.threats_identified.map((threat, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>{threat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Domain Comparisons Tab */}
        <TabsContent value="domains" className="space-y-4 mt-4">
          {analysis.domain_comparisons && (
            <div className="space-y-4">
              {Object.entries(analysis.domain_comparisons).map(([domain, data]) => (
                <Card key={domain}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize">
                        {domain.replace(/_/g, ' ')}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{data.score}/100</span>
                        <Progress value={data.score} className="w-24 h-2" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{data.comparison}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!analysis.domain_comparisons || Object.keys(analysis.domain_comparisons).length === 0 && (
            <Alert>
              <AlertDescription>
                Aucune comparaison par domaine n'est disponible pour le moment.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4 mt-4">
          {analysis.personalized_recommendations && (
            <div className="space-y-4">
              {/* Quick Wins */}
              {analysis.personalized_recommendations.quick_wins && analysis.personalized_recommendations.quick_wins.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Quick Wins - Actions rapides à fort impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.personalized_recommendations.quick_wins.map((action, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <Badge variant="default" className="bg-yellow-600 flex-shrink-0">
                            {idx + 1}
                          </Badge>
                          <span className="mt-0.5">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Strategic Moves */}
              {analysis.personalized_recommendations.strategic_moves && analysis.personalized_recommendations.strategic_moves.length > 0 && (
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      Mouvements stratégiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.personalized_recommendations.strategic_moves.map((move, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-purple-600 flex-shrink-0">→</span>
                          <span>{move}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Areas to Improve */}
              {analysis.personalized_recommendations.areas_to_improve && analysis.personalized_recommendations.areas_to_improve.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      Domaines à améliorer en priorité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.personalized_recommendations.areas_to_improve.map((area, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Competitive Advantages */}
              {analysis.personalized_recommendations.competitive_advantages && analysis.personalized_recommendations.competitive_advantages.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-green-600" />
                      Avantages compétitifs à exploiter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.personalized_recommendations.competitive_advantages.map((advantage, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{advantage}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!analysis.personalized_recommendations && (
            <Alert>
              <AlertDescription>
                Aucune recommandation n'est disponible pour le moment.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          {analysis.data_insights && (
            <div className="space-y-4">
              {/* Vs Market Leader */}
              {analysis.data_insights.vs_market_leader && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-600" />
                      Par rapport au leader du marché
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.data_insights.vs_market_leader}</p>
                  </CardContent>
                </Card>
              )}

              {/* Vs Average Competitor */}
              {analysis.data_insights.vs_average_competitor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      Par rapport à la moyenne des concurrents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.data_insights.vs_average_competitor}</p>
                  </CardContent>
                </Card>
              )}

              {/* Growth Potential */}
              {analysis.data_insights.growth_potential && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Potentiel de croissance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.data_insights.growth_potential}</p>
                  </CardContent>
                </Card>
              )}

              {/* Differentiation Opportunities */}
              {analysis.data_insights.differentiation_opportunities && analysis.data_insights.differentiation_opportunities.length > 0 && (
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      Opportunités de différenciation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.data_insights.differentiation_opportunities.map((opportunity, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <Zap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!analysis.data_insights && (
            <Alert>
              <AlertDescription>
                Aucun insight n'est disponible pour le moment.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
