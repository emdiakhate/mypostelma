export type SocialPlatform = 'x' | 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok' | 'threads';

export type PostStatus = 'scheduled' | 'published' | 'draft' | 'failed' | 'pending';

export interface Post {
  id: string;
  content: string;
  scheduledTime: Date;
  published_at?: Date | string; // Date de publication réelle
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

  // Sentiment analysis (added for user posts)
  last_sentiment_analysis_at?: string | Date;
  sentiment_score?: number; // -1 to 1
  sentiment_label?: 'positive' | 'neutral' | 'negative';
  comments_sentiment_count?: number; // Number of comments analyzed

  // Upload Post integration
  upload_post_job_id?: string; // ID du job programmé Upload Post
  upload_post_request_id?: string; // ID de la requête async Upload Post
  upload_post_status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'scheduled';
  upload_post_results?: {
    [platform: string]: {
      success: boolean;
      url?: string;
      publish_id?: string;
      post_id?: string;
      error?: string;
      completed_at?: string;
    };
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