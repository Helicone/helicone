import {
  FilterLeaf,
  FilterLeafRequest,
  FilterLeafResponse,
  FilterLeafUserMetrics,
  NumberOperators,
  RequestTableToOperators,
  TablesAndViews,
  TextOperators,
  TimestampOperators,
} from "./filterDefs";

export type ColumnType =
  | "text"
  | "timestamp"
  | "number"
  | "text-with-suggestions";

interface Operator<T> {
  value: T;
  label: string;
  type: ColumnType;
  inputParams?: string[];
}
const textOperators: Operator<keyof TextOperators>[] = [
  {
    value: "equals",
    label: "=",
    type: "text",
  },
  {
    value: "ilike",
    label: "~~",
    type: "text",
  },
  {
    value: "like",
    label: "~",
    type: "text",
  },
];

const numberOperators: Operator<keyof NumberOperators>[] = [
  {
    value: "equals",
    label: "=",
    type: "number",
  },
  {
    value: "gte",
    label: ">=",
    type: "number",
  },
  {
    value: "lte",
    label: "<=",
    type: "number",
  },
];

const timestampOperators: Operator<keyof TimestampOperators>[] = [
  {
    value: "gte",
    label: ">=",
    type: "timestamp",
  },
  {
    value: "lte",
    label: "<=",
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

export const requestTableFilters: [
  SingleFilterDef<"request">,
  SingleFilterDef<"request">,
  SingleFilterDef<"response">,
  SingleFilterDef<"response">,
  SingleFilterDef<"request">,
  SingleFilterDef<"response">
] = [
  {
    label: "Created At",
    operators: timestampOperators,
    table: "request",
    column: "created_at",
    category: "request",
  },
  {
    label: "Prompt",
    operators: textOperators,
    table: "request",
    column: "prompt",
    category: "request",
  },
  {
    label: "Completion",
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
    label: "User ID",
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
];

export const userTableFilters: [
  SingleFilterDef<"request">,
  SingleFilterDef<"request">,
  SingleFilterDef<"response">,
  SingleFilterDef<"response">,
  SingleFilterDef<"request">,
  SingleFilterDef<"response">
] = [
  {
    label: "Created At",
    operators: timestampOperators,
    table: "request",
    column: "created_at",
    category: "request",
  },
  {
    label: "Prompt",
    operators: textOperators,
    table: "request",
    column: "prompt",
    category: "request",
  },
  {
    label: "Completion",
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
    label: "User ID",
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
];

function textWithSuggestions(inputParams: string[]): Operator<string>[] {
  return textOperators.map((o) => ({
    ...o,
    type: "text-with-suggestions",
    inputParams,
  }));
}

export function getPropertyFilters(
  properties: string[],
  inputParams: string[]
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
  inputParams: string[]
): SingleFilterDef<"values">[] {
  return properties.map((p) => ({
    label: p,
    operators: textWithSuggestions(inputParams),
    table: "values",
    column: p,
    category: "values",
  }));
}
