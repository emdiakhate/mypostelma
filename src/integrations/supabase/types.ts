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
      comparative_analysis: {
        Row: {
          analysis_date: string
          competitor_ids: string[]
          data_insights: Json | null
          domain_comparisons: Json | null
          id: string
          my_business_id: string
          overall_comparison: Json | null
          personalized_recommendations: Json | null
          user_id: string
        }
        Insert: {
          analysis_date?: string
          competitor_ids: string[]
          data_insights?: Json | null
          domain_comparisons?: Json | null
          id?: string
          my_business_id: string
          overall_comparison?: Json | null
          personalized_recommendations?: Json | null
          user_id: string
        }
        Update: {
          analysis_date?: string
          competitor_ids?: string[]
          data_insights?: Json | null
          domain_comparisons?: Json | null
          id?: string
          my_business_id?: string
          overall_comparison?: Json | null
          personalized_recommendations?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparative_analysis_my_business_id_fkey"
            columns: ["my_business_id"]
            isOneToOne: false
            referencedRelation: "my_business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparative_analysis_my_business_id_fkey"
            columns: ["my_business_id"]
            isOneToOne: false
            referencedRelation: "my_business_latest_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_analysis: {
        Row: {
          analysis_cost: number | null
          analyzed_at: string | null
          brand_identity: Json | null
          competitive_analysis: Json | null
          competitor_id: string | null
          content_strategy: string | null
          context_objectives: Json | null
          digital_presence: Json | null
          estimated_budget: string | null
          facebook_data: Json | null
          id: string
          insights_recommendations: Json | null
          instagram_data: Json | null
          key_differentiators: string[] | null
          linkedin_data: Json | null
          metadata: Json | null
          offering_positioning: Json | null
          opportunities_for_us: string[] | null
          positioning: string | null
          raw_data: Json | null
          recommendations: string | null
          social_media_presence: string | null
          strengths: string[] | null
          summary: string | null
          swot: Json | null
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
          brand_identity?: Json | null
          competitive_analysis?: Json | null
          competitor_id?: string | null
          content_strategy?: string | null
          context_objectives?: Json | null
          digital_presence?: Json | null
          estimated_budget?: string | null
          facebook_data?: Json | null
          id?: string
          insights_recommendations?: Json | null
          instagram_data?: Json | null
          key_differentiators?: string[] | null
          linkedin_data?: Json | null
          metadata?: Json | null
          offering_positioning?: Json | null
          opportunities_for_us?: string[] | null
          positioning?: string | null
          raw_data?: Json | null
          recommendations?: string | null
          social_media_presence?: string | null
          strengths?: string[] | null
          summary?: string | null
          swot?: Json | null
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
          brand_identity?: Json | null
          competitive_analysis?: Json | null
          competitor_id?: string | null
          content_strategy?: string | null
          context_objectives?: Json | null
          digital_presence?: Json | null
          estimated_budget?: string | null
          facebook_data?: Json | null
          id?: string
          insights_recommendations?: Json | null
          instagram_data?: Json | null
          key_differentiators?: string[] | null
          linkedin_data?: Json | null
          metadata?: Json | null
          offering_positioning?: Json | null
          opportunities_for_us?: string[] | null
          positioning?: string | null
          raw_data?: Json | null
          recommendations?: string | null
          social_media_presence?: string | null
          strengths?: string[] | null
          summary?: string | null
          swot?: Json | null
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
          analysis_id: string | null
          caption: string | null
          comments: number | null
          comments_count: number | null
          competitor_id: string | null
          content_type: string | null
          detected_tone: string | null
          engagement_rate: number | null
          hashtags: string[] | null
          id: string
          likes: number | null
          media_urls: string[] | null
          platform: string
          post_url: string | null
          posted_at: string | null
          raw_data: Json | null
          scraped_at: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          shares: number | null
          views: number | null
        }
        Insert: {
          analysis_id?: string | null
          caption?: string | null
          comments?: number | null
          comments_count?: number | null
          competitor_id?: string | null
          content_type?: string | null
          detected_tone?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          media_urls?: string[] | null
          platform: string
          post_url?: string | null
          posted_at?: string | null
          raw_data?: Json | null
          scraped_at?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          shares?: number | null
          views?: number | null
        }
        Update: {
          analysis_id?: string | null
          caption?: string | null
          comments?: number | null
          comments_count?: number | null
          competitor_id?: string | null
          content_type?: string | null
          detected_tone?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          media_urls?: string[] | null
          platform?: string
          post_url?: string | null
          posted_at?: string | null
          raw_data?: Json | null
          scraped_at?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_posts_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analysis"
            referencedColumns: ["id"]
          },
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
      connected_accounts: {
        Row: {
          access_token: string | null
          account_name: string | null
          avatar_url: string | null
          config: Json | null
          connected_at: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          messages_received: number | null
          messages_sent: number | null
          platform: string
          platform_account_id: string
          refresh_token: string | null
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          avatar_url?: string | null
          config?: Json | null
          connected_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          messages_received?: number | null
          messages_sent?: number | null
          platform: string
          platform_account_id: string
          refresh_token?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          avatar_url?: string | null
          config?: Json | null
          connected_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          messages_received?: number | null
          messages_sent?: number | null
          platform?: string
          platform_account_id?: string
          refresh_token?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_teams: {
        Row: {
          ai_reasoning: string | null
          assigned_at: string | null
          assigned_by: string | null
          auto_assigned: boolean | null
          confidence_score: number | null
          conversation_id: string
          id: string
          team_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          auto_assigned?: boolean | null
          confidence_score?: number | null
          conversation_id: string
          id?: string
          team_id: string
        }
        Update: {
          ai_reasoning?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          auto_assigned?: boolean | null
          confidence_score?: number | null
          conversation_id?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_teams_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_teams_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_last_message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_teams_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          connected_account_id: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          notes: string | null
          participant_avatar_url: string | null
          participant_id: string
          participant_name: string | null
          participant_username: string | null
          platform: string
          platform_conversation_id: string
          sentiment: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          connected_account_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          notes?: string | null
          participant_avatar_url?: string | null
          participant_id: string
          participant_name?: string | null
          participant_username?: string | null
          platform: string
          platform_conversation_id: string
          sentiment?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          connected_account_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          notes?: string | null
          participant_avatar_url?: string | null
          participant_id?: string
          participant_name?: string | null
          participant_username?: string | null
          platform?: string
          platform_conversation_id?: string
          sentiment?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          channel: string
          completed_at: string | null
          created_at: string
          delivered_count: number
          description: string | null
          failed_count: number
          id: string
          message: string
          name: string
          read_count: number
          replied_count: number
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          status: string
          subject: string | null
          target_cities: string[] | null
          target_sector_ids: string[] | null
          target_segment_ids: string[] | null
          target_status: string[] | null
          target_tags: string[] | null
          total_leads: number
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          completed_at?: string | null
          created_at?: string
          delivered_count?: number
          description?: string | null
          failed_count?: number
          id?: string
          message: string
          name: string
          read_count?: number
          replied_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string | null
          target_cities?: string[] | null
          target_sector_ids?: string[] | null
          target_segment_ids?: string[] | null
          target_status?: string[] | null
          target_tags?: string[] | null
          total_leads?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          completed_at?: string | null
          created_at?: string
          delivered_count?: number
          description?: string | null
          failed_count?: number
          id?: string
          message?: string
          name?: string
          read_count?: number
          replied_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string | null
          target_cities?: string[] | null
          target_sector_ids?: string[] | null
          target_segment_ids?: string[] | null
          target_status?: string[] | null
          target_tags?: string[] | null
          total_leads?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_lead_interactions: {
        Row: {
          campaign_id: string | null
          channel: string | null
          content: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          status: string | null
          subject: string | null
          type: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          channel?: string | null
          content?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          status?: string | null
          subject?: string | null
          type: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          channel?: string | null
          content?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          status?: string | null
          subject?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_interactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sectors: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_segments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sector_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sector_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sector_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_segments_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_by_sector"
            referencedColumns: ["sector_id"]
          },
          {
            foreignKeyName: "crm_segments_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "crm_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          sector_id: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          sector_id?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          sector_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tags_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_by_sector"
            referencedColumns: ["sector_id"]
          },
          {
            foreignKeyName: "crm_tags_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "crm_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          added_at: string
          address: string
          business_hours: Json | null
          category: string
          city: string
          created_at: string
          email: string | null
          google_maps_url: string | null
          google_rating: number | null
          google_reviews_count: number | null
          id: string
          image_url: string | null
          last_contacted_at: string | null
          metrics: Json | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          score: number | null
          sector_id: string | null
          segment_id: string | null
          social_media: Json | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          added_at?: string
          address: string
          business_hours?: Json | null
          category: string
          city: string
          created_at?: string
          email?: string | null
          google_maps_url?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          id?: string
          image_url?: string | null
          last_contacted_at?: string | null
          metrics?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          score?: number | null
          sector_id?: string | null
          segment_id?: string | null
          social_media?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          added_at?: string
          address?: string
          business_hours?: Json | null
          category?: string
          city?: string
          created_at?: string
          email?: string | null
          google_maps_url?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          id?: string
          image_url?: string | null
          last_contacted_at?: string | null
          metrics?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          score?: number | null
          sector_id?: string | null
          segment_id?: string | null
          social_media?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "crm_leads_by_sector"
            referencedColumns: ["sector_id"]
          },
          {
            foreignKeyName: "leads_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "crm_sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "crm_segments"
            referencedColumns: ["id"]
          },
        ]
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
      message_ai_analysis: {
        Row: {
          analyzed_at: string | null
          analyzed_content: string | null
          confidence_scores: Json | null
          conversation_id: string
          detected_intent: string | null
          detected_language: string | null
          id: string
          message_id: string
          model_used: string | null
          processing_time_ms: number | null
          suggested_team_ids: string[] | null
          tokens_used: number | null
        }
        Insert: {
          analyzed_at?: string | null
          analyzed_content?: string | null
          confidence_scores?: Json | null
          conversation_id: string
          detected_intent?: string | null
          detected_language?: string | null
          id?: string
          message_id: string
          model_used?: string | null
          processing_time_ms?: number | null
          suggested_team_ids?: string[] | null
          tokens_used?: number | null
        }
        Update: {
          analyzed_at?: string | null
          analyzed_content?: string | null
          confidence_scores?: Json | null
          conversation_id?: string
          detected_intent?: string | null
          detected_language?: string | null
          id?: string
          message_id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          suggested_team_ids?: string[] | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_ai_analysis_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_ai_analysis_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_last_message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_ai_analysis_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_ai_analysis_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          is_read: boolean | null
          is_starred: boolean | null
          media_type: string | null
          media_url: string | null
          message_type: string | null
          platform_message_id: string | null
          sender_id: string | null
          sender_name: string | null
          sender_username: string | null
          sent_at: string | null
          text_content: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          platform_message_id?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_username?: string | null
          sent_at?: string | null
          text_content?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          platform_message_id?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_username?: string | null
          sent_at?: string | null
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_last_message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      my_business: {
        Row: {
          business_name: string
          created_at: string
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
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
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
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
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
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      my_business_analysis: {
        Row: {
          analyzed_at: string
          brand_identity: Json | null
          business_id: string
          competitive_analysis: Json | null
          context_objectives: Json | null
          digital_presence: Json | null
          id: string
          insights_recommendations: Json | null
          metadata: Json | null
          offering_positioning: Json | null
          raw_data: Json | null
          swot: Json | null
          version: number
        }
        Insert: {
          analyzed_at?: string
          brand_identity?: Json | null
          business_id: string
          competitive_analysis?: Json | null
          context_objectives?: Json | null
          digital_presence?: Json | null
          id?: string
          insights_recommendations?: Json | null
          metadata?: Json | null
          offering_positioning?: Json | null
          raw_data?: Json | null
          swot?: Json | null
          version?: number
        }
        Update: {
          analyzed_at?: string
          brand_identity?: Json | null
          business_id?: string
          competitive_analysis?: Json | null
          context_objectives?: Json | null
          digital_presence?: Json | null
          id?: string
          insights_recommendations?: Json | null
          metadata?: Json | null
          offering_positioning?: Json | null
          raw_data?: Json | null
          swot?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "my_business_analysis_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "my_business_analysis_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_business_latest_analysis"
            referencedColumns: ["id"]
          },
        ]
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
          comments_sentiment_count: number | null
          content: string
          created_at: string
          day_column: string | null
          id: string
          images: string[] | null
          last_sentiment_analysis_at: string | null
          platforms: string[]
          published_at: string | null
          rejection_reason: string | null
          scheduled_time: string | null
          sentiment_label: string | null
          sentiment_score: number | null
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
          comments_sentiment_count?: number | null
          content: string
          created_at?: string
          day_column?: string | null
          id?: string
          images?: string[] | null
          last_sentiment_analysis_at?: string | null
          platforms?: string[]
          published_at?: string | null
          rejection_reason?: string | null
          scheduled_time?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
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
          comments_sentiment_count?: number | null
          content?: string
          created_at?: string
          day_column?: string | null
          id?: string
          images?: string[] | null
          last_sentiment_analysis_at?: string | null
          platforms?: string[]
          published_at?: string | null
          rejection_reason?: string | null
          scheduled_time?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
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
      quick_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
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
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          invited_by: string
          role: string | null
          status: string | null
          team_id: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          invited_by: string
          role?: string | null
          status?: string | null
          team_id: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string
          role?: string | null
          status?: string | null
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          conversation_count: number | null
          created_at: string | null
          description: string | null
          id: string
          member_count: number | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color: string
          conversation_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          conversation_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string
          updated_at?: string | null
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
      user_post_comments: {
        Row: {
          author_is_verified: boolean | null
          author_username: string | null
          comment_likes: number | null
          comment_text: string
          comment_url: string | null
          created_at: string | null
          id: string
          is_user_reply: boolean | null
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
          is_user_reply?: boolean | null
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
          is_user_reply?: boolean | null
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
            foreignKeyName: "user_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      user_sentiment_statistics: {
        Row: {
          analyzed_at: string | null
          avg_engagement_rate: number | null
          avg_sentiment_score: number | null
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
          total_comments: number | null
          total_posts: number | null
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          analyzed_at?: string | null
          avg_engagement_rate?: number | null
          avg_sentiment_score?: number | null
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
          total_comments?: number | null
          total_posts?: number | null
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          analyzed_at?: string | null
          avg_engagement_rate?: number | null
          avg_sentiment_score?: number | null
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
          total_comments?: number | null
          total_posts?: number | null
          user_id?: string
          week_end_date?: string
          week_start_date?: string
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
      webhook_logs: {
        Row: {
          body: Json | null
          connected_account_id: string | null
          error_message: string | null
          headers: Json | null
          id: string
          method: string | null
          platform: string
          processed: boolean | null
          processed_at: string | null
          query_params: Json | null
          received_at: string | null
          response_body: Json | null
          status_code: number | null
        }
        Insert: {
          body?: Json | null
          connected_account_id?: string | null
          error_message?: string | null
          headers?: Json | null
          id?: string
          method?: string | null
          platform: string
          processed?: boolean | null
          processed_at?: string | null
          query_params?: Json | null
          received_at?: string | null
          response_body?: Json | null
          status_code?: number | null
        }
        Update: {
          body?: Json | null
          connected_account_id?: string | null
          error_message?: string | null
          headers?: Json | null
          id?: string
          method?: string | null
          platform?: string
          processed?: boolean | null
          processed_at?: string | null
          query_params?: Json | null
          received_at?: string | null
          response_body?: Json | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts_with_stats"
            referencedColumns: ["id"]
          },
        ]
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
      connected_accounts_with_stats: {
        Row: {
          access_token: string | null
          account_name: string | null
          active_conversations: number | null
          avatar_url: string | null
          config: Json | null
          connected_at: string | null
          error_message: string | null
          id: string | null
          last_sync_at: string | null
          messages_received: number | null
          messages_sent: number | null
          platform: string | null
          platform_account_id: string | null
          refresh_token: string | null
          status: string | null
          token_expires_at: string | null
          unread_conversations: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      conversations_with_last_message: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          connected_account_id: string | null
          created_at: string | null
          id: string | null
          last_message_at: string | null
          last_message_direction: string | null
          last_message_sent_at: string | null
          last_message_text: string | null
          notes: string | null
          participant_avatar_url: string | null
          participant_id: string | null
          participant_name: string | null
          participant_username: string | null
          platform: string | null
          platform_conversation_id: string | null
          sentiment: string | null
          status: string | null
          tags: string[] | null
          unread_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations_with_teams: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          connected_account_id: string | null
          created_at: string | null
          id: string | null
          last_message_at: string | null
          notes: string | null
          participant_avatar_url: string | null
          participant_id: string | null
          participant_name: string | null
          participant_username: string | null
          platform: string | null
          platform_conversation_id: string | null
          sentiment: string | null
          status: string | null
          tags: string[] | null
          teams: Json[] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads_by_sector: {
        Row: {
          avg_score: number | null
          client_leads: number | null
          contacted_leads: number | null
          interested_leads: number | null
          new_leads: number | null
          sector_id: string | null
          sector_name: string | null
          total_leads: number | null
          user_id: string | null
        }
        Relationships: []
      }
      inbox_stats: {
        Row: {
          avg_response_time_minutes: number | null
          negative_sentiment_count: number | null
          read_count: number | null
          unassigned_count: number | null
          unread_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      my_business_latest_analysis: {
        Row: {
          analysis_id: string | null
          analyzed_at: string | null
          brand_identity: Json | null
          business_name: string | null
          competitive_analysis: Json | null
          context_objectives: Json | null
          created_at: string | null
          description: string | null
          digital_presence: Json | null
          facebook_likes: string | null
          facebook_url: string | null
          id: string | null
          industry: string | null
          insights_recommendations: Json | null
          instagram_followers: string | null
          instagram_url: string | null
          last_analyzed_at: string | null
          linkedin_followers: string | null
          linkedin_url: string | null
          metadata: Json | null
          offering_positioning: Json | null
          swot: Json | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Relationships: []
      }
      teams_with_stats: {
        Row: {
          active_members: number | null
          assigned_conversations: number | null
          color: string | null
          conversation_count: number | null
          created_at: string | null
          description: string | null
          id: string | null
          member_count: number | null
          name: string | null
          updated_at: string | null
          user_id: string | null
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
      increment_quick_reply_usage: {
        Args: { reply_id: string }
        Returns: undefined
      }
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
