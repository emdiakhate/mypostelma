import React, { memo } from 'react';
import { Hash, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HashtagSuggestion {
  hashtag: string;
  expectedEngagement: number;
}

interface HashtagSet {
  id: string;
  name: string;
  hashtags: string[];
}

interface HashtagSectionProps {
  hashtagSuggestions: HashtagSuggestion[];
  hashtagSets: HashtagSet[];
  selectedHashtagSet: string;
  onHashtagSetChange: (setId: string) => void;
  onAddHashtag: (hashtag: string) => void;
  onUseHashtagSet: (setId: string) => void;
}

const HashtagSection: React.FC<HashtagSectionProps> = memo(({
  hashtagSuggestions,
  hashtagSets,
  selectedHashtagSet,
  onHashtagSetChange,
  onAddHashtag,
  onUseHashtagSet
}) => {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-3">
        <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-foreground">🏷️ Hashtags suggérés</h3>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          IA
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Top 5 hashtags du moment */}
        {hashtagSuggestions.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Top 5 du moment</p>
            <div className="flex flex-wrap gap-2">
              {hashtagSuggestions.slice(0, 5).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onAddHashtag(suggestion.hashtag)}
                  className="text-xs border-purple-200 text-purple-800 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  {suggestion.hashtag}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {suggestion.expectedEngagement.toFixed(1)}%
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Sets de hashtags */}
        {hashtagSets.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Utiliser un set</p>
            <div className="flex gap-2">
              <Select value={selectedHashtagSet} onValueChange={onHashtagSetChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sélectionner un set" />
                </SelectTrigger>
                <SelectContent>
                  {hashtagSets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name} ({set.hashtags.length} hashtags)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => onUseHashtagSet(selectedHashtagSet)}
                disabled={!selectedHashtagSet}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        )}

        {/* Suggestions intelligentes */}
        {hashtagSuggestions.length > 5 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Plus de suggestions</p>
            <div className="flex flex-wrap gap-2">
              {hashtagSuggestions.slice(5, 10).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onAddHashtag(suggestion.hashtag)}
                  className="text-xs border-border text-foreground hover:bg-accent"
                >
                  {suggestion.hashtag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Auto-complétion */}
        <div className="text-xs text-muted-foreground">
          💡 Tapez # pour voir l'auto-complétion des hashtags
        </div>
      </div>
    </div>
  );
});

HashtagSection.displayName = 'HashtagSection';

export default HashtagSection;
