export interface TimeFilter {
  start: Date;
  end: Date;
}

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

export type TimestampOperators = Record<"gte" | "lte" | "lt" | "gt", string>;

export type TimestampOperatorsTyped = Record<"gte" | "lte" | "lt" | "gt", Date>;

export type AnyOperator =
  | SingleKey<TextOperators>
  | SingleKey<NumberOperators>
  | SingleKey<TimestampOperators>
  | SingleKey<TimestampOperatorsTyped>
  | SingleKey<BooleanOperators>
  | SingleKey<VectorOperators>;
export type SingleKey<T> = {
  [K in keyof T]: Partial<{
    [P in keyof T]: P extends K ? T[P] : never;
  }>;
}[keyof T];

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

export type FeedbackTableToOperators = {
  id: SingleKey<NumberOperators>;
  created_at: SingleKey<TimestampOperators>;
  rating: SingleKey<BooleanOperators>;
  response_id: SingleKey<TextOperators>;
};

export type FilterLeafFeedback = SingleKey<FeedbackTableToOperators>;

export type PropertiesTableToOperators = {
  auth_hash: SingleKey<TextOperators>;
  key: SingleKey<TextOperators>;
  value: SingleKey<TextOperators>;
};

export type CacheHitsTableToOperators = {
  organization_id: SingleKey<TextOperators>;
  request_id: SingleKey<TextOperators>;
  latency: SingleKey<NumberOperators>;
  completion_tokens: SingleKey<NumberOperators>;
  prompt_tokens: SingleKey<NumberOperators>;
  created_at: SingleKey<TimestampOperatorsTyped>;
};

export type FilterLeafCacheHits = SingleKey<CacheHitsTableToOperators>;

export type RateLimitTableToOperators = {
  organization_id: SingleKey<TextOperators>;
  created_at: SingleKey<TimestampOperatorsTyped>;
};

export type FilterLeafRateLimitLog = SingleKey<RateLimitTableToOperators>;

export type FilterLeafPropertiesTable = SingleKey<PropertiesTableToOperators>;

type UserApiKeysTableToOperators = {
  api_key_hash: SingleKey<TextOperators>;
  api_key_name: SingleKey<TextOperators>;
};

export type FilterLeafUserApiKeys = SingleKey<UserApiKeysTableToOperators>;

type ResponseTableToOperators = {
  body_tokens: SingleKey<NumberOperators>;
  body_model: SingleKey<TextOperators>;
  body_completion: SingleKey<TextOperators>;
  status: SingleKey<NumberOperators>;
  model: SingleKey<TextOperators>;
};

export type FilterLeafResponse = SingleKey<ResponseTableToOperators>;

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

type ResponseCopyV1ToOperators = {
  latency: SingleKey<NumberOperators>;
  status: SingleKey<NumberOperators>;
  request_created_at: SingleKey<TimestampOperatorsTyped>;
  response_created_at: SingleKey<TimestampOperatorsTyped>;
  auth_hash: SingleKey<TextOperators>;
  model: SingleKey<TextOperators>;
  user_id: SingleKey<TextOperators>;
};
export type FilterLeafResponseCopyV1 = SingleKey<ResponseCopyV1ToOperators>;
interface ResponseCopyV2ToOperators extends ResponseCopyV1ToOperators {
  organization_id: SingleKey<TextOperators>;
}

export type FilterLeafResponseCopyV2 = SingleKey<ResponseCopyV2ToOperators>;

interface ResponseCopyV3ToOperators extends ResponseCopyV2ToOperators {
  rating: SingleKey<BooleanOperators>;
  feedback_created_at: SingleKey<TimestampOperatorsTyped>;
  feedback_id: SingleKey<TextOperators>;
}

export type FilterLeafResponseCopyV3 = SingleKey<ResponseCopyV3ToOperators>;

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

interface RequestResponseVersionedToOperators {
  latency: SingleKey<NumberOperators>;
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
  total_tokens: SingleKey<NumberOperators>;
  prompt_tokens: SingleKey<NumberOperators>;
  completion_tokens: SingleKey<NumberOperators>;
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
  request_body: SingleKey<VectorOperators>;
  response_body: SingleKey<VectorOperators>;
  "helicone-score-feedback": SingleKey<BooleanOperators>;
}

interface SessionsRequestResponseVersionedToOperators {
  total_cost: SingleKey<NumberOperators>;
  total_tokens: SingleKey<NumberOperators>;
}

export type FilterLeafRequestResponseLog =
  SingleKey<RequestResponseLogToOperators>;

export type FilterLeafRequestResponseVersioned =
  SingleKey<RequestResponseVersionedToOperators>;

export type FilterLeafSessionsRequestResponseVersioned =
  SingleKey<SessionsRequestResponseVersionedToOperators>;

type PropertiesCopyV2ToOperators = {
  key: SingleKey<TextOperators>;
  value: SingleKey<TextOperators>;
  organization_id: SingleKey<TextOperators>;
};

export type FilterLeafPropertiesCopyV2 = SingleKey<PropertiesCopyV2ToOperators>;

type PropertyWithResponseV1ToOperators = {
  property_key: SingleKey<TextOperators>;
  property_value: SingleKey<TextOperators>;
  request_created_at: SingleKey<TimestampOperatorsTyped>;
  organization_id: SingleKey<TextOperators>;
  threat: SingleKey<BooleanOperators>;
};

export type FilterLeafPropertyWithResponseV1 =
  SingleKey<PropertyWithResponseV1ToOperators>;

type RequestResponseSearchToOperators = {
  request_body_vector: SingleKey<VectorOperators>;
  response_body_vector: SingleKey<VectorOperators>;
};

export type FilterLeafRequestResponseSearch =
  SingleKey<RequestResponseSearchToOperators>;

type UserViewToOperators = {
  user_id: SingleKey<TextOperators>;
  active_for: SingleKey<NumberOperators>;
  first_active: SingleKey<TimestampOperators>;
  last_active: SingleKey<TimestampOperators>;
  total_requests: SingleKey<NumberOperators>;
  average_requests_per_day_active: SingleKey<NumberOperators>;
  average_tokens_per_request: SingleKey<NumberOperators>;
  total_completion_tokens: SingleKey<NumberOperators>;
  total_prompt_token: SingleKey<NumberOperators>;
  cost: SingleKey<NumberOperators>;
};

export type FilterLeafUserView = SingleKey<UserViewToOperators>;

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

export type TablesAndViews = {
  user_metrics: FilterLeafUserMetrics;
  user_api_keys: FilterLeafUserApiKeys;
  response: FilterLeafResponse;
  request: FilterLeafRequest;
  feedback: FilterLeafFeedback;
  properties_table: FilterLeafPropertiesTable;
  request_response_search: FilterLeafRequestResponseSearch;
  // CLICKHOUSE TABLES
  request_response_log: FilterLeafRequestResponseLog;
  request_response_rmt: FilterLeafRequestResponseVersioned;
  sessions_request_response_rmt: FilterLeafSessionsRequestResponseVersioned;
  users_view: FilterLeafUserView;
  properties_v3: FilterLeafPropertiesCopyV2;
  property_with_response_v1: FilterLeafPropertyWithResponseV1;
  job: FilterLeafJob;
  job_node: FilterLeafNode;
  cache_hits: FilterLeafCacheHits;
  rate_limit_log: FilterLeafRateLimitLog;

  properties: {
    [key: string]: SingleKey<TextOperators>;
  };
  values: {
    [key: string]: SingleKey<TextOperators>;
  };
};

export type FilterLeaf = SingleKey<TablesAndViews>;

export interface FilterBranch {
  left: FilterNode;
  operator: "or" | "and"; // Can add more later
  right: FilterNode;
}

export type FilterNode = FilterLeaf | FilterBranch | "all";
