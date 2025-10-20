export type SocialPlatform = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok';

export type PostStatus = 'scheduled' | 'published' | 'draft' | 'failed' | 'pending';

export interface Post {
  id: string;
  content: string;
  scheduledTime: Date;
  platforms: SocialPlatform[];
  status: PostStatus;
  image?: string;
  images?: string[];
  video?: string; // URL de la vidéo
  videoThumbnail?: string; // URL de la miniature de la vidéo
  campaign?: string;
  campaignColor?: string;
  author: string;
  authorAvatar?: string;
  captions?: { [key: string]: string }; // Captions générées par IA pour chaque plateforme
  dayColumn: string; // e.g., 'sunday', 'monday', etc.
  timeSlot: number; // position in the day column
  
  // Métriques d'engagement
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  reach?: number;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

export interface Campaign {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}