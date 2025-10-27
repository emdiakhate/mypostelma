/**
 * Composant pour afficher une carte de compte social connecté
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, Facebook, Instagram, Linkedin, Twitter, MessageCircle, Music } from 'lucide-react';
import type { SocialPlatform } from '@/types/uploadPost.types';

interface ConnectedAccountCardProps {
  platform: SocialPlatform;
  displayName: string;
  image?: string;
  username?: string;
}

const platformConfig = {
  facebook: {
    icon: Facebook,
    color: 'text-blue-600',
    label: 'Facebook'
  },
  instagram: {
    icon: Instagram,
    color: 'text-pink-600',
    label: 'Instagram'
  },
  tiktok: {
    icon: Music,
    color: 'text-black',
    label: 'TikTok'
  },
  linkedin: {
    icon: Linkedin,
    color: 'text-blue-700',
    label: 'LinkedIn'
  },
  x: {
    icon: Twitter,
    color: 'text-black',
    label: 'X (Twitter)'
  },
  threads: {
    icon: MessageCircle,
    color: 'text-black',
    label: 'Threads'
  }
};

export function ConnectedAccountCard({ 
  platform, 
  displayName, 
  image, 
  username 
}: ConnectedAccountCardProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          {image ? (
            <AvatarImage src={image} alt={displayName} />
          ) : (
            <AvatarFallback className={config.color}>
              <Icon className="h-6 w-6" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <div>
          <p className="font-medium">{displayName}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{config.label}</p>
            {username && (
              <span className="text-xs text-muted-foreground">@{username}</span>
            )}
          </div>
        </div>
      </div>
      
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <Check className="h-3 w-3 mr-1" />
        Connecté
      </Badge>
    </div>
  );
}
