import {
  FilterLeaf,
  FilterLeafRequest,
  FilterLeafResponse,
  FilterLeafUserMetrics,
} from "./filterDefs";

export type ColumnType = "text" | "timestamp" | "number";
interface Operator {
  type: ColumnType;
}

interface Comparator {
  type: ColumnType;
  label: string;
  operations: {
    equals?: Operator;
    gte?: Operator;
    lte?: Operator;
  };
}
export type TableFilter<T> = {
  label: string;
  columns: {
    [key in keyof T]: Comparator;
  };
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
