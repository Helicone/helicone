import { ColumnComparators, Comparator } from "./frontendFilterDefs";

export function getPropertyFilters(
  properties: string[],
  inputParams?: string[]
) {
  const filters: ColumnComparators<any> = {};
  properties.forEach((p) => {
    filters[p] = {
      label: p,
      type: "text-with-suggestions",
      operations: {
        equals: {
          inputParams,
          type: "text-with-suggestions",
        },
      },
    };
  });
  return filters;
}

export interface FilterLeafUserMetrics {
  user_id?: {
    equals?: string;
  };
  last_active?: {
    gte?: string;
    lte?: string;
  };
  total_requests?: {
    gte?: number;
    lte?: number;
  };
}
export interface FilterLeafRequest {
  prompt?: {
    equals?: string;
    like: string;
    ilike?: string;
  };
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

export interface FilterLeafUserApiKeys {
  api_key_hash?: {
    equals?: string;
  };
}
export interface FilterLeafResponse {
  body_tokens?: {
    gte?: number;
    lte?: number;
  };
  body_model?: {
    equals?: string;
  };
}

export interface FilterLeaf {
  user_metrics?: FilterLeafUserMetrics;
  user_api_keys?: FilterLeafUserApiKeys;
  response?: FilterLeafResponse;
  request?: FilterLeafRequest;
  properties?: {
    [key: string]: {
      equals?: string;
    };
  };
}
export interface FilterBranch {
  left: FilterNode;
  operator: "or" | "and"; // Can add more later
  right: FilterNode;
}

export type FilterNode = FilterLeaf | FilterBranch | "all";
