/**
 * SentimentAnalysisView Component
 *
 * Displays sentiment analysis results for competitor posts and comments
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import {
  Smile,
  Meh,
  Frown,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Hash,
  Calendar,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SentimentAnalysisViewProps {
  analysisId: string;
  competitorName: string;
}

interface Post {
  id: string;
  platform: string;
  post_url: string;
  caption: string;
  likes: number;
  comments_count: number;
  engagement_rate: number;
  posted_at: string;
  sentiment_score: number;
  sentiment_label: 'positive' | 'neutral' | 'negative';
}

interface Comment {
  id: string;
  author_username: string;
  text: string;
  likes: number;
  posted_at: string;
  sentiment_score: number;
  sentiment_label: 'positive' | 'neutral' | 'negative';
  sentiment_explanation: string;
  keywords: string[];
}

interface Statistics {
  total_posts: number;
  total_comments: number;
  avg_sentiment_score: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
  top_keywords: Record<string, number>;
  response_rate: number;
  avg_engagement_rate: number;
}

export function SentimentAnalysisView({ analysisId, competitorName }: SentimentAnalysisViewProps) {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bestComment, setBestComment] = useState<Comment | null>(null);
  const [worstComment, setWorstComment] = useState<Comment | null>(null);
  const [topEngagementPost, setTopEngagementPost] = useState<Post | null>(null);

  useEffect(() => {
    loadSentimentData();
  }, [analysisId]);

  async function loadSentimentData() {
    try {
      setLoading(true);

      // Load statistics
      const { data: stats } = await supabase
        .from('sentiment_statistics')
        .select('*')
        .eq('analysis_id', analysisId)
        .single();

      if (stats) {
        setStatistics(stats);
      }

      // Load posts
      const { data: postsData } = await supabase
        .from('competitor_posts')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('posted_at', { ascending: false });

      if (postsData) {
        setPosts(postsData);

        // Find top engagement post
        const topPost = postsData.reduce((prev, current) =>
          (prev.engagement_rate || 0) > (current.engagement_rate || 0) ? prev : current
        );
        setTopEngagementPost(topPost);
      }

      // Load best and worst comments
      const { data: allComments } = await supabase
        .from('post_comments')
        .select('*')
        .in(
          'post_id',
          postsData?.map(p => p.id) || []
        )
        .order('sentiment_score', { ascending: false });

      if (allComments && allComments.length > 0) {
        setBestComment(allComments[0]); // Highest score
        setWorstComment(allComments[allComments.length - 1]); // Lowest score
      }
    } catch (error) {
      console.error('Error loading sentiment data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSentimentIcon(label: string) {
    switch (label) {
      case 'positive':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'negative':
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Meh className="h-5 w-5 text-yellow-500" />;
    }
  }

  function getSentimentBadgeColor(label: string) {
    switch (label) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Chargement de l'analyse de sentiment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Aucune analyse de sentiment disponible pour ce concurrent.</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const sentimentDistribution = [
    { name: 'Positif', value: statistics.positive_percentage, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Neutre', value: statistics.neutral_percentage, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Négatif', value: statistics.negative_percentage, fill: 'hsl(0, 84%, 60%)' },
  ];

  const topKeywords = Object.entries(statistics.top_keywords || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Global Sentiment Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smile className="h-4 w-4 text-green-500" />
              Sentiment Positif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {statistics.positive_percentage.toFixed(1)}%
            </div>
            <Progress value={statistics.positive_percentage} className="mt-2 bg-green-100" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Meh className="h-4 w-4 text-yellow-500" />
              Sentiment Neutre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {statistics.neutral_percentage.toFixed(1)}%
            </div>
            <Progress value={statistics.neutral_percentage} className="mt-2 bg-yellow-100" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Frown className="h-4 w-4 text-red-500" />
              Sentiment Négatif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {statistics.negative_percentage.toFixed(1)}%
            </div>
            <Progress value={statistics.negative_percentage} className="mt-2 bg-red-100" />
          </CardContent>
        </Card>
      </div>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Vue d'ensemble
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Posts analysés</div>
              <div className="text-2xl font-bold">{statistics.total_posts}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Commentaires analysés</div>
              <div className="text-2xl font-bold">{statistics.total_comments}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Score moyen</div>
              <div className="text-2xl font-bold">{statistics.avg_sentiment_score.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Taux de réponse</div>
              <div className="text-2xl font-bold">{statistics.response_rate.toFixed(1)}%</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Sentiment Distribution Chart */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-3">Distribution du sentiment</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sentimentDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Best and Worst Comments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestComment && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                Meilleur commentaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">@{bestComment.author_username}</p>
                  <p className="text-sm mt-1">{bestComment.text}</p>
                </div>
                <Badge className={getSentimentBadgeColor(bestComment.sentiment_label)}>
                  {bestComment.sentiment_score.toFixed(2)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground italic">{bestComment.sentiment_explanation}</p>
              <div className="flex flex-wrap gap-1">
                {bestComment.keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {worstComment && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-600" />
                Commentaire le plus négatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">@{worstComment.author_username}</p>
                  <p className="text-sm mt-1">{worstComment.text}</p>
                </div>
                <Badge className={getSentimentBadgeColor(worstComment.sentiment_label)}>
                  {worstComment.sentiment_score.toFixed(2)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground italic">{worstComment.sentiment_explanation}</p>
              <div className="flex flex-wrap gap-1">
                {worstComment.keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Engagement Post */}
      {topEngagementPost && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Post avec le plus d'engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{topEngagementPost.platform}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(topEngagementPost.posted_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                <p className="text-sm">{topEngagementPost.caption}</p>
              </div>
              <Badge className={getSentimentBadgeColor(topEngagementPost.sentiment_label)}>
                {getSentimentIcon(topEngagementPost.sentiment_label)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {topEngagementPost.likes} likes
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {topEngagementPost.comments_count} commentaires
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {topEngagementPost.engagement_rate.toFixed(2)}% engagement
              </span>
            </div>

            {topEngagementPost.post_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={topEngagementPost.post_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Voir le post
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Keywords */}
      {topKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Mots-clés populaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map(([keyword, count]) => (
                <Badge key={keyword} variant="secondary" className="text-sm">
                  {keyword} <span className="ml-1 text-xs opacity-70">({count})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Posts analysés ({posts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {post.platform}
                    </Badge>
                    <Badge className={getSentimentBadgeColor(post.sentiment_label)}>
                      {getSentimentIcon(post.sentiment_label)}
                      <span className="ml-1">{post.sentiment_label}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{post.caption}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{post.likes} likes</span>
                    <span>{post.comments_count} commentaires</span>
                    <span>{post.engagement_rate.toFixed(2)}% engagement</span>
                  </div>
                </div>
                {post.post_url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
