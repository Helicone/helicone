import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

// Define auth expectations for Novita provider
const novitaAuthExpectations = {
  headers: {
    Authorization: /^Bearer /
  }
};

describe("Moonshot AI Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Kimi K2 Models", () => {
    describe("kimi-k2-instruct", () => {
      it("should handle novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: novitaAuthExpectations
              }
            ],
            finalStatus: 200
          }
        }));

      it("should auto-select novita provider when none specified", () =>
        runGatewayTest({
          model: "kimi-k2-instruct",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: novitaAuthExpectations
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle tool calls with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
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
                        location: { type: "string" }
                      },
                      required: ["location"]
                    }
                  }
                }
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle response format with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle structured outputs with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" }
                    },
                    required: ["name", "age"]
                  }
                }
              }
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle functions parameter with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Call a function" }],
              functions: [
                {
                  name: "calculate_sum",
                  description: "Calculate sum of two numbers",
                  parameters: {
                    type: "object",
                    properties: {
                      a: { type: "number" },
                      b: { type: "number" }
                    },
                    required: ["a", "b"]
                  }
                }
              ],
              function_call: "auto"
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "functions",
                    "function_call",
                    "calculate_sum"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle all supported parameters with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" }
              ],
              max_tokens: 1000,
              temperature: 0.8,
              top_p: 0.95,
              stop: ["STOP"],
              frequency_penalty: 0.2,
              presence_penalty: 0.1,
              seed: 12345,
              logprobs: true,
              top_logprobs: 5,
              response_format: { type: "text" }
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
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
                    "logprobs",
                    "top_logprobs",
                    "response_format"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));
    });
  });

  describe("Error scenarios - kimi-k2-instruct with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable"
            }
          ],
          finalStatus: 500
        }
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded"
            }
          ],
          finalStatus: 429
        }
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key"
            }
          ],
          finalStatus: 401
        }
      }));

    it("should handle model not found error from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found"
            }
          ],
          finalStatus: 500
        }
      }));

    it("should handle timeout from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout"
            }
          ],
          finalStatus: 500
        }
      }));
  });

  describe("Provider validation - kimi-k2-instruct with Novita", () => {
    it("should construct correct Novita URL for kimi-k2-instruct", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-instruct",
              data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/openai/v1
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              }
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-instruct", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
              expects: novitaAuthExpectations
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        request: {
          bodyMapping: "NO_MAPPING"
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-instruct",
              data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
              expects: {
                ...novitaAuthExpectations
              }
            }
          ],
          finalStatus: 200
        }
      }));
  });
});

