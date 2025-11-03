import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus, Loader2, TrendingUp, Users, Eye, Heart } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUploadPost } from '@/hooks/useUploadPost';
import { supabase } from '@/integrations/supabase/client';

function Analytics() {
  const [uploadPostUsername, setUploadPostUsername] = useState<string | null>(null);
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
  
  const { data, loading, error } = useAnalytics(uploadPostUsername || undefined, connectedPlatforms);

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
  );
}

export default Analytics;