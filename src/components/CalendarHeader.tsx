import React from 'react';
import { ChevronLeft, ChevronRight, Filter, Share, MoreHorizontal, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPreviousWeek,
  onNextWeek,
  viewMode,
  onViewModeChange,
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const formatWeekRange = () => {
    return `Semaine du ${format(weekStart, 'd MMMM yyyy', { locale: fr })}`;
  };

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        {/* Left section - Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onPreviousWeek}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline"
              className="h-8 px-3 font-medium"
            >
              Aujourd'hui
            </Button>
            
            <Button
              variant="outline"
              size="sm" 
              onClick={onNextWeek}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            {formatWeekRange()}
          </h2>
        </div>

        {/* Right section - View controls and actions */}
        <div className="flex items-center gap-3">
          {/* View mode toggles */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('week')}
              className="h-7 px-3 text-xs"
            >
              <List className="w-3 h-3 mr-1" />
              Liste
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
            >
              Semaine
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('month')}
              className="h-7 px-3 text-xs"
            >
              Mois
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm" className="h-8">
              <Share className="w-4 h-4 mr-2" />
              Partager
            </Button>
            
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
            
            <Button variant="default" size="sm" className="h-8 bg-primary hover:bg-primary-hover">
              <span className="mr-2">+</span>
              Créer un post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;