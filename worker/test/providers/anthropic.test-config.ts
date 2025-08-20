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

// PTB test cases for Anthropic provider - dynamically generated for ALL models
export const anthropicPtbTestCases: TestCase[] = (() => {
  const cases: TestCase[] = [];
  const provider = "anthropic";
  const models = registry.getProviderModels(provider).data || [];

  models.forEach((modelId) => {
    cases.push({
      name: `${provider} - ${modelId} - PTB`,
      provider,
      modelId,
      request: {
        messages: [{ role: "user", content: "Hello, this is a test" }],
        max_tokens: 100,
      },
    });
  });

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
