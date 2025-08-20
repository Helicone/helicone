import { registry } from "@helicone-package/cost/models/registry";
import { UserEndpointConfig } from "@helicone-package/cost/models/types";

export interface TestCase {
  name: string;
  provider: string;
  modelId: string;
  request: {
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  };
  byokConfig?: UserEndpointConfig;
}

function generateMockResponse(modelId: string) {
  const config = registry.getModelProviderConfig(modelId, "anthropic");
  const providerModelId = config.data?.providerModelId || modelId;

  return {
    id: `chatcmpl-test-${modelId}`,
    object: "chat.completion",
    created: Date.now(),
    model: providerModelId,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: `Test response for ${modelId}`,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    },
  };
}

// PTB test cases for Anthropic provider
// Note: PTB endpoints are not currently used by the gateway (see aiGateway.ts line 320)
// These tests are prepared for when PTB is enabled
export const anthropicPtbTestCases: TestCase[] = (() => {
  const cases: TestCase[] = [];
  const provider = "anthropic";
  const models = registry.getProviderModels(provider).data || [];

  // For now, just test one model since PTB isn't active
  // When PTB is enabled, we can expand this to test each endpoint individually
  const testModel = "claude-3.5-sonnet-v2";
  if (models instanceof Set && models.has(testModel)) {
    cases.push({
      name: `${provider} - ${testModel} - PTB (placeholder)`,
      provider,
      modelId: testModel,
      request: {
        messages: [{ role: "user", content: "Hello, this is a test" }],
        max_tokens: 100,
      },
    });
  }

  return cases;
})();

// BYOK test cases for Anthropic provider - simple for now
export const anthropicByokTestCases: TestCase[] = [
  {
    name: "anthropic - claude-3-5-sonnet - BYOK",
    provider: "anthropic",
    modelId: "claude-3-5-sonnet",
    request: {
      messages: [{ role: "user", content: "Hello, this is a test" }],
      max_tokens: 100,
    },
    byokConfig: {},
  },
];

// Export the mock response generator for use in tests
export { generateMockResponse };
