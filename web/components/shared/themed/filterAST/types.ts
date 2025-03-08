import {
  FilterExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
} from "../../../../services/lib/filters/filterAst";

export type ColumnType = string;

export interface FilterASTEditorProps {
  filter?: FilterExpression;
  onChange?: (filter: FilterExpression) => void;
  className?: string;
}

export interface FilterNodeProps {
  node: FilterExpression;
  path: number[];
  index: number;
  isRoot?: boolean;
  onUpdate: (path: number[], updatedNode: FilterExpression) => void;
  onAddCondition: (path: number[]) => void;
  onTransformToGroup: (path: number[], type: "and" | "or") => void;
  onDeleteNode: (path: number[]) => void;
  onChangeGroupType: (path: number[], newType: "and" | "or") => void;
  onMoveItem: (
    dragIndex: number,
    hoverIndex: number,
    dragPath: number[],
    hoverPath: number[]
  ) => void;
}

export interface ConditionNodeProps {
  node: ConditionExpression;
  path: number[];
  isRoot?: boolean;
  showTransformButton?: boolean;
  onUpdate: (field: keyof ConditionExpression, value: any) => void;
  onTransform: () => void;
  onDelete: () => void;
}

export interface GroupNodeProps {
  node: AndExpression | OrExpression;
  path: number[];
  isRoot?: boolean;
  isDirectChildOfRoot: boolean;
  onChangeType: (newType: "and" | "or") => void;
  onAddCondition: () => void;
  onAddGroup: (type: "and" | "or") => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export const OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater than or equals" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less than or equals" },
  { value: "like", label: "contains" },
  { value: "ilike", label: "contains (case insensitive)" },
  { value: "is", label: "is" },
  { value: "in", label: "in" },
];

// Available columns for filtering with appropriate types
export const COLUMNS: {
  label: string;
  value: ColumnType;
  type: string;
  hasSubtypes?: boolean;
}[] = [
  { label: "Response ID", value: "response_id", type: "string" },
  {
    label: "Response Created At",
    value: "response_created_at",
    type: "datetime",
  },
  { label: "Latency", value: "latency", type: "number" },
  { label: "Status", value: "status", type: "number" },
  { label: "Completion Tokens", value: "completion_tokens", type: "number" },
  { label: "Prompt Tokens", value: "prompt_tokens", type: "number" },
  { label: "Model", value: "model", type: "string" },
  { label: "Provider", value: "provider", type: "string" },
  { label: "Request ID", value: "request_id", type: "string" },
  {
    label: "Request Created At",
    value: "request_created_at",
    type: "datetime",
  },
  { label: "User ID", value: "user_id", type: "string" },
  {
    label: "Time to First Token",
    value: "time_to_first_token",
    type: "number",
  },
  {
    label: "Properties",
    value: "properties",
    type: "object",
    hasSubtypes: true,
  },
  { label: "Scores", value: "scores", type: "object", hasSubtypes: true },
];

// Fallback common property keys for suggestions when API data is not available
export const COMMON_PROPERTIES = [
  "user_id",
  "session_id",
  "request_path",
  "client_ip",
  "user_agent",
  "referrer",
];

// Fallback common score keys for suggestions when API data is not available
export const COMMON_SCORES = [
  "toxicity",
  "sentiment",
  "relevance",
  "helpfulness",
];
