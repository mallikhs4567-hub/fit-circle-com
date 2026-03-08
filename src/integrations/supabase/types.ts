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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_coach_logs: {
        Row: {
          ai_feedback: string
          context: Json | null
          created_at: string
          id: string
          user_id: string
          workout_type: string | null
        }
        Insert: {
          ai_feedback: string
          context?: Json | null
          created_at?: string
          id?: string
          user_id: string
          workout_type?: string | null
        }
        Update: {
          ai_feedback?: string
          context?: Json | null
          created_at?: string
          id?: string
          user_id?: string
          workout_type?: string | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          priority: number
          recommendation: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          priority?: number
          recommendation: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          priority?: number
          recommendation?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      body_metrics: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          posture_score: number | null
          shoulder_width_ratio: number | null
          user_id: string
          waist_ratio: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          posture_score?: number | null
          shoulder_width_ratio?: number | null
          user_id: string
          waist_ratio?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          posture_score?: number | null
          shoulder_width_ratio?: number | null
          user_id?: string
          waist_ratio?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          start_date: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          start_date?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          ends_at: string | null
          exercise_type: string
          global_target: number | null
          id: string
          is_global: boolean
          target_reps: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          ends_at?: string | null
          exercise_type: string
          global_target?: number | null
          id?: string
          is_global?: boolean
          target_reps: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          ends_at?: string | null
          exercise_type?: string
          global_target?: number | null
          id?: string
          is_global?: boolean
          target_reps?: number
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          deleted_for: Json | null
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_for?: Json | null
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_for?: Json | null
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checklists: {
        Row: {
          completed_at: string | null
          created_at: string
          date: string
          diet_followed: boolean | null
          id: string
          user_id: string
          workout_completed: boolean | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date?: string
          diet_followed?: boolean | null
          id?: string
          user_id: string
          workout_completed?: boolean | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date?: string
          diet_followed?: boolean | null
          id?: string
          user_id?: string
          workout_completed?: boolean | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      group_challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          id: string
          joined_at: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "group_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      group_challenges: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_days: number
          ends_at: string | null
          group_id: string
          id: string
          metric: string
          starts_at: string
          target_value: number
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_days?: number
          ends_at?: string | null
          group_id: string
          id?: string
          metric?: string
          starts_at?: string
          target_value: number
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_days?: number
          ends_at?: string | null
          group_id?: string
          id?: string
          metric?: string
          starts_at?: string
          target_value?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_challenges_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          like_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          like_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          like_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          member_count: number
          name: string
          privacy: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          privacy?: string
        }
        Update: {
          avatar_url?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          privacy?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          from_user_id: string | null
          id: string
          read: boolean
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          read?: boolean
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          image_url: string | null
          like_count: number | null
          reactions: Json | null
          type: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          like_count?: number | null
          reactions?: Json | null
          type?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          like_count?: number | null
          reactions?: Json | null
          type?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          experience_level: string | null
          gender: string | null
          goal: string | null
          height: number | null
          id: string
          streak: number | null
          total_active_days: number | null
          updated_at: string
          user_id: string
          username: string
          weight: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          streak?: number | null
          total_active_days?: number | null
          updated_at?: string
          user_id: string
          username: string
          weight?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          streak?: number | null
          total_active_days?: number | null
          updated_at?: string
          user_id?: string
          username?: string
          weight?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      story_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          story_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          story_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_replies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_activity: {
        Row: {
          calories: number | null
          device_id: string | null
          distance: number | null
          heart_rate: number | null
          id: string
          recorded_at: string
          sleep_minutes: number | null
          steps: number | null
          synced_at: string
          user_id: string
          workout_duration_minutes: number | null
          workout_type: string | null
        }
        Insert: {
          calories?: number | null
          device_id?: string | null
          distance?: number | null
          heart_rate?: number | null
          id?: string
          recorded_at: string
          sleep_minutes?: number | null
          steps?: number | null
          synced_at?: string
          user_id: string
          workout_duration_minutes?: number | null
          workout_type?: string | null
        }
        Update: {
          calories?: number | null
          device_id?: string | null
          distance?: number | null
          heart_rate?: number | null
          id?: string
          recorded_at?: string
          sleep_minutes?: number | null
          steps?: number | null
          synced_at?: string
          user_id?: string
          workout_duration_minutes?: number | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_activity_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "wearable_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_devices: {
        Row: {
          access_token: string | null
          connected_at: string
          device_name: string
          id: string
          is_connected: boolean
          last_sync_at: string | null
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          device_name: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          device_name?: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_xp_leaderboard: {
        Row: {
          created_at: string
          id: string
          user_id: string
          week_start: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          week_start: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          week_start?: string
          xp?: number
        }
        Relationships: []
      }
      workout_results: {
        Row: {
          avg_form_score: number
          calories_burned: number
          created_at: string
          duration_seconds: number
          exercise_name: string
          id: string
          reps_completed: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          avg_form_score?: number
          calories_burned?: number
          created_at?: string
          duration_seconds?: number
          exercise_name: string
          id?: string
          reps_completed?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          avg_form_score?: number
          calories_burned?: number
          created_at?: string
          duration_seconds?: number
          exercise_name?: string
          id?: string
          reps_completed?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      delete_chat_for_user: {
        Args: { other_user_id: string }
        Returns: undefined
      }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      search_users_by_username: {
        Args: { search_username: string }
        Returns: {
          avatar_url: string
          streak: number
          user_id: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
