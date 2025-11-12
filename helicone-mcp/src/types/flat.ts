/**
 * Flattened type definitions for ts-to-zod
 * Core types for Helicone filter and sort functionality
 */

export type SortDirection = "asc" | "desc";

export type TextOperators = {
  "not-equals"?: string;
  equals?: string;
  like?: string;
  ilike?: string;
  contains?: string;
  "not-contains"?: string;
};

export type NumberOperators = {
  "not-equals"?: number;
  equals?: number;
  gte?: number;
  lte?: number;
  lt?: number;
  gt?: number;
};

export type BooleanOperators = {
  equals?: boolean;
};

export type TimestampOperators = {
  equals?: string;
  gte?: string;
  lte?: string;
  lt?: string;
  gt?: string;
};

export type VectorOperators = {
  contains?: string;
};

export type RequestResponseRMTToOperators = {
  country_code?: TextOperators;
  latency?: NumberOperators;
  cost?: NumberOperators;
  provider?: TextOperators;
  time_to_first_token?: NumberOperators;
  status?: NumberOperators;
  request_created_at?: TimestampOperators;
  response_created_at?: TimestampOperators;
  model?: TextOperators;
  user_id?: TextOperators;
  organization_id?: TextOperators;
  node_id?: TextOperators;
  job_id?: TextOperators;
  threat?: BooleanOperators;
  request_id?: TextOperators;
  prompt_tokens?: NumberOperators;
  completion_tokens?: NumberOperators;
  prompt_cache_read_tokens?: NumberOperators;
  prompt_cache_write_tokens?: NumberOperators;
  total_tokens?: NumberOperators;
  target_url?: TextOperators;
  properties?: {
    [key: string]: TextOperators;
  };
  search_properties?: {
    [key: string]: TextOperators;
  };
  scores?: {
    [key: string]: TextOperators;
  };
  scores_column?: TextOperators;
  request_body?: VectorOperators;
  response_body?: VectorOperators;
  cache_enabled?: BooleanOperators;
  cache_reference_id?: TextOperators;
  cached?: BooleanOperators;
  assets?: TextOperators;
  "helicone-score-feedback"?: BooleanOperators;
  prompt_id?: TextOperators;
  prompt_version?: TextOperators;
  request_referrer?: TextOperators;
  is_passthrough_billing?: BooleanOperators;
};

export type SessionsRequestResponseRMTToOperators = {
  session_session_id?: TextOperators;
  session_session_name?: TextOperators;
  session_total_cost?: NumberOperators;
  session_total_tokens?: NumberOperators;
  session_prompt_tokens?: NumberOperators;
  session_completion_tokens?: NumberOperators;
  session_total_requests?: NumberOperators;
  session_created_at?: TimestampOperators;
  session_latest_request_created_at?: TimestampOperators;
  session_tag?: TextOperators;
};

export type ResponseTableToOperators = {
  body_tokens?: NumberOperators;
  body_model?: TextOperators;
  body_completion?: TextOperators;
  status?: NumberOperators;
  model?: TextOperators;
};

export type RequestTableToOperators = {
  prompt?: TextOperators;
  created_at?: TimestampOperators;
  user_id?: TextOperators;
  auth_hash?: TextOperators;
  org_id?: TextOperators;
  id?: TextOperators;
  node_id?: TextOperators;
  model?: TextOperators;
  modelOverride?: TextOperators;
  path?: TextOperators;
  country_code?: TextOperators;
  prompt_id?: TextOperators;
};

export type FeedbackTableToOperators = {
  id?: NumberOperators;
  created_at?: TimestampOperators;
  rating?: BooleanOperators;
  response_id?: TextOperators;
};

export type FilterLeafSubset = {
  request_response_rmt?: RequestResponseRMTToOperators;
  response?: ResponseTableToOperators;
  request?: RequestTableToOperators;
  feedback?: FeedbackTableToOperators;
  sessions_request_response_rmt?: SessionsRequestResponseRMTToOperators;
  properties?: {
    [key: string]: TextOperators;
  };
  values?: {
    [key: string]: TextOperators;
  };
};

export type RequestFilterBranch = {
  left: RequestFilterNode;
  operator: "or" | "and";
  right: RequestFilterNode;
};

export type RequestFilterNode = FilterLeafSubset | RequestFilterBranch | "all";

export type SessionFilterBranch = {
  left: SessionFilterNode;
  operator: "or" | "and";
  right: SessionFilterNode;
};

export type SessionFilterNode = FilterLeafSubset | SessionFilterBranch | "all";

export type SortLeafRequest = {
  random?: true;
  created_at?: SortDirection;
  cache_created_at?: SortDirection;
  latency?: SortDirection;
  last_active?: SortDirection;
  total_tokens?: SortDirection;
  completion_tokens?: SortDirection;
  prompt_tokens?: SortDirection;
  user_id?: SortDirection;
  body_model?: SortDirection;
  is_cached?: SortDirection;
  request_prompt?: SortDirection;
  response_text?: SortDirection;
  properties?: {
    [key: string]: SortDirection;
  };
  values?: {
    [key: string]: SortDirection;
  };
  cost?: SortDirection;
};
