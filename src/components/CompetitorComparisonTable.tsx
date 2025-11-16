import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Users, Heart, MessageCircle, Smile, Frown, Meh } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type CompetitorComparison = Tables<'competitor_comparison'>;
type SentimentStats = Tables<'sentiment_statistics'>;
type LatestAnalysis = Tables<'competitor_latest_analysis'>;

interface CompetitorComparisonTableProps {
  competitors: CompetitorComparison[];
  sentimentData: Record<string, SentimentStats>;
  analysisData: Record<string, LatestAnalysis>;
}

export function CompetitorComparisonTable({ competitors, sentimentData, analysisData }: CompetitorComparisonTableProps) {
  if (competitors.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Sélectionnez au moins 2 concurrents pour voir la comparaison
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number | null) => {
    if (num === null || num === undefined) return '-';
    return `${num.toFixed(2)}%`;
  };

  // Calculate best performer for each metric
  const bestInstagram = Math.max(...competitors.map(c => c.instagram_followers || 0));
  const bestFacebook = Math.max(...competitors.map(c => c.facebook_likes || 0));
  const bestLinkedIn = Math.max(...competitors.map(c => c.linkedin_followers || 0));
  const bestEngagement = Math.max(...competitors.map(c => Number(c.avg_engagement_rate) || 0));
  const mostPosts = Math.max(...competitors.map(c => Number(c.total_posts_tracked) || 0));

  return (
    <div className="space-y-6">
      {/* Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concurrent</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead className="text-right">Instagram</TableHead>
                  <TableHead className="text-right">Facebook</TableHead>
                  <TableHead className="text-right">LinkedIn</TableHead>
                  <TableHead className="text-right">Posts suivis</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="text-right">Sentiment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
                  <TableRow key={competitor.id}>
                    <TableCell className="font-medium">{competitor.name}</TableCell>
                    <TableCell>
                      {competitor.industry && (
                        <Badge variant="secondary">{competitor.industry}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {competitor.instagram_followers === bestInstagram && competitor.instagram_followers > 0 && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{formatNumber(competitor.instagram_followers)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {competitor.facebook_likes === bestFacebook && competitor.facebook_likes > 0 && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span>{formatNumber(competitor.facebook_likes)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {competitor.linkedin_followers === bestLinkedIn && competitor.linkedin_followers > 0 && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{formatNumber(competitor.linkedin_followers)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {Number(competitor.total_posts_tracked) === mostPosts && mostPosts > 0 && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{competitor.total_posts_tracked || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {Number(competitor.avg_engagement_rate) === bestEngagement && bestEngagement > 0 && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        <span className={
                          Number(competitor.avg_engagement_rate) === bestEngagement && bestEngagement > 0
                            ? 'font-semibold text-green-600'
                            : ''
                        }>
                          {formatPercentage(Number(competitor.avg_engagement_rate))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {competitor.id && sentimentData[competitor.id] ? (
                        <div className="flex items-center justify-end gap-2">
                          {sentimentData[competitor.id].positive_percentage! > 60 ? (
                            <Smile className="h-4 w-4 text-green-500" />
                          ) : sentimentData[competitor.id].negative_percentage! > 40 ? (
                            <Frown className="h-4 w-4 text-red-500" />
                          ) : (
                            <Meh className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm">
                            {sentimentData[competitor.id].positive_percentage?.toFixed(0)}% positif
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Meilleur taux d'engagement</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const best = competitors.reduce((prev, current) =>
                Number(current.avg_engagement_rate) > Number(prev.avg_engagement_rate) ? current : prev
              );
              return (
                <div>
                  <div className="text-2xl font-bold">{best.name}</div>
                  <div className="text-muted-foreground">
                    {formatPercentage(Number(best.avg_engagement_rate))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Plus grand nombre d'abonnés (Instagram)</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const best = competitors.reduce((prev, current) =>
                (current.instagram_followers || 0) > (prev.instagram_followers || 0) ? current : prev
              );
              return (
                <div>
                  <div className="text-2xl font-bold">{best.name}</div>
                  <div className="text-muted-foreground">
                    {formatNumber(best.instagram_followers)} abonnés
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Plus actif (posts)</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const best = competitors.reduce((prev, current) =>
                Number(current.total_posts_tracked) > Number(prev.total_posts_tracked) ? current : prev
              );
              return (
                <div>
                  <div className="text-2xl font-bold">{best.name}</div>
                  <div className="text-muted-foreground">
                    {best.total_posts_tracked} posts suivis
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Forces & Faiblesses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {competitors.map((competitor) => {
              const analysis = competitor.id ? analysisData[competitor.id] : null;
              if (!analysis) return null;

              return (
                <div key={competitor.id} className="space-y-4">
                  <h3 className="font-semibold text-lg">{competitor.name}</h3>
                  
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Forces
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strengths?.map((strength, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Faiblesses
                    </h4>
                    <ul className="space-y-1">
                      {analysis.weaknesses?.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
