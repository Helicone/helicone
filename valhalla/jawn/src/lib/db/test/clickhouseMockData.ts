import { RequestResponseRMT } from "../ClickhouseWrapper";

// ClickHouse error codes and types matching actual ClickHouse responses
export const CLICKHOUSE_ERRORS = {
  SYNTAX_ERROR: {
    code: "62",
    type: "SYNTAX_ERROR",
  },
  AUTHENTICATION_FAILED: {
    code: "516",
    type: "AUTHENTICATION_FAILED",
  },
  ACCESS_DENIED: {
    code: "497",
    type: "ACCESS_DENIED",
  },
  READONLY: {
    code: "164",
    type: "READONLY",
  },
  TIMEOUT: {
    code: "159",
    type: "TIMEOUT_EXCEEDED",
  },
  MEMORY_LIMIT: {
    code: "241",
    type: "MEMORY_LIMIT_EXCEEDED",
  },
  NOT_FOUND: {
    code: "60",
    type: "UNKNOWN_TABLE",
  },
  BAD_ARGUMENTS: {
    code: "36",
    type: "BAD_ARGUMENTS",
  },
};

// Mock data for request_response_rmt table
export const mockRequestResponseData: Partial<RequestResponseRMT>[] = [
  // Data for test organization
  {
    response_id: "resp-001",
    response_created_at: "2024-01-01 10:00:00",
    latency: 1500,
    status: 200,
    completion_tokens: 150,
    prompt_tokens: 50,
    model: "gpt-4",
    request_id: "req-001",
    request_created_at: "2024-01-01 09:59:58",
    user_id: "user-001",
    organization_id: "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0",
    provider: "openai",
    country_code: "US",
    properties: {},
    scores: {},
    cost: 0.005,
  },
  {
    response_id: "resp-002",
    response_created_at: "2024-01-01 10:01:00",
    latency: 1200,
    status: 200,
    completion_tokens: 100,
    prompt_tokens: 30,
    model: "gpt-3.5-turbo",
    request_id: "req-002",
    request_created_at: "2024-01-01 10:00:58",
    user_id: "user-001",
    organization_id: "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0",
    provider: "openai",
    country_code: "US",
    properties: {},
    scores: {},
    cost: 0.002,
  },
  {
    response_id: "resp-003",
    response_created_at: "2024-01-01 10:02:00",
    latency: 800,
    status: 200,
    completion_tokens: 80,
    prompt_tokens: 25,
    model: "claude-2",
    request_id: "req-003",
    request_created_at: "2024-01-01 10:01:59",
    user_id: "user-002",
    organization_id: "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0",
    provider: "anthropic",
    country_code: "US",
    properties: {},
    scores: {},
    cost: 0.003,
  },
  // Data for different organization (should be filtered out by RLS)
  {
    response_id: "resp-004",
    response_created_at: "2024-01-01 10:03:00",
    latency: 900,
    status: 200,
    completion_tokens: 120,
    prompt_tokens: 40,
    model: "gpt-4",
    request_id: "req-004",
    request_created_at: "2024-01-01 10:02:59",
    user_id: "user-003",
    organization_id: "99999999-9999-9999-9999-999999999999",
    provider: "openai",
    country_code: "UK",
    properties: {},
    scores: {},
    cost: 0.004,
  },
  {
    response_id: "resp-005",
    response_created_at: "2024-01-01 10:04:00",
    latency: 1100,
    status: 200,
    completion_tokens: 90,
    prompt_tokens: 35,
    model: "claude-3",
    request_id: "req-005",
    request_created_at: "2024-01-01 10:03:59",
    user_id: "user-004",
    organization_id: "99999999-9999-9999-9999-999999999999",
    provider: "anthropic",
    country_code: "UK",
    properties: {},
    scores: {},
    cost: 0.0035,
  },
  // More data for test organization with different statuses
  {
    response_id: "resp-006",
    response_created_at: "2024-01-01 10:05:00",
    latency: 500,
    status: 429,
    completion_tokens: 0,
    prompt_tokens: 20,
    model: "gpt-3.5-turbo",
    request_id: "req-006",
    request_created_at: "2024-01-01 10:04:59",
    user_id: "user-001",
    organization_id: "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0",
    provider: "openai",
    country_code: "US",
    properties: {},
    scores: {},
    cost: 0.001,
  },
  {
    response_id: "resp-007",
    response_created_at: "2024-01-01 10:06:00",
    latency: 2000,
    status: 500,
    completion_tokens: 0,
    prompt_tokens: 45,
    model: "gpt-4",
    request_id: "req-007",
    request_created_at: "2024-01-01 10:05:58",
    user_id: "user-002",
    organization_id: "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0",
    provider: "openai",
    country_code: "US",
    properties: {},
    scores: {},
    cost: 0.0015,
  },
];

// Mock system table data (should be blocked by security rules)
export const mockSystemTables = {
  "system.tables": [
    { name: "request_response_rmt", database: "default", engine: "ReplicatedMergeTree" },
    { name: "users", database: "default", engine: "Memory" },
  ],
  "system.columns": [
    { table: "request_response_rmt", name: "response_id", type: "String" },
    { table: "request_response_rmt", name: "organization_id", type: "String" },
  ],
  "system.users": [
    { name: "default", id: "1", storage: "local" },
    { name: "hql_user", id: "2", storage: "local" },
  ],
  "system.grants": [
    { user_name: "hql_user", access_type: "SELECT", database: "default" },
  ],
  "system.row_policies": [
    { name: "org_filter", database: "default", table: "request_response_rmt" },
  ],
};

// Expected error messages for various security violations
export const SECURITY_ERROR_MESSAGES = {
  SETTINGS_OVERRIDE: "SETTINGS clause is not allowed in queries",
  MULTI_STATEMENT: "Multi-statement queries are not allowed",
  DDL_OPERATION: "DDL operations are not allowed in readonly mode",
  DML_OPERATION: "Cannot execute write query in readonly mode",
  DANGEROUS_FUNCTION: "Access to table function is not allowed",
  SYSTEM_TABLE_ACCESS: "Access to system tables is denied",
  PERMISSION_ESCALATION: "Permission management operations are not allowed",
  RESOURCE_EXHAUSTION: "Query exceeded maximum execution time",
};