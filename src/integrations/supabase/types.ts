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
      game_players: {
        Row: {
          game_id: string
          id: string
          joined_at: string
          score: number
          user_id: string
          username: string
        }
        Insert: {
          game_id: string
          id?: string
          joined_at?: string
          score?: number
          user_id: string
          username: string
        }
        Update: {
          game_id?: string
          id?: string
          joined_at?: string
          score?: number
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          bonus_all_correct: number
          code: string
          created_at: string
          creator_id: string
          current_vip_id: string | null
          id: string
          penalty_all_wrong: number
          points_per_correct: number
          status: string
          target_score: number
          updated_at: string
        }
        Insert: {
          bonus_all_correct?: number
          code: string
          created_at?: string
          creator_id: string
          current_vip_id?: string | null
          id?: string
          penalty_all_wrong?: number
          points_per_correct?: number
          status?: string
          target_score?: number
          updated_at?: string
        }
        Update: {
          bonus_all_correct?: number
          code?: string
          created_at?: string
          creator_id?: string
          current_vip_id?: string | null
          id?: string
          penalty_all_wrong?: number
          points_per_correct?: number
          status?: string
          target_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      guesses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean | null
          item_id: string
          position: number
          round_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          item_id: string
          position: number
          round_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          item_id?: string
          position?: number
          round_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guesses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "topic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guesses_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      rankings: {
        Row: {
          created_at: string
          id: string
          item_id: string
          position: number
          round_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          position: number
          round_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          position?: number
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rankings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "topic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rankings_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          created_at: string
          game_id: string
          id: string
          reveal_index: number
          round_number: number
          status: string
          topic_id: string
          vip_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          reveal_index?: number
          round_number: number
          status?: string
          topic_id: string
          vip_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          reveal_index?: number
          round_number?: number
          status?: string
          topic_id?: string
          vip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_items: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          topic_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position: number
          topic_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_editable: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_editable?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_editable?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
