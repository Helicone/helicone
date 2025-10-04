/**
 * Shared constants for all test files
 */

// Valid Helicone API key format: sk-helicone-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}
export const TEST_API_KEY = "sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd";

// SHA256 hash of the TEST_API_KEY
// This hash should match what's expected in setup.ts for the mocked database
export const TEST_API_KEY_HASH =
  "4ff435549f7ff2c4a644185152e079d2bec8f533996b41f471de44b99f2e3254";

// Common test headers
export const TEST_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${TEST_API_KEY}`,
} as const;

// Test organization ID (must match setup.ts mock)
export const TEST_ORG_ID = "test-org-id";

// Test endpoints
export const TEST_ENDPOINTS = {
  AI_GATEWAY: "https://ai-gateway.helicone.ai",
  S3: "http://localhost:9000",
  LOGGING: "http://localhost:8585",
} as const;

// Common test data
export const TEST_USER_MESSAGE = "Test";
export const TEST_MAX_TOKENS = 100;

// Provider-specific endpoints
export const PROVIDER_ENDPOINTS = {
  ANTHROPIC: "https://api.anthropic.com",
  OPENAI: "https://api.openai.com",
  GOOGLE: "https://generativelanguage.googleapis.com",
  VERTEX: "https://us-central1-aiplatform.googleapis.com",
  BEDROCK: "https://bedrock-runtime.us-east-1.amazonaws.com",
} as const;
