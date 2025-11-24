import React, { memo, useMemo, useState } from 'react';
import { Lightbulb, Clock, TrendingUp } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getBestPostingTimes, getDayFactor, getBestDay } from '@/data/bestPostingTimes';

interface BestTimeSectionProps {
  onUseBestTime: (date: Date) => void;
  selectedPlatforms: string[];
  selectedDomain: string;
}

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'facebook', label: 'Facebook', emoji: '👥' },
  { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { value: 'twitter', label: 'Twitter/X', emoji: '🐦' },
];

const BestTimeSection: React.FC<BestTimeSectionProps> = memo(({
  onUseBestTime,
  selectedPlatforms,
  selectedDomain
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState(selectedPlatforms[0] || 'instagram');
  const platform = selectedPlatform;
  
  // Charger les meilleurs horaires pour la plateforme et le domaine
  const postingTimes = useMemo(() => {
    return getBestPostingTimes(platform, selectedDomain);
  }, [platform, selectedDomain]);

  // Trouver le meilleur moment
  const bestTime = useMemo(() => {
    if (postingTimes.length === 0) return null;
    return postingTimes.reduce((max, time) => 
      time.engagement > max.engagement ? time : max
    );
  }, [postingTimes]);

  // Obtenir le meilleur jour
  const { day: bestDayName, boost } = useMemo(() => 
    getBestDay(platform), [platform]
  );

  // Créer une date pour le meilleur moment (demain à cette heure)
  const getBestDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = addDays(new Date(), 1);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-primary/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-3 w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">⏰ Meilleurs Moments</h3>
        </div>
        <svg
          className={`w-5 h-5 text-primary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2 text-foreground">Réseau social</label>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span>{option.emoji}</span>
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-3">
          {/* Info jour optimal */}
          {boost > 0 && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                <span>
                  📈 Le {bestDayName} génère <strong>+{boost}%</strong> d'engagement sur {platform}
                </span>
              </p>
            </div>
          )}

          {/* Meilleurs moments */}
          {postingTimes.length > 0 ? (
            postingTimes.map((time, index) => {
              const isBest = bestTime && time.time === bestTime.time;
              const targetDate = getBestDate(time.time);
              
              return (
                <div 
                  key={index}
                  className={`p-3 bg-background rounded-lg border ${
                    isBest 
                      ? 'border-green-400 dark:border-green-600 shadow-sm' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className={`w-4 h-4 ${isBest ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
                        <p className="font-medium text-foreground">
                          {time.time} - {time.label}
                        </p>
                        {isBest && (
                          <Badge className="bg-green-500 text-white text-xs">
                            🔥 Meilleur
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        💡 {time.reason}
                      </p>
                      <div className="ml-6 mt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${isBest ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${time.engagement}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            +{time.engagement}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        onUseBestTime(targetDate);
                        toast.success(`Programmé pour demain à ${time.time}`);
                      }}
                      variant={isBest ? "default" : "outline"}
                      className={isBest ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                    >
                      Choisir
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 bg-background rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-muted-foreground">
                Aucune recommandation disponible pour ce domaine
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BestTimeSection.displayName = 'BestTimeSection';

export default BestTimeSection;
