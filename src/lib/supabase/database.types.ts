export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          classifier_id: string
          created_at: string
          hashed_key: string
          id: string
          label: string | null
          last_used_at: string | null
          revoked_at: string | null
        }
        Insert: {
          classifier_id: string
          created_at?: string
          hashed_key: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Update: {
          classifier_id?: string
          created_at?: string
          hashed_key?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_classifier_id_fkey"
            columns: ["classifier_id"]
            isOneToOne: false
            referencedRelation: "classifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_logs: {
        Row: {
          answers: Json | null
          api_key_id: string | null
          classifier_id: string
          created_at: string
          id: string
          jev_model_version_used: string | null
          latency_ms: number | null
          needs_review: boolean
          state_excerpt: string | null
        }
        Insert: {
          answers?: Json | null
          api_key_id?: string | null
          classifier_id: string
          created_at?: string
          id?: string
          jev_model_version_used?: string | null
          latency_ms?: number | null
          needs_review?: boolean
          state_excerpt?: string | null
        }
        Update: {
          answers?: Json | null
          api_key_id?: string | null
          classifier_id?: string
          created_at?: string
          id?: string
          jev_model_version_used?: string | null
          latency_ms?: number | null
          needs_review?: boolean
          state_excerpt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classification_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_logs_classifier_id_fkey"
            columns: ["classifier_id"]
            isOneToOne: false
            referencedRelation: "classifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      classifier_questions: {
        Row: {
          classifier_id: string
          confidence_threshold: number
          created_at: string
          criteria: Json
          id: string
          instructions: string
          key: string
          position: number
          type: string
          updated_at: string
        }
        Insert: {
          classifier_id: string
          confidence_threshold?: number
          created_at?: string
          criteria?: Json
          id?: string
          instructions: string
          key: string
          position?: number
          type: string
          updated_at?: string
        }
        Update: {
          classifier_id?: string
          confidence_threshold?: number
          created_at?: string
          criteria?: Json
          id?: string
          instructions?: string
          key?: string
          position?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classifier_questions_classifier_id_fkey"
            columns: ["classifier_id"]
            isOneToOne: false
            referencedRelation: "classifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      classifier_settings: {
        Row: {
          below_threshold_action: string
          classifier_id: string
          notes: string | null
        }
        Insert: {
          below_threshold_action?: string
          classifier_id: string
          notes?: string | null
        }
        Update: {
          below_threshold_action?: string
          classifier_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classifier_settings_classifier_id_fkey"
            columns: ["classifier_id"]
            isOneToOne: true
            referencedRelation: "classifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      classifiers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          jev_model_version: string
          name: string
          owner_id: string
          slug: string
          status: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          jev_model_version?: string
          name: string
          owner_id: string
          slug: string
          status?: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          jev_model_version?: string
          name?: string
          owner_id?: string
          slug?: string
          status?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      load_classifier_by_key: { Args: { p_hashed_key: string }; Returns: Json }
      record_classification_log: {
        Args: {
          p_answers: Json
          p_api_key_id: string
          p_classifier_id: string
          p_jev_model_version_used: string
          p_latency_ms: number
          p_needs_review: boolean
          p_state_excerpt: string
        }
        Returns: undefined
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
type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Update"]
