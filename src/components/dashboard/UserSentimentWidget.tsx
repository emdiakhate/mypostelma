/**
 * User Sentiment Widget
 *
 * Displays weekly sentiment analysis statistics for user's posts
 * Shows overall sentiment, top positive/negative posts, and trends
 */

import { useState, useEffect } from 'react';
import { SmilePlus, Meh, Frown, TrendingUp, TrendingDown, MessageCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SentimentStatistics {
  id: string;
  week_start_date: string;
  week_end_date: string;
  total_posts: number | null;
  total_comments: number | null;
  avg_sentiment_score: number | null;
  positive_count: number | null;
  neutral_count: number | null;
  negative_count: number | null;
  positive_percentage: number | null;
  neutral_percentage: number | null;
  negative_percentage: number | null;
  top_keywords: Record<string, number> | null;
  analyzed_at: string | null;
}

interface Post {
  id: string;
  content: string;
  sentiment_score: number | null;
  sentiment_label: string | null;
  comments_sentiment_count: number | null;
  last_sentiment_analysis_at: string | null;
}

const SENTIMENT_COLORS = {
  positive: 'hsl(142, 76%, 36%)',
  neutral: 'hsl(45, 93%, 47%)',
  negative: 'hsl(0, 84%, 60%)',
};

export function UserSentimentWidget() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<SentimentStatistics | null>(null);
  const [topPosts, setTopPosts] = useState<{ best: Post | null; worst: Post | null }>({
    best: null,
    worst: null,
  });
  const [weeklyTrend, setWeeklyTrend] = useState<SentimentStatistics[]>([]);

  useEffect(() => {
    loadSentimentData();
  }, []);

  async function loadSentimentData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load latest week statistics
      const { data: latestStats } = await supabase
        .from('user_sentiment_statistics')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();

      if (latestStats) {
        setStatistics({
          ...latestStats,
          top_keywords: latestStats.top_keywords as Record<string, number> | null
        });

        // Load top/worst posts from this week
        const weekStart = new Date(latestStats.week_start_date);
        const weekEnd = new Date(latestStats.week_end_date);

        const { data: posts } = await supabase
          .from('posts')
          .select('id, content, sentiment_score, sentiment_label, comments_sentiment_count, last_sentiment_analysis_at')
          .eq('author_id', user.id)
          .gte('published_at', weekStart.toISOString())
          .lte('published_at', weekEnd.toISOString())
          .not('sentiment_score', 'is', null)
          .order('sentiment_score', { ascending: false });

        if (posts && posts.length > 0) {
          setTopPosts({
            best: posts[0],
            worst: posts[posts.length - 1],
          });
        }
      }

      // Load last 4 weeks for trend
      const { data: trendData } = await supabase
        .from('user_sentiment_statistics')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(4);

      if (trendData) {
        setWeeklyTrend(trendData.map(stat => ({
          ...stat,
          top_keywords: stat.top_keywords as Record<string, number> | null
        })).reverse());
      }
    } catch (error) {
      console.error('Error loading sentiment data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Sentiment de la semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucune analyse de sentiment disponible</p>
            <p className="text-xs mt-1">
              L'analyse automatique se lance tous les lundis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sentimentDistribution = [
    { name: 'Positif', value: statistics.positive_percentage, count: statistics.positive_count },
    { name: 'Neutre', value: statistics.neutral_percentage, count: statistics.neutral_count },
    { name: 'Négatif', value: statistics.negative_percentage, count: statistics.negative_count },
  ];

  const topKeywords = Object.entries(statistics.top_keywords || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const getTrendIcon = () => {
    if (weeklyTrend.length < 2) return null;
    const currentScore = statistics.avg_sentiment_score;
    const previousScore = weeklyTrend[weeklyTrend.length - 2].avg_sentiment_score;

    if (currentScore > previousScore) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (currentScore < previousScore) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.2) return { label: 'Positif', icon: SmilePlus, color: 'text-green-600', bg: 'bg-green-100' };
    if (score < -0.2) return { label: 'Négatif', icon: Frown, color: 'text-red-600', bg: 'bg-red-100' };
    return { label: 'Neutre', icon: Meh, color: 'text-yellow-600', bg: 'bg-yellow-100' };
  };

  const overallSentiment = getSentimentLabel(statistics.avg_sentiment_score);
  const OverallIcon = overallSentiment.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Sentiment de la semaine
          </span>
          {getTrendIcon()}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Du {new Date(statistics.week_start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au{' '}
          {new Date(statistics.week_end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment Score */}
        <div className={`${overallSentiment.bg} p-4 rounded-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <OverallIcon className={`h-8 w-8 ${overallSentiment.color}`} />
              <div>
                <div className="text-2xl font-bold">{overallSentiment.label}</div>
                <div className="text-sm text-muted-foreground">
                  Score: {statistics.avg_sentiment_score.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{statistics.total_posts} posts</div>
              <div className="text-xs text-muted-foreground">
                {statistics.total_comments} commentaires
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Répartition du sentiment</h4>
          <div className="space-y-3">
            {sentimentDistribution.map((item, index) => {
              const colors = [
                { bg: 'bg-green-100', bar: 'bg-green-600' },
                { bg: 'bg-yellow-100', bar: 'bg-yellow-600' },
                { bg: 'bg-red-100', bar: 'bg-red-600' },
              ];
              const color = colors[index];

              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({item.value.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={item.value} className={`h-2 ${color.bg}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie Chart */}
        {sentimentDistribution.some(s => s.value > 0) && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Distribution visuelle</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sentimentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
                  outerRadius={70}
                  dataKey="value"
                >
                  {sentimentDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? SENTIMENT_COLORS.positive : index === 1 ? SENTIMENT_COLORS.neutral : SENTIMENT_COLORS.negative}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Keywords */}
        {topKeywords.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Mots-clés populaires</h4>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map(([keyword, count]) => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  {keyword} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top/Worst Posts */}
        {(topPosts.best || topPosts.worst) && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Posts marquants</h4>

            {topPosts.best && (
              <div className="border border-green-200 bg-green-50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <SmilePlus className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-green-800 mb-1">
                      Post le plus positif ({topPosts.best.sentiment_score.toFixed(2)})
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {topPosts.best.content}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {topPosts.best.comments_sentiment_count} commentaires analysés
                    </div>
                  </div>
                </div>
              </div>
            )}

            {topPosts.worst && topPosts.worst.sentiment_label === 'negative' && (
              <div className="border border-red-200 bg-red-50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Frown className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-red-800 mb-1">
                      Post à améliorer ({topPosts.worst.sentiment_score.toFixed(2)})
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {topPosts.worst.content}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {topPosts.worst.comments_sentiment_count} commentaires analysés
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weekly Trend */}
        {weeklyTrend.length > 1 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Évolution (4 dernières semaines)</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week_start_date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 10 }}
                />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(date) => `Semaine du ${new Date(date).toLocaleDateString('fr-FR')}`}
                  formatter={(value: number) => [value.toFixed(2), 'Score']}
                />
                <Bar dataKey="avg_sentiment_score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
