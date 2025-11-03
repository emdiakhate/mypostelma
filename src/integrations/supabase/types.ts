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
          upload_post_username: string | null
        }
        Insert: {
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
          upload_post_username?: string | null
        }
        Update: {
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
          upload_post_username?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_lead_generation: { Args: { p_user_id: string }; Returns: Json }
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
