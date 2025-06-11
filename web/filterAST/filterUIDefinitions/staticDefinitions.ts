import { FilterUIDefinition } from "./types";
import { RequestResponseRMTDerivedTable } from "../filterAst";

export const STATIC_USER_VIEW_DEFINITIONS: FilterUIDefinition[] = [
  {
    id: "user_user_id",
    label: "User ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_active_for",
    label: "Active For (days)",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_first_active",
    label: "First Active",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_last_active",
    label: "Last Active",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_total_requests",
    label: "Total Requests",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_average_requests_per_day_active",
    label: "Avg Requests per Day",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_average_tokens_per_request",
    label: "Avg Tokens per Request",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_total_completion_tokens",
    label: "Total Completion Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_total_prompt_token",
    label: "Total Prompt Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
  {
    id: "user_total_cost",
    label: "Total Cost",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "user_metrics",
    subType: "user",
  },
];

export const STATIC_SESSIONS_VIEW_DEFINITIONS: FilterUIDefinition[] = [
  {
    id: "session_created_at",
    label: "Created At",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "sessions",
    subType: "sessions",
  },
  {
    id: "session_latest_request_created_at",
    label: "Latest Request Created At",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "sessions",
    subType: "sessions",
  },
  {
    id: "session_total_tokens",
    label: "Total Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "sessions",
    subType: "sessions",
  },
  {
    id: "session_total_requests",
    label: "Total Requests",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "sessions",
    subType: "sessions",
  },
  {
    id: "session_completion_tokens",
    label: "Total Completion Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "sessions",
    subType: "sessions",
  },
  {
    id: "session_prompt_tokens",
    label: "Total Prompt Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "sessions",
    subType: "sessions",
  },
  {
    id: "session_total_cost",
    label: "Total Cost",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "sessions",
    subType: "sessions",
  },
  {
    id: "session_tag",
    label: "Tags",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "sessions",
    subType: "sessions",
  },
];

// Static definitions that don't need to be fetched
export const STATIC_FILTER_DEFINITIONS: FilterUIDefinition[] = [
  // String fields
  {
    id: "response_id",
    label: "Response ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "request_response_rmt",
  },

  {
    id: "request_id",
    label: "Request ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "request_response_rmt",
  },
  {
    id: "user_id",
    label: "User ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "request_response_rmt",
  },
  {
    id: "organization_id",
    label: "Organization ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "request_response_rmt",
  },
  {
    id: "target_url",
    label: "Target URL",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "request_response_rmt",
  },
  {
    id: "request_body",
    label: "Request Body",
    type: "string",
    operators: ["contains", "like", "ilike"],
    table: "request_response_rmt",
  },
  {
    id: "response_body",
    label: "Response Body",
    type: "string",
    operators: ["contains", "like", "ilike"],
    table: "request_response_rmt",
  },

  // Number fields
  {
    id: "status",
    label: "Status Code",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    valueOptions: [
      { label: "Success (200)", value: 200 },
      { label: "Created (201)", value: 201 },
      { label: "Bad Request (400)", value: 400 },
      { label: "Unauthorized (401)", value: 401 },
      { label: "Not Found (404)", value: 404 },
      { label: "Server Error (500)", value: 500 },
    ],
    table: "request_response_rmt",
  },
  {
    id: "latency",
    label: "Latency (ms)",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },
  {
    id: "completion_tokens",
    label: "Completion Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },
  {
    id: "prompt_tokens",
    label: "Prompt Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },
  {
    id: "prompt_cache_write_tokens",
    label: "Prompt Cache Write Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },
  {
    id: "prompt_cache_read_tokens",
    label: "Prompt Cache Read Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },
  {
    id: "time_to_first_token",
    label: "Time to First Token (ms)",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },

  // Boolean fields
  {
    id: "threat",
    label: "Threat",
    type: "boolean",
    operators: ["is"],
    valueOptions: [
      { label: "Yes", value: true },
      { label: "No", value: false },
    ],
    table: "request_response_rmt",
  },
  {
    id: "cache_enabled",
    label: "Cache Enabled",
    type: "boolean",
    operators: ["is"],
    valueOptions: [
      { label: "Yes", value: true },
      { label: "No", value: false },
    ],
    table: "request_response_rmt",
  },

  // Datetime fields
  {
    id: "response_created_at",
    label: "Response Created At",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },
  {
    id: "request_created_at",
    label: "Request Created At",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },
  {
    id: "updated_at",
    label: "Updated At",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
    table: "request_response_rmt",
  },
  {
    id: "assets",
    label: "Assets",
    type: "string",
    operators: ["contains", "in"],
    table: "request_response_rmt",
  },
];

export const STATIC_SESSION_RMT_DEFINITIONS: FilterUIDefinition[] = [
  {
    id: "session_id",
    label: "Session ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "session_rmt",
  },
  {
    id: "session_name", 
    label: "Session Name",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
    table: "session_rmt",
  },
];

// Given a table variation of request_response_rmt, return filter definitions of the view of the variation
// example: session_rmt is aggregated to session_metrics, so provide a filter defn for that view
export const rmtDerivedTableViewMappings: Record<RequestResponseRMTDerivedTable, FilterUIDefinition[]> = {
  request_response_rmt: [],
  session_rmt: STATIC_SESSIONS_VIEW_DEFINITIONS,
  // user_rmt: STATIC_USER_VIEW_DEFINITIONS,
};


// Given a table variation of request_response_rmt, return the base static filter definitions
export const getRMTBasedFilterDefinitions = (table: RequestResponseRMTDerivedTable): FilterUIDefinition[] => {
  return [
    ...STATIC_FILTER_DEFINITIONS.map((def) => ({
      ...def,
      table,
    })),
    ...(() => {
      switch (table) {
        case "session_rmt":
          return STATIC_SESSION_RMT_DEFINITIONS;
        default:
          return []; // to add more later, e.g /users
      }
    })(),
  ];
};