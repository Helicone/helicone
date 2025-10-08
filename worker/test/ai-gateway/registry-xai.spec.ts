import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";

const xaiAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("xAI Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - xAI Grok Models", () => {
    describe("grok-code-fast-1", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-code-fast-1/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-code-fast-1",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-code-fast-1",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-code-fast-1",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("grok-4", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-4/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-4",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("grok-4-fast-reasoning", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-4-fast-reasoning/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4-fast",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-4-fast-reasoning",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4-fast",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with xai provider", () =>
        runGatewayTest({
          model: "grok-4-fast-reasoning/xai",
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
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4-fast",
                expects: {
                  ...xaiAuthExpectations,
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

      it("should handle response format with xai provider", () =>
        runGatewayTest({
          model: "grok-4-fast-reasoning/xai",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4-fast",
                expects: {
                  ...xaiAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle all supported parameters", () =>
        runGatewayTest({
          model: "grok-4-fast-reasoning/xai",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" }
              ],
              max_tokens: 1000,
              temperature: 0.8,
              top_p: 0.95,
              seed: 12345,
              logprobs: true,
              top_logprobs: 5
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4-fast",
                expects: {
                  ...xaiAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "top_p",
                    "seed",
                    "logprobs",
                    "top_logprobs"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle structured outputs", () =>
        runGatewayTest({
          model: "grok-4-fast-reasoning/xai",
          request: {
            body: {
              messages: [
                { role: "user", content: "Generate structured data" }
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "user_data",
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
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4-fast",
                expects: {
                  ...xaiAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "user_data"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));
    });

    describe("grok-3", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-3/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-3",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-3",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-3",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("grok-3-mini", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-3-mini/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-3-mini",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-3-mini",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-3-mini",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Error scenarios", () => {
      it("should handle xAI provider failure", () =>
        runGatewayTest({
          model: "grok-3/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "xAI service unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle rate limiting from xAI", () =>
        runGatewayTest({
          model: "grok-3/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
            ],
            finalStatus: 429,
          },
        }));

      it("should handle authentication failure", () =>
        runGatewayTest({
          model: "grok-3/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "failure",
                statusCode: 401,
                errorMessage: "Invalid API key",
              },
            ],
            finalStatus: 401,
          },
        }));
    });
  });

  describe("Error scenarios - grok-4-fast-reasoning", () => {
    it("should handle xAI provider failure for grok-4-fast-reasoning", () =>
      runGatewayTest({
        model: "grok-4-fast-reasoning/xai",
        expected: {
          providers: [
            {
              url: "https://api.x.ai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "xAI service unavailable"
            }
          ],
          finalStatus: 500
        }
      }));

    it("should handle rate limiting from xAI for grok-4-fast-reasoning", () =>
      runGatewayTest({
        model: "grok-4-fast-reasoning/xai",
        expected: {
          providers: [
            {
              url: "https://api.x.ai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded"
            }
          ],
          finalStatus: 429
        }
      }));

    it("should handle authentication failure for grok-4-fast-reasoning", () =>
      runGatewayTest({
        model: "grok-4-fast-reasoning/xai",
        expected: {
          providers: [
            {
              url: "https://api.x.ai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key"
            }
          ],
          finalStatus: 401
        }
      }));

    it("should handle model not found error for grok-4-fast-reasoning", () =>
      runGatewayTest({
        model: "grok-4-fast-reasoning/xai",
        expected: {
          providers: [
            {
              url: "https://api.x.ai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found"
            }
          ],
          finalStatus: 500
        }
      }));

    it("should handle timeout for grok-4-fast-reasoning", () =>
      runGatewayTest({
        model: "grok-4-fast-reasoning/xai",
        expected: {
          providers: [
            {
              url: "https://api.x.ai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout"
            }
          ],
          finalStatus: 500
        }
      }));

    it("should handle bad request error for grok-4-fast-reasoning", () =>
      runGatewayTest({
        model: "grok-4-fast-reasoning/xai",
        expected: {
          providers: [
            {
              url: "https://api.x.ai/v1/chat/completions",
              response: "failure",
              statusCode: 400,
              errorMessage: "Bad request"
            }
          ],
          finalStatus: 500
        }
      }));
  });
});
