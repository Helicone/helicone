import { UIFilterRow } from "../../../components/shared/themed/themedAdvancedFilters";
import { SingleFilterDef } from "./frontendFilterDefs";
export type AllOperators =
  | "equals"
  | "like"
  | "ilike"
  | "gte"
  | "lte"
  | "not-equals"
  | "contains";
export type TextOperators = Record<
  "not-equals" | "equals" | "like" | "ilike" | "contains",
  string
>;

export type NumberOperators = Record<
  "not-equals" | "equals" | "gte" | "lte",
  number
>;

export type TimestampOperators = Record<"gte" | "lte", string>;

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
};

export type FilterLeafRequest = SingleKey<RequestTableToOperators>;

export type PropertiesTableToOperators = {
  auth_hash: SingleKey<TextOperators>;
  key: SingleKey<TextOperators>;
  value: SingleKey<TextOperators>;
};

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
};

export type FilterLeafResponse = SingleKey<ResponseTableToOperators>;

type UserMetricsToOperators = {
  user_id: SingleKey<TextOperators>;
  last_active: SingleKey<TimestampOperators>;
  total_requests: SingleKey<NumberOperators>;
};

export type FilterLeafUserMetrics = SingleKey<UserMetricsToOperators>;

type ResponseCopyV1ToOperators = {
  latency: SingleKey<NumberOperators>;
  status: SingleKey<NumberOperators>;
  request_created_at: SingleKey<TimestampOperators>;
  auth_hash: SingleKey<TextOperators>;
  model: SingleKey<TextOperators>;
  user_id: SingleKey<TextOperators>;
};
export type FilterLeafResponseCopyV1 = SingleKey<ResponseCopyV1ToOperators>;
interface ResponseCopyV2ToOperators extends ResponseCopyV1ToOperators {
  organization_id: SingleKey<TextOperators>;
}

export type FilterLeafResponseCopyV2 = SingleKey<ResponseCopyV2ToOperators>;

type PropertiesCopyV2ToOperators = {
  key: SingleKey<TextOperators>;
  value: SingleKey<TextOperators>;
  organization_id: SingleKey<TextOperators>;
};

export type FilterLeafPropertiesCopyV2 = SingleKey<PropertiesCopyV2ToOperators>;

type UserViewToOperators = {
  user_id: SingleKey<TextOperators>;
  active_for: SingleKey<NumberOperators>;
  first_active: SingleKey<TimestampOperators>;
  last_active: SingleKey<TimestampOperators>;
  total_requests: SingleKey<NumberOperators>;
  cost: SingleKey<NumberOperators>;
};

export type FilterLeafUserView = SingleKey<UserViewToOperators>;

type PropertiesCopyV1ToOperators = {
  auth_hash: SingleKey<TextOperators>;
  key: SingleKey<TextOperators>;
  value: SingleKey<TextOperators>;
};

export type TablesAndViews = {
  user_metrics: FilterLeafUserMetrics;
  user_api_keys: FilterLeafUserApiKeys;
  response: FilterLeafResponse;
  request: FilterLeafRequest;
  properties_table: FilterLeafPropertiesTable;
  properties: {
    [key: string]: SingleKey<TextOperators>;
  };
  values: {
    [key: string]: SingleKey<TextOperators>;
  };

  // CLICKHOUSE TABLES
  response_copy_v1: FilterLeafResponseCopyV1;
  response_copy_v2: FilterLeafResponseCopyV2;
  users_view: FilterLeafUserView;
  properties_copy_v1: FilterLeafPropertiesTable;
  properties_copy_v2: FilterLeafPropertiesCopyV2;
};

export type FilterLeaf = SingleKey<TablesAndViews>;

export interface FilterBranch {
  left: FilterNode;
  operator: "or" | "and"; // Can add more later
  right: FilterNode;
}

export type FilterNode = FilterLeaf | FilterBranch | "all";

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
