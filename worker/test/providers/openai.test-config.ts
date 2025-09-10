import { BaseTestConfig } from "./base.test-config";

class OpenaiTestConfig extends BaseTestConfig {
  constructor() {
    super("openai");
  }
}

// Export the test config instance
export const openaiTestConfig = new OpenaiTestConfig();
