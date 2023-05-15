export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      cache_hits: {
        Row: {
          created_at: string;
          request_id: string;
        };
        Insert: {
          created_at?: string;
          request_id: string;
        };
        Update: {
          created_at?: string;
          request_id?: string;
        };
      };
      helicone_api_keys: {
        Row: {
          api_key_hash: string;
          api_key_name: string;
          created_at: string;
          id: number;
          organization_id: string;
          soft_delete: boolean;
          user_id: string;
        };
        Insert: {
          api_key_hash: string;
          api_key_name: string;
          created_at?: string;
          id?: number;
          organization_id: string;
          soft_delete?: boolean;
          user_id: string;
        };
        Update: {
          api_key_hash?: string;
          api_key_name?: string;
          created_at?: string;
          id?: number;
          organization_id?: string;
          soft_delete?: boolean;
          user_id?: string;
        };
      };
      layout: {
        Row: {
          columns: Json | null;
          created_at: string | null;
          filters: Json | null;
          id: number;
          name: string;
          user_id: string;
        };
        Insert: {
          columns?: Json | null;
          created_at?: string | null;
          filters?: Json | null;
          id?: number;
          name: string;
          user_id: string;
        };
        Update: {
          columns?: Json | null;
          created_at?: string | null;
          filters?: Json | null;
          id?: number;
          name?: string;
          user_id?: string;
        };
      };
      organization: {
        Row: {
          color: string;
          created_at: string | null;
          icon: string;
          id: string;
          is_personal: boolean;
          name: string;
          owner: string;
          soft_delete: boolean;
        };
        Insert: {
          color?: string;
          created_at?: string | null;
          icon?: string;
          id?: string;
          is_personal?: boolean;
          name: string;
          owner: string;
          soft_delete?: boolean;
        };
        Update: {
          color?: string;
          created_at?: string | null;
          icon?: string;
          id?: string;
          is_personal?: boolean;
          name?: string;
          owner?: string;
          soft_delete?: boolean;
        };
      };
      organization_member: {
        Row: {
          created_at: string | null;
          member: string;
          organization: string;
        };
        Insert: {
          created_at?: string | null;
          member: string;
          organization: string;
        };
        Update: {
          created_at?: string | null;
          member?: string;
          organization?: string;
        };
      };
      prompt: {
        Row: {
          auth_hash: string;
          created_at: string | null;
          id: string;
          name: string;
          prompt: string;
        };
        Insert: {
          auth_hash: string;
          created_at?: string | null;
          id: string;
          name: string;
          prompt: string;
        };
        Update: {
          auth_hash?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          prompt?: string;
        };
      };
      properties: {
        Row: {
          auth_hash: string | null;
          created_at: string;
          id: number;
          key: string;
          request_id: string | null;
          user_id: string | null;
          value: string;
        };
        Insert: {
          auth_hash?: string | null;
          created_at?: string;
          id?: number;
          key: string;
          request_id?: string | null;
          user_id?: string | null;
          value: string;
        };
        Update: {
          auth_hash?: string | null;
          created_at?: string;
          id?: number;
          key?: string;
          request_id?: string | null;
          user_id?: string | null;
          value?: string;
        };
      };
      request: {
        Row: {
          auth_hash: string;
          body: Json;
          created_at: string;
          formatted_prompt_id: string | null;
          helicone_api_key_id: number | null;
          helicone_org_id: string | null;
          helicone_user: string | null;
          id: string;
          path: string;
          prompt_id: string | null;
          prompt_values: Json | null;
          properties: Json | null;
          user_id: string | null;
        };
        Insert: {
          auth_hash: string;
          body: Json;
          created_at?: string;
          formatted_prompt_id?: string | null;
          helicone_api_key_id?: number | null;
          helicone_org_id?: string | null;
          helicone_user?: string | null;
          id?: string;
          path: string;
          prompt_id?: string | null;
          prompt_values?: Json | null;
          properties?: Json | null;
          user_id?: string | null;
        };
        Update: {
          auth_hash?: string;
          body?: Json;
          created_at?: string;
          formatted_prompt_id?: string | null;
          helicone_api_key_id?: number | null;
          helicone_org_id?: string | null;
          helicone_user?: string | null;
          id?: string;
          path?: string;
          prompt_id?: string | null;
          prompt_values?: Json | null;
          properties?: Json | null;
          user_id?: string | null;
        };
      };
      response: {
        Row: {
          body: Json;
          completion_tokens: number | null;
          created_at: string;
          delay_ms: number | null;
          id: string;
          prompt_tokens: number | null;
          request: string;
          status: number | null;
        };
        Insert: {
          body: Json;
          completion_tokens?: number | null;
          created_at?: string;
          delay_ms?: number | null;
          id?: string;
          prompt_tokens?: number | null;
          request: string;
          status?: number | null;
        };
        Update: {
          body?: Json;
          completion_tokens?: number | null;
          created_at?: string;
          delay_ms?: number | null;
          id?: string;
          prompt_tokens?: number | null;
          request?: string;
          status?: number | null;
        };
      };
      user_api_keys: {
        Row: {
          api_key_hash: string;
          api_key_preview: string;
          created_at: string;
          key_name: string | null;
          user_id: string;
        };
        Insert: {
          api_key_hash: string;
          api_key_preview: string;
          created_at?: string;
          key_name?: string | null;
          user_id: string;
        };
        Update: {
          api_key_hash?: string;
          api_key_preview?: string;
          created_at?: string;
          key_name?: string | null;
          user_id?: string;
        };
      };
      user_settings: {
        Row: {
          created_at: string | null;
          request_limit: number;
          tier: string;
          user: string;
        };
        Insert: {
          created_at?: string | null;
          request_limit?: number;
          tier?: string;
          user: string;
        };
        Update: {
          created_at?: string | null;
          request_limit?: number;
          tier?: string;
          user?: string;
        };
      };
    };
    Views: {
      metrics_rbac: {
        Row: {
          average_response_time: number | null;
          average_tokens_per_response: number | null;
        };
      };
      model_metrics: {
        Row: {
          model: string | null;
          request_count: number | null;
          sum_completion_tokens: number | null;
          sum_prompt_tokens: number | null;
          sum_tokens: number | null;
        };
      };
      request_cache_rbac: {
        Row: {
          auth_hash: string | null;
          body: Json | null;
          cached_created_at: string | null;
          created_at: string | null;
          formatted_prompt_id: string | null;
          id: string | null;
          path: string | null;
          prompt_id: string | null;
          prompt_values: Json | null;
          properties: Json | null;
          user_id: string | null;
        };
      };
      request_rbac: {
        Row: {
          auth_hash: string | null;
          body: Json | null;
          created_at: string | null;
          id: string | null;
          path: string | null;
          properties: Json | null;
          user_id: string | null;
        };
      };
      response_and_request_rbac: {
        Row: {
          api_key_preview: string | null;
          formatted_prompt_id: string | null;
          is_cached: boolean | null;
          prompt_name: string | null;
          prompt_regex: string | null;
          prompt_values: Json | null;
          request_body: Json | null;
          request_created_at: string | null;
          request_id: string | null;
          request_path: string | null;
          request_properties: Json | null;
          request_user_id: string | null;
          response_body: Json | null;
          response_created_at: string | null;
          response_id: string | null;
          user_id: string | null;
        };
      };
      response_rbac: {
        Row: {
          body: Json | null;
          created_at: string | null;
          id: string | null;
          request: string | null;
        };
      };
      user_metrics_rbac: {
        Row: {
          average_requests_per_day_active: number | null;
          average_tokens_per_request: number | null;
          first_active: string | null;
          last_active: string | null;
          total_requests: number | null;
          user_id: string | null;
        };
      };
    };
    Functions: {
      check_request_access: {
        Args: {
          this_auth_hash: string;
          this_user_id: string;
        };
        Returns: boolean;
      };
      check_response_access:
        | {
            Args: {
              this_associated_request_id: string;
            };
            Returns: boolean;
          }
        | {
            Args: {
              this_associated_request_id: string;
              this_user_id: string;
            };
            Returns: boolean;
          };
      date_count:
        | {
            Args: {
              time_increment: string;
              prev_period: string;
            };
            Returns: Record<string, unknown>[];
          }
        | {
            Args: {
              time_increment: string;
            };
            Returns: Record<string, unknown>[];
          };
      ensure_personal: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_org_id: {
        Args: {
          request_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string;
          name: string;
          owner: string;
          metadata: Json;
        };
        Returns: undefined;
      };
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
