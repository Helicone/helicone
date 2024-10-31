export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: number
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      alert: {
        Row: {
          created_at: string | null
          emails: string[]
          id: string
          metric: string
          minimum_request_count: number | null
          name: string
          org_id: string
          slack_channels: string[]
          soft_delete: boolean
          status: string
          threshold: number
          time_block_duration: number
          time_window: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          emails: string[]
          id?: string
          metric: string
          minimum_request_count?: number | null
          name: string
          org_id: string
          slack_channels?: string[]
          soft_delete?: boolean
          status?: string
          threshold: number
          time_block_duration?: number
          time_window: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          emails?: string[]
          id?: string
          metric?: string
          minimum_request_count?: number | null
          name?: string
          org_id?: string
          slack_channels?: string[]
          soft_delete?: boolean
          status?: string
          threshold?: number
          time_block_duration?: number
          time_window?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_banners: {
        Row: {
          active: boolean
          created_at: string
          id: number
          message: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          message?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          message?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      alert_history: {
        Row: {
          alert_end_time: string | null
          alert_id: string
          alert_metric: string
          alert_name: string
          alert_start_time: string
          created_at: string | null
          id: string
          org_id: string
          soft_delete: boolean
          status: string
          triggered_value: string
          updated_at: string | null
        }
        Insert: {
          alert_end_time?: string | null
          alert_id: string
          alert_metric: string
          alert_name: string
          alert_start_time: string
          created_at?: string | null
          id?: string
          org_id: string
          soft_delete?: boolean
          status: string
          triggered_value: string
          updated_at?: string | null
        }
        Update: {
          alert_end_time?: string | null
          alert_id?: string
          alert_metric?: string
          alert_name?: string
          alert_start_time?: string
          created_at?: string | null
          id?: string
          org_id?: string
          soft_delete?: boolean
          status?: string
          triggered_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alert"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      asset: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_hits: {
        Row: {
          created_at: string
          organization_id: string | null
          request_id: string
        }
        Insert: {
          created_at?: string
          organization_id?: string | null
          request_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cache_hits_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company_description: string | null
          company_name: string | null
          created_at: string | null
          email_address: string | null
          first_name: string | null
          id: number
          last_name: string | null
          tag: string | null
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string | null
          email_address?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          tag?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string | null
          email_address?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          tag?: string | null
        }
        Relationships: []
      }
      evaluator: {
        Row: {
          created_at: string
          id: string
          llm_template: Json | null
          name: string
          organization_id: string
          scoring_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          llm_template?: Json | null
          name: string
          organization_id: string
          scoring_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          llm_template?: Json | null
          name?: string
          organization_id?: string
          scoring_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluator_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluator_experiments: {
        Row: {
          created_at: string
          evaluator: string
          experiment: string
          id: number
        }
        Insert: {
          created_at?: string
          evaluator: string
          experiment: string
          id?: number
        }
        Update: {
          created_at?: string
          evaluator?: string
          experiment?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_evaluator_experiments_evaluator_fkey"
            columns: ["evaluator"]
            isOneToOne: false
            referencedRelation: "evaluator"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_evaluator_experiments_experiment_fkey"
            columns: ["experiment"]
            isOneToOne: false
            referencedRelation: "experiment_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_cell: {
        Row: {
          column_id: string
          created_at: string
          id: string
          metadata: Json | null
          row_index: number
          status: string | null
          value: string | null
        }
        Insert: {
          column_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          row_index: number
          status?: string | null
          value?: string | null
        }
        Update: {
          column_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          row_index?: number
          status?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiment_cell_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "experiment_column"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_column: {
        Row: {
          column_name: string
          column_type: string
          created_at: string
          id: string
          metadata: Json | null
          table_id: string
        }
        Insert: {
          column_name: string
          column_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          table_id: string
        }
        Update: {
          column_name?: string
          column_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_column_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "experiment_table"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_dataset_v2_row: {
        Row: {
          created_at: string
          dataset_id: string
          id: string
          input_record: string
        }
        Insert: {
          created_at?: string
          dataset_id: string
          id?: string
          input_record: string
        }
        Update: {
          created_at?: string
          dataset_id?: string
          id?: string
          input_record?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_dataset_id"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "helicone_dataset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_experiment_dataset_v2_row_input_record_fkey"
            columns: ["input_record"]
            isOneToOne: false
            referencedRelation: "prompt_input_record"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_table: {
        Row: {
          created_at: string
          experiment_id: string
          id: string
          metadata: Json | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          experiment_id: string
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          experiment_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_table_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_table_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_v2: {
        Row: {
          created_at: string | null
          dataset: string | null
          id: string
          meta: Json | null
          organization: string | null
        }
        Insert: {
          created_at?: string | null
          dataset?: string | null
          id?: string
          meta?: Json | null
          organization?: string | null
        }
        Update: {
          created_at?: string | null
          dataset?: string | null
          id?: string
          meta?: Json | null
          organization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_dataset"
            columns: ["dataset"]
            isOneToOne: false
            referencedRelation: "helicone_dataset"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_v2_hypothesis: {
        Row: {
          created_at: string | null
          experiment_v2: string | null
          id: string
          model: string
          prompt_version: string
          provider_key: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          experiment_v2?: string | null
          id?: string
          model: string
          prompt_version: string
          provider_key?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          experiment_v2?: string | null
          id?: string
          model?: string
          prompt_version?: string
          provider_key?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_experiment"
            columns: ["experiment_v2"]
            isOneToOne: false
            referencedRelation: "experiment_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prompt_version"
            columns: ["prompt_version"]
            isOneToOne: false
            referencedRelation: "prompts_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_experiment_v2_hypothesis_provider_key_fkey"
            columns: ["provider_key"]
            isOneToOne: false
            referencedRelation: "decrypted_provider_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_experiment_v2_hypothesis_provider_key_fkey"
            columns: ["provider_key"]
            isOneToOne: false
            referencedRelation: "provider_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_v2_hypothesis_run: {
        Row: {
          created_at: string | null
          dataset_row: string
          experiment_hypothesis: string
          id: string
          result_request_id: string
        }
        Insert: {
          created_at?: string | null
          dataset_row: string
          experiment_hypothesis: string
          id?: string
          result_request_id: string
        }
        Update: {
          created_at?: string | null
          dataset_row?: string
          experiment_hypothesis?: string
          id?: string
          result_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_dataset_row"
            columns: ["dataset_row"]
            isOneToOne: false
            referencedRelation: "experiment_dataset_v2_row"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_experiment_hypothesis"
            columns: ["experiment_hypothesis"]
            isOneToOne: false
            referencedRelation: "experiment_v2_hypothesis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_experiment_v2_hypothesis_run_result_request_id_fkey"
            columns: ["result_request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments_waitlist: {
        Row: {
          created_at: string
          email: string
          id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          feature: string
          id: number
          org_id: string
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: number
          org_id: string
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: number
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          rating: boolean
          response_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: boolean
          response_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: boolean
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: true
            referencedRelation: "response"
            referencedColumns: ["id"]
          },
        ]
      }
      finetune_dataset: {
        Row: {
          created_at: string
          filter_node: string | null
          filters: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          filter_node?: string | null
          filters?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          filter_node?: string | null
          filters?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finetune_dataset_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      finetune_dataset_data: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          id: string
          organization_id: string
          request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finetune_dataset_data_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "finetune_dataset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finetune_dataset_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finetune_dataset_data_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      finetune_job: {
        Row: {
          created_at: string
          dataset_id: string
          finetune_job_id: string
          id: string
          organization_id: string
          provider_key_id: string
          status: string
        }
        Insert: {
          created_at?: string
          dataset_id: string
          finetune_job_id: string
          id?: string
          organization_id: string
          provider_key_id: string
          status: string
        }
        Update: {
          created_at?: string
          dataset_id?: string
          finetune_job_id?: string
          id?: string
          organization_id?: string
          provider_key_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "finetune_job_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "finetune_dataset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finetune_job_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finetune_job_provider_key_id_fkey"
            columns: ["provider_key_id"]
            isOneToOne: false
            referencedRelation: "decrypted_provider_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finetune_job_provider_key_id_fkey"
            columns: ["provider_key_id"]
            isOneToOne: false
            referencedRelation: "provider_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      helicone_api_keys: {
        Row: {
          api_key_hash: string
          api_key_name: string
          created_at: string
          id: number
          key_permissions: string | null
          organization_id: string
          soft_delete: boolean
          user_id: string
        }
        Insert: {
          api_key_hash: string
          api_key_name: string
          created_at?: string
          id?: number
          key_permissions?: string | null
          organization_id: string
          soft_delete?: boolean
          user_id: string
        }
        Update: {
          api_key_hash?: string
          api_key_name?: string
          created_at?: string
          id?: number
          key_permissions?: string | null
          organization_id?: string
          soft_delete?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helicone_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helicone_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helicone_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      helicone_dataset: {
        Row: {
          created_at: string | null
          dataset_type: string
          deleted_at: string | null
          id: string
          meta: Json | null
          name: string | null
          organization: string
        }
        Insert: {
          created_at?: string | null
          dataset_type?: string
          deleted_at?: string | null
          id?: string
          meta?: Json | null
          name?: string | null
          organization: string
        }
        Update: {
          created_at?: string | null
          dataset_type?: string
          deleted_at?: string | null
          id?: string
          meta?: Json | null
          name?: string | null
          organization?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      helicone_dataset_row: {
        Row: {
          created_at: string
          dataset_id: string
          id: string
          organization_id: string
          origin_request_id: string
        }
        Insert: {
          created_at?: string
          dataset_id: string
          id?: string
          organization_id: string
          origin_request_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string
          id?: string
          organization_id?: string
          origin_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_helicone_dataset_row_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "helicone_dataset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_helicone_dataset_row_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      helicone_proxy_key_limits: {
        Row: {
          cost: number | null
          count: number | null
          created_at: string | null
          currency: string | null
          helicone_proxy_key: string
          id: string
          timewindow_seconds: number | null
        }
        Insert: {
          cost?: number | null
          count?: number | null
          created_at?: string | null
          currency?: string | null
          helicone_proxy_key: string
          id: string
          timewindow_seconds?: number | null
        }
        Update: {
          cost?: number | null
          count?: number | null
          created_at?: string | null
          currency?: string | null
          helicone_proxy_key?: string
          id?: string
          timewindow_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "helicone_proxy_key_limits_helicone_proxy_key_fkey"
            columns: ["helicone_proxy_key"]
            isOneToOne: false
            referencedRelation: "helicone_proxy_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      helicone_proxy_keys: {
        Row: {
          created_at: string | null
          experiment_use: boolean
          helicone_proxy_key: string
          helicone_proxy_key_name: string
          id: string
          org_id: string
          provider_key_id: string
          soft_delete: boolean
        }
        Insert: {
          created_at?: string | null
          experiment_use?: boolean
          helicone_proxy_key: string
          helicone_proxy_key_name: string
          id?: string
          org_id: string
          provider_key_id: string
          soft_delete?: boolean
        }
        Update: {
          created_at?: string | null
          experiment_use?: boolean
          helicone_proxy_key?: string
          helicone_proxy_key_name?: string
          id?: string
          org_id?: string
          provider_key_id?: string
          soft_delete?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "helicone_proxy_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helicone_proxy_keys_provider_key_id_fkey"
            columns: ["provider_key_id"]
            isOneToOne: false
            referencedRelation: "decrypted_provider_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helicone_proxy_keys_provider_key_id_fkey"
            columns: ["provider_key_id"]
            isOneToOne: false
            referencedRelation: "provider_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      helicone_settings: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
        }
        Relationships: []
      }
      integrations: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          integration_name: string
          organization_id: string
          settings: Json | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          integration_name: string
          organization_id: string
          settings?: Json | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          integration_name?: string
          organization_id?: string
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      job: {
        Row: {
          created_at: string | null
          custom_properties: Json
          description: string
          id: string
          name: string
          org_id: string
          status: string
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          custom_properties: Json
          description: string
          id: string
          name: string
          org_id: string
          status?: string
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          custom_properties?: Json
          description?: string
          id?: string
          name?: string
          org_id?: string
          status?: string
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      job_node: {
        Row: {
          created_at: string | null
          custom_properties: Json
          description: string
          id: string
          job: string
          name: string
          node_type: string
          org_id: string
          resource_data: string | null
          resource_data_type: string | null
          status: string
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          custom_properties: Json
          description?: string
          id: string
          job: string
          name?: string
          node_type?: string
          org_id: string
          resource_data?: string | null
          resource_data_type?: string | null
          status?: string
          timeout_seconds?: number
          updated_at: string
        }
        Update: {
          created_at?: string | null
          custom_properties?: Json
          description?: string
          id?: string
          job?: string
          name?: string
          node_type?: string
          org_id?: string
          resource_data?: string | null
          resource_data_type?: string | null
          status?: string
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_node_job_fkey"
            columns: ["job"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_node_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      job_node_relationships: {
        Row: {
          job_id: string | null
          node_id: string
          parent_node_id: string
        }
        Insert: {
          job_id?: string | null
          node_id: string
          parent_node_id: string
        }
        Update: {
          job_id?: string | null
          node_id?: string
          parent_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_node_relationships_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_node_relationships_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "job_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_node_relationships_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "job_node"
            referencedColumns: ["id"]
          },
        ]
      }
      job_node_request: {
        Row: {
          created_at: string
          job_id: string
          node_id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          node_id: string
          request_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          node_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_node_request_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_node_request_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "job_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_node_request_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      layout: {
        Row: {
          columns: Json | null
          created_at: string | null
          filters: Json | null
          id: number
          name: string
          user_id: string
        }
        Insert: {
          columns?: Json | null
          created_at?: string | null
          filters?: Json | null
          id?: number
          name: string
          user_id: string
        }
        Update: {
          columns?: Json | null
          created_at?: string | null
          filters?: Json | null
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "layout_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layout_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      org_rate_limit_tracker: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          total_count: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          total_count?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_rate_limit_tracker_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          color: string
          created_at: string | null
          domain: string | null
          has_onboarded: boolean
          icon: string
          id: string
          is_personal: boolean
          limits: Json | null
          logo_path: string | null
          name: string
          org_provider_key: string | null
          organization_type: string
          owner: string
          percent_to_log: number | null
          referral: string | null
          request_limit: number | null
          reseller_id: string | null
          size: string | null
          soft_delete: boolean
          stripe_customer_id: string | null
          stripe_metadata: Json
          stripe_subscription_id: string | null
          stripe_subscription_item_id: string | null
          subscription_status: string | null
          tier: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          domain?: string | null
          has_onboarded?: boolean
          icon?: string
          id?: string
          is_personal?: boolean
          limits?: Json | null
          logo_path?: string | null
          name: string
          org_provider_key?: string | null
          organization_type?: string
          owner: string
          percent_to_log?: number | null
          referral?: string | null
          request_limit?: number | null
          reseller_id?: string | null
          size?: string | null
          soft_delete?: boolean
          stripe_customer_id?: string | null
          stripe_metadata?: Json
          stripe_subscription_id?: string | null
          stripe_subscription_item_id?: string | null
          subscription_status?: string | null
          tier?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          domain?: string | null
          has_onboarded?: boolean
          icon?: string
          id?: string
          is_personal?: boolean
          limits?: Json | null
          logo_path?: string | null
          name?: string
          org_provider_key?: string | null
          organization_type?: string
          owner?: string
          percent_to_log?: number | null
          referral?: string | null
          request_limit?: number | null
          reseller_id?: string | null
          size?: string | null
          soft_delete?: boolean
          stripe_customer_id?: string | null
          stripe_metadata?: Json
          stripe_subscription_id?: string | null
          stripe_subscription_item_id?: string | null
          subscription_status?: string | null
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_org_provider_key_fkey"
            columns: ["org_provider_key"]
            isOneToOne: false
            referencedRelation: "decrypted_provider_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_org_provider_key_fkey"
            columns: ["org_provider_key"]
            isOneToOne: false
            referencedRelation: "provider_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_layout: {
        Row: {
          created_at: string
          filters: Json
          id: string
          organization_id: string
          type: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          organization_id: string
          type: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_layout_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_member: {
        Row: {
          created_at: string | null
          member: string
          org_role: string
          organization: string
        }
        Insert: {
          created_at?: string | null
          member: string
          org_role?: string
          organization: string
        }
        Update: {
          created_at?: string | null
          member?: string
          org_role?: string
          organization?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_member_member_fkey"
            columns: ["member"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_member_member_fkey"
            columns: ["member"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_member_organization_fkey"
            columns: ["organization"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_usage: {
        Row: {
          created_at: string
          end_date: string
          error_message: string | null
          id: string
          organization_id: string
          quantity: number
          recorded: boolean | null
          start_date: string
          stripe_record: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          error_message?: string | null
          id?: string
          organization_id: string
          quantity: number
          recorded?: boolean | null
          start_date: string
          stripe_record?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          quantity?: number
          recorded?: boolean | null
          start_date?: string
          stripe_record?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_input_keys: {
        Row: {
          created_at: string | null
          id: string
          key: string
          prompt_version: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          prompt_version: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          prompt_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prompt_version"
            columns: ["prompt_version"]
            isOneToOne: false
            referencedRelation: "prompts_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_input_record: {
        Row: {
          auto_prompt_inputs: Json
          created_at: string | null
          id: string
          inputs: Json
          prompt_version: string
          source_request: string | null
        }
        Insert: {
          auto_prompt_inputs?: Json
          created_at?: string | null
          id?: string
          inputs: Json
          prompt_version: string
          source_request?: string | null
        }
        Update: {
          auto_prompt_inputs?: Json
          created_at?: string | null
          id?: string
          inputs?: Json
          prompt_version?: string
          source_request?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prompt_version"
            columns: ["prompt_version"]
            isOneToOne: false
            referencedRelation: "prompts_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_source_request"
            columns: ["source_request"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_v2: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          organization: string
          pretty_name: string | null
          soft_delete: boolean | null
          user_defined_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization: string
          pretty_name?: string | null
          soft_delete?: boolean | null
          user_defined_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization?: string
          pretty_name?: string | null
          soft_delete?: boolean | null
          user_defined_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts_versions: {
        Row: {
          created_at: string | null
          helicone_template: Json | null
          id: string
          major_version: number
          metadata: Json | null
          minor_version: number
          model: string | null
          organization: string
          prompt_v2: string
          soft_delete: boolean | null
        }
        Insert: {
          created_at?: string | null
          helicone_template?: Json | null
          id?: string
          major_version: number
          metadata?: Json | null
          minor_version: number
          model?: string | null
          organization: string
          prompt_v2: string
          soft_delete?: boolean | null
        }
        Update: {
          created_at?: string | null
          helicone_template?: Json | null
          id?: string
          major_version?: number
          metadata?: Json | null
          minor_version?: number
          model?: string | null
          organization?: string
          prompt_v2?: string
          soft_delete?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prompt"
            columns: ["prompt_v2"]
            isOneToOne: false
            referencedRelation: "prompt_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          auth_hash: string | null
          created_at: string
          id: number
          key: string
          request_id: string | null
          user_id: string | null
          value: string
        }
        Insert: {
          auth_hash?: string | null
          created_at?: string
          id?: number
          key: string
          request_id?: string | null
          user_id?: string | null
          value: string
        }
        Update: {
          auth_hash?: string | null
          created_at?: string
          id?: number
          key?: string
          request_id?: string | null
          user_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_keys: {
        Row: {
          created_at: string | null
          id: string
          key_id: string
          nonce: string
          org_id: string
          provider_key: string
          provider_key_name: string
          provider_name: string
          soft_delete: boolean
          vault_key_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_id?: string
          nonce?: string
          org_id: string
          provider_key: string
          provider_key_name: string
          provider_name: string
          soft_delete?: boolean
          vault_key_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_id?: string
          nonce?: string
          org_id?: string
          provider_key?: string
          provider_key_name?: string
          provider_name?: string
          soft_delete?: boolean
          vault_key_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_keys_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "decrypted_key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_keys_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_keys_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "valid_key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_user_id: string | null
          referrer_user_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_user_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      request: {
        Row: {
          auth_hash: string
          body: Json
          country_code: string | null
          created_at: string
          formatted_prompt_id: string | null
          helicone_api_key_id: number | null
          helicone_org_id: string | null
          helicone_proxy_key_id: string | null
          helicone_user: string | null
          id: string
          model: string | null
          model_override: string | null
          path: string
          prompt_id: string | null
          prompt_values: Json | null
          properties: Json | null
          provider: string
          request_ip: string | null
          target_url: string | null
          threat: boolean | null
          user_id: string | null
          version: number
        }
        Insert: {
          auth_hash: string
          body: Json
          country_code?: string | null
          created_at?: string
          formatted_prompt_id?: string | null
          helicone_api_key_id?: number | null
          helicone_org_id?: string | null
          helicone_proxy_key_id?: string | null
          helicone_user?: string | null
          id?: string
          model?: string | null
          model_override?: string | null
          path: string
          prompt_id?: string | null
          prompt_values?: Json | null
          properties?: Json | null
          provider?: string
          request_ip?: string | null
          target_url?: string | null
          threat?: boolean | null
          user_id?: string | null
          version?: number
        }
        Update: {
          auth_hash?: string
          body?: Json
          country_code?: string | null
          created_at?: string
          formatted_prompt_id?: string | null
          helicone_api_key_id?: number | null
          helicone_org_id?: string | null
          helicone_proxy_key_id?: string | null
          helicone_user?: string | null
          id?: string
          model?: string | null
          model_override?: string | null
          path?: string
          prompt_id?: string | null
          prompt_values?: Json | null
          properties?: Json | null
          provider?: string
          request_ip?: string | null
          target_url?: string | null
          threat?: boolean | null
          user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "request_helicone_api_key_id_fkey"
            columns: ["helicone_api_key_id"]
            isOneToOne: false
            referencedRelation: "helicone_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_helicone_org_id_fkey"
            columns: ["helicone_org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_helicone_proxy_key_id_fkey"
            columns: ["helicone_proxy_key_id"]
            isOneToOne: false
            referencedRelation: "helicone_proxy_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_helicone_user_fkey"
            columns: ["helicone_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_helicone_user_fkey"
            columns: ["helicone_user"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      request_job_task: {
        Row: {
          job_id: string
          request_id: string
          task_id: string
        }
        Insert: {
          job_id: string
          request_id: string
          task_id: string
        }
        Update: {
          job_id?: string
          request_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_job_task_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_job_task_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_job_task_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "job_node"
            referencedColumns: ["id"]
          },
        ]
      }
      request_response_search: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          request_body_vector: unknown | null
          request_id: string
          response_body_vector: unknown | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          request_body_vector?: unknown | null
          request_id: string
          response_body_vector?: unknown | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          request_body_vector?: unknown | null
          request_id?: string
          response_body_vector?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "request_response_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_response_search_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      response: {
        Row: {
          body: Json
          completion_tokens: number | null
          created_at: string
          delay_ms: number | null
          feedback: Json | null
          helicone_org_id: string | null
          id: string
          model: string | null
          prompt_tokens: number | null
          request: string
          status: number | null
          time_to_first_token: number | null
        }
        Insert: {
          body: Json
          completion_tokens?: number | null
          created_at?: string
          delay_ms?: number | null
          feedback?: Json | null
          helicone_org_id?: string | null
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          request: string
          status?: number | null
          time_to_first_token?: number | null
        }
        Update: {
          body?: Json
          completion_tokens?: number | null
          created_at?: string
          delay_ms?: number | null
          feedback?: Json | null
          helicone_org_id?: string | null
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          request?: string
          status?: number | null
          time_to_first_token?: number | null
        }
        Relationships: []
      }
      rosetta_mappers: {
        Row: {
          code: string
          created_at: string
          id: string
          ignored_fields: string[] | null
          input_json: Json
          key: string
          mapped_fields: string[] | null
          output_schema: Json
          output_schema_hash: string
          status: Database["public"]["Enums"]["mapper_status"]
          updated_at: string
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          ignored_fields?: string[] | null
          input_json: Json
          key: string
          mapped_fields?: string[] | null
          output_schema: Json
          output_schema_hash: string
          status: Database["public"]["Enums"]["mapper_status"]
          updated_at?: string
          version: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          ignored_fields?: string[] | null
          input_json?: Json
          key?: string
          mapped_fields?: string[] | null
          output_schema?: Json
          output_schema_hash?: string
          status?: Database["public"]["Enums"]["mapper_status"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      score_attribute: {
        Row: {
          created_at: string | null
          id: string
          organization: string
          score_key: string
          value_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization: string
          score_key: string
          value_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization?: string
          score_key?: string
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      score_value: {
        Row: {
          created_at: string | null
          id: string
          int_value: number | null
          request_id: string
          score_attribute: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          int_value?: number | null
          request_id: string
          score_attribute: string
        }
        Update: {
          created_at?: string | null
          id?: string
          int_value?: number | null
          request_id?: string
          score_attribute?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_score_attribute"
            columns: ["score_attribute"]
            isOneToOne: false
            referencedRelation: "score_attribute"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          api_key_hash: string
          api_key_preview: string
          created_at: string
          key_name: string | null
          user_id: string
        }
        Insert: {
          api_key_hash: string
          api_key_preview: string
          created_at?: string
          key_name?: string | null
          user_id: string
        }
        Update: {
          api_key_hash?: string
          api_key_preview?: string
          created_at?: string
          key_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback: string
          id: number
          organization_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          feedback: string
          id?: number
          organization_id: string
          tag: string
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: number
          organization_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          referral_code: string
          request_limit: number
          tier: string
          user: string
        }
        Insert: {
          created_at?: string | null
          referral_code?: string
          request_limit?: number
          tier?: string
          user: string
        }
        Update: {
          created_at?: string | null
          referral_code?: string
          request_limit?: number
          tier?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_fkey"
            columns: ["user"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_fkey"
            columns: ["user"]
            isOneToOne: true
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          created_at: string | null
          event: string
          id: number
          payload_type: Json
          webhook_id: number
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: number
          payload_type: Json
          webhook_id: number
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: number
          payload_type?: Json
          webhook_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          config: Json | null
          created_at: string | null
          destination: string
          hmac_key: string | null
          id: number
          is_verified: boolean
          org_id: string
          txt_record: string
          version: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          destination: string
          hmac_key?: string | null
          id?: number
          is_verified?: boolean
          org_id: string
          txt_record: string
          version?: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          destination?: string
          hmac_key?: string | null
          id?: number
          is_verified?: boolean
          org_id?: string
          txt_record?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      decrypted_provider_keys: {
        Row: {
          created_at: string | null
          decrypted_provider_key: string | null
          id: string | null
          key_id: string | null
          nonce: string | null
          org_id: string | null
          provider_key: string | null
          provider_key_name: string | null
          provider_name: string | null
          soft_delete: boolean | null
          vault_key_id: string | null
        }
        Insert: {
          created_at?: string | null
          decrypted_provider_key?: never
          id?: string | null
          key_id?: string | null
          nonce?: string | null
          org_id?: string | null
          provider_key?: string | null
          provider_key_name?: string | null
          provider_name?: string | null
          soft_delete?: boolean | null
          vault_key_id?: string | null
        }
        Update: {
          created_at?: string | null
          decrypted_provider_key?: never
          id?: string | null
          key_id?: string | null
          nonce?: string | null
          org_id?: string | null
          provider_key?: string | null
          provider_key_name?: string | null
          provider_name?: string | null
          soft_delete?: boolean | null
          vault_key_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_keys_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_keys_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "decrypted_key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_keys_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "valid_key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      users_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_sign_in_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_request_access: {
        Args: {
          this_auth_hash: string
          this_user_id: string
        }
        Returns: boolean
      }
      check_response_access:
        | {
            Args: {
              this_associated_request_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              this_associated_request_id: string
              this_user_id: string
            }
            Returns: boolean
          }
      date_count:
        | {
            Args: {
              time_increment: string
            }
            Returns: Record<string, unknown>[]
          }
        | {
            Args: {
              time_increment: string
              prev_period: string
            }
            Returns: Record<string, unknown>[]
          }
      ensure_personal: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_org_id: {
        Args: {
          request_id: string
        }
        Returns: string
      }
      insert_feedback_and_update_response: {
        Args: {
          response_id: string
          feedback_metric_id: number
          boolean_value: boolean
          numerical_value: number
          string_value: string
          categorical_value: string
          created_by: string
          name: string
        }
        Returns: number
      }
      verify_helicone_proxy_key: {
        Args: {
          api_key: string
          stored_hashed_key: string
        }
        Returns: boolean
      }
    }
    Enums: {
      mapper_status:
        | "PENDING_CREATION"
        | "PENDING_UPDATE"
        | "IN_PROGRESS"
        | "PENDING_APPROVAL"
        | "ACTIVE"
        | "INACTIVE"
        | "DECLINED"
        | "FAILED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

