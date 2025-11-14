export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      competitor_analysis: {
        Row: {
          analysis_cost: number | null
          analyzed_at: string | null
          competitor_id: string | null
          content_strategy: string | null
          estimated_budget: string | null
          facebook_data: Json | null
          id: string
          instagram_data: Json | null
          key_differentiators: string[] | null
          linkedin_data: Json | null
          opportunities_for_us: string[] | null
          positioning: string | null
          recommendations: string | null
          social_media_presence: string | null
          strengths: string[] | null
          summary: string | null
          target_audience: string | null
          tiktok_data: Json | null
          tokens_used: number | null
          tone: string | null
          twitter_data: Json | null
          version: number | null
          weaknesses: string[] | null
          website_data: Json | null
        }
        Insert: {
          analysis_cost?: number | null
          analyzed_at?: string | null
          competitor_id?: string | null
          content_strategy?: string | null
          estimated_budget?: string | null
          facebook_data?: Json | null
          id?: string
          instagram_data?: Json | null
          key_differentiators?: string[] | null
          linkedin_data?: Json | null
          opportunities_for_us?: string[] | null
          positioning?: string | null
          recommendations?: string | null
          social_media_presence?: string | null
          strengths?: string[] | null
          summary?: string | null
          target_audience?: string | null
          tiktok_data?: Json | null
          tokens_used?: number | null
          tone?: string | null
          twitter_data?: Json | null
          version?: number | null
          weaknesses?: string[] | null
          website_data?: Json | null
        }
        Update: {
          analysis_cost?: number | null
          analyzed_at?: string | null
          competitor_id?: string | null
          content_strategy?: string | null
          estimated_budget?: string | null
          facebook_data?: Json | null
          id?: string
          instagram_data?: Json | null
          key_differentiators?: string[] | null
          linkedin_data?: Json | null
          opportunities_for_us?: string[] | null
          positioning?: string | null
          recommendations?: string | null
          social_media_presence?: string | null
          strengths?: string[] | null
          summary?: string | null
          target_audience?: string | null
          tiktok_data?: Json | null
          tokens_used?: number | null
          tone?: string | null
          twitter_data?: Json | null
          version?: number | null
          weaknesses?: string[] | null
          website_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_analysis_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_comparison"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_analysis_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_latest_analysis"
            referencedColumns: ["competitor_id"]
          },
          {
            foreignKeyName: "competitor_analysis_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_metrics_history: {
        Row: {
          avg_comments: number | null
          avg_engagement_rate: number | null
          avg_likes: number | null
          competitor_id: string | null
          facebook_likes: number | null
          id: string
          instagram_followers: number | null
          instagram_following: number | null
          instagram_posts_count: number | null
          linkedin_employees: number | null
          linkedin_followers: number | null
          posts_last_30_days: number | null
          posts_last_7_days: number | null
          recorded_at: string | null
        }
        Insert: {
          avg_comments?: number | null
          avg_engagement_rate?: number | null
          avg_likes?: number | null
          competitor_id?: string | null
          facebook_likes?: number | null
          id?: string
          instagram_followers?: number | null
          instagram_following?: number | null
          instagram_posts_count?: number | null
          linkedin_employees?: number | null
          linkedin_followers?: number | null
          posts_last_30_days?: number | null
          posts_last_7_days?: number | null
          recorded_at?: string | null
        }
        Update: {
          avg_comments?: number | null
          avg_engagement_rate?: number | null
          avg_likes?: number | null
          competitor_id?: string | null
          facebook_likes?: number | null
          id?: string
          instagram_followers?: number | null
          instagram_following?: number | null
          instagram_posts_count?: number | null
          linkedin_employees?: number | null
          linkedin_followers?: number | null
          posts_last_30_days?: number | null
          posts_last_7_days?: number | null
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_metrics_history_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_comparison"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_metrics_history_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_latest_analysis"
            referencedColumns: ["competitor_id"]
          },
          {
            foreignKeyName: "competitor_metrics_history_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_posts: {
        Row: {
          comments: number | null
          competitor_id: string | null
          content_type: string | null
          detected_tone: string | null
          engagement_rate: number | null
          hashtags: string[] | null
          id: string
          likes: number | null
          media_urls: string[] | null
          platform: string
          post_text: string | null
          post_url: string | null
          posted_at: string | null
          scraped_at: string | null
          shares: number | null
          views: number | null
        }
        Insert: {
          comments?: number | null
          competitor_id?: string | null
          content_type?: string | null
          detected_tone?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          media_urls?: string[] | null
          platform: string
          post_text?: string | null
          post_url?: string | null
          posted_at?: string | null
          scraped_at?: string | null
          shares?: number | null
          views?: number | null
        }
        Update: {
          comments?: number | null
          competitor_id?: string | null
          content_type?: string | null
          detected_tone?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          media_urls?: string[] | null
          platform?: string
          post_text?: string | null
          post_url?: string | null
          posted_at?: string | null
          scraped_at?: string | null
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_posts_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_comparison"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_posts_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_latest_analysis"
            referencedColumns: ["competitor_id"]
          },
          {
            foreignKeyName: "competitor_posts_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          added_at: string | null
          analysis_count: number | null
          description: string | null
          facebook_likes: string | null
          facebook_url: string | null
          id: string
          industry: string | null
          instagram_followers: string | null
          instagram_url: string | null
          last_analyzed_at: string | null
          linkedin_followers: string | null
          linkedin_url: string | null
          name: string
          tiktok_url: string | null
          twitter_url: string | null
          user_id: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          added_at?: string | null
          analysis_count?: number | null
          description?: string | null
          facebook_likes?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_followers?: string | null
          instagram_url?: string | null
          last_analyzed_at?: string | null
          linkedin_followers?: string | null
          linkedin_url?: string | null
          name: string
          tiktok_url?: string | null
          twitter_url?: string | null
          user_id?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          added_at?: string | null
          analysis_count?: number | null
          description?: string | null
          facebook_likes?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_followers?: string | null
          instagram_url?: string | null
          last_analyzed_at?: string | null
          linkedin_followers?: string | null
          linkedin_url?: string | null
          name?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          user_id?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          added_at: string
          address: string
          category: string
          city: string
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          metrics: Json | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          social_media: Json | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          added_at?: string
          address: string
          category: string
          city: string
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          metrics?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          social_media?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          added_at?: string
          address?: string
          category?: string
          city?: string
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          metrics?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          social_media?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      media_archives: {
        Row: {
          created_at: string | null
          dimensions: string | null
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          source: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dimensions?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          source: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dimensions?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          source?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_analytics: {
        Row: {
          comments: number | null
          id: string
          likes: number | null
          post_id: string
          reach: number | null
          shares: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          comments?: number | null
          id?: string
          likes?: number | null
          post_id: string
          reach?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          comments?: number | null
          id?: string
          likes?: number | null
          post_id?: string
          reach?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_is_verified: boolean | null
          author_username: string | null
          comment_likes: number | null
          comment_text: string
          comment_url: string | null
          created_at: string | null
          id: string
          is_competitor_reply: boolean | null
          keywords: string[] | null
          post_id: string
          posted_at: string | null
          scraped_at: string | null
          sentiment_explanation: string | null
          sentiment_label: string | null
          sentiment_score: number | null
        }
        Insert: {
          author_is_verified?: boolean | null
          author_username?: string | null
          comment_likes?: number | null
          comment_text: string
          comment_url?: string | null
          created_at?: string | null
          id?: string
          is_competitor_reply?: boolean | null
          keywords?: string[] | null
          post_id: string
          posted_at?: string | null
          scraped_at?: string | null
          sentiment_explanation?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
        }
        Update: {
          author_is_verified?: boolean | null
          author_username?: string | null
          comment_likes?: number | null
          comment_text?: string
          comment_url?: string | null
          created_at?: string | null
          id?: string
          is_competitor_reply?: boolean | null
          keywords?: string[] | null
          post_id?: string
          posted_at?: string | null
          scraped_at?: string | null
          sentiment_explanation?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "competitor_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          accounts: string[]
          author_id: string
          campaign: string | null
          campaign_color: string | null
          captions: Json | null
          content: string
          created_at: string
          day_column: string | null
          id: string
          images: string[] | null
          platforms: string[]
          published_at: string | null
          rejection_reason: string | null
          scheduled_time: string | null
          status: Database["public"]["Enums"]["post_status"]
          time_slot: number | null
          updated_at: string
          video: string | null
          video_thumbnail: string | null
        }
        Insert: {
          accounts?: string[]
          author_id: string
          campaign?: string | null
          campaign_color?: string | null
          captions?: Json | null
          content: string
          created_at?: string
          day_column?: string | null
          id?: string
          images?: string[] | null
          platforms?: string[]
          published_at?: string | null
          rejection_reason?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          time_slot?: number | null
          updated_at?: string
          video?: string | null
          video_thumbnail?: string | null
        }
        Update: {
          accounts?: string[]
          author_id?: string
          campaign?: string | null
          campaign_color?: string | null
          captions?: Json | null
          content?: string
          created_at?: string
          day_column?: string | null
          id?: string
          images?: string[] | null
          platforms?: string[]
          published_at?: string | null
          rejection_reason?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          time_slot?: number | null
          updated_at?: string
          video?: string | null
          video_thumbnail?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_image_generation_count: number | null
          ai_image_generation_limit: number | null
          ai_video_generation_count: number | null
          ai_video_generation_limit: number | null
          avatar: string | null
          beta_user: boolean | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          lead_generation_count: number | null
          lead_generation_limit: number | null
          name: string
          posts_unlimited: boolean | null
          quota_reset_date: string | null
          upload_post_username: string | null
        }
        Insert: {
          ai_image_generation_count?: number | null
          ai_image_generation_limit?: number | null
          ai_video_generation_count?: number | null
          ai_video_generation_limit?: number | null
          avatar?: string | null
          beta_user?: boolean | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_login?: string | null
          lead_generation_count?: number | null
          lead_generation_limit?: number | null
          name: string
          posts_unlimited?: boolean | null
          quota_reset_date?: string | null
          upload_post_username?: string | null
        }
        Update: {
          ai_image_generation_count?: number | null
          ai_image_generation_limit?: number | null
          ai_video_generation_count?: number | null
          ai_video_generation_limit?: number | null
          avatar?: string | null
          beta_user?: boolean | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          lead_generation_count?: number | null
          lead_generation_limit?: number | null
          name?: string
          posts_unlimited?: boolean | null
          quota_reset_date?: string | null
          upload_post_username?: string | null
        }
        Relationships: []
      }
      sentiment_statistics: {
        Row: {
          analysis_id: string
          analyzed_at: string | null
          avg_engagement_rate: number | null
          avg_sentiment_score: number | null
          competitor_id: string
          created_at: string | null
          id: string
          negative_count: number | null
          negative_percentage: number | null
          neutral_count: number | null
          neutral_percentage: number | null
          positive_count: number | null
          positive_percentage: number | null
          response_rate: number | null
          top_keywords: Json | null
          total_comments: number
          total_posts: number
        }
        Insert: {
          analysis_id: string
          analyzed_at?: string | null
          avg_engagement_rate?: number | null
          avg_sentiment_score?: number | null
          competitor_id: string
          created_at?: string | null
          id?: string
          negative_count?: number | null
          negative_percentage?: number | null
          neutral_count?: number | null
          neutral_percentage?: number | null
          positive_count?: number | null
          positive_percentage?: number | null
          response_rate?: number | null
          top_keywords?: Json | null
          total_comments?: number
          total_posts?: number
        }
        Update: {
          analysis_id?: string
          analyzed_at?: string | null
          avg_engagement_rate?: number | null
          avg_sentiment_score?: number | null
          competitor_id?: string
          created_at?: string | null
          id?: string
          negative_count?: number | null
          negative_percentage?: number | null
          neutral_count?: number | null
          neutral_percentage?: number | null
          positive_count?: number | null
          positive_percentage?: number | null
          response_rate?: number | null
          top_keywords?: Json | null
          total_comments?: number
          total_posts?: number
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_statistics_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentiment_statistics_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_comparison"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentiment_statistics_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_latest_analysis"
            referencedColumns: ["competitor_id"]
          },
          {
            foreignKeyName: "sentiment_statistics_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          beta_user: boolean | null
          created_at: string
          id: string
          plan_type: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          beta_user?: boolean | null
          created_at?: string
          id?: string
          plan_type?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          beta_user?: boolean | null
          created_at?: string
          id?: string
          plan_type?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_custom_hashtags: {
        Row: {
          created_at: string | null
          domain: string
          hashtag: string
          id: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain: string
          hashtag: string
          id?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          hashtag?: string
          id?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_writing_styles: {
        Row: {
          created_at: string | null
          examples: string[]
          id: string
          is_active: boolean | null
          name: string
          style_description: string | null
          style_instructions: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          examples: string[]
          id?: string
          is_active?: boolean | null
          name: string
          style_description?: string | null
          style_instructions: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          examples?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
          style_description?: string | null
          style_instructions?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      competitor_comparison: {
        Row: {
          avg_engagement_rate: number | null
          facebook_likes: number | null
          id: string | null
          industry: string | null
          instagram_followers: number | null
          last_analyzed_at: string | null
          linkedin_followers: number | null
          name: string | null
          total_posts_tracked: number | null
        }
        Relationships: []
      }
      competitor_latest_analysis: {
        Row: {
          analysis_cost: number | null
          competitor_id: string | null
          content_strategy: string | null
          facebook_url: string | null
          industry: string | null
          instagram_url: string | null
          last_analyzed_at: string | null
          linkedin_url: string | null
          name: string | null
          opportunities_for_us: string[] | null
          positioning: string | null
          social_media_presence: string | null
          strengths: string[] | null
          summary: string | null
          tone: string | null
          weaknesses: string[] | null
          website_url: string | null
        }
        Relationships: []
      }
      competitor_recent_activity: {
        Row: {
          comments: number | null
          competitor_name: string | null
          engagement_rate: number | null
          likes: number | null
          platform: string | null
          post_text: string | null
          post_url: string | null
          posted_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_quotas: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_image_generation: {
        Args: { p_user_id: string }
        Returns: Json
      }
      increment_ai_video_generation: {
        Args: { p_user_id: string }
        Returns: Json
      }
      increment_lead_generation: { Args: { p_user_id: string }; Returns: Json }
      reset_user_quotas: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "manager"
      lead_status:
        | "new"
        | "contacted"
        | "interested"
        | "client"
        | "not_interested"
      post_status: "pending" | "scheduled" | "published" | "failed" | "draft"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["manager"],
      lead_status: [
        "new",
        "contacted",
        "interested",
        "client",
        "not_interested",
      ],
      post_status: ["pending", "scheduled", "published", "failed", "draft"],
    },
  },
} as const
