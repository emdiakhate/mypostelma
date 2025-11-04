import React, { memo } from 'react';
import { Lightbulb, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface BestTimeRecommendation {
  recommended: Date;
  reason: string;
  alternatives: Date[];
}

interface BestTimeSectionProps {
  bestTimeRecommendation: BestTimeRecommendation | null;
  engagementChartData: any[];
  onUseBestTime: (date: Date) => void;
  onUseAlternativeTime: (date: Date) => void;
  selectedPlatforms: string[];
}

const BestTimeSection: React.FC<BestTimeSectionProps> = memo(({
  bestTimeRecommendation,
  engagementChartData,
  onUseBestTime,
  onUseAlternativeTime,
  selectedPlatforms
}) => {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">💡 Meilleur moment</h3>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Recommandé
        </Badge>
      </div>
      
      <div className="space-y-3">
        {/* Moment recommandé */}
        {bestTimeRecommendation ? (
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-foreground">
                  {format(bestTimeRecommendation.recommended, 'EEEE dd/MM à HH:mm', { locale: fr })}
                </p>
                <p className="text-sm text-muted-foreground">{bestTimeRecommendation.reason}</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => {
                onUseBestTime(bestTimeRecommendation.recommended);
                toast.success('Créneau pré-rempli dans la section "Programmer la publication"');
              }}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Utiliser ce créneau
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-foreground">
                  Mardi 15/01 à 18:00
                </p>
                <p className="text-sm text-muted-foreground">Moment optimal général pour {selectedPlatforms[0]}</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => {
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 1);
                defaultDate.setHours(18, 0, 0, 0);
                onUseBestTime(defaultDate);
                toast.success('Créneau pré-rempli dans la section "Programmer la publication"');
              }}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Utiliser ce créneau
            </Button>
          </div>
        )}
    
        {/* Alternatives */}
        {bestTimeRecommendation ? (
          bestTimeRecommendation.alternatives.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Ou essayez :</p>
              <div className="flex gap-2 flex-wrap">
                {bestTimeRecommendation.alternatives.map((alt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onUseAlternativeTime(alt);
                      toast.success('Créneau pré-rempli dans la section "Programmer la publication"');
                    }}
                    className="text-xs border-yellow-200 text-yellow-800 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                  >
                    {format(alt, 'EEEE HH:mm', { locale: fr })}
                  </Button>
                ))}
              </div>
            </div>
          )
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Ou essayez :</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const altDate1 = new Date();
                  altDate1.setDate(altDate1.getDate() + 2);
                  altDate1.setHours(14, 0, 0, 0);
                  onUseAlternativeTime(altDate1);
                  toast.success('Créneau pré-rempli dans la section "Programmer la publication"');
                }}
                className="text-xs border-yellow-200 text-yellow-800 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
              >
                Jeudi 14h
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const altDate2 = new Date();
                  altDate2.setDate(altDate2.getDate() + 4);
                  altDate2.setHours(19, 0, 0, 0);
                  onUseAlternativeTime(altDate2);
                  toast.success('Créneau pré-rempli dans la section "Programmer la publication"');
                }}
                className="text-xs border-yellow-200 text-yellow-800 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
              >
                Vendredi 19h
              </Button>
            </div>
          </div>
        )}

        {/* Graphique d'engagement */}
        {engagementChartData.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-2">Engagement par heure</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="engagement" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

BestTimeSection.displayName = 'BestTimeSection';

export default BestTimeSection;
