import {
  BooleanOperators,
  NumberOperators,
  TablesAndViews,
  TextOperators,
  TimestampOperators,
} from "./filterDefs";

export type ColumnType =
  | "text"
  | "timestamp"
  | "number"
  | "text-with-suggestions"
  | "bool";

export type InputParam = {
  key: string;
  param: string;
};
interface Operator<T> {
  value: T;
  label: string;
  type: ColumnType;
  inputParams?: InputParam[];
}
const textOperators: Operator<keyof TextOperators>[] = [
  {
    value: "equals",
    label: "equals",
    type: "text",
  },
  {
    value: "not-equals",
    label: "not equals",
    type: "text",
  },
  {
    value: "contains",
    label: "contains",
    type: "text",
  },
  {
    value: "not-contains",
    label: "not contains",
    type: "text",
  },
  {
    value: "ilike",
    label: "ilike",
    type: "text",
  },
  {
    value: "like",
    label: "like",
    type: "text",
  },
];

const numberOperators: Operator<keyof NumberOperators>[] = [
  {
    value: "equals",
    label: "equals",
    type: "number",
  },
  {
    value: "not-equals",
    label: "not equals",
    type: "text",
  },
  {
    value: "gte",
    label: "greater than or equal to",
    type: "number",
  },
  {
    value: "lte",
    label: "less than or equal to",
    type: "number",
  },
];

const booleanOperators: Operator<keyof BooleanOperators>[] = [
  {
    value: "equals",
    label: "equals",
    type: "bool",
  },
];

const timestampOperators: Operator<keyof TimestampOperators>[] = [
  {
    value: "gte",
    label: "greater than or equal to",
    type: "timestamp",
  },
  {
    value: "lte",
    label: "less than or equal to",
    type: "timestamp",
  },
];

type KeyOfUnion<T> = T extends T ? keyof T : never;
export type SingleFilterDef<T extends keyof TablesAndViews> = {
  label: string;
  operators: Operator<string>[];
  table: T;
  column: KeyOfUnion<TablesAndViews[T]>;
  category: string;
};

export const DASHBOARD_PAGE_TABLE_FILTERS: [
  SingleFilterDef<"request_response_log">,
  SingleFilterDef<"request_response_log">,
  SingleFilterDef<"request_response_log">,
  SingleFilterDef<"request_response_log">
] = [
  {
    label: "Model",
    operators: textOperators,
    category: "request",
    table: "request_response_log",
    column: "model",
  },
  {
    label: "Status",
    operators: numberOperators,
    category: "request",
    table: "request_response_log",
    column: "status",
  },
  {
    label: "Latency",
    operators: numberOperators,
    category: "request",
    table: "request_response_log",
    column: "latency",
  },
  {
    label: "User",
    operators: textOperators,
    category: "request",
    table: "request_response_log",
    column: "user_id",
  },
];
export const REQUEST_TABLE_FILTERS: [
  SingleFilterDef<"request">,
  SingleFilterDef<"response">,
  SingleFilterDef<"response">,
  SingleFilterDef<"request">,
  SingleFilterDef<"response">,
  SingleFilterDef<"response">,
  SingleFilterDef<"request">,
  SingleFilterDef<"feedback">
] = [
  {
    label: "Request",
    operators: textOperators,
    table: "request",
    column: "prompt",
    category: "request",
  },
  {
    label: "Response",
    operators: textOperators,
    table: "response",
    column: "body_completion",
    category: "request",
  },
  {
    label: "Total Tokens",
    operators: numberOperators,
    table: "response",
    column: "body_tokens",
    category: "request",
  },
  {
    label: "User",
    operators: textOperators,
    table: "request",
    column: "user_id",
    category: "request",
  },
  {
    label: "Model",
    operators: textOperators,
    table: "response",
    column: "body_model",
    category: "request",
  },
  {
    label: "Status",
    operators: numberOperators,
    category: "response",
    table: "response",
    column: "status",
  },
  {
    label: "Path",
    operators: textOperators,
    table: "request",
    column: "path",
    category: "request",
  },
  {
    label: "Feedback",
    operators: booleanOperators,
    table: "feedback",
    column: "rating",
    category: "feedback",
  },
];

export const userTableFilters: [
  SingleFilterDef<"users_view">,
  SingleFilterDef<"users_view">,
  SingleFilterDef<"users_view">,
  SingleFilterDef<"users_view">,
  SingleFilterDef<"users_view">,
  SingleFilterDef<"response_copy_v1">,
  SingleFilterDef<"response_copy_v1">
] = [
  {
    label: "ID",
    operators: textOperators,
    table: "users_view",
    column: "user_id",
    category: "user",
  },
  {
    label: "Active For",
    operators: numberOperators,
    table: "users_view",
    column: "active_for",
    category: "user",
  },
  {
    label: "Last Active",
    operators: timestampOperators,
    table: "users_view",
    column: "last_active",
    category: "user",
  },
  {
    label: "Request Count",
    operators: numberOperators,
    table: "users_view",
    column: "total_requests",
    category: "user",
  },
  {
    label: "Cost",
    operators: numberOperators,
    table: "users_view",
    column: "cost",
    category: "user",
  },
  {
    label: "Created At",
    operators: timestampOperators,
    table: "response_copy_v1",
    column: "request_created_at",
    category: "request",
  },
  {
    label: "Status",
    operators: numberOperators,
    table: "response_copy_v1",
    column: "status",
    category: "request",
  },
];

function textWithSuggestions(inputParams: InputParam[]): Operator<string>[] {
  return textOperators.map((o) => ({
    ...o,
    type: "text-with-suggestions",
    inputParams,
  }));
}

export function getPropertyFilters(
  properties: string[],
  inputParams: InputParam[]
): SingleFilterDef<"properties">[] {
  return properties.map((p) => ({
    label: p,
    operators: textWithSuggestions(inputParams),
    table: "properties",
    column: p,
    category: "properties",
  }));
}

export function getValueFilters(
  properties: string[],
  inputParams: InputParam[]
): SingleFilterDef<"values">[] {
  return properties.map((p) => ({
    label: p,
    operators: textWithSuggestions(inputParams),
    table: "values",
    column: p,
    category: "prompt variables",
  }));
}
