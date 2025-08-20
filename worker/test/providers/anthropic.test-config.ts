import { registry } from "@helicone-package/cost/models/registry";
import { UserEndpointConfig } from "@helicone-package/cost/models/types";

export interface TestCase {
  name: string;
  description?: string;
  request: {
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
    stream?: boolean;
  };
  skipForNow?: boolean;
}

export interface BYOKUserConfig {
  name: string;
  description: string;
  config: UserEndpointConfig;
}

export interface ProviderTestConfig {
  provider: string;
  baseUrl: string;
  testCases: TestCase[];
  byokUserConfigs: BYOKUserConfig[];
  generateMockResponse: (modelId: string) => any;
  generateErrorResponse: (type: "auth" | "rate_limit" | "invalid_model") => {
    status: number;
    body: any;
  };
}

export const anthropicTestConfig: ProviderTestConfig = {
  provider: "anthropic",
  baseUrl: "https://api.anthropic.com",

  byokUserConfigs: [
    {
      name: "default",
      description: "Default Anthropic API configuration",
      config: {},
    },
  ],

  testCases: [
    {
      name: "basic_chat_request",
      description: "Basic chat completion request",
      request: {
        messages: [{ role: "user", content: "Hello, this is a test" }],
        max_tokens: 100,
      },
    },
  ],

  generateMockResponse: (modelId: string) => {
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
  },

  generateErrorResponse: (type: "auth" | "rate_limit" | "invalid_model") => {
    const responses = {
      auth: {
        status: 401,
        body: {
          error: {
            type: "authentication_error",
            message: "Invalid API key provided",
          },
        },
      },
      rate_limit: {
        status: 429,
        body: {
          error: {
            type: "rate_limit_error",
            message: "Rate limit exceeded",
          },
        },
      },
      invalid_model: {
        status: 400,
        body: {
          error: {
            type: "invalid_request_error",
            message: "Model not found",
          },
        },
      },
    };

    return responses[type];
  },
};
