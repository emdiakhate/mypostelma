/**
 * Page Analytics complète
 * Phase 3: Analytics Interface
 */

import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  ChevronDown,
  RefreshCw,
  Heart,
  Eye,
  Users,
  BarChart3,
  Filter,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsFilters, AnalyticsPeriod, SocialPlatform } from '@/types/analytics';
import AnalyticsKPICard from '@/components/AnalyticsKPICard';
import TopPostCard from '@/components/TopPostCard';

const Analytics: React.FC = () => {
  // États pour les filtres
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>({
    label: '7 derniers jours',
    days: 7,
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['instagram', 'facebook', 'twitter']);
  const [showPlatformFilter, setShowPlatformFilter] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

  // Hook analytics
  const filters: AnalyticsFilters = {
    period: selectedPeriod,
    platforms: selectedPlatforms
  };
  
  const { data, loading, refresh, lastRefresh, canRefresh } = useAnalytics(filters);

  // Périodes prédéfinies
  const periods: AnalyticsPeriod[] = [
    { label: '7 derniers jours', days: 7, start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() },
    { label: '30 derniers jours', days: 30, start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
    { label: '90 derniers jours', days: 90, start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() }
  ];

  // Plateformes disponibles
  const availablePlatforms: { id: SocialPlatform; label: string }[] = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'twitter', label: 'Twitter' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'youtube', label: 'YouTube' }
  ];

  // Couleurs pour les plateformes
  const platformColors = {
    instagram: '#E4405F',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    linkedin: '#0A66C2',
    tiktok: '#000000',
    youtube: '#FF0000'
  };

  // Gestion des plateformes
  const handlePlatformToggle = (platform: SocialPlatform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data) return;
    
    const csvContent = [
      ['Métrique', 'Valeur'],
      ['Total Likes', data.totalLikes],
      ['Total Comments', data.totalComments],
      ['Total Shares', data.totalShares],
      ['Total Impressions', data.totalImpressions],
      ['Total Reach', data.totalReach],
      ['Taux d\'Engagement Moyen', `${data.avgEngagementRate.toFixed(2)}%`],
      ['Meilleure Plateforme', data.bestPerformingPlatform],
      ['', ''],
      ['Date', 'Engagement', 'Impressions', 'Posts'],
      ...data.dailyEngagement.map(day => [
        day.date,
        day.engagement,
        day.impressions,
        day.posts
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Formatage du temps depuis le dernier refresh
  const getLastRefreshText = () => {
    if (!lastRefresh) return 'Jamais';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    return `Il y a ${Math.floor(diff / 60)}h`;
  };

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune donnée disponible
          </h3>
          <p className="text-gray-600 mb-4">
            Publiez votre premier post pour voir les analytics
          </p>
          <Button>
            Créer un post
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Analysez les performances de vos publications
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Période */}
          <Select value={selectedPeriod.label} onValueChange={(value) => {
            const period = periods.find(p => p.label === value);
            if (period) setSelectedPeriod(period);
          }}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.label} value={period.label}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Plateformes */}
          <Popover open={showPlatformFilter} onOpenChange={setShowPlatformFilter}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                {selectedPlatforms.length === availablePlatforms.length ? 'Toutes' : `${selectedPlatforms.length} plateformes`}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <h4 className="font-medium">Plateformes</h4>
                {availablePlatforms.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <label htmlFor={platform.id} className="text-sm">
                      {platform.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Refresh */}
          <Button 
            onClick={refresh} 
            disabled={!canRefresh || loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Rafraîchir
          </Button>

          {/* Export */}
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-sm text-gray-500">
        Mis à jour {getLastRefreshText()}
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsKPICard
          title="Total Engagement"
          value={data.totalLikes + data.totalComments + data.totalShares}
          subtitle="Likes + Comments + Shares"
          icon={Heart}
          trend={{ value: 23, isPositive: true }}
          sparklineData={data.dailyEngagement.map(d => d.engagement)}
        />
        
        <AnalyticsKPICard
          title="Impressions"
          value={data.totalImpressions}
          subtitle="Vues totales"
          icon={Eye}
          trend={{ value: 15, isPositive: true }}
          sparklineData={data.dailyEngagement.map(d => d.impressions)}
        />
        
        <AnalyticsKPICard
          title="Taux d'Engagement"
          value={`${data.avgEngagementRate.toFixed(1)}%`}
          subtitle="Moyenne sur la période"
          icon={TrendingUp}
          trend={{ value: -0.3, isPositive: false }}
        />
        
        <AnalyticsKPICard
          title="Nouveaux Followers"
          value="+456"
          subtitle="Croissance sur la période"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Évolution de l'Engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution de l'Engagement</CardTitle>
          <CardDescription>
            Engagement et impressions par jour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="engagement" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Engagement"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="impressions" 
                stroke="#94A3B8" 
                strokeWidth={2}
                name="Impressions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance par Plateforme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Répartition des impressions */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Impressions</CardTitle>
            <CardDescription>Par plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.platformPerformance}
                  dataKey="impressions"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ platform, impressions }) => `${platform}: ${impressions}`}
                >
                  {data.platformPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={platformColors[entry.platform]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Taux d'engagement par plateforme */}
        <Card>
          <CardHeader>
            <CardTitle>Taux d'Engagement par Plateforme</CardTitle>
            <CardDescription>Performance comparative</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.platformPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="platform" type="category" />
                <Tooltip />
                <Bar dataKey="engagementRate" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Publications les Plus Performantes</CardTitle>
          <CardDescription>
            Vos 5 publications les plus performantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topPosts.map((post, index) => (
              <TopPostCard
                key={post.postId}
                post={post}
                rank={index + 1}
                onClick={() => console.log('Voir détails:', post.postId)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analyse par Contenu */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Type de Contenu</CardTitle>
          <CardDescription>
            Engagement moyen selon le format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.contentTypePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgEngagement" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">💡 Insights</h4>
                <p className="text-sm text-green-800">
                  Les carrousels génèrent +45% d'engagement par rapport aux images simples.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📈 Recommandation</h4>
                <p className="text-sm text-blue-800">
                  Vos reels atteignent 3x plus de personnes. Continuez sur cette voie !
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meilleurs Moments */}
      <Card>
        <CardHeader>
          <CardTitle>Meilleurs Moments pour Publier</CardTitle>
          <CardDescription>
            Heatmap des performances par jour et heure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-8 gap-1">
              {/* En-têtes des jours */}
              <div></div>
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                <div key={day} className="text-xs font-medium text-center">{day}</div>
              ))}
              
              {/* Grille des heures */}
              {Array.from({ length: 24 }, (_, hour) => (
                <React.Fragment key={hour}>
                  <div className="text-xs text-gray-600 text-right pr-2">
                    {hour.toString().padStart(2, '0')}h
                  </div>
                  {Array.from({ length: 7 }, (_, day) => {
                    const bestTime = data.bestTimes.find(bt => bt.day === day && bt.hour === hour);
                    const intensity = bestTime ? Math.min(bestTime.avgEngagement / 200, 1) : 0;
                    
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={cn(
                          "w-8 h-8 rounded border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors",
                          intensity > 0.7 ? "bg-green-500" :
                          intensity > 0.4 ? "bg-yellow-400" :
                          intensity > 0 ? "bg-orange-300" : "bg-gray-100"
                        )}
                        title={bestTime ? `${bestTime.avgEngagement.toFixed(0)} likes en moyenne` : 'Aucune donnée'}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>Faible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-300 rounded"></div>
                  <span>Moyen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Élevé</span>
                </div>
              </div>
              
              <Button variant="outline" size="sm">
                Optimiser ma planification
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;