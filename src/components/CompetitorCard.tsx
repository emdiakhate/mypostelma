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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Competitor } from '@/types/competitor';
import type { CompetitorAnalysis } from '@/services/competitorAnalytics';
import {
  analyzeCompetitorStrategy,
  deleteCompetitor,
  getLatestAnalysis,
} from '@/services/competitorAnalytics';
import { useToast } from '@/hooks/use-toast';

interface CompetitorCardProps {
  competitor: Competitor;
  onUpdate?: () => void;
}

export function CompetitorCard({ competitor, onUpdate }: CompetitorCardProps) {
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
        console.error('Error loading analysis:', error);
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
        title: 'Analysis Started',
        description: `Analyzing ${competitor.name}... This will take 1-5 minutes (powered by Apify + OpenAI).`,
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
              title: 'Analysis Complete',
              description: `${competitor.name} has been analyzed successfully.`,
            });
            onUpdate?.();
            setIsAnalyzing(false);
          } else if (attempts >= maxAttempts) {
            // Timeout after 5 minutes
            clearInterval(pollForAnalysis);
            toast({
              title: 'Analysis Taking Longer',
              description: 'The analysis is taking longer than expected. Please check back in a few minutes.',
              variant: 'destructive',
            });
            setIsAnalyzing(false);
          }
        } catch (error) {
          console.error('Error polling for analysis:', error);
        }
      }, pollInterval);

    } catch (error) {
      console.error('Error analyzing competitor:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze competitor. Please try again.',
        variant: 'destructive',
      });
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCompetitor(competitor.id);
      toast({
        title: 'Competitor Deleted',
        description: `${competitor.name} has been removed.`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting competitor:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete competitor. Please try again.',
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {competitor.analysis_count > 0 ? 'Re-analyze' : 'Analyze'}
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
              <span>Analyzed {competitor.analysis_count} time{competitor.analysis_count > 1 ? 's' : ''}</span>
              {competitor.last_analyzed_at && (
                <span>
                  Last: {formatDistanceToNow(new Date(competitor.last_analyzed_at), { addSuffix: true })}
                </span>
              )}
            </div>
          )}

          {/* No Analysis Yet */}
          {competitor.analysis_count === 0 && (
            <Alert>
              <AlertDescription>
                No analysis yet. Click "Analyze" to start competitor intelligence gathering.
              </AlertDescription>
            </Alert>
          )}

          {/* Latest Analysis (Collapsible) */}
          {competitor.analysis_count > 0 && (
            <Collapsible open={isExpanded} onOpenChange={handleExpand}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>View Latest Analysis</span>
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
                    {/* Summary */}
                    {analysis.summary && (
                      <div>
                        <h4 className="font-semibold mb-2">Executive Summary</h4>
                        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Positioning & Strategy */}
                    {analysis.positioning && (
                      <div>
                        <h4 className="font-semibold mb-2">Positioning</h4>
                        <p className="text-sm text-muted-foreground">{analysis.positioning}</p>
                      </div>
                    )}

                    {analysis.content_strategy && (
                      <div>
                        <h4 className="font-semibold mb-2">Content Strategy</h4>
                        <p className="text-sm text-muted-foreground">{analysis.content_strategy}</p>
                      </div>
                    )}

                    {/* Strengths */}
                    {analysis.strengths && analysis.strengths.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Strengths
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
                          Weaknesses
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
                          Opportunities for You
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
                          <h5 className="text-xs font-semibold text-muted-foreground mb-1">Tone</h5>
                          <Badge variant="secondary">{analysis.tone}</Badge>
                        </div>
                      )}
                      {analysis.estimated_budget && (
                        <div>
                          <h5 className="text-xs font-semibold text-muted-foreground mb-1">Est. Budget</h5>
                          <Badge variant="secondary">{analysis.estimated_budget}</Badge>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    {analysis.recommendations && (
                      <div>
                        <h4 className="font-semibold mb-2">Strategic Recommendations</h4>
                        <p className="text-sm text-muted-foreground">{analysis.recommendations}</p>
                      </div>
                    )}

                    {/* Cost Info */}
                    {analysis.analysis_cost && (
                      <div className="text-xs text-muted-foreground text-right">
                        Analysis cost: €{analysis.analysis_cost.toFixed(4)}
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Failed to load analysis. Please try re-analyzing.
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
            <AlertDialogTitle>Delete Competitor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {competitor.name}? This will also delete all associated analyses and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
