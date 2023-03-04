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
      operations: {
        gte: {
          type: "timestamp",
        },
        lte: {
          type: "timestamp",
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
    body_model: {
      label: "Model",
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
  [key in keyof FilterLeaf]: TableFilter<any>;
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
