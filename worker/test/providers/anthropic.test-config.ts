import { BaseTestConfig } from "./base.test-config";

class AnthropicTestConfig extends BaseTestConfig {
  constructor() {
    super("anthropic");
  }

  // Anthropic doesn't need special BYOK config
  // Uses default implementation from base class
}

// Export the test config instance
export const anthropicTestConfig = new AnthropicTestConfig();
