export type AllOperators =
  | "equals"
  | "like"
  | "ilike"
  | "gte"
  | "lte"
  | "lt"
  | "gt"
  | "not-equals"
  | "contains"
  | "not-contains"
  | "gin-contains"
  | "vector-contains";

export type TextOperators = Record<
  "not-equals" | "equals" | "like" | "ilike" | "contains" | "not-contains",
  string
>;

export type VectorOperators = Record<"contains", string>;

export type NumberOperators = Record<
  "not-equals" | "equals" | "gte" | "lte" | "lt" | "gt",
  number
>;

export type BooleanOperators = Record<"equals", boolean>;

export type TimestampOperators = Record<
  "equals" | "gte" | "lte" | "lt" | "gt",
  string
>;

export type TimestampOperatorsTyped = Record<
  "equals" | "gte" | "lte" | "lt" | "gt",
  Date
>;

export type AnyOperator =
  | SingleKey<TextOperators>
  | SingleKey<NumberOperators>
  | SingleKey<TimestampOperators>
  | SingleKey<TimestampOperatorsTyped>
  | SingleKey<BooleanOperators>;
export type SingleKey<T> = Partial<T>;

export interface TimeFilter {
  start: Date;
  end: Date;
}

export interface TimeFilterMs {
  startTimeUnixMs: number;
  endTimeUnixMs: number;
}

// NON CLICKHOUSE TABLES

// user_metrics
type UserMetricsToOperators = {
  user_id: SingleKey<TextOperators>;
  last_active: SingleKey<TimestampOperators>;
  total_requests: SingleKey<NumberOperators>;
  active_for: SingleKey<NumberOperators>;
  average_requests_per_day_active: SingleKey<NumberOperators>;
  average_tokens_per_request: SingleKey<NumberOperators>;
  total_completion_tokens: SingleKey<NumberOperators>;
  total_prompt_tokens: SingleKey<NumberOperators>;
  cost: SingleKey<NumberOperators>;
};
export type FilterLeafUserMetrics = SingleKey<UserMetricsToOperators>;

// user_api_keys
type UserApiKeysTableToOperators = {
  api_key_hash: SingleKey<TextOperators>;
  api_key_name: SingleKey<TextOperators>;
};
export type FilterLeafUserApiKeys = SingleKey<UserApiKeysTableToOperators>;

// response
type ResponseTableToOperators = {
  body_tokens: SingleKey<NumberOperators>;
  body_model: SingleKey<TextOperators>;
  body_completion: SingleKey<TextOperators>;
  status: SingleKey<NumberOperators>;
  model: SingleKey<TextOperators>;
};
export type FilterLeafResponse = SingleKey<ResponseTableToOperators>;

// request
export type RequestTableToOperators = {
  prompt: SingleKey<TextOperators>;
  created_at: SingleKey<TimestampOperators>;
  user_id: SingleKey<TextOperators>;
  auth_hash: SingleKey<TextOperators>;
  org_id: SingleKey<TextOperators>;
  id: SingleKey<TextOperators>;
  node_id: SingleKey<TextOperators>;
  model: SingleKey<TextOperators>;
  modelOverride: SingleKey<TextOperators>;
  path: SingleKey<TextOperators>;
  country_code: SingleKey<TextOperators>;
  prompt_id: SingleKey<TextOperators>;
};
export type FilterLeafRequest = SingleKey<RequestTableToOperators>;

// feedback
export type FeedbackTableToOperators = {
  id: SingleKey<NumberOperators>;
  created_at: SingleKey<TimestampOperators>;
  rating: SingleKey<BooleanOperators>;
  response_id: SingleKey<TextOperators>;
};
export type FilterLeafFeedback = SingleKey<FeedbackTableToOperators>;

// properties_table
export type PropertiesTableToOperators = {
  auth_hash: SingleKey<TextOperators>;
  key: SingleKey<TextOperators>;
  value: SingleKey<TextOperators>;
};
export type FilterLeafPropertiesTable = SingleKey<PropertiesTableToOperators>;

// prompt_v2
type PromptToOperators = {
  id: SingleKey<TextOperators>;
  user_defined_id: SingleKey<TextOperators>;
};

export type FilterLeafPrompt = SingleKey<PromptToOperators>;

// prompts_versions
type PromptVersionsToOperators = {
  minor_version: SingleKey<NumberOperators>;
  major_version: SingleKey<NumberOperators>;
  id: SingleKey<TextOperators>;
  prompt_v2: SingleKey<TextOperators>;
};
export type FilterLeafPromptVersions = SingleKey<PromptVersionsToOperators>;

// experiment
type ExperimentToOperators = {
  id: SingleKey<TextOperators>;
  prompt_v2: SingleKey<TextOperators>;
};
export type FilterLeafExperiment = SingleKey<ExperimentToOperators>;

// experiment_hypothesis_run
type ExperimentHypothesisRunToOperator = {
  result_request_id: SingleKey<TextOperators>;
};
export type ExperimentHypothesisRunScoreValue =
  SingleKey<ExperimentHypothesisRunToOperator>;

// score_value
type ScoreValueToOperator = {
  request_id: SingleKey<TextOperators>;
};
export type FilterLeafScoreValue = SingleKey<ScoreValueToOperator>;

// CLICKHOUSE TABLES

// request_response_log
interface RequestResponseLogToOperators {
  latency: SingleKey<NumberOperators>;
  status: SingleKey<NumberOperators>;
  request_created_at: SingleKey<TimestampOperatorsTyped>;
  response_created_at: SingleKey<TimestampOperatorsTyped>;
  auth_hash: SingleKey<TextOperators>;
  model: SingleKey<TextOperators>;
  user_id: SingleKey<TextOperators>;
  organization_id: SingleKey<TextOperators>;
  node_id: SingleKey<TextOperators>;
  job_id: SingleKey<TextOperators>;
  threat: SingleKey<BooleanOperators>;
}
export type FilterLeafRequestResponseLog =
  SingleKey<RequestResponseLogToOperators>;

// request_response_rmt
interface RequestResponseRMTToOperators {
  country_code: SingleKey<TextOperators>;
  latency: SingleKey<NumberOperators>;
  cost: SingleKey<NumberOperators>;
  provider: SingleKey<TextOperators>;
  time_to_first_token: SingleKey<NumberOperators>;
  status: SingleKey<NumberOperators>;
  request_created_at: SingleKey<TimestampOperatorsTyped>;
  response_created_at: SingleKey<TimestampOperatorsTyped>;
  model: SingleKey<TextOperators>;
  user_id: SingleKey<TextOperators>;
  organization_id: SingleKey<TextOperators>;
  node_id: SingleKey<TextOperators>;
  job_id: SingleKey<TextOperators>;
  threat: SingleKey<BooleanOperators>;
  request_id: SingleKey<TextOperators>;
  prompt_tokens: SingleKey<NumberOperators>;
  completion_tokens: SingleKey<NumberOperators>;
  prompt_cache_read_tokens: SingleKey<NumberOperators>;
  prompt_cache_write_tokens: SingleKey<NumberOperators>;
  total_tokens: SingleKey<NumberOperators>;
  target_url: SingleKey<TextOperators>;
  properties: {
    [key: string]: SingleKey<TextOperators>;
  };
  search_properties: {
    [key: string]: SingleKey<TextOperators>;
  };
  scores: {
    [key: string]: SingleKey<TextOperators>;
  };
  scores_column: SingleKey<TextOperators>;
  request_body: SingleKey<VectorOperators>;
  response_body: SingleKey<VectorOperators>;
  cache_enabled: SingleKey<BooleanOperators>;
  cache_reference_id: SingleKey<TextOperators>;
  cached: SingleKey<BooleanOperators>;
  assets: SingleKey<TextOperators>;
  "helicone-score-feedback": SingleKey<BooleanOperators>; // TODO: make this not a string literal key
  prompt_id: SingleKey<TextOperators>;
  prompt_version: SingleKey<TextOperators>;
}
export type FilterLeafRequestResponseRMT =
  SingleKey<RequestResponseRMTToOperators>;

// sessions_request_response_rmt
interface SessionsRequestResponseRMTToOperators {
  session_session_id: SingleKey<TextOperators>;
  session_session_name: SingleKey<TextOperators>;
  session_total_cost: SingleKey<NumberOperators>;
  session_total_tokens: SingleKey<NumberOperators>;
  session_prompt_tokens: SingleKey<NumberOperators>;
  session_completion_tokens: SingleKey<NumberOperators>;
  session_total_requests: SingleKey<NumberOperators>;
  session_created_at: SingleKey<TimestampOperatorsTyped>;
  session_latest_request_created_at: SingleKey<TimestampOperatorsTyped>;
  session_tag: SingleKey<TextOperators>;
}
export type FilterLeafSessionsRequestResponseRMT =
  SingleKey<SessionsRequestResponseRMTToOperators>;

// users_view
type UserViewToOperators = {
  user_user_id: SingleKey<TextOperators>;
  user_active_for: SingleKey<NumberOperators>;
  user_first_active: SingleKey<TimestampOperatorsTyped>;
  user_last_active: SingleKey<TimestampOperatorsTyped>;
  user_total_requests: SingleKey<NumberOperators>;
  user_average_requests_per_day_active: SingleKey<NumberOperators>;
  user_average_tokens_per_request: SingleKey<NumberOperators>;
  user_total_completion_tokens: SingleKey<NumberOperators>;
  user_total_prompt_tokens: SingleKey<NumberOperators>;
  user_cost: SingleKey<NumberOperators>;
};
export type FilterLeafUserView = SingleKey<UserViewToOperators>;

// properties_v3
type PropertiesV3ToOperators = {
  key: SingleKey<TextOperators>;
  value: SingleKey<TextOperators>;
  organization_id: SingleKey<TextOperators>;
};
export type FilterLeafPropertiesV3 = SingleKey<PropertiesV3ToOperators>;

// property_with_response_v1
type PropertyWithResponseV1ToOperators = {
  property_key: SingleKey<TextOperators>;
  property_value: SingleKey<TextOperators>;
  request_created_at: SingleKey<TimestampOperatorsTyped>;
  organization_id: SingleKey<TextOperators>;
  threat: SingleKey<BooleanOperators>;
};
export type FilterLeafPropertyWithResponseV1 =
  SingleKey<PropertyWithResponseV1ToOperators>;

// job
type JobToOperators = {
  id: SingleKey<TextOperators>;
  name: SingleKey<TextOperators>;
  description: SingleKey<TextOperators>;
  status: SingleKey<TextOperators>;
  created_at: SingleKey<TimestampOperators>;
  updated_at: SingleKey<TimestampOperators>;
  timeout_seconds: SingleKey<NumberOperators>;
  custom_properties: {
    [key: string]: SingleKey<TextOperators>;
  };
  org_id: SingleKey<TextOperators>;
};
export type FilterLeafJob = SingleKey<JobToOperators>;

// job_node
type NodesToOperators = {
  id: SingleKey<TextOperators>;
  name: SingleKey<TextOperators>;
  description: SingleKey<TextOperators>;
  job_id: SingleKey<TextOperators>;
  status: SingleKey<TextOperators>;
  created_at: SingleKey<TimestampOperators>;
  updated_at: SingleKey<TimestampOperators>;
  timeout_seconds: SingleKey<NumberOperators>;
  custom_properties: {
    [key: string]: SingleKey<TextOperators>;
  };
  org_id: SingleKey<TextOperators>;
};
export type FilterLeafNode = SingleKey<NodesToOperators>;

// cache_metrics
export type CacheMetricsTableToOperators = {
  organization_id: SingleKey<TextOperators>;
  request_id: SingleKey<TextOperators>;
  date: SingleKey<TimestampOperatorsTyped>;
  hour: SingleKey<NumberOperators>;
  model: SingleKey<TextOperators>;
  cache_hit_count: SingleKey<NumberOperators>;
  saved_latency_ms: SingleKey<NumberOperators>;
  saved_completion_tokens: SingleKey<NumberOperators>;
  saved_prompt_tokens: SingleKey<NumberOperators>;
  saved_completion_audio_tokens: SingleKey<NumberOperators>;
  saved_prompt_audio_tokens: SingleKey<NumberOperators>;
  saved_prompt_cache_write_tokens: SingleKey<NumberOperators>;
  saved_prompt_cache_read_tokens: SingleKey<NumberOperators>;
  first_hit: SingleKey<TimestampOperatorsTyped>;
  last_hit: SingleKey<TimestampOperatorsTyped>;
  request_body: SingleKey<TextOperators>;
  response_body: SingleKey<TextOperators>;
};
export type FilterLeafCacheMetrics = SingleKey<CacheMetricsTableToOperators>;

// rate_limit_log
export type RateLimitTableToOperators = {
  organization_id: SingleKey<TextOperators>;
  created_at: SingleKey<TimestampOperatorsTyped>;
};
export type FilterLeafRateLimitLog = SingleKey<RateLimitTableToOperators>;

// CLICKHOUSE TABLES: SIMPLE MATERIALIZED VIEWS

// organization_properties
type OrganizationPropertiesToOperators = {
  organization_id: SingleKey<TextOperators>;
  property_key: SingleKey<TextOperators>;
};
export type FilterLeafOrganizationProperties =
  SingleKey<OrganizationPropertiesToOperators>;

// FilterLeaf
export type TablesAndViews = {
  // NON CLICKHOUSE TABLES
  user_metrics: FilterLeafUserMetrics;
  user_api_keys: FilterLeafUserApiKeys;
  response: FilterLeafResponse;
  request: FilterLeafRequest;
  feedback: FilterLeafFeedback;
  properties_table: FilterLeafPropertiesTable;
  prompt_v2: FilterLeafPrompt;
  prompts_versions: FilterLeafPromptVersions;
  experiment: FilterLeafExperiment;
  experiment_hypothesis_run: ExperimentHypothesisRunScoreValue;
  score_value: FilterLeafScoreValue;

  // CLICKHOUSE TABLES
  request_response_log: FilterLeafRequestResponseLog;
  request_response_rmt: FilterLeafRequestResponseRMT;
  sessions_request_response_rmt: FilterLeafSessionsRequestResponseRMT;
  users_view: FilterLeafUserView;
  properties_v3: FilterLeafPropertiesV3;
  property_with_response_v1: FilterLeafPropertyWithResponseV1;
  job: FilterLeafJob;
  job_node: FilterLeafNode;
  cache_metrics: FilterLeafCacheMetrics;
  rate_limit_log: FilterLeafRateLimitLog;

  // SIMPLE MATERIALIZED VIEWS
  // cheap tables, made for quick stat queries
  organization_properties: FilterLeafOrganizationProperties;

  properties: {
    [key: string]: SingleKey<TextOperators>;
  };
  values: {
    [key: string]: SingleKey<TextOperators>;
  };
};
export type FilterLeaf = SingleKey<TablesAndViews>;

export type FilterNode = FilterLeaf | FilterBranch | "all";

export interface FilterBranch {
  left: FilterNode;
  operator: "or" | "and";
  right: FilterNode;
}

export type FilterLeafSubset<T extends keyof TablesAndViews> = Pick<
  FilterLeaf,
  T
>;

// Note: (justin)
// I am keeping this here just incase anyone in the future tries to do this... we know it has been done before.
// Basically this would be awesome instead of having to create types like RequestFilterNode, but tsoa is not
// sophisticated enough to handle this.
//
// export type FilterBranchSubset<T extends TableAndViewKeys> = {
//   left: FilterNodeSubset<T>;
//   operator: "or" | "and";
//   right: FilterNodeSubset<T>;
// };

// export type FilterNodeSubset<T extends TableAndViewKeys> =
//   | FilterLeafSubset<T>
//   | FilterBranchSubset<T>
//   | "all";
