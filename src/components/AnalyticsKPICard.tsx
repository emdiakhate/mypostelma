import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnalyticsKPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  className?: string;
}

export function AnalyticsKPICard({ title, value, icon: Icon, className }: AnalyticsKPICardProps) {
  const formatValue = (val: number): string => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toString();
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="text-3xl font-bold">{formatValue(value)}</div>
      </CardContent>
    </Card>
  );
}
