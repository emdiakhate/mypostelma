/**
 * CompetitorCard Component
 *
 * Displays competitor information and their latest AI analysis.
 * Shows social media presence, strengths, weaknesses, and strategic opportunities.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  BarChart3,
  Trash2,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Download,
  FileText,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { TwitterIcon, TikTokIcon } from '@/config/socialIcons';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Competitor } from '@/types/competitor';
import type { CompetitorAnalysis } from '@/services/competitorAnalytics';
import {
  analyzeCompetitorStrategy,
  deleteCompetitor,
  getLatestAnalysis,
} from '@/services/competitorAnalytics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompetitorMetricsChart } from './CompetitorMetricsChart';
import { SentimentAnalysisView } from './SentimentAnalysisView';
import { exportToPDF, exportToExcel } from '@/utils/exportAnalysis';

interface CompetitorCardProps {
  competitor: Competitor;
  onUpdate?: () => void;
  onEdit?: (competitor: Competitor) => void;
}

export function CompetitorCard({ competitor, onUpdate, onEdit }: CompetitorCardProps) {
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSentimentAnalyzing, setIsSentimentAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const { toast } = useToast();

  // Load analysis when card is expanded
  const handleExpand = async () => {
    if (!isExpanded && !analysis) {
      setIsLoadingAnalysis(true);
      try {
        const latestAnalysis = await getLatestAnalysis(competitor.id);
        setAnalysis(latestAnalysis);
      } catch (error) {
        // Silent error - will show empty state in UI
      } finally {
        setIsLoadingAnalysis(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeCompetitorStrategy({
        ...competitor,
        added_at: competitor.added_at.toISOString(),
        last_analyzed_at: competitor.last_analyzed_at?.toISOString(),
      });

      toast({
        title: 'Analyse lancée',
        description: `Analyse de ${competitor.name} en cours... Cela prendra 1-5 minutes (Apify + OpenAI).`,
      });

      // Poll for analysis completion (check every 15s for up to 5 minutes)
      const pollInterval = 15000; // 15 seconds
      const maxAttempts = 20; // 20 attempts = 5 minutes
      let attempts = 0;

      const pollForAnalysis = setInterval(async () => {
        attempts++;
        try {
          const latestAnalysis = await getLatestAnalysis(competitor.id);

          // Check if this is a new analysis (within last 2 minutes)
          if (latestAnalysis && new Date(latestAnalysis.analyzed_at).getTime() > Date.now() - 120000) {
            clearInterval(pollForAnalysis);
            setAnalysis(latestAnalysis);
            toast({
              title: 'Analyse terminée',
              description: `${competitor.name} a été analysé avec succès.`,
            });
            onUpdate?.();
            setIsAnalyzing(false);
          } else if (attempts >= maxAttempts) {
            // Timeout after 5 minutes
            clearInterval(pollForAnalysis);
            toast({
              title: 'Analyse plus longue que prévu',
              description: 'L\'analyse prend plus de temps que prévu. Veuillez revenir dans quelques minutes.',
              variant: 'destructive',
            });
            setIsAnalyzing(false);
          }
        } catch (error) {
          // Silent error during polling, will timeout naturally
        }
      }, pollInterval);

    } catch (error) {
      toast({
        title: 'Échec de l\'analyse',
        description: 'Impossible d\'analyser le concurrent. Veuillez réessayer.',
        variant: 'destructive',
      });
      setIsAnalyzing(false);
    }
  };

  const handleSentimentAnalysis = async () => {
    // Check if competitor has been analyzed at least once
    if (!competitor.last_analyzed_at && competitor.analysis_count === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez d\'abord lancer une analyse standard',
        variant: 'destructive',
      });
      return;
    }

    // Check if competitor has social media URLs
    const hasUrls = competitor.instagram_url || competitor.facebook_url || competitor.twitter_url;
    if (!hasUrls) {
      toast({
        title: 'URLs manquantes',
        description: 'Ce concurrent n\'a aucun compte de réseau social configuré. Ajoutez au moins une URL (Instagram, Facebook ou Twitter).',
        variant: 'destructive',
      });
      return;
    }

    setIsSentimentAnalyzing(true);
    try {
      // Get latest analysis if not already loaded
      let analysisId = analysis?.id;
      if (!analysisId) {
        const latestAnalysis = await getLatestAnalysis(competitor.id);
        if (!latestAnalysis) {
          throw new Error('Aucune analyse trouvée pour ce concurrent');
        }
        analysisId = latestAnalysis.id;
        setAnalysis(latestAnalysis);
      }

      const { data, error } = await supabase.functions.invoke('analyze-competitor-sentiment', {
        body: {
          competitor_id: competitor.id,
          analysis_id: analysisId,
        },
      });

      // Check for HTTP error first, but also check if data contains an error message
      if (error) {
        // Try to extract error message from the error context
        let errorMessage = 'Erreur lors de l\'analyse';

        // Check if error has a context with error details
        if (error?.context?.error) {
          errorMessage = error.context.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // Show detailed error toast
        toast({
          title: 'Erreur d\'analyse',
          description: errorMessage,
          variant: 'destructive',
          duration: 15000,
        });
        return;
      }
      
      if (data && !data.success) {
        const errorMessage = data?.error || 'Erreur lors de l\'analyse';
        toast({
          title: 'Erreur d\'analyse',
          description: errorMessage,
          variant: 'destructive',
          duration: 15000,
        });
        return;
      }

      toast({
        title: 'Analyse de sentiment terminée',
        description: 'Les résultats sont disponibles dans l\'onglet Sentiment',
      });
      
      // Refresh the sentiment data
      setIsExpanded(false);
      setTimeout(() => setIsExpanded(true), 100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible d\'analyser le sentiment. Vérifiez que les URLs sont correctes.';
      toast({
        title: 'Erreur d\'analyse',
        description: errorMessage,
        variant: 'destructive',
        duration: 15000,
      });
    } finally {
      setIsSentimentAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCompetitor(competitor.id);
      toast({
        title: 'Concurrent supprimé',
        description: `${competitor.name} a été supprimé.`,
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Échec de la suppression',
        description: 'Impossible de supprimer le concurrent. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{competitor.name}</CardTitle>
              {competitor.industry && (
                <CardDescription>{competitor.industry}</CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(competitor)}
                >
                  Éditer
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {competitor.analysis_count > 0 ? 'Ré-analyser' : 'Analyser'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSentimentAnalysis}
                disabled={isSentimentAnalyzing || (!competitor.last_analyzed_at && competitor.analysis_count === 0)}
              >
                {isSentimentAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyse sentiment...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Analyser sentiment
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Social Media Links */}
          <div className="flex gap-2 flex-wrap">
            {competitor.instagram_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={competitor.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4 mr-2" />
                  {competitor.instagram_followers || 'Instagram'}
                </a>
              </Button>
            )}
            {competitor.facebook_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={competitor.facebook_url} target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-4 w-4 mr-2" />
                  {competitor.facebook_likes || 'Facebook'}
                </a>
              </Button>
            )}
            {competitor.linkedin_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={competitor.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />
                  {competitor.linkedin_followers || 'LinkedIn'}
                </a>
              </Button>
            )}
            {competitor.twitter_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={competitor.twitter_url} target="_blank" rel="noopener noreferrer">
                  <TwitterIcon className="h-4 w-4 mr-2" />
                  X (Twitter)
                </a>
              </Button>
            )}
            {competitor.tiktok_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={competitor.tiktok_url} target="_blank" rel="noopener noreferrer">
                  <TikTokIcon className="h-4 w-4 mr-2" />
                  TikTok
                </a>
              </Button>
            )}
            {competitor.youtube_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={competitor.youtube_url} target="_blank" rel="noopener noreferrer">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <polygon points="10,8 16,12 10,16"/>
                  </svg>
                  YouTube
                </a>
              </Button>
            )}
            {competitor.website_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={competitor.website_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
          </div>

          {/* Analysis Stats */}
          {competitor.analysis_count > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Analysé {competitor.analysis_count} fois</span>
              {competitor.last_analyzed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Dernière analyse : {formatDistanceToNow(competitor.last_analyzed_at, { addSuffix: true, locale: fr })}
                </p>
              )}
            </div>
          )}

          {/* No Analysis Yet */}
          {competitor.analysis_count === 0 && (
            <Alert>
              <AlertDescription>
                Aucune analyse disponible. Cliquez sur "Analyser" pour commencer la collecte d'informations concurrentielles.
              </AlertDescription>
            </Alert>
          )}

          {/* Latest Analysis (Collapsible) */}
          {competitor.analysis_count > 0 && (
            <Collapsible open={isExpanded} onOpenChange={handleExpand}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>Voir la dernière analyse</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                {isLoadingAnalysis ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : analysis ? (
                  <>
                    {/* Export Buttons */}
                    <div className="flex gap-2 justify-end mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(competitor, analysis)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Exporter PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToExcel(competitor, analysis)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Excel
                      </Button>
                    </div>

                    {/* Tabs for different views */}
                    <Tabs defaultValue="analysis" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="analysis">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analyse
                        </TabsTrigger>
                        <TabsTrigger value="sentiment">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Sentiment
                        </TabsTrigger>
                        <TabsTrigger value="charts">
                          <Activity className="h-4 w-4 mr-2" />
                          Graphiques
                        </TabsTrigger>
                      </TabsList>

                      {/* Analysis Tab */}
                      <TabsContent value="analysis" className="space-y-4 mt-4">
                        {/* Summary */}
                        {analysis.summary && (
                          <div>
                            <h4 className="font-semibold mb-2">Résumé exécutif</h4>
                            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                          </div>
                        )}

                        <Separator />

                        {/* Positioning & Strategy */}
                        {analysis.positioning && (
                          <div>
                            <h4 className="font-semibold mb-2">Positionnement</h4>
                            <p className="text-sm text-muted-foreground">{analysis.positioning}</p>
                          </div>
                        )}

                        {analysis.content_strategy && (
                          <div>
                            <h4 className="font-semibold mb-2">Stratégie de contenu</h4>
                            <p className="text-sm text-muted-foreground">{analysis.content_strategy}</p>
                          </div>
                        )}

                        {/* Strengths */}
                        {analysis.strengths && analysis.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              Forces
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.strengths.map((strength, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground">{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-500" />
                              Faiblesses
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.weaknesses.map((weakness, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground">{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Opportunities */}
                        {analysis.opportunities_for_us && analysis.opportunities_for_us.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              Opportunités pour vous
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.opportunities_for_us.map((opportunity, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground">{opportunity}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Separator />

                        {/* Additional Info */}
                        <div className="grid grid-cols-2 gap-4">
                          {analysis.tone && (
                            <div>
                              <h5 className="text-xs font-semibold text-muted-foreground mb-1">Ton</h5>
                              <Badge variant="secondary">{analysis.tone}</Badge>
                            </div>
                          )}
                          {analysis.estimated_budget && (
                            <div>
                              <h5 className="text-xs font-semibold text-muted-foreground mb-1">Budget estimé</h5>
                              <Badge variant="secondary">{analysis.estimated_budget}</Badge>
                            </div>
                          )}
                        </div>

                        {/* Recommendations */}
                        {analysis.recommendations && (
                          <div>
                            <h4 className="font-semibold mb-2">Recommandations stratégiques</h4>
                            <p className="text-sm text-muted-foreground">{analysis.recommendations}</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Sentiment Tab */}
                      <TabsContent value="sentiment" className="mt-4">
                        <SentimentAnalysisView
                          analysisId={analysis.id}
                          competitorName={competitor.name}
                          competitorId={competitor.id}
                          onTriggerAnalysis={handleSentimentAnalysis}
                          isAnalyzing={isSentimentAnalyzing}
                        />
                      </TabsContent>

                      {/* Charts Tab */}
                      <TabsContent value="charts" className="mt-4">
                        <CompetitorMetricsChart competitorId={competitor.id} competitor={competitor} />
                      </TabsContent>
                    </Tabs>
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Échec du chargement de l'analyse. Veuillez essayer de ré-analyser.
                    </AlertDescription>
                  </Alert>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le concurrent</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {competitor.name} ? Cela supprimera également toutes les analyses associées et ne peut pas être annulé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
