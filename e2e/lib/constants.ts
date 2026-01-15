/**
 * Test constants and configuration
 */

// Service URLs
export const AI_GATEWAY_URL =
  process.env.AI_GATEWAY_URL || "http://localhost:8793";
// OpenAI proxy URL - uses BYOK flow (no wallet/credits needed)
export const OPENAI_PROXY_URL =
  process.env.OPENAI_PROXY_URL || "http://localhost:8787";
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

// Test credentials from supabase/seed.sql (local development only)
// See seed.sql line 13 for org ID and line 22 for API key
export const TEST_ORG_ID = "83635a30-5ba6-41a8-8cc6-fb7df941b24a";

export const TEST_ORG_API_KEY = "sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa";

// Mock OpenAI response for testing
export const MOCK_OPENAI_RESPONSE = {
  id: "chatcmpl-1234567890",
  object: "chat.completion",
  created: 1759861728,
  model: "gpt-5-2025-08-07",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content:
          "This is a mock response from the OpenAI API for testing purposes. - Helicone ooga booga",
        refusal: null,
        annotations: [],
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 1870,
    total_tokens: 1880,
    completion_tokens_details: {
      reasoning_tokens: 1792,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0,
    },
  },
  service_tier: "default",
  system_fingerprint: null,
};

export const TEST_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${TEST_ORG_API_KEY}`,
  "__helicone-mock-response": JSON.stringify(MOCK_OPENAI_RESPONSE),
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
