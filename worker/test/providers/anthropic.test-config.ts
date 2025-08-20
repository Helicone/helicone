import { registry } from "@helicone-package/cost/models/registry";

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

export interface ProviderTestConfig {
  provider: string;
  baseUrl: string;
  testCases: TestCase[];
  generateMockResponse: (modelId: string, testCase: TestCase) => any;
  generateErrorResponse: (type: "auth" | "rate_limit" | "invalid_model") => {
    status: number;
    body: any;
  };
}

export const anthropicTestConfig: ProviderTestConfig = {
  provider: "anthropic",
  baseUrl: "https://api.anthropic.com",
  
  testCases: [
    {
      name: "basic_chat_request",
      description: "Basic chat completion request",
      request: {
        messages: [
          { role: "user", content: "Hello, this is a test" }
        ],
        max_tokens: 100
      }
    },
    {
      name: "chat_with_system",
      description: "Chat with system message",
      request: {
        messages: [
          { role: "system", content: "You are a helpful assistant" },
          { role: "user", content: "Hello" }
        ],
        max_tokens: 100
      }
    },
    {
      name: "streaming_request",
      description: "Streaming chat request",
      request: {
        messages: [
          { role: "user", content: "Tell me a story" }
        ],
        max_tokens: 100,
        stream: true
      },
      skipForNow: true // Streaming is complex to test
    }
  ],
  
  generateMockResponse: (modelId: string, testCase: TestCase) => {
    // Get the actual provider model ID from registry
    const config = registry.getModelProviderConfig(modelId, "anthropic");
    const providerModelId = config.data?.providerModelId || modelId;
    
    // Generate response based on registry data
    return {
      id: `chatcmpl-test-${modelId}`,
      object: "chat.completion",
      created: Date.now(),
      model: providerModelId, // Use actual provider model ID from registry
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: `Test response for ${modelId} using ${providerModelId}`
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: testCase.request.messages.length * 5, // Rough estimate
        completion_tokens: 5,
        total_tokens: testCase.request.messages.length * 5 + 5
      }
    };
  },
  
  generateErrorResponse: (type: "auth" | "rate_limit" | "invalid_model") => {
    const responses = {
      auth: {
        status: 401,
        body: {
          error: {
            type: "authentication_error",
            message: "Invalid API key provided"
          }
        }
      },
      rate_limit: {
        status: 429,
        body: {
          error: {
            type: "rate_limit_error",
            message: "Rate limit exceeded"
          }
        }
      },
      invalid_model: {
        status: 400,
        body: {
          error: {
            type: "invalid_request_error",
            message: "Model not found"
          }
        }
      }
    };
    
    return responses[type];
  }
};