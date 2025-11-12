export interface Competitor {
  id: string;
  user_id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  social_media?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  notes: string;
  tags: string[];
  metrics?: {
    followers?: number;
    engagement_rate?: number;
    posting_frequency?: number;
  };
  added_at: Date;
  created_at: Date;
  updated_at: Date;
  source: string;
}
