/**
 * Test constants and configuration
 */

// Service URLs
export const AI_GATEWAY_URL =
  process.env.AI_GATEWAY_URL || "http://localhost:8793";
export const WORKER_API_URL =
  process.env.WORKER_API_URL || "http://localhost:8788";
export const JAWN_URL = process.env.JAWN_URL || "http://localhost:8585";
export const POSTGRES_URL =
  process.env.POSTGRES_URL ||
  "postgresql://postgres:postgres@localhost:54322/postgres";
export const CLICKHOUSE_URL =
  process.env.CLICKHOUSE_URL || "http://localhost:18123";

// Gateway endpoints
export const GATEWAY_ENDPOINTS = {
  CHAT_COMPLETIONS: "/v1/chat/completions",
  HEALTHCHECK: "/healthcheck",
} as const;

// Jawn endpoints
export const JAWN_ENDPOINTS = {
  HEALTHCHECK: "/healthcheck",
} as const;

export const TEST_ORG_ID = "83635a30-5ba6-41a8-8cc6-fb7df941b24a";

export const TEST_ORG_API_KEY = "sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa";

export const TEST_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${TEST_ORG_API_KEY}`,
  "__helicone-mock-response": "true",
} as const;

export const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const TEST_MESSAGES = {
  SIMPLE: [
    {
      role: "user" as const,
      content: "Say hello",
    },
  ],
} as const;
