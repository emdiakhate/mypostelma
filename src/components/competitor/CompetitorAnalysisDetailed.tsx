/**
 * CompetitorAnalysisDetailed Component
 *
 * Displays comprehensive competitor analysis following the strategic framework:
 * 1. Contexte et objectifs
 * 2. Identité de marque
 * 3. Analyse de l'offre et du positionnement
 * 4. Présence digitale et marketing
 * 5. SWOT Analysis
 * 6. Analyse concurrentielle directe
 * 7. Insights et recommandations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Palette,
  Package,
  Globe,
  Shield,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Calendar,
  BarChart3,
} from 'lucide-react';
import type { CompetitorAnalysisExtended } from '@/types/competitor';

interface CompetitorAnalysisDetailedProps {
  analysis: CompetitorAnalysisExtended;
  competitorName: string;
}

export function CompetitorAnalysisDetailed({ analysis, competitorName }: CompetitorAnalysisDetailedProps) {
  return (
    <div className="space-y-6">
      {/* 1. Contexte et Objectifs */}
      {analysis.context_objectives && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Contexte et Objectifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.context_objectives.brand_presentation && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Présentation de la marque</h4>
                <p className="text-sm text-muted-foreground">{analysis.context_objectives.brand_presentation}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.context_objectives.target_audience && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground mb-1">Cible principale</h5>
                  <p className="text-sm">{analysis.context_objectives.target_audience}</p>
                </div>
              )}

              {analysis.context_objectives.main_offering && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground mb-1">Offre principale</h5>
                  <p className="text-sm">{analysis.context_objectives.main_offering}</p>
                </div>
              )}
            </div>

            {analysis.context_objectives.analysis_objectives && analysis.context_objectives.analysis_objectives.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Objectifs de l'analyse</h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.context_objectives.analysis_objectives.map((objective, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{objective}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. Identité de Marque */}
      {analysis.brand_identity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Identité de Marque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Univers visuel */}
            {analysis.brand_identity.visual_universe && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Univers Visuel</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.brand_identity.visual_universe.logo_style && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Style du logo</h5>
                      <p className="text-sm">{analysis.brand_identity.visual_universe.logo_style}</p>
                    </div>
                  )}

                  {analysis.brand_identity.visual_universe.primary_colors && analysis.brand_identity.visual_universe.primary_colors.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Couleurs principales</h5>
                      <div className="flex gap-2 flex-wrap">
                        {analysis.brand_identity.visual_universe.primary_colors.map((color, idx) => (
                          <Badge key={idx} variant="secondary">{color}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.brand_identity.visual_universe.typography && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Typographie</h5>
                      <p className="text-sm">{analysis.brand_identity.visual_universe.typography}</p>
                    </div>
                  )}

                  {analysis.brand_identity.visual_universe.image_style && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Style d'images</h5>
                      <p className="text-sm">{analysis.brand_identity.visual_universe.image_style}</p>
                    </div>
                  )}
                </div>

                {analysis.brand_identity.visual_universe.visual_consistency && (
                  <div className="mt-3">
                    <h5 className="text-xs font-semibold text-muted-foreground mb-1">Cohérence visuelle</h5>
                    <p className="text-sm text-muted-foreground">{analysis.brand_identity.visual_universe.visual_consistency}</p>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Ton et messages */}
            {analysis.brand_identity.tone_and_messages && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Ton et Messages Clés</h4>
                <div className="space-y-3">
                  {analysis.brand_identity.tone_and_messages.communication_tone && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Ton de communication</h5>
                      <Badge>{analysis.brand_identity.tone_and_messages.communication_tone}</Badge>
                    </div>
                  )}

                  {analysis.brand_identity.tone_and_messages.main_promise && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Promesse principale</h5>
                      <p className="text-sm">{analysis.brand_identity.tone_and_messages.main_promise}</p>
                    </div>
                  )}

                  {analysis.brand_identity.tone_and_messages.core_values && analysis.brand_identity.tone_and_messages.core_values.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Valeurs mises en avant</h5>
                      <div className="flex gap-2 flex-wrap">
                        {analysis.brand_identity.tone_and_messages.core_values.map((value, idx) => (
                          <Badge key={idx} variant="outline">{value}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.brand_identity.tone_and_messages.storytelling && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Storytelling</h5>
                      <p className="text-sm text-muted-foreground">{analysis.brand_identity.tone_and_messages.storytelling}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Analyse de l'Offre et du Positionnement */}
      {analysis.offering_positioning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Offre et Positionnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Produits/Services */}
            {analysis.offering_positioning.products_services && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Produits et Services</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.offering_positioning.products_services.product_range && analysis.offering_positioning.products_services.product_range.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Gamme de produits</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.offering_positioning.products_services.product_range.map((product, idx) => (
                          <li key={idx} className="text-sm">{product}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.offering_positioning.products_services.price_levels && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Niveau de prix</h5>
                      <Badge variant="secondary">{analysis.offering_positioning.products_services.price_levels}</Badge>
                    </div>
                  )}

                  {analysis.offering_positioning.products_services.business_model && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Modèle économique</h5>
                      <Badge>{analysis.offering_positioning.products_services.business_model}</Badge>
                    </div>
                  )}
                </div>

                {analysis.offering_positioning.products_services.differentiators && analysis.offering_positioning.products_services.differentiators.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-xs font-semibold text-muted-foreground mb-1">Éléments différenciants</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.offering_positioning.products_services.differentiators.map((diff, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{diff}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Positionnement */}
            {analysis.offering_positioning.positioning && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Positionnement</h4>
                <div className="space-y-3">
                  {analysis.offering_positioning.positioning.segment && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Segment visé</h5>
                      <Badge variant="outline">{analysis.offering_positioning.positioning.segment}</Badge>
                    </div>
                  )}

                  {analysis.offering_positioning.positioning.target_personas && analysis.offering_positioning.positioning.target_personas.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Personas cibles</h5>
                      <div className="flex gap-2 flex-wrap">
                        {analysis.offering_positioning.positioning.target_personas.map((persona, idx) => (
                          <Badge key={idx} variant="secondary">{persona}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.offering_positioning.positioning.value_proposition && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Proposition de valeur</h5>
                      <p className="text-sm">{analysis.offering_positioning.positioning.value_proposition}</p>
                    </div>
                  )}

                  {analysis.offering_positioning.positioning.vs_competitors && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Par rapport aux concurrents</h5>
                      <p className="text-sm text-muted-foreground">{analysis.offering_positioning.positioning.vs_competitors}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Présence Digitale et Marketing */}
      {analysis.digital_presence && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              Présence Digitale et Marketing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Site Web */}
            {analysis.digital_presence.website && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Site Web</h4>
                <div className="space-y-3">
                  {analysis.digital_presence.website.ux_quality && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="text-xs font-semibold text-muted-foreground">Qualité UX</h5>
                        <span className="text-sm font-semibold">{analysis.digital_presence.website.ux_quality}/10</span>
                      </div>
                      <Progress value={analysis.digital_presence.website.ux_quality * 10} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.digital_presence.website.user_journey_clarity && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-1">Clarté du parcours</h5>
                        <p className="text-sm">{analysis.digital_presence.website.user_journey_clarity}</p>
                      </div>
                    )}

                    {analysis.digital_presence.website.content_quality && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-1">Qualité des contenus</h5>
                        <p className="text-sm">{analysis.digital_presence.website.content_quality}</p>
                      </div>
                    )}

                    {analysis.digital_presence.website.loading_speed && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-1">Vitesse de chargement</h5>
                        <p className="text-sm">{analysis.digital_presence.website.loading_speed}</p>
                      </div>
                    )}
                  </div>

                  {analysis.digital_presence.website.seo_basics && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2">SEO de base</h5>
                      <div className="space-y-2">
                        {analysis.digital_presence.website.seo_basics.structure && (
                          <p className="text-sm text-muted-foreground">Structure: {analysis.digital_presence.website.seo_basics.structure}</p>
                        )}
                        {analysis.digital_presence.website.seo_basics.keywords && analysis.digital_presence.website.seo_basics.keywords.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Mots-clés visibles:</p>
                            <div className="flex gap-1 flex-wrap">
                              {analysis.digital_presence.website.seo_basics.keywords.map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{keyword}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {analysis.digital_presence.website.seo_basics.has_blog !== undefined && (
                          <div className="flex items-center gap-2">
                            {analysis.digital_presence.website.seo_basics.has_blog ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">Blog {analysis.digital_presence.website.seo_basics.has_blog ? 'présent' : 'absent'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Réseaux Sociaux */}
            {analysis.digital_presence.social_media && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Réseaux Sociaux</h4>
                <div className="space-y-3">
                  {analysis.digital_presence.social_media.platforms_used && analysis.digital_presence.social_media.platforms_used.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Plateformes utilisées</h5>
                      <div className="flex gap-2 flex-wrap">
                        {analysis.digital_presence.social_media.platforms_used.map((platform, idx) => (
                          <Badge key={idx}>{platform}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.digital_presence.social_media.posting_frequency && Object.keys(analysis.digital_presence.social_media.posting_frequency).length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2">Fréquence de publication</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(analysis.digital_presence.social_media.posting_frequency).map(([platform, freq]) => (
                          <div key={platform} className="text-sm">
                            <span className="font-medium capitalize">{platform}:</span> {freq}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.digital_presence.social_media.engagement_metrics && Object.keys(analysis.digital_presence.social_media.engagement_metrics).length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2">Métriques d'engagement</h5>
                      <div className="space-y-2">
                        {Object.entries(analysis.digital_presence.social_media.engagement_metrics).map(([platform, metrics]) => (
                          <div key={platform} className="border rounded-lg p-3">
                            <h6 className="font-medium text-sm capitalize mb-2">{platform}</h6>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              {metrics.likes_avg !== undefined && (
                                <div>
                                  <p className="text-muted-foreground">Likes moy.</p>
                                  <p className="font-semibold">{metrics.likes_avg}</p>
                                </div>
                              )}
                              {metrics.comments_avg !== undefined && (
                                <div>
                                  <p className="text-muted-foreground">Comm. moy.</p>
                                  <p className="font-semibold">{metrics.comments_avg}</p>
                                </div>
                              )}
                              {metrics.shares_avg !== undefined && (
                                <div>
                                  <p className="text-muted-foreground">Partages moy.</p>
                                  <p className="font-semibold">{metrics.shares_avg}</p>
                                </div>
                              )}
                              {metrics.engagement_rate !== undefined && (
                                <div>
                                  <p className="text-muted-foreground">Taux eng.</p>
                                  <p className="font-semibold">{metrics.engagement_rate}%</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.digital_presence.social_media.content_types && analysis.digital_presence.social_media.content_types.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Types de contenu</h5>
                      <div className="flex gap-2 flex-wrap">
                        {analysis.digital_presence.social_media.content_types.map((type, idx) => (
                          <Badge key={idx} variant="outline">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.digital_presence.social_media.brand_consistency && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-1">Cohérence de marque</h5>
                      <p className="text-sm text-muted-foreground">{analysis.digital_presence.social_media.brand_consistency}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. SWOT Analysis */}
      {analysis.swot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              Analyse SWOT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Forces */}
              {analysis.swot.strengths && analysis.swot.strengths.length > 0 && (
                <div className="border rounded-lg p-4 bg-green-50/50">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Forces
                  </h4>
                  <ul className="space-y-2">
                    {analysis.swot.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Faiblesses */}
              {analysis.swot.weaknesses && analysis.swot.weaknesses.length > 0 && (
                <div className="border rounded-lg p-4 bg-red-50/50">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Faiblesses
                  </h4>
                  <ul className="space-y-2">
                    {analysis.swot.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunités */}
              {analysis.swot.opportunities && analysis.swot.opportunities.length > 0 && (
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    Opportunités
                  </h4>
                  <ul className="space-y-2">
                    {analysis.swot.opportunities.map((opportunity, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Menaces */}
              {analysis.swot.threats && analysis.swot.threats.length > 0 && (
                <div className="border rounded-lg p-4 bg-orange-50/50">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Menaces
                  </h4>
                  <ul className="space-y-2">
                    {analysis.swot.threats.map((threat, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>{threat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Analyse Concurrentielle Directe */}
      {analysis.competitive_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-500" />
              Analyse Concurrentielle Directe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.competitive_analysis.market_position && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-1">Position sur le marché</h5>
                <p className="text-sm">{analysis.competitive_analysis.market_position}</p>
              </div>
            )}

            {analysis.competitive_analysis.market_share_estimate && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-1">Part de marché estimée</h5>
                <Badge variant="secondary">{analysis.competitive_analysis.market_share_estimate}</Badge>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Avantages */}
              {analysis.competitive_analysis.advantages && analysis.competitive_analysis.advantages.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Avantages du concurrent
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.competitive_analysis.advantages.map((advantage, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{advantage}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Inconvénients */}
              {analysis.competitive_analysis.disadvantages && analysis.competitive_analysis.disadvantages.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Inconvénients du concurrent
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.competitive_analysis.disadvantages.map((disadvantage, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{disadvantage}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. Insights et Recommandations */}
      {analysis.insights_recommendations && (
        <Card className="border-2 border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Insights et Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Insights clés */}
            {analysis.insights_recommendations.key_insights && analysis.insights_recommendations.key_insights.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Insights Clés</h4>
                <div className="space-y-2">
                  {analysis.insights_recommendations.key_insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-white rounded-lg border">
                      <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Recommandations actionnables */}
            {analysis.insights_recommendations.actionable_recommendations && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Recommandations Actionnables</h4>
                <div className="space-y-4">
                  {analysis.insights_recommendations.actionable_recommendations.short_term && analysis.insights_recommendations.actionable_recommendations.short_term.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Court terme
                      </h5>
                      <ul className="space-y-1">
                        {analysis.insights_recommendations.actionable_recommendations.short_term.map((action, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-yellow-600">→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.insights_recommendations.actionable_recommendations.medium_term && analysis.insights_recommendations.actionable_recommendations.medium_term.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Moyen terme
                      </h5>
                      <ul className="space-y-1">
                        {analysis.insights_recommendations.actionable_recommendations.medium_term.map((action, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-yellow-600">→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.insights_recommendations.actionable_recommendations.long_term && analysis.insights_recommendations.actionable_recommendations.long_term.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Long terme
                      </h5>
                      <ul className="space-y-1">
                        {analysis.insights_recommendations.actionable_recommendations.long_term.map((action, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-yellow-600">→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions prioritaires */}
            {analysis.insights_recommendations.priority_actions && analysis.insights_recommendations.priority_actions.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-700" />
                  Actions Prioritaires
                </h4>
                <ul className="space-y-2">
                  {analysis.insights_recommendations.priority_actions.map((action, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <Badge variant="default" className="bg-yellow-700">{idx + 1}</Badge>
                      <span className="mt-0.5">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Métadonnées */}
      {analysis.metadata && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {analysis.metadata.confidence_score !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Score de confiance</p>
                  <div className="flex items-center gap-2">
                    <Progress value={analysis.metadata.confidence_score} className="h-2 flex-1" />
                    <span className="font-semibold">{analysis.metadata.confidence_score}%</span>
                  </div>
                </div>
              )}
              {analysis.metadata.data_sources && analysis.metadata.data_sources.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sources de données</p>
                  <p className="font-semibold">{analysis.metadata.data_sources.length} sources</p>
                </div>
              )}
              {analysis.metadata.tokens_used && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tokens utilisés</p>
                  <p className="font-semibold">{analysis.metadata.tokens_used.toLocaleString()}</p>
                </div>
              )}
              {analysis.metadata.analysis_cost && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Coût d'analyse</p>
                  <p className="font-semibold">{analysis.metadata.analysis_cost.toFixed(4)}€</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
