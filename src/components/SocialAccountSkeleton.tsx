/**
 * Composant Skeleton pour les comptes sociaux
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SocialAccountSkeletonProps {
  count?: number;
  className?: string;
}

const SocialAccountSkeleton: React.FC<SocialAccountSkeletonProps> = ({ 
  count = 3, 
  className 
}) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              {/* Avatar skeleton */}
              <div className="w-12 h-12 rounded-full skeleton flex-shrink-0"></div>
              
              <div className="flex-1 space-y-2">
                {/* Username skeleton */}
                <div className="h-4 bg-gray-200 rounded skeleton w-3/4"></div>
                
                {/* Display name skeleton */}
                <div className="h-3 bg-gray-200 rounded skeleton w-1/2"></div>
                
                {/* Metrics skeleton */}
                <div className="flex space-x-4">
                  <div className="h-3 bg-gray-200 rounded skeleton w-16"></div>
                  <div className="h-3 bg-gray-200 rounded skeleton w-20"></div>
                </div>
                
                {/* Status skeleton */}
                <div className="h-6 bg-gray-200 rounded skeleton w-20"></div>
              </div>
              
              {/* Actions skeleton */}
              <div className="w-8 h-8 bg-gray-200 rounded skeleton"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SocialAccountSkeleton;
