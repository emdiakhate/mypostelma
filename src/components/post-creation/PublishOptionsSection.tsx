import React, { memo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PublishOptionsSectionProps {
  publishType: 'now' | 'scheduled';
  onPublishTypeChange: (type: 'now' | 'scheduled') => void;
  scheduledDateTime: Date | null;
  onScheduledDateTimeChange: (date: Date | null) => void;
  generatedCaptions: any;
  onRegenerateCaptions: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  hasPublishPermission: boolean;
  selectedAccountsCount: number;
  isEditing?: boolean;
}

const PublishOptionsSection: React.FC<PublishOptionsSectionProps> = memo(({
  publishType,
  onPublishTypeChange,
  scheduledDateTime,
  onScheduledDateTimeChange,
  generatedCaptions,
  onRegenerateCaptions,
  onPublish,
  isPublishing,
  hasPublishPermission,
  selectedAccountsCount,
  isEditing = false
}) => {
  return (
    <div className="space-y-4">
      {/* Options de publication */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Options de publication</label>
        
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input 
              type="radio" 
              name="publishType"
              value="now"
              checked={publishType === 'now'}
              onChange={() => onPublishTypeChange('now')}
              className="w-4 h-4"
            />
            <span>Publier immédiatement</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input 
              type="radio" 
              name="publishType"
              value="scheduled"
              checked={publishType === 'scheduled'}
              onChange={() => onPublishTypeChange('scheduled')}
              className="w-4 h-4"
            />
            <span>Programmer la publication</span>
          </label>
        </div>
      </div>

      {/* Section date/heure conditionnelle */}
      {publishType === 'scheduled' && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={scheduledDateTime ? format(scheduledDateTime, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                const currentTime = scheduledDateTime || new Date();
                newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                onScheduledDateTimeChange(newDate);
              }}
              className="w-full p-2 border border-border rounded bg-background"
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Heure</label>
            <input
              type="time"
              value={scheduledDateTime ? format(scheduledDateTime, 'HH:mm') : ''}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newDate = scheduledDateTime ? new Date(scheduledDateTime) : new Date();
                newDate.setHours(parseInt(hours), parseInt(minutes));
                onScheduledDateTimeChange(newDate);
              }}
              className="w-full p-2 border border-border rounded bg-background"
            />
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="space-y-3">
        {/* Bouton Enregistrer (en mode édition uniquement) */}
        {isEditing && (
          <Button 
            onClick={onPublish}
            disabled={
              selectedAccountsCount === 0 || 
              isPublishing || 
              (publishType === 'scheduled' && !scheduledDateTime)
            }
            className="w-full font-semibold py-3 bg-blue-500 hover:bg-blue-600"
          >
            {isPublishing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                Enregistrement...
              </div>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        )}

        {/* Bouton Publier */}
        <Button 
          onClick={onPublish}
          disabled={
            isPublishing || 
            (publishType === 'scheduled' && !scheduledDateTime)
          }
          className={cn(
            "w-full font-semibold py-3",
            hasPublishPermission 
              ? (publishType === 'now' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-blue-500 hover:bg-blue-600')
              : 'bg-orange-500 hover:bg-orange-600'
          )}
        >
          {isPublishing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
              {publishType === 'now' ? 'Publication...' : 'Programmation...'}
            </div>
          ) : (
            hasPublishPermission 
              ? (publishType === 'now' ? 'Publier maintenant' : 'Programmer la publication')
              : (publishType === 'now' ? 'Soumettre pour approbation' : 'Programmer pour approbation')
          )}
        </Button>
        
        {/* Bouton Régénérer les captions */}
        {generatedCaptions && (
          <Button 
            onClick={onRegenerateCaptions}
            variant="outline"
            className="w-full"
          >
            Régénérer les captions
          </Button>
        )}
      </div>
    </div>
  );
});

PublishOptionsSection.displayName = 'PublishOptionsSection';

export default PublishOptionsSection;
