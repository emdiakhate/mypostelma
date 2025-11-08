import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Plus, Loader2, TrendingUp, Users, Eye, Heart, Target } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUploadPost } from '@/hooks/useUploadPost';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsKPICard } from '@/components/AnalyticsKPICard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function Analytics() {
  const [uploadPostUsername, setUploadPostUsername] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const { connectedAccounts } = useUploadPost();
  
  // Récupérer le username depuis le profil
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('upload_post_username')
          .eq('id', user.id)
          .single();
        
        if (profile?.upload_post_username) {
          setUploadPostUsername(profile.upload_post_username);
        }
      }
    };
    fetchProfile();
  }, []);

  // Extraire les plateformes connectées
  const connectedPlatforms = connectedAccounts.map(acc => acc.platform);
  const { profile } = useUploadPost();
  
  // Initialiser les plateformes sélectionnées
  useEffect(() => {
    if (connectedPlatforms.length > 0 && selectedPlatforms.length === 0) {
      setSelectedPlatforms(connectedPlatforms);
    }
  }, [connectedPlatforms]);
  
  const { data, loading, error } = useAnalytics(profile?.username || undefined, connectedPlatforms);

  // Calculer les totaux globaux
  const globalStats = data?.analytics ? Object.values(data.analytics).reduce((acc, metrics: any) => ({
    followers: (acc.followers || 0) + (metrics.followers || 0),
    reach: (acc.reach || 0) + (metrics.reach || 0),
    impressions: (acc.impressions || 0) + (metrics.impressions || 0),
    profileViews: (acc.profileViews || 0) + (metrics.profileViews || 0),
  }), { followers: 0, reach: 0, impressions: 0, profileViews: 0 }) : null;

  // Générer des données pour le graphique (mockées pour l'instant - 30 derniers jours)
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    
    const dataPoint: any = { date: dateStr };
    
    if (data?.analytics) {
      Object.entries(data.analytics).forEach(([platform, metrics]: [string, any]) => {
        if (selectedPlatforms.includes(platform)) {
          // Simuler des variations de reach au fil du temps
          const baseReach = metrics.reach || 0;
          dataPoint[platform] = Math.floor(baseReach * (0.7 + Math.random() * 0.6));
        }
      });
    }
    
    return dataPoint;
  });

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const platformColors: Record<string, string> = {
    instagram: '#E4405F',
    facebook: '#1877F2',
    linkedin: '#0A66C2',
    x: '#000000',
  };

  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Analysez les performances de vos publications
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Si pas de comptes connectés ou pas de données
  if (!connectedAccounts.length || !data?.analytics) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Analysez les performances de vos publications
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
              <p className="text-muted-foreground mb-6">
                Connectez vos comptes sociaux pour voir vos statistiques
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/app/settings/accounts">
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Connecter mes comptes
                  </Button>
                </Link>
                <Link to="/app/calendar">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une publication
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Afficher les analytics par plateforme
  const analytics = data.analytics;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Performances de vos comptes sociaux
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Global Analytics KPIs */}
      {globalStats && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Statistiques Globales</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnalyticsKPICard
              title="Abonnés"
              value={globalStats.followers}
              icon={Users}
            />
            <AnalyticsKPICard
              title="Portée"
              value={globalStats.reach}
              icon={Target}
            />
            <AnalyticsKPICard
              title="Impressions"
              value={globalStats.impressions}
              icon={Eye}
            />
            <AnalyticsKPICard
              title="Vues du profil"
              value={globalStats.profileViews}
              icon={TrendingUp}
            />
          </div>
        </div>
      )}

      {/* Global Reach Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Portée sur les 30 derniers jours</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {connectedPlatforms.map(platform => (
                <Badge
                  key={platform}
                  variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => togglePlatform(platform)}
                  style={
                    selectedPlatforms.includes(platform)
                      ? { backgroundColor: platformColors[platform], color: 'white' }
                      : {}
                  }
                >
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              {selectedPlatforms.map(platform => (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  stroke={platformColors[platform]}
                  strokeWidth={2}
                  dot={false}
                  name={platform.charAt(0).toUpperCase() + platform.slice(1)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Platform Details */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Détails par plateforme</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(analytics).map(([platform, metrics]) => (
            <Card key={platform}>
              <CardHeader>
                <CardTitle className="capitalize flex items-center gap-2">
                  {platform}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.followers !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Abonnés</span>
                    </div>
                    <span className="font-semibold">{metrics.followers.toLocaleString()}</span>
                  </div>
                )}
                
                {metrics.impressions !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Impressions</span>
                    </div>
                    <span className="font-semibold">{metrics.impressions.toLocaleString()}</span>
                  </div>
                )}
                
                {metrics.profileViews !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Vues du profil</span>
                    </div>
                    <span className="font-semibold">{metrics.profileViews.toLocaleString()}</span>
                  </div>
                )}
                
                {metrics.reach !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Portée</span>
                    </div>
                    <span className="font-semibold">{metrics.reach.toLocaleString()}</span>
                  </div>
                )}
                
                {metrics.reels_plays !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Lectures Reels</span>
                    </div>
                    <span className="font-semibold">{metrics.reels_plays.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics;