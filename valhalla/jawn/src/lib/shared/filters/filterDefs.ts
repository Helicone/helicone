export type UIFilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};

import { SingleFilterDef } from "./frontendFilterDefs";
import { TimeFilter } from "./timeFilter";
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

export type TimestampOperators = Record<"gte" | "lte" | "lt" | "gt", string>;

export type TimestampOperatorsTyped = Record<"gte" | "lte" | "lt" | "gt", Date>;

export type AnyOperator =
  | SingleKey<TextOperators>
  | SingleKey<NumberOperators>
  | SingleKey<TimestampOperators>
  | SingleKey<TimestampOperatorsTyped>
  | SingleKey<BooleanOperators>;

export type SingleKey<T> = Partial<T>;

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

interface RequestResponseRMTToOperators {
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
  prompt_tokens: SingleKey<NumberOperators>;
  completion_tokens: SingleKey<NumberOperators>;
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
}

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
}

export type FilterLeafRequestResponseLog =
  SingleKey<RequestResponseLogToOperators>;

export type FilterLeafRequestResponseRMT =
  SingleKey<RequestResponseRMTToOperators>;

export type FilterLeafSessionsRequestResponseRMT =
  SingleKey<SessionsRequestResponseRMTToOperators>;

type PropertiesCopyV2ToOperators = {
  key: SingleKey<TextOperators>;
  value: SingleKey<TextOperators>;
  organization_id: SingleKey<TextOperators>;
};

export type FilterLeafPropertiesCopyV2 = SingleKey<PropertiesCopyV2ToOperators>;

export type FilterLeafPropertiesV3 = FilterLeafPropertiesCopyV2;

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

type PromptVersionsToOperators = {
  minor_version: SingleKey<NumberOperators>;
  major_version: SingleKey<NumberOperators>;
  id: SingleKey<TextOperators>;
  prompt_v2: SingleKey<TextOperators>;
};

export type FilterLeafPromptVersions = SingleKey<PromptVersionsToOperators>;

type PromptToOperators = {
  id: SingleKey<TextOperators>;
  user_defined_id: SingleKey<TextOperators>;
};

export type FilterLeafPrompt = SingleKey<PromptToOperators>;

type ExperimentToOperators = {
  id: SingleKey<TextOperators>;
  prompt_v2: SingleKey<TextOperators>;
};

export type FilterLeafExperiment = SingleKey<ExperimentToOperators>;

type ScoreValueToOperator = {
  request_id: SingleKey<TextOperators>;
};

export type FilterLeafScoreValue = SingleKey<ScoreValueToOperator>;

type ExperimentHypothesisRunToOperator = {
  result_request_id: SingleKey<TextOperators>;
};

export type ExperimentHypothesisRunScoreValue =
  SingleKey<ExperimentHypothesisRunToOperator>;

export type TablesAndViews = {
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
  request_response_search: FilterLeafRequestResponseSearch;

  // CLICKHOUSE TABLES
  request_response_log: FilterLeafRequestResponseLog;
  request_response_rmt: FilterLeafRequestResponseRMT;
  sessions_request_response_rmt: FilterLeafSessionsRequestResponseRMT;
  users_view: FilterLeafUserView;
  properties_v3: FilterLeafPropertiesV3;
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

export type FilterLeafSubset<T extends keyof TablesAndViews> = Pick<
  FilterLeaf,
  T
>;

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

export function timeFilterToFilterNode(
  filter: TimeFilter,
  table: keyof TablesAndViews
): FilterNode {
  if (table === "request_response_rmt") {
    return {
      left: {
        request_response_rmt: {
          request_created_at: {
            gte: filter.start,
          },
        },
      },
      right: {
        request_response_rmt: {
          request_created_at: {
            lte: filter.end,
          },
        },
      },
      operator: "and",
    };
  } else if (table === "property_with_response_v1") {
    return {
      left: {
        property_with_response_v1: {
          request_created_at: {
            gte: filter.start,
          },
        },
      },
      right: {
        property_with_response_v1: {
          request_created_at: {
            lte: filter.end,
          },
        },
      },
      operator: "and",
    };
  }

  throw new Error("Table not supported");
}

export function filterListToTree(
  list: FilterNode[],
  operator: "or" | "and"
): FilterNode {
  if (list.length === 0) {
    return "all";
  } else if (list.length === 1) {
    return list[0];
  } else {
    return {
      left: list[0],
      operator,
      right: filterListToTree(list.slice(1), operator),
    };
  }
}

export function filterUIToFilterLeafs(
  filterMap: SingleFilterDef<any>[],
  filters: UIFilterRow[]
): FilterLeaf[] {
  return filters
    .filter((filter) => filter.value !== "")
    .map((filter) => {
      if (
        filterMap &&
        filterMap[filter.filterMapIdx].isCustomProperty &&
        filterMap[filter.filterMapIdx].isCustomProperty === true
      ) {
        return {
          request_response_rmt: {
            properties: {
              [filterMap[filter.filterMapIdx]?.column]: {
                [filterMap[filter.filterMapIdx]?.operators[filter.operatorIdx]
                  ?.value]: filter.value,
              },
            },
          },
        };
      }
      const leaf: FilterLeaf = {
        [filterMap[filter.filterMapIdx]?.table]: {
          [filterMap[filter.filterMapIdx]?.column]: {
            [filterMap[filter.filterMapIdx]?.operators[filter.operatorIdx]
              ?.value]: filter.value,
          },
        },
      };
      return leaf;
    });
}

export const parseKey = (keyString: string): FilterLeaf => {
  return {
    request: {
      auth_hash: {
        equals: keyString,
      },
    },
  };
};
