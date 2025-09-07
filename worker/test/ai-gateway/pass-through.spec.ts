import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";

describe("Pass-Through Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("Customer-Specific Tests", () => {
    describe("Anthropic SDK with NO_MAPPING", () => {
      it("should route to /v1/messages for Anthropic provider", () =>
        runGatewayTest({
          model: "claude-3-7-sonnet-20250219/anthropic",
          request: {
            messages: [{ role: "user", content: "Test" }],
            maxTokens: 100,
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                // With NO_MAPPING, Anthropic uses native /v1/messages endpoint
                url: "https://api.anthropic.com/v1/messages",
                response: "success",
                model: "claude-3-7-sonnet-20250219",
                data: {
                  id: "msg_test",
                  type: "message",
                  role: "assistant",
                  content: [{ type: "text", text: "Test response" }],
                  model: "claude-3-7-sonnet-20250219",
                  usage: { input_tokens: 10, output_tokens: 5 },
                },
                expects: {
                  headers: {
                    "x-api-key": "test-anthropic-api-key",
                  },
                  // Verify body contains the system field and messages in Anthropic format
                  bodyContains: ["messages", "max_tokens"],
                },
                customVerify: (call) => {
                  // Verify NO_MAPPING is being used
                  const bodyMapping =
                    call.requestWrapper?.heliconeHeaders?.gatewayConfig
                      ?.bodyMapping;
                  if (bodyMapping !== "NO_MAPPING") {
                    throw new Error(
                      `Expected NO_MAPPING but got ${bodyMapping}`
                    );
                  }
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Fallback with comma-separated models", () => {
      it("should try bedrock first, then fallback to anthropic", () =>
        runGatewayTest({
          model:
            "us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock,claude-3-7-sonnet-20250219/anthropic",
          request: {
            messages: [{ role: "user", content: "Test fallback" }],
            maxTokens: 50,
          },
          expected: {
            providers: [
              {
                // First attempt: Bedrock fails
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
                response: "failure",
                statusCode: 500,
                errorMessage: "Bedrock failed",
              },
              {
                // Second attempt: Anthropic succeeds (NO_MAPPING not specified here, so uses /v1/chat/completions)
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-3-7-sonnet-20250219",
                data: {
                  id: "msg_fallback",
                  type: "message",
                  role: "assistant",
                  content: [{ type: "text", text: "Fallback response" }],
                  model: "claude-3-7-sonnet-20250219",
                  usage: { input_tokens: 10, output_tokens: 5 },
                },
                expects: {
                  headers: {
                    // Without NO_MAPPING, Anthropic uses OpenAI compatibility mode with Authorization header
                    Authorization: /^Bearer /,
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Model with NO_MAPPING and fallback", () => {
      it("should handle Anthropic SDK format with fallback", () =>
        runGatewayTest({
          model:
            "claude-3-7-sonnet-20250219/anthropic, us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock",
          request: {
            messages: [
              { role: "user", content: "What is the capital of France?" },
            ],
            maxTokens: 100,
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                // First model (anthropic) succeeds with NO_MAPPING on /v1/messages
                url: "https://api.anthropic.com/v1/messages",
                response: "success",
                model: "claude-3-7-sonnet-20250219",
                data: {
                  id: "msg_anthropic_sdk",
                  type: "message",
                  role: "assistant",
                  content: [{ type: "text", text: "Anthropic SDK response" }],
                  model: "claude-3-7-sonnet-20250219",
                  usage: { input_tokens: 10, output_tokens: 5 },
                },
                expects: {
                  headers: {
                    "x-api-key": "test-anthropic-api-key",
                  },
                  bodyContains: ["messages", "max_tokens"],
                },
              },
            ],
            finalStatus: 200,
            responseContains: "Anthropic SDK response",
          },
        }));
    });

    describe("Google Vertex AI pass-through", () => {
      it("should route to Vertex AI endpoint for gemini models", () =>
        runGatewayTest({
          model: "gemini-1.5-pro/vertex",
          request: {
            messages: [{ role: "user", content: "Test Vertex AI" }],
            maxTokens: 100,
          },
          expected: {
            providers: [
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/passthrough/models/gemini-1.5-pro:streamRawPredict",
                response: "success",
                model: "gemini-1.5-pro",
                data: {
                  candidates: [
                    {
                      content: {
                        parts: [{ text: "Vertex AI response" }],
                        role: "model",
                      },
                      finishReason: "STOP",
                    },
                  ],
                  usageMetadata: {
                    promptTokenCount: 10,
                    candidatesTokenCount: 5,
                    totalTokenCount: 15,
                  },
                },
                expects: {
                  headers: {
                    Authorization: /^Bearer /,
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Azure OpenAI pass-through", () => {
      it("should route to Azure OpenAI endpoint", () =>
        runGatewayTest({
          model: "gpt-4-turbo/azure",
          request: {
            messages: [{ role: "user", content: "Test Azure" }],
            maxTokens: 100,
          },
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4-turbo",
                data: {
                  id: "chatcmpl-azure",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "gpt-4-turbo",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Azure OpenAI response",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 10,
                    completion_tokens: 5,
                    total_tokens: 15,
                  },
                },
                expects: {
                  headers: {
                    "api-key": "test-azure-api-key",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Groq pass-through", () => {
      it("should route to Groq endpoint for llama models", () =>
        runGatewayTest({
          model: "llama-3.3-70b-versatile/groq",
          request: {
            messages: [{ role: "user", content: "Test Groq" }],
            maxTokens: 100,
          },
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "llama-3.3-70b-versatile",
                data: {
                  id: "chatcmpl-groq",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "llama-3.3-70b-versatile",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Groq response",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 10,
                    completion_tokens: 5,
                    total_tokens: 15,
                  },
                },
                expects: {
                  headers: {
                    Authorization: /^Bearer /,
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("AWS Bedrock with different regions", () => {
      it("should route to Bedrock endpoint with eu prefix", () =>
        runGatewayTest({
          model: "eu.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock",
          request: {
            messages: [{ role: "user", content: "Test EU Bedrock" }],
            maxTokens: 100,
          },
          expected: {
            providers: [
              {
                // Note: EU prefix in model doesn't change the region, still uses us-east-1
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/eu.anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
                response: "success",
                model: "eu.anthropic.claude-3-7-sonnet-20250219-v1:0",
                data: {
                  id: "msg_bedrock_eu",
                  type: "message",
                  role: "assistant",
                  content: [{ type: "text", text: "EU Bedrock response" }],
                  model: "claude-3-7-sonnet-20250219",
                  usage: { input_tokens: 10, output_tokens: 5 },
                },
                expects: {
                  headers: {
                    Authorization: /^AWS4-HMAC-SHA256/,
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should route to Bedrock endpoint with ap-southeast prefix", () =>
        runGatewayTest({
          model:
            "ap-southeast-2.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock",
          request: {
            messages: [{ role: "user", content: "Test APAC Bedrock" }],
            maxTokens: 100,
          },
          expected: {
            providers: [
              {
                // Note: AP prefix in model doesn't change the region, still uses us-east-1
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/ap-southeast-2.anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
                response: "success",
                model:
                  "ap-southeast-2.anthropic.claude-3-7-sonnet-20250219-v1:0",
                data: {
                  id: "msg_bedrock_apac",
                  type: "message",
                  role: "assistant",
                  content: [{ type: "text", text: "APAC Bedrock response" }],
                  model: "claude-3-7-sonnet-20250219",
                  usage: { input_tokens: 10, output_tokens: 5 },
                },
                expects: {
                  headers: {
                    Authorization: /^AWS4-HMAC-SHA256/,
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Mixed provider fallback scenarios", () => {
      it("should fallback from Groq to OpenAI to Anthropic", () =>
        runGatewayTest({
          model:
            "llama-3.3-70b-versatile/groq,gpt-4-turbo/openai,claude-3-7-sonnet-20250219/anthropic",
          request: {
            messages: [{ role: "user", content: "Test triple fallback" }],
            maxTokens: 100,
          },
          expected: {
            providers: [
              {
                // First attempt: Groq fails
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Groq service unavailable",
              },
              {
                // Second attempt: OpenAI fails
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                // Third attempt: Anthropic succeeds
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-3-7-sonnet-20250219",
                data: {
                  id: "msg_fallback_success",
                  type: "message",
                  role: "assistant",
                  content: [{ type: "text", text: "Fallback successful" }],
                  model: "claude-3-7-sonnet-20250219",
                  usage: { input_tokens: 10, output_tokens: 5 },
                },
                expects: {
                  headers: {
                    // Without NO_MAPPING, Anthropic uses OpenAI compatibility mode with Authorization header
                    Authorization: /^Bearer /,
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle NO_MAPPING with provider fallback", () =>
        runGatewayTest({
          model: "gpt-4-turbo/openai,claude-3-7-sonnet-20250219/anthropic",
          request: {
            messages: [{ role: "user", content: "Test NO_MAPPING fallback" }],
            maxTokens: 100,
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                // First attempt: OpenAI fails (NO_MAPPING doesn't affect OpenAI)
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "OpenAI error",
              },
              {
                // Second attempt: Anthropic succeeds with NO_MAPPING
                url: "https://api.anthropic.com/v1/messages",
                response: "success",
                model: "claude-3-7-sonnet-20250219",
                data: {
                  id: "msg_no_mapping_fallback",
                  type: "message",
                  role: "assistant",
                  content: [
                    { type: "text", text: "NO_MAPPING fallback response" },
                  ],
                  model: "claude-3-7-sonnet-20250219",
                  usage: { input_tokens: 10, output_tokens: 5 },
                },
                expects: {
                  headers: {
                    "x-api-key": "test-anthropic-api-key",
                  },
                  bodyContains: ["messages", "max_tokens"],
                },
                customVerify: (call) => {
                  const bodyMapping =
                    call.requestWrapper?.heliconeHeaders?.gatewayConfig
                      ?.bodyMapping;
                  if (bodyMapping !== "NO_MAPPING") {
                    throw new Error(
                      `Expected NO_MAPPING but got ${bodyMapping}`
                    );
                  }
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });
});
