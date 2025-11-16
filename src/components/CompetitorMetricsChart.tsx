/**
 * CompetitorMetricsChart Component
 * 
 * Displays visual charts for competitor metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Users, Activity } from 'lucide-react';
import { useCompetitorMetrics } from '@/hooks/useCompetitorMetrics';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CompetitorMetricsChartProps {
  competitorId: string;
  competitor: {
    name: string;
    instagram_followers?: string;
    facebook_likes?: string;
    linkedin_followers?: string;
  };
  analysis?: {
    engagement_data?: any;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

export function CompetitorMetricsChart({ competitorId, competitor, analysis }: CompetitorMetricsChartProps) {
  const [timeRange, setTimeRange] = useState<30 | 90 | 180>(30);
  const { metrics, loading } = useCompetitorMetrics(competitorId, timeRange);

  // Prepare social media followers data
  const socialData = [
    {
      platform: 'Instagram',
      followers: parseInt(competitor.instagram_followers?.replace(/[^0-9]/g, '') || '0'),
    },
    {
      platform: 'Facebook',
      followers: parseInt(competitor.facebook_likes?.replace(/[^0-9]/g, '') || '0'),
    },
    {
      platform: 'LinkedIn',
      followers: parseInt(competitor.linkedin_followers?.replace(/[^0-9]/g, '') || '0'),
    },
  ].filter(item => item.followers > 0);

  // Transform real metrics history into chart data
  const engagementData = metrics.map(metric => ({
    date: format(new Date(metric.recorded_at), 'dd MMM', { locale: fr }),
    engagement: metric.avg_engagement_rate || 0,
    posts: metric.posts_last_7_days || 0,
    followers: metric.instagram_followers || 0,
  }));

  const hasHistoricalData = metrics.length > 0;

  return (
    <div className="space-y-4">
      {/* Time range selector */}
      {hasHistoricalData && (
        <div className="flex gap-2 justify-end">
          <Button
            variant={timeRange === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(30)}
          >
            30 jours
          </Button>
          <Button
            variant={timeRange === 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(90)}
          >
            90 jours
          </Button>
          <Button
            variant={timeRange === 180 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(180)}
          >
            6 mois
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Social Media Followers Chart */}
        {socialData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Abonnés par plateforme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={socialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="followers" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          </Card>
        )}

        {/* Engagement Trend Chart */}
        <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {hasHistoricalData ? 'Évolution de l\'engagement' : 'Tendance d\'engagement'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chargement...
            </div>
          ) : !hasHistoricalData ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Aucune donnée historique disponible. Lancez une analyse pour commencer.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="hsl(var(--primary))"
                  name="Engagement (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="posts"
                  stroke="hsl(var(--secondary))"
                  name="Posts (7j)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          </CardContent>
        </Card>

        {/* Platform Distribution Pie Chart */}
        {socialData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Distribution des audiences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={socialData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, percent }) => `${platform} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="followers"
                >
                  {socialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
