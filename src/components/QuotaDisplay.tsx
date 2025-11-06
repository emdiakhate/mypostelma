import { useQuotas } from '@/hooks/useQuotas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Image, Video, Users, AlertCircle, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuotaDisplayProps {
  variant?: 'full' | 'compact' | 'inline';
  showOnlyType?: 'ai_images' | 'ai_videos' | 'lead_searches' | null;
}

export function QuotaDisplay({ variant = 'full', showOnlyType = null }: QuotaDisplayProps) {
  const { quotas, isLoading, error } = useQuotas();

  if (isLoading) {
    return <QuotaDisplaySkeleton variant={variant} />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Impossible de charger les quotas. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  if (!quotas) return null;

  // Si l'utilisateur n'est pas beta, ne rien afficher
  if (!quotas.beta_user && variant !== 'full') {
    return null;
  }

  const quotaItems = [
    {
      type: 'ai_images' as const,
      icon: Image,
      label: 'Images IA',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      data: quotas.ai_images,
    },
    {
      type: 'ai_videos' as const,
      icon: Video,
      label: 'Vidéos IA',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      data: quotas.ai_videos,
    },
    {
      type: 'lead_searches' as const,
      icon: Users,
      label: 'Recherches Leads',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      data: quotas.lead_searches,
    },
  ];

  // Filtrer si nécessaire
  const filteredItems = showOnlyType
    ? quotaItems.filter((item) => item.type === showOnlyType)
    : quotaItems;

  // Variante inline (petit badge)
  if (variant === 'inline' && showOnlyType) {
    const item = filteredItems[0];
    if (!item) return null;

    const percentage = (item.data.remaining / item.data.limit) * 100;
    const isLow = percentage < 30;
    const isEmpty = item.data.remaining === 0;

    return (
      <Badge
        variant={isEmpty ? 'destructive' : isLow ? 'secondary' : 'outline'}
        className="gap-1"
      >
        <item.icon className="h-3 w-3" />
        {item.data.remaining}/{item.data.limit}
      </Badge>
    );
  }

  // Variante compact (une seule ligne par quota)
  if (variant === 'compact') {
    return (
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const percentage = (item.data.count / item.data.limit) * 100;
          const isLow = item.data.remaining <= 2;
          const isEmpty = item.data.remaining === 0;

          return (
            <div key={item.type} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    isEmpty
                      ? 'text-red-500'
                      : isLow
                      ? 'text-orange-500'
                      : 'text-gray-600'
                  }`}
                >
                  {item.data.remaining} restant{item.data.remaining > 1 ? 's' : ''}
                </span>
              </div>
              <Progress
                value={percentage}
                className={`h-2 ${isEmpty ? '[&>div]:bg-red-500' : isLow ? '[&>div]:bg-orange-500' : ''}`}
              />
              <p className="text-xs text-gray-500">
                {item.data.count} / {item.data.limit} utilisé{item.data.count > 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  // Variante full (card complète)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Quotas Beta
          </CardTitle>
          <Badge variant="secondary">Beta Testeur</Badge>
        </div>
        <CardDescription>
          Vos limites de génération pour la période beta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {filteredItems.map((item) => {
          const percentage = (item.data.count / item.data.limit) * 100;
          const isLow = item.data.remaining <= 2;
          const isEmpty = item.data.remaining === 0;

          return (
            <div key={item.type} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{item.label}</h4>
                    <p className="text-xs text-gray-500">
                      {item.data.count} / {item.data.limit} utilisé{item.data.count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${
                      isEmpty
                        ? 'text-red-500'
                        : isLow
                        ? 'text-orange-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {item.data.remaining}
                  </p>
                  <p className="text-xs text-gray-500">restant{item.data.remaining > 1 ? 's' : ''}</p>
                </div>
              </div>
              <Progress
                value={percentage}
                className={`h-2.5 ${isEmpty ? '[&>div]:bg-red-500' : isLow ? '[&>div]:bg-orange-500' : ''}`}
              />
              {isEmpty && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Quota épuisé. Contactez-nous pour augmenter votre limite.
                  </AlertDescription>
                </Alert>
              )}
              {isLow && !isEmpty && (
                <Alert className="py-2 border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-xs text-orange-800">
                    Attention, il ne vous reste que {item.data.remaining} génération
                    {item.data.remaining > 1 ? 's' : ''}.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Les quotas seront augmentés lors du lancement de l'abonnement premium
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuotaDisplaySkeleton({ variant }: { variant: 'full' | 'compact' | 'inline' }) {
  if (variant === 'inline') {
    return <Skeleton className="h-6 w-16" />;
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-2.5 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
