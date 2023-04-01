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
      cache_hits: {
        Row: {
          request_id: string
          created_at: string
        }
        Insert: {
          request_id: string
          created_at?: string
        }
        Update: {
          request_id?: string
          created_at?: string
        }
      }
      helicone_api_keys: {
        Row: {
          api_key_hash: string
          api_key_name: string
          user_id: string
          created_at: string
        }
        Insert: {
          api_key_hash: string
          api_key_name: string
          user_id: string
          created_at?: string
        }
        Update: {
          api_key_hash?: string
          api_key_name?: string
          user_id?: string
          created_at?: string
        }
      }
      prompt: {
        Row: {
          prompt: string
          name: string
          id: string
          auth_hash: string
          created_at: string | null
        }
        Insert: {
          prompt: string
          name: string
          id: string
          auth_hash: string
          created_at?: string | null
        }
        Update: {
          prompt?: string
          name?: string
          id?: string
          auth_hash?: string
          created_at?: string | null
        }
      }
      request: {
        Row: {
          body: Json
          path: string
          id: string
          created_at: string
          auth_hash: string
          user_id: string | null
          prompt_id: string | null
          properties: Json | null
          formatted_prompt_id: string | null
          prompt_values: Json | null
        }
        Insert: {
          body: Json
          path: string
          id?: string
          created_at?: string
          auth_hash: string
          user_id?: string | null
          prompt_id?: string | null
          properties?: Json | null
          formatted_prompt_id?: string | null
          prompt_values?: Json | null
        }
        Update: {
          body?: Json
          path?: string
          id?: string
          created_at?: string
          auth_hash?: string
          user_id?: string | null
          prompt_id?: string | null
          properties?: Json | null
          formatted_prompt_id?: string | null
          prompt_values?: Json | null
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
          key_name: string | null
        }
        Insert: {
          api_key_hash: string
          api_key_preview: string
          user_id: string
          created_at?: string
          key_name?: string | null
        }
        Update: {
          api_key_hash?: string
          api_key_preview?: string
          user_id?: string
          created_at?: string
          key_name?: string | null
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
      model_metrics: {
        Row: {
          model: string | null
          sum_tokens: number | null
          sum_prompt_tokens: number | null
          sum_completion_tokens: number | null
          request_count: number | null
        }
      }
      request_cache_rbac: {
        Row: {
          id: string | null
          created_at: string | null
          body: Json | null
          path: string | null
          auth_hash: string | null
          user_id: string | null
          prompt_id: string | null
          properties: Json | null
          formatted_prompt_id: string | null
          prompt_values: Json | null
          cached_created_at: string | null
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
          properties: Json | null
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
          request_properties: Json | null
          formatted_prompt_id: string | null
          prompt_values: Json | null
          prompt_name: string | null
          prompt_regex: string | null
          is_cached: boolean | null
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
            Args: { this_associated_request_id: string; this_user_id: string }
            Returns: boolean
          }
        | {
            Args: { this_associated_request_id: string }
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

