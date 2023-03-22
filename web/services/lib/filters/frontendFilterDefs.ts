import {
  FilterLeaf,
  FilterLeafRequest,
  FilterLeafResponse,
  FilterLeafUserMetrics,
} from "./filterDefs";

export type ColumnType =
  | "text"
  | "timestamp"
  | "number"
  | "text-with-suggestions";

interface Operator {
  type: ColumnType;
  inputParams?: string[];
}

export interface Comparator {
  type: ColumnType;
  label: string;
  operations: {
    equals?: Operator;
    gte?: Operator;
    lte?: Operator;
    like?: Operator;
    ilike?: Operator;
  };
  table: keyof FilterLeaf;
}

export type ColumnComparators<T> = {
  [key in keyof T]: Comparator;
};

export type TableFilter<T> = {
  label: string;
  columns: ColumnComparators<T>;
};
export const filterUserMetric: TableFilter<FilterLeafUserMetrics> = {
  label: "User Metrics",
  columns: {
    user_id: {
      table: "user_metrics",
      label: "User ID",
      type: "text",
      operations: {
        equals: {
          type: "text",
        },
      },
    },
    last_active: {
      label: "Last Active",
      table: "user_metrics",
      type: "timestamp",
      operations: {
        gte: {
          type: "timestamp",
        },
        lte: {
          type: "timestamp",
        },
      },
    },
    total_requests: {
      label: "Total Requests",
      table: "user_metrics",
      type: "number",
      operations: {
        gte: {
          type: "number",
        },
        lte: {
          type: "number",
        },
      },
    },
  },
};

export const filterRequestFilter: TableFilter<FilterLeafRequest> = {
  label: "Request",
  columns: {
    prompt: {
      label: "Prompt",
      table: "request",
      type: "text",
      operations: {
        equals: {
          type: "text",
        },
        like: {
          type: "text",
        },
        ilike: {
          type: "text",
        },
      },
    },
    created_at: {
      label: "Created At",
      type: "timestamp",
      table: "request",
      operations: {
        gte: {
          type: "timestamp",
        },
        lte: {
          type: "timestamp",
        },
      },
    },
    user_id: {
      label: "User ID",
      table: "request",
      type: "text",
      operations: {
        equals: {
          type: "text",
        },
      },
    },
  },
};

export const filterResponseFilter: TableFilter<FilterLeafResponse> = {
  label: "Response",
  columns: {
    body_tokens: {
      label: "Tokens",
      table: "response",
      type: "number",
      operations: {
        gte: {
          type: "number",
        },
        lte: {
          type: "number",
        },
      },
    },
    body_completion: {
      label: "Completion",
      table: "response",
      type: "text",
      operations: {
        equals: {
          type: "text",
        },
        ilike: {
          type: "text",
        },
        like: {
          type: "text",
        },
      },
    },
    body_model: {
      label: "Model",
      table: "response",
      type: "text",
      operations: {
        equals: {
          type: "text",
        },
      },
    },
  },
};

export type TableFilterMap = {
  [key: string]: TableFilter<any>;
};

export const UserMetricsTableFilter: TableFilterMap = {
  user_metrics: filterUserMetric,
  request: filterRequestFilter,
  response: filterResponseFilter,
};

export const RequestsTableFilter: TableFilterMap = {
  request: filterRequestFilter,
  response: filterResponseFilter,
};

export function getValueFilters(properties: string[], inputParams: string[]) {
  const filters: ColumnComparators<any> = {};
  properties.forEach((p) => {
    filters[p] = {
      table: "values",
      label: p,
      type: "text-with-suggestions",
      operations: {
        equals: {
          inputParams,
          type: "text-with-suggestions",
        },
        ilike: {
          type: "text",
        },
        like: {
          type: "text",
        },
      },
    };
  });
  return filters;
}
