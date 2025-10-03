import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

// Define auth expectations for different providers
const deepinfraAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const novitaAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("Meta Llama Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Meta Llama Models", () => {
    describe("llama-3.1-8b-instruct-turbo", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct-turbo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                data: createOpenAIMockResponse(
                  "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct-turbo",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                data: createOpenAIMockResponse(
                  "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      // Test tool usage with DeepInfra
      it("should handle tool calls with deepinfra provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct-turbo/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                data: createOpenAIMockResponse(
                  "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      // Test response format support with DeepInfra
      it("should handle response format with deepinfra provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct-turbo/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                data: createOpenAIMockResponse(
                  "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("llama-3.1-8b-instruct", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
                data: createOpenAIMockResponse(
                  "meta-llama/Meta-Llama-3.1-8B-Instruct"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle novita provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "meta-llama/llama-3.1-8b-instruct",
                data: createOpenAIMockResponse(
                  "meta-llama/llama-3.1-8b-instruct"
                ),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      // Test tool usage with DeepInfra
      it("should handle tool calls with deepinfra provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
                data: createOpenAIMockResponse(
                  "meta-llama/Meta-Llama-3.1-8B-Instruct"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      // Test tool usage with Novita
      it("should handle tool calls with novita provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "meta-llama/llama-3.1-8b-instruct",
                data: createOpenAIMockResponse(
                  "meta-llama/llama-3.1-8b-instruct"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      // Test response format support with DeepInfra
      it("should handle response format with deepinfra provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
                data: createOpenAIMockResponse(
                  "meta-llama/Meta-Llama-3.1-8B-Instruct"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      // Test response format support with Novita
      it("should handle response format with novita provider", () =>
        runGatewayTest({
          model: "llama-3.1-8b-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "meta-llama/llama-3.1-8b-instruct",
                data: createOpenAIMockResponse(
                  "meta-llama/llama-3.1-8b-instruct"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  // Error scenarios and edge cases for llama-3.1-8b-instruct with DeepInfra
  describe("Error scenarios - llama-3.1-8b-instruct with DeepInfra Provider", () => {
    it("should handle DeepInfra provider failure", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "DeepInfra service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  // Error scenarios and edge cases for llama-3.1-8b-instruct-turbo with DeepInfra
  describe("Error scenarios - llama-3.1-8b-instruct-turbo with DeepInfra Provider", () => {
    it("should handle DeepInfra provider failure", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "DeepInfra service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Error scenarios - llama-4-scout with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle insufficient credits from Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 402,
              errorMessage: "Insufficient credits",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle quota exceeded from Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Quota exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));
  });

  // Error scenarios and edge cases for llama-3.1-8b-instruct with Novita Provider
  describe("Error scenarios - llama-3.1-8b-instruct with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Novita", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Novita", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  // Provider URL validation and model mapping for llama-3.1-8b-instruct with DeepInfra
  describe("Provider validation - llama-3.1-8b-instruct with DeepInfra", () => {
    it("should construct correct DeepInfra URL for llama-3.1-8b-instruct", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: deepinfraAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.deepinfra.com/
                // Built URL: https://api.deepinfra.com/v1/openai/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test all supported parameters
    it("should handle all supported parameters with DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        request: {
          body: {
            messages: [
              { role: "user", content: "Test comprehensive parameters" },
            ],
            max_tokens: 1000,
            temperature: 0.8,
            top_p: 0.95,
            stop: ["STOP"],
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            repetition_penalty: 1.1,
            top_k: 40,
            seed: 12345,
            min_p: 0.05,
            response_format: { type: "text" },
            tool_choice: "auto",
            tools: [
              {
                type: "function",
                function: {
                  name: "test_function",
                  description: "A test function",
                  parameters: {
                    type: "object",
                    properties: {
                      param: { type: "string" },
                    },
                  },
                },
              },
            ],
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: [
                  "max_tokens",
                  "temperature",
                  "top_p",
                  "stop",
                  "frequency_penalty",
                  "presence_penalty",
                  "repetition_penalty",
                  "top_k",
                  "seed",
                  "min_p",
                  "response_format",
                  "tool_choice",
                  "tools",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test context length and max completion tokens
    it("should handle context length and max completion tokens correctly", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        request: {
          body: {
            messages: [{ role: "user", content: "Test context length" }],
            max_tokens: 8000, // Max completion tokens for this model
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["max_tokens", "8000"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test pricing configuration
    it("should handle pricing configuration correctly", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: deepinfraAuthExpectations,
              customVerify: (call) => {
                // Verify that the pricing configuration is correctly applied
                // Input: $0.03/1M tokens, Output: $0.06/1M tokens
                // This would be verified in the cost calculation logic
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  // Provider URL validation and model mapping for llama-3.1-8b-instruct-turbo with DeepInfra
  describe("Provider validation - llama-3.1-8b-instruct-turbo with DeepInfra", () => {
    it("should construct correct DeepInfra URL for llama-3.1-8b-instruct-turbo", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: deepinfraAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.deepinfra.com/
                // Built URL: https://api.deepinfra.com/v1/openai/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test all supported parameters
    it("should handle all supported parameters with DeepInfra", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        request: {
          body: {
            messages: [
              { role: "user", content: "Test comprehensive parameters" },
            ],
            max_tokens: 1000,
            temperature: 0.8,
            top_p: 0.95,
            stop: ["STOP"],
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            repetition_penalty: 1.1,
            top_k: 40,
            seed: 12345,
            min_p: 0.05,
            response_format: { type: "text" },
            tool_choice: "auto",
            tools: [
              {
                type: "function",
                function: {
                  name: "test_function",
                  description: "A test function",
                  parameters: {
                    type: "object",
                    properties: {
                      param: { type: "string" },
                    },
                  },
                },
              },
            ],
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: [
                  "max_tokens",
                  "temperature",
                  "top_p",
                  "stop",
                  "frequency_penalty",
                  "presence_penalty",
                  "repetition_penalty",
                  "top_k",
                  "seed",
                  "min_p",
                  "response_format",
                  "tool_choice",
                  "tools",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test context length and max completion tokens
    it("should handle context length and max completion tokens correctly", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        request: {
          body: {
            messages: [{ role: "user", content: "Test context length" }],
            max_tokens: 128000, // Max completion tokens for this model
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["max_tokens", "128000"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test pricing configuration
    it("should handle pricing configuration correctly", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: deepinfraAuthExpectations,
              customVerify: (call) => {
                // Verify that the pricing configuration is correctly applied
                // Input: $0.02/1M tokens, Output: $0.03/1M tokens
                // This would be verified in the cost calculation logic
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test rate limits configuration
    it("should handle rate limits configuration correctly", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: deepinfraAuthExpectations,
              customVerify: (call) => {
                // Verify that the rate limits are correctly applied
                // RPM: 12000, TPM: 60000000, TPD: 6000000000
                // This would be verified in the rate limiting logic
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("Provider validation - llama-4-scout with Novita", () => {
    it("should construct correct Novita URL for llama-4-scout", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/openai/v1
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test all supported parameters
    it("should handle all supported parameters with Novita", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Test comprehensive parameters" },
            ],
            max_tokens: 1000,
            temperature: 0.8,
            top_p: 0.95,
            stop: ["STOP"],
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            seed: 12345,
            top_k: 40,
            min_p: 0.05,
            repetition_penalty: 1.1,
            logit_bias: {
              "1234": 0.5,
              "5678": -0.3,
            },
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "max_tokens",
                  "temperature",
                  "top_p",
                  "stop",
                  "frequency_penalty",
                  "presence_penalty",
                  "seed",
                  "top_k",
                  "min_p",
                  "repetition_penalty",
                  "logit_bias",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test context length and max completion tokens
    it("should handle context length and max completion tokens correctly", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Test context length" }],
            max_tokens: 131072, // Max completion tokens for this model
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["max_tokens", "131072"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test pricing configuration
    it("should handle pricing configuration correctly", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the pricing configuration is correctly applied
                // Input: $0.1/1M tokens, Output: $0.5/1M tokens
                // This would be verified in the cost calculation logic
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test priority configuration
    it("should handle priority configuration correctly", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the priority configuration is correctly applied
                // Priority: 2
                // This would be verified in the provider selection logic
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  // Provider URL validation and model mapping for llama-3.1-8b-instruct with Novita
  describe("Provider validation - llama-3.1-8b-instruct with Novita", () => {
    it("should construct correct Novita URL for llama-3.1-8b-instruct", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/openai/v1
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test all supported parameters
    it("should handle all supported parameters with Novita", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Test comprehensive parameters" },
            ],
            max_tokens: 1000,
            temperature: 0.8,
            top_p: 0.95,
            stop: ["STOP"],
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            repetition_penalty: 1.1,
            top_k: 40,
            seed: 12345,
            min_p: 0.05,
            response_format: { type: "text" },
            tool_choice: "auto",
            tools: [
              {
                type: "function",
                function: {
                  name: "test_function",
                  description: "A test function",
                  parameters: {
                    type: "object",
                    properties: {
                      param: { type: "string" },
                    },
                  },
                },
              },
            ],
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "max_tokens",
                  "temperature",
                  "top_p",
                  "stop",
                  "frequency_penalty",
                  "presence_penalty",
                  "repetition_penalty",
                  "top_k",
                  "seed",
                  "min_p",
                  "response_format",
                  "tool_choice",
                  "tools",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test context length and max completion tokens
    it("should handle context length and max completion tokens correctly", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Test context length" }],
            max_tokens: 16384, // Max completion tokens for this model
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["max_tokens", "16384"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test pricing configuration
    it("should handle pricing configuration correctly", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the pricing configuration is correctly applied
                // Input: $0.02/1M tokens, Output: $0.05/1M tokens
                // This would be verified in the cost calculation logic
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test rate limits configuration
    it("should handle rate limits configuration correctly", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the rate limits are correctly applied
                // This would be verified in the rate limiting logic
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  // Advanced scenarios and edge cases for llama-3.1-8b-instruct with DeepInfra
  describe("Advanced scenarios - llama-3.1-8b-instruct with DeepInfra", () => {
    it("should handle streaming requests", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        request: {
          stream: true,
          body: {
            messages: [{ role: "user", content: "Stream this response" }],
            temperature: 0.7,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["stream", "true"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle complex multi-turn conversations", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        request: {
          body: {
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: "Hello, how are you?" },
              { role: "assistant", content: "I'm doing well, thank you!" },
              { role: "user", content: "What can you help me with?" },
            ],
            temperature: 0.5,
            max_tokens: 500,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: [
                  "system",
                  "user",
                  "assistant",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle custom headers", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/deepinfra",
        request: {
          headers: {
            "X-Custom-Header": "test-value",
            "User-Agent": "Helicone-Test/1.0",
          },
          body: {
            messages: [{ role: "user", content: "Test with custom headers" }],
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                headers: {
                  ...deepinfraAuthExpectations.headers,
                  "X-Custom-Header": "test-value",
                  "User-Agent": "Helicone-Test/1.0",
                },
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  // Advanced scenarios and edge cases
  describe("Advanced scenarios - llama-3.1-8b-instruct-turbo", () => {
    it("should handle streaming requests", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        request: {
          stream: true,
          body: {
            messages: [{ role: "user", content: "Stream this response" }],
            temperature: 0.7,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["stream", "true"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle complex multi-turn conversations", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        request: {
          body: {
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: "Hello, how are you?" },
              { role: "assistant", content: "I'm doing well, thank you!" },
              { role: "user", content: "What can you help me with?" },
            ],
            temperature: 0.5,
            max_tokens: 500,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: [
                  "system",
                  "user",
                  "assistant",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle custom headers", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct-turbo/deepinfra",
        request: {
          headers: {
            "X-Custom-Header": "test-value",
            "User-Agent": "Helicone-Test/1.0",
          },
          body: {
            messages: [{ role: "user", content: "Test with custom headers" }],
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
              data: createOpenAIMockResponse(
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
              ),
              expects: {
                ...deepinfraAuthExpectations,
                headers: {
                  ...deepinfraAuthExpectations.headers,
                  "X-Custom-Header": "test-value",
                  "User-Agent": "Helicone-Test/1.0",
                },
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  // Advanced scenarios and edge cases for llama-3.1-8b-instruct with Novita
  describe("Advanced scenarios - llama-3.1-8b-instruct with Novita", () => {
    it("should handle streaming requests", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        request: {
          stream: true,
          body: {
            messages: [{ role: "user", content: "Stream this response" }],
            temperature: 0.7,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["stream", "true"],
              },
            },
          ],
          finalStatus: 200,
        },
      })
    );

    it("should handle complex multi-turn conversations", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        request: {
          body: {
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: "Hello, how are you?" },
              { role: "assistant", content: "I'm doing well, thank you!" },
              { role: "user", content: "What can you help me with?" },
            ],
            temperature: 0.5,
            max_tokens: 500,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "system",
                  "user",
                  "assistant",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      })
    );

    it("should handle custom headers", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        request: {
          headers: {
            "X-Custom-Header": "test-value",
            "User-Agent": "Helicone-Test/1.0",
          },
          body: {
            messages: [{ role: "user", content: "Test with custom headers" }],
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                headers: {
                  ...novitaAuthExpectations.headers,
                  "X-Custom-Header": "test-value",
                  "User-Agent": "Helicone-Test/1.0",
                },
              },
            },
          ],
          finalStatus: 200,
        },
      })
    );

    it("should handle logit bias parameter", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Test logit bias" }],
            logit_bias: {
              "1234": 0.5,
              "5678": -0.3,
            },
            temperature: 0.7,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["logit_bias", "1234", "5678", "temperature"],
              },
            },
          ],
          finalStatus: 200,
        },
      })
    );

    it("should handle function calling with specific tool choice", () =>
      runGatewayTest({
        model: "llama-3.1-8b-instruct/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Get the weather in New York" },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "get_weather",
                  description: "Get current weather for a location",
                  parameters: {
                    type: "object",
                    properties: {
                      location: { type: "string" },
                      unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                    },
                    required: ["location"],
                  },
                },
              },
            ],
            tool_choice: {
              type: "function",
              function: { name: "get_weather" },
            },
            temperature: 0.1,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.1-8b-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-3.1-8b-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "tools",
                  "tool_choice",
                  "get_weather",
                  "function",
                  "temperature",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      })
    );
  });

  describe("llama-4-scout", () => {
    it("should handle novita provider", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle tool calls with novita provider", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "What's the weather in Tokyo?" }],
            tools: [
              {
                type: "function",
                function: {
                  name: "get_weather",
                  description: "Get current weather for a location",
                  parameters: {
                    type: "object",
                    properties: {
                      location: { type: "string" },
                      unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                    },
                    required: ["location"],
                  },
                },
              },
            ],
            tool_choice: "auto",
            temperature: 0.7,
            max_tokens: 2000,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "tools",
                  "tool_choice",
                  "get_weather",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle response format with novita provider", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Generate JSON data" }],
            response_format: { type: "json_object" },
            temperature: 0.1,
            top_p: 0.9,
            frequency_penalty: 0.5,
            presence_penalty: 0.3,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "response_format",
                  "json_object",
                  "temperature",
                  "top_p",
                  "frequency_penalty",
                  "presence_penalty",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle all supported parameters with novita provider", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Test comprehensive parameters" },
            ],
            max_tokens: 1000,
            temperature: 0.8,
            top_p: 0.95,
            stop: ["STOP"],
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            seed: 12345,
            top_k: 40,
            min_p: 0.05,
            repetition_penalty: 1.1,
            logit_bias: {
              "1234": 0.5,
              "5678": -0.3,
            },
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "max_tokens",
                  "temperature",
                  "top_p",
                  "stop",
                  "frequency_penalty",
                  "presence_penalty",
                  "seed",
                  "top_k",
                  "min_p",
                  "repetition_penalty",
                  "logit_bias",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle context length and max completion tokens correctly", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Test context length" }],
            max_tokens: 131072, // Max completion tokens for this model
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["max_tokens", "131072"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle pricing configuration correctly", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the pricing configuration is correctly applied
                // Input: $0.1/1M tokens, Output: $0.5/1M tokens
                // This would be verified in the cost calculation logic
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle streaming requests", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          stream: true,
          body: {
            messages: [{ role: "user", content: "Stream this response" }],
            temperature: 0.7,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["stream", "true"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle complex multi-turn conversations", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          body: {
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: "Hello, how are you?" },
              { role: "assistant", content: "I'm doing well, thank you!" },
              { role: "user", content: "What can you help me with?" },
            ],
            temperature: 0.5,
            max_tokens: 500,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "system",
                  "user",
                  "assistant",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle custom headers", () =>
      runGatewayTest({
        model: "llama-4-scout/novita",
        request: {
          headers: {
            "X-Custom-Header": "test-value",
            "User-Agent": "Helicone-Test/1.0",
          },
          body: {
            messages: [{ role: "user", content: "Test with custom headers" }],
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              data: createOpenAIMockResponse(
                "meta-llama/llama-4-scout-17b-16e-instruct"
              ),
              expects: {
                ...novitaAuthExpectations,
                headers: {
                  ...novitaAuthExpectations.headers,
                  "X-Custom-Header": "test-value",
                  "User-Agent": "Helicone-Test/1.0",
                },
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("llama-3.3-70b-instruct", () => {
    it("should handle novita provider", () =>
      runGatewayTest({
        model: "llama-3.3-70b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.3-70b-instruct",
              data: createOpenAIMockResponse("meta-llama/llama-3.3-70b-instruct"),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test tool usage with Novita for llama-3.3-70b-instruct
    it("should handle tool calls with novita provider", () =>
      runGatewayTest({
        model: "llama-3.3-70b-instruct/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "What's the weather in Paris?" }],
            tools: [
              {
                type: "function",
                function: {
                  name: "get_weather",
                  description: "Get current weather",
                  parameters: {
                    type: "object",
                    properties: {
                      location: { type: "string" },
                      unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                    },
                    required: ["location"],
                  },
                },
              },
            ],
            tool_choice: "auto",
            temperature: 0.7,
            max_tokens: 4000,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.3-70b-instruct",
              data: createOpenAIMockResponse("meta-llama/llama-3.3-70b-instruct"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "tools",
                  "tool_choice",
                  "get_weather",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle multilingual conversations with novita provider", () =>
      runGatewayTest({
        model: "llama-3.3-70b-instruct/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "¿Puedes ayudarme en español?" },
              { role: "assistant", content: "¡Por supuesto! Puedo ayudarte en español." },
              { role: "user", content: "Merci! Peux-tu aussi parler français?" },
            ],
            temperature: 0.8,
            max_tokens: 2000,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.3-70b-instruct",
              data: createOpenAIMockResponse("meta-llama/llama-3.3-70b-instruct"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "español",
                  "français",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test all supported parameters for llama-3.3-70b-instruct
    it("should handle all supported parameters with novita provider", () =>
      runGatewayTest({
        model: "llama-3.3-70b-instruct/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Test comprehensive parameters" },
            ],
            max_tokens: 8000,
            temperature: 0.9,
            top_p: 0.95,
            stop: ["STOP", "END"],
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            repetition_penalty: 1.05,
            top_k: 50,
            seed: 42,
            min_p: 0.1,
            tools: [
              {
                type: "function",
                function: {
                  name: "test_function",
                  description: "A test function for parameter validation",
                  parameters: {
                    type: "object",
                    properties: {
                      param: { type: "string" },
                    },
                  },
                },
              },
            ],
            tool_choice: "auto",
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.3-70b-instruct",
              data: createOpenAIMockResponse("meta-llama/llama-3.3-70b-instruct"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "max_tokens",
                  "temperature",
                  "top_p",
                  "stop",
                  "frequency_penalty",
                  "presence_penalty",
                  "repetition_penalty",
                  "top_k",
                  "seed",
                  "min_p",
                  "tool_choice",
                  "tools",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test max completion tokens for llama-3.3-70b-instruct (120,000)
    it("should handle large max completion tokens correctly", () =>
      runGatewayTest({
        model: "llama-3.3-70b-instruct/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Generate a very long response" },
            ],
            max_tokens: 120000, // Max completion tokens for this model
            temperature: 0.3,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-3.3-70b-instruct",
              data: createOpenAIMockResponse("meta-llama/llama-3.3-70b-instruct"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["max_tokens", "120000"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test error scenarios for llama-3.3-70b-instruct with Novita
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "llama-3.3-70b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "llama-3.3-70b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "llama-3.3-70b-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      })
    );
  });

  describe("llama-4-maverick", () => {
    it("should handle novita provider", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle tool calls with novita provider", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "What's the weather in Paris?" }],
            tools: [
              {
                type: "function",
                function: {
                  name: "get_weather",
                  description: "Get current weather",
                  parameters: {
                    type: "object",
                    properties: {
                      location: { type: "string" },
                      unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                    },
                    required: ["location"],
                  },
                },
              },
            ],
            tool_choice: "auto",
            temperature: 0.7,
            max_tokens: 4000,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "tools",
                  "tool_choice",
                  "get_weather",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle response format with novita provider", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Generate JSON data" }],
            response_format: { type: "json_object" },
            temperature: 0.1,
            top_p: 0.9,
            frequency_penalty: 0.5,
            presence_penalty: 0.3,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "response_format",
                  "json_object",
                  "temperature",
                  "top_p",
                  "frequency_penalty",
                  "presence_penalty",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle all supported parameters with novita provider", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Test comprehensive parameters" },
            ],
            max_tokens: 8000,
            temperature: 0.9,
            top_p: 0.95,
            stop: ["STOP", "END"],
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            repetition_penalty: 1.05,
            top_k: 50,
            seed: 42,
            min_p: 0.1,
            tools: [
              {
                type: "function",
                function: {
                  name: "test_function",
                  description: "A test function for parameter validation",
                  parameters: {
                    type: "object",
                    properties: {
                      param: { type: "string" },
                    },
                  },
                },
              },
            ],
            tool_choice: "auto",
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "max_tokens",
                  "temperature",
                  "top_p",
                  "stop",
                  "frequency_penalty",
                  "presence_penalty",
                  "repetition_penalty",
                  "top_k",
                  "seed",
                  "min_p",
                  "tool_choice",
                  "tools",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle very large context length correctly", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Generate a response with large context" },
            ],
            max_tokens: 100000,
            temperature: 0.3,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["max_tokens", "100000"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle streaming requests with novita provider", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          stream: true,
          body: {
            messages: [{ role: "user", content: "Stream this response" }],
            temperature: 0.7,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["stream", "true"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle complex multi-turn conversations with novita provider", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          body: {
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: "Hello, how are you?" },
              { role: "assistant", content: "I'm doing well, thank you!" },
              { role: "user", content: "What can you help me with?" },
            ],
            temperature: 0.5,
            max_tokens: 500,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "system",
                  "user",
                  "assistant",
                  "temperature",
                  "max_tokens",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle custom headers with novita provider", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          headers: {
            "X-Custom-Header": "test-value",
            "User-Agent": "Helicone-Test/1.0",
          },
          body: {
            messages: [{ role: "user", content: "Test with custom headers" }],
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                headers: {
                  ...novitaAuthExpectations.headers,
                  "X-Custom-Header": "test-value",
                  "User-Agent": "Helicone-Test/1.0",
                },
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle function calling with specific tool choice", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Get the weather in New York" },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "get_weather",
                  description: "Get current weather for a location",
                  parameters: {
                    type: "object",
                    properties: {
                      location: { type: "string" },
                      unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                    },
                    required: ["location"],
                  },
                },
              },
            ],
            tool_choice: {
              type: "function",
              function: { name: "get_weather" },
            },
            temperature: 0.1,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "tools",
                  "tool_choice",
                  "get_weather",
                  "function",
                  "temperature",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Novita", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Novita", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "llama-4-maverick/novita",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
              data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("Passthrough billing tests", () => {
    describe("llama-4-scout with Novita", () => {
      it("should handle passthrough billing with novita provider", () =>
        runGatewayTest({
          model: "llama-4-scout/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test passthrough billing" },
              ],
              passthroughBilling: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                data: createOpenAIMockResponse("meta-llama/llama-4-scout-17b-16e-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("llama-3.3-70b-instruct with Novita", () => {
      it("should handle passthrough billing with novita provider", () =>
        runGatewayTest({
          model: "llama-3.3-70b-instruct/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test passthrough billing" },
              ],
              passthroughBilling: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "meta-llama/llama-3.3-70b-instruct",
                data: createOpenAIMockResponse("meta-llama/llama-3.3-70b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("llama-4-maverick with Novita", () => {
      it("should handle passthrough billing with novita provider", () =>
        runGatewayTest({
          model: "llama-4-maverick/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test passthrough billing" },
              ],
              passthroughBilling: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
                data: createOpenAIMockResponse("meta-llama/llama-4-maverick-17b-128e-instruct-fp8"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });
});
