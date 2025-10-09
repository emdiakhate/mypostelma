/**
 * Composant pour afficher les KPIs principaux
 * Phase 3: Analytics Interface
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalyticsKPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  className?: string;
}

const AnalyticsKPICard: React.FC<AnalyticsKPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  sparklineData,
  className
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    
    if (trend.value > 0) return 'text-green-600';
    if (trend.value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        {/* Icône */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          
          {/* Sparkline en arrière-plan */}
          {sparklineData && (
            <div className="absolute top-4 right-4 w-16 h-8 opacity-20">
              <svg width="100%" height="100%" viewBox="0 0 64 32" className="text-blue-500">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={sparklineData.map((val, i) => 
                    `${i * (64 / (sparklineData.length - 1))},${32 - (val / Math.max(...sparklineData)) * 32}`
                  ).join(' ')}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Valeur principale */}
        <div className="mb-2">
          <h3 className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        {/* Trend */}
        {trend && (
          <div className={cn(
            "flex items-center space-x-1 text-sm font-medium",
            getTrendColor()
          )}>
            {getTrendIcon()}
            <span>
              {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
            <span className="text-gray-500 text-xs">vs période précédente</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsKPICard;
