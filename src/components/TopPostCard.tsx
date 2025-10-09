/**
 * Composant pour afficher un top post
 * Phase 3: Analytics Interface
 */

import React from 'react';
import { PostAnalytics } from '@/types/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  Bookmark,
  MousePointer,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Music,
  Youtube,
  Bookmark as Pinterest
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopPostCardProps {
  post: PostAnalytics;
  rank: number;
  onClick: () => void;
  className?: string;
}

const TopPostCard: React.FC<TopPostCardProps> = ({
  post,
  rank,
  onClick,
  className
}) => {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'tiktok': return Music;
      case 'youtube': return Youtube;
      case 'pinterest': return Pinterest;
      default: return Instagram;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'facebook': return 'bg-blue-600';
      case 'linkedin': return 'bg-blue-700';
      case 'twitter': return 'bg-black';
      case 'tiktok': return 'bg-black';
      case 'youtube': return 'bg-red-600';
      case 'pinterest': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const PlatformIcon = getPlatformIcon(post.platform);

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Image thumbnail avec overlay */}
        <div className="relative aspect-square bg-gray-200 rounded-t-lg overflow-hidden">
          {/* Image placeholder */}
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <div className="text-4xl">📸</div>
          </div>
          
          {/* Rank badge */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-black/80 text-white font-bold">
              #{rank}
            </Badge>
          </div>
          
          {/* Platform badge */}
          <div className="absolute top-2 right-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              getPlatformColor(post.platform)
            )}>
              <PlatformIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Engagement rate badge */}
          <div className="absolute bottom-2 right-2">
            <Badge 
              className={cn(
                "text-white font-bold",
                post.metrics.engagementRate > 5 ? 'bg-green-500' :
                post.metrics.engagementRate > 3 ? 'bg-yellow-500' : 'bg-red-500'
              )}
            >
              {post.metrics.engagementRate.toFixed(1)}%
            </Badge>
          </div>
          
          {/* Métriques overlay */}
          <div className="absolute bottom-2 left-2 right-2 bg-black/80 rounded-lg p-2 text-white">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{formatNumber(post.metrics.likes)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{formatNumber(post.metrics.comments)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Share2 className="w-3 h-3" />
                  <span>{formatNumber(post.metrics.shares)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(post.metrics.impressions)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenu */}
        <div className="p-4">
          {/* Caption tronquée */}
          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          
          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {new Date(post.publishedAt).toLocaleDateString('fr-FR')}
            </span>
            
            {/* Bouton détails (visible au hover) */}
            <Button 
              size="sm" 
              variant="outline" 
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              Détails
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPostCard;
