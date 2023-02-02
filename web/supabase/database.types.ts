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
          id: string
          created_at: string
          body: Json
          path: string
          auth_hash: string
          user_id: string | null
          prompt_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          body: Json
          path: string
          auth_hash: string
          user_id?: string | null
          prompt_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          body?: Json
          path?: string
          auth_hash?: string
          user_id?: string | null
          prompt_id?: string | null
        }
      }
      response: {
        Row: {
          id: string
          created_at: string
          body: Json
          request: string
        }
        Insert: {
          id?: string
          created_at?: string
          body: Json
          request: string
        }
        Update: {
          id?: string
          created_at?: string
          body?: Json
          request?: string
        }
      }
      user_api_keys: {
        Row: {
          created_at: string
          api_key_hash: string
          api_key_preview: string
          user_id: string
        }
        Insert: {
          created_at?: string
          api_key_hash: string
          api_key_preview: string
          user_id: string
        }
        Update: {
          created_at?: string
          api_key_hash?: string
          api_key_preview?: string
          user_id?: string
        }
      }
      user_settings: {
        Row: {
          user: string
          created_at: string | null
          request_limit: number
          tier: string
        }
        Insert: {
          user: string
          created_at?: string | null
          request_limit?: number
          tier?: string
        }
        Update: {
          user?: string
          created_at?: string | null
          request_limit?: number
          tier?: string
        }
      }
    }
    Views: {
      metrics_rbac: {
        Row: {
          average_response_time: number | null
          average_tokens_per_response: number | null
        }
      }
      request_rbac: {
        Row: {
          id: string | null
          created_at: string | null
          body: Json | null
          path: string | null
          auth_hash: string | null
          user_id: string | null
        }
      }
      response_and_request_rbac: {
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
          user_id: string | null
        }
      }
      response_rbac: {
        Row: {
          id: string | null
          created_at: string | null
          body: Json | null
          request: string | null
        }
      }
      user_metrics_rbac: {
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
            Args: { time_increment: string; prev_period: string }
            Returns: Record<string, unknown>[]
          }
        | {
            Args: { time_increment: string }
            Returns: Record<string, unknown>[]
          }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

