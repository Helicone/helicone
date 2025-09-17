import { BaseTestConfig } from "./base.test-config";

class AnthropicTestConfig extends BaseTestConfig {
  constructor() {
    super("anthropic");
  }

  // /v1/messages compatible mock response
  generateMockResponse(modelId: string) {
    return {
      id: `msg_test_${modelId}`,
      type: "message",
      role: "assistant",
      model: modelId,
      content: [
        {
          type: "text",
          text: `Test response for ${modelId}`,
        },
      ],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
    };
  }
}

// Export the test config instance
export const anthropicTestConfig = new AnthropicTestConfig();
