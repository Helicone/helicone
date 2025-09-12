import { BaseTestConfig } from "./base.test-config";

class GroqTestConfig extends BaseTestConfig {
  constructor() {
    super("groq");
  }
}

// Export the test config instance
export const groqTestConfig = new GroqTestConfig();
