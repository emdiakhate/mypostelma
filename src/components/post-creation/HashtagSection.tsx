import React, { memo, useState } from 'react';
import { Hash, Plus, X, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useHashtags } from '@/hooks/useHashtags';
import { getAllDomains } from '@/data/hashtagsByDomain';

interface HashtagSectionProps {
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  onAddHashtag: (hashtag: string) => void;
  selectedHashtags: string[];
}

const HashtagSection: React.FC<HashtagSectionProps> = memo(({
  selectedDomain,
  onDomainChange,
  onAddHashtag,
  selectedHashtags
}) => {
  const domains = getAllDomains();
  const { 
    predefinedHashtags, 
    customHashtags, 
    isLoading,
    addCustomHashtag, 
    removeCustomHashtag,
    incrementUsage
  } = useHashtags(selectedDomain);
  
  const [newHashtag, setNewHashtag] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const handleAddHashtag = (hashtag: string) => {
    onAddHashtag(hashtag);
    incrementUsage(hashtag);
  };

  const handleAddCustom = async () => {
    if (!newHashtag.trim()) return;
    
    const success = await addCustomHashtag(newHashtag);
    if (success) {
      setNewHashtag('');
      setShowAddInput(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-3">
        <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-foreground">🏷️ Hashtags Suggérés</h3>
      </div>

      <div className="space-y-4">
        {/* Sélection du domaine */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Domaine d'activité</p>
          <Select value={selectedDomain} onValueChange={onDomainChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  <span className="flex items-center gap-2">
                    <span>{domain.icon}</span>
                    <span>{domain.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hashtags suggérés */}
        {predefinedHashtags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">📌 Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {predefinedHashtags.map((hashtag, index) => {
                const isSelected = selectedHashtags.includes(hashtag);
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAddHashtag(hashtag)}
                    className={isSelected 
                      ? "text-xs bg-purple-500 hover:bg-purple-600 text-white" 
                      : "text-xs border-purple-200 text-purple-800 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    }
                  >
                    {hashtag}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hashtags personnels */}
        {customHashtags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Vos hashtags
            </p>
            <div className="flex flex-wrap gap-2">
              {customHashtags.map((custom) => {
                const isSelected = selectedHashtags.includes(custom.hashtag);
                return (
                  <div key={custom.id} className="relative group">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAddHashtag(custom.hashtag)}
                      className={isSelected 
                        ? "text-xs bg-purple-500 hover:bg-purple-600 text-white pr-8" 
                        : "text-xs border-purple-200 text-purple-800 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20 pr-8"
                      }
                    >
                      {custom.hashtag}
                      {custom.usage_count > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {custom.usage_count}
                        </Badge>
                      )}
                    </Button>
                    <button
                      onClick={() => removeCustomHashtag(custom.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ajouter un hashtag personnel */}
        <div>
          {showAddInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Ex: #mamarque"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleAddCustom}
                disabled={isLoading || !newHashtag.trim()}
              >
                Ajouter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddInput(false);
                  setNewHashtag('');
                }}
              >
                Annuler
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddInput(true)}
              className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un hashtag personnel
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground">
          💡 Recommandé : 5-10 hashtags pour maximiser la portée
        </div>
      </div>
    </div>
  );
});

HashtagSection.displayName = 'HashtagSection';

export default HashtagSection;
