import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

function Analytics() {
  const { data, loading } = useAnalytics();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Analysez les performances de vos publications
          </p>
        </div>
        <div className="flex gap-2">
          {/* Filtres de date, export, etc. */}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Heart}
          iconColor="text-red-500"
          title="Likes + Comments + Shares"
          value={data.overview.likes.total}
          change={data.overview.likes.change}
          previousValue={data.overview.likes.previousPeriod}
        />
        <StatCard
          icon={Eye}
          iconColor="text-blue-500"
          title="Vues totales"
          value={data.overview.views.total}
          change={data.overview.views.change}
          previousValue={data.overview.views.previousPeriod}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-green-500"
          title="Moyenne sur la période"
          value={`${data.overview.avgEngagement.total}%`}
          change={data.overview.avgEngagement.change}
          previousValue={data.overview.avgEngagement.previousPeriod}
          isPercentage
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-purple-500"
          title="Croissance sur la période"
          value={data.overview.growth.total}
          change={data.overview.growth.change}
          previousValue={data.overview.growth.previousPeriod}
        />
      </div>

      {/* Évolution de l'engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution de l'Engagement</CardTitle>
          <CardDescription>Engagement et impressions par jour</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.engagementEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Engagement"
              />
              <Line 
                type="monotone" 
                dataKey="impressions" 
                stroke="#94a3b8" 
                strokeWidth={2}
                name="Impressions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des impressions */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Impressions</CardTitle>
            <CardDescription>Par plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.impressionsByPlatform}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.platform}: ${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.impressionsByPlatform.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taux d'engagement par plateforme */}
        <Card>
          <CardHeader>
            <CardTitle>Taux d'Engagement par Plateforme</CardTitle>
            <CardDescription>Performance comparative</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.engagementByPlatform}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rate" fill="#3b82f6">
                  {data.engagementByPlatform.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Publications les plus performantes */}
      <Card>
        <CardHeader>
          <CardTitle>Publications les Plus Performantes</CardTitle>
          <CardDescription>Top 5 publications les plus performantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topPosts.map((post) => (
              <TopPostCard key={post.id} post={post} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance par type de contenu */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Type de Contenu</CardTitle>
          <CardDescription>Engagement moyen selon le format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Insight</p>
                <p className="text-sm text-green-700">
                  Les carrousels génèrent +45% d'engagement par rapport aux images simples
                </p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.contentTypePerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="type" type="category" />
              <Tooltip />
              <Bar dataKey="avgEngagement" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Meilleurs moments pour publier (Heatmap) */}
      <Card>
        <CardHeader>
          <CardTitle>Meilleurs Moments pour Publier</CardTitle>
          <CardDescription>Heatmap des performances par jour et heure</CardDescription>
        </CardHeader>
        <CardContent>
          <HeatmapChart data={data.bestTimesToPost} />
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Recommandation</p>
                <p className="text-sm text-blue-700">
                  Vos posts atteignent 2x plus de personnes. Continuez cette voie !
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composants helpers
function StatCard({ icon: Icon, iconColor, title, value, change, previousValue, isPercentage = false }) {
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {change !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendIcon className="w-4 h-4" />
              <span>{isPositive ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          vs période précédente
        </p>
      </CardContent>
    </Card>
  );
}

function TopPostCard({ post }) {
  return (
    <div className="flex gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
      <img 
        src={post.thumbnail} 
        alt="Post" 
        className="w-20 h-20 rounded object-cover"
      />
      <div className="flex-1">
        <p className="font-medium line-clamp-2">{post.content}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{post.metrics.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{post.metrics.comments}</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            <span>{post.metrics.shares}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{post.metrics.views.toLocaleString()}</span>
          </div>
          <span className="ml-auto font-semibold text-green-600">
            {post.metrics.engagementRate}% engagement
          </span>
        </div>
      </div>
    </div>
  );
}

function HeatmapChart({ data }) {
  const days = Object.keys(data);
  const hours = Object.keys(data[days[0]]);
  
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${days.length}, 1fr)` }}>
          {/* Header vide */}
          <div />
          {/* Jours */}
          {days.map(day => (
            <div key={day} className="text-center text-sm font-medium p-2">
              {day}
            </div>
          ))}
          
          {/* Heures et cellules */}
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="text-right text-xs text-muted-foreground pr-2 flex items-center justify-end">
                {hour}
              </div>
              {days.map(day => {
                const value = data[day][hour];
                const opacity = value / 100;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="aspect-square rounded"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                    }}
                    title={`${day} ${hour}: ${value}% performance`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
        
        {/* Légende */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Faible</span>
          <div className="flex gap-1">
            {[0.2, 0.4, 0.6, 0.8, 1].map(opacity => (
              <div
                key={opacity}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
              />
            ))}
          </div>
          <span>Moyen</span>
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span>Élevé</span>
        </div>
      </div>
    </div>
  );
}

export default Analytics;