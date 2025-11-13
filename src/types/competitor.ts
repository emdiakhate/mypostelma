export interface Competitor {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  description?: string;
  website_url?: string;
  instagram_url?: string;
  instagram_followers?: string;
  facebook_url?: string;
  facebook_likes?: string;
  linkedin_url?: string;
  linkedin_followers?: string;
  twitter_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  added_at: Date;
  last_analyzed_at?: Date;
  analysis_count: number;
}
