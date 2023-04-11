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
};

export type FilterLeafRequest = SingleKey<RequestTableToOperators>;

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
export type TablesAndViews = {
  user_metrics: FilterLeafUserMetrics;
  user_api_keys: FilterLeafUserApiKeys;
  response: FilterLeafResponse;
  request: FilterLeafRequest;
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
