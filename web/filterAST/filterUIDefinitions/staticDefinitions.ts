import { FilterUIDefinition } from "./types";

// Static definitions that don't need to be fetched
export const STATIC_FILTER_DEFINITIONS: FilterUIDefinition[] = [
  // String fields
  {
    id: "response_id",
    label: "Response ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
  },
  {
    id: "request_id",
    label: "Request ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
  },
  {
    id: "user_id",
    label: "User ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
  },
  {
    id: "organization_id",
    label: "Organization ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
  },
  {
    id: "proxy_key_id",
    label: "Proxy Key ID",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
  },
  {
    id: "target_url",
    label: "Target URL",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
  },
  {
    id: "request_body",
    label: "Request Body",
    type: "string",
    operators: ["like", "ilike", "contains"],
  },
  {
    id: "response_body",
    label: "Response Body",
    type: "string",
    operators: ["like", "ilike", "contains"],
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
  },
  {
    id: "latency",
    label: "Latency (ms)",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    id: "completion_tokens",
    label: "Completion Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    id: "prompt_tokens",
    label: "Prompt Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    id: "prompt_cache_write_tokens",
    label: "Prompt Cache Write Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    id: "prompt_cache_read_tokens",
    label: "Prompt Cache Read Tokens",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    id: "time_to_first_token",
    label: "Time to First Token (ms)",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
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
  },

  // Datetime fields
  {
    id: "response_created_at",
    label: "Response Created At",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    id: "request_created_at",
    label: "Request Created At",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    id: "updated_at",
    label: "Updated At",
    type: "datetime",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },

  // Special fields
  {
    id: "properties",
    label: "Properties",
    type: "string",
    operators: ["eq", "neq", "like", "ilike", "contains"],
  },
  {
    id: "scores",
    label: "Scores",
    type: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    id: "assets",
    label: "Assets",
    type: "string",
    operators: ["contains", "in"],
  },
];
