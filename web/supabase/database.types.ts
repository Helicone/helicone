export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      request: {
        Row: {
          body: Json
          path: string
          id: string
          created_at: string
          auth_hash: string
          user_id: string | null
        }
        Insert: {
          body: Json
          path: string
          id?: string
          created_at?: string
          auth_hash: string
          user_id?: string | null
        }
        Update: {
          body?: Json
          path?: string
          id?: string
          created_at?: string
          auth_hash?: string
          user_id?: string | null
        }
      }
      response: {
        Row: {
          body: Json
          request: string
          id: string
          created_at: string
        }
        Insert: {
          body: Json
          request: string
          id?: string
          created_at?: string
        }
        Update: {
          body?: Json
          request?: string
          id?: string
          created_at?: string
        }
      }
      user_api_keys: {
        Row: {
          api_key_hash: string
          api_key_preview: string
          user_id: string
          created_at: string
        }
        Insert: {
          api_key_hash: string
          api_key_preview: string
          user_id: string
          created_at?: string
        }
        Update: {
          api_key_hash?: string
          api_key_preview?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      metrics: {
        Row: {
          average_response_time: number | null
          average_tokens_per_response: number | null
        }
      }
      response_and_request: {
        Row: {
          response_body: Json | null
          response_id: string | null
          response_created_at: string | null
          request_id: string | null
          request_body: Json | null
          request_path: string | null
          request_created_at: string | null
          request_user_id: string | null
          api_key_preview: string | null
        }
      }
      user_metrics: {
        Row: {
          user_id: string | null
          first_active: string | null
          last_active: string | null
          total_requests: number | null
          average_requests_per_day_active: number | null
          average_tokens_per_request: number | null
        }
      }
    }
    Functions: {
      check_request_access: {
        Args: { this_auth_hash: string; this_user_id: string }
        Returns: boolean
      }
      check_response_access:
        | {
            Args: { this_associated_request_id: string }
            Returns: boolean
          }
        | {
            Args: { this_associated_request_id: string; this_user_id: string }
            Returns: boolean
          }
      date_count:
        | {
            Args: { time_increment: string }
            Returns: Record<string, unknown>[]
          }
        | {
            Args: { time_increment: string; prev_period: string }
            Returns: Record<string, unknown>[]
          }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

