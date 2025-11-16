/**
 * CompetitorMetricsChart Component
 * 
 * Displays visual charts for competitor metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, Activity } from 'lucide-react';

interface CompetitorMetricsChartProps {
  competitorId: string;
  competitor: {
    name: string;
    instagram_followers?: string;
    facebook_likes?: string;
    linkedin_followers?: string;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

export function CompetitorMetricsChart({ competitor }: CompetitorMetricsChartProps) {
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

  return (
    <div className="grid grid-cols-1 gap-4 mt-4">
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
  );
}
