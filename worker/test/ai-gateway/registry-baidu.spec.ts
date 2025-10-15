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

describe("Baidu Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Baidu Ernie Models", () => {
    describe("ernie-4.5-21b-a3b-thinking", () => {
      it("should handle novita provider", () =>
        runGatewayTest({
          model: "ernie-4.5-21b-a3b-thinking/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "baidu/ernie-4.5-21B-A3B-Thinking",
                data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
                expects: novitaAuthExpectations
              }
            ],
            finalStatus: 200
          }
        }));

      it("should auto-select novita provider when none specified", () =>
        runGatewayTest({
          model: "ernie-4.5-21b-a3b-thinking",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "baidu/ernie-4.5-21B-A3B-Thinking",
                data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
                expects: novitaAuthExpectations
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle reasoning parameters with novita provider", () =>
        runGatewayTest({
          model: "ernie-4.5-21b-a3b-thinking/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Solve this problem step by step" }
              ],
              reasoning: { enabled: true },
              max_tokens: 2000
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "baidu/ernie-4.5-21B-A3B-Thinking",
                data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["reasoning", "max_tokens"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle temperature and top_p parameters with novita provider", () =>
        runGatewayTest({
          model: "ernie-4.5-21b-a3b-thinking/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate creative text" }],
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 1000
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "baidu/ernie-4.5-21B-A3B-Thinking",
                data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["temperature", "top_p", "max_tokens"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle stop sequences with novita provider", () =>
        runGatewayTest({
          model: "ernie-4.5-21b-a3b-thinking/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate text" }],
              stop: ["STOP", "END"],
              max_tokens: 500
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "baidu/ernie-4.5-21B-A3B-Thinking",
                data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["stop", "max_tokens"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle all supported parameters with novita provider", () =>
        runGatewayTest({
          model: "ernie-4.5-21b-a3b-thinking/novita",
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
              repetition_penalty: 1.1,
              top_k: 40,
              seed: 12345,
              min_p: 0.05,
              logit_bias: { "100": -100 }
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "baidu/ernie-4.5-21B-A3B-Thinking",
                data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
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
                    "logit_bias"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));
    });
  });

  // Error scenarios and edge cases
  describe("Error scenarios - ernie-4.5-21b-a3b-thinking with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "ernie-4.5-21b-a3b-thinking/novita",
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
        model: "ernie-4.5-21b-a3b-thinking/novita",
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
        model: "ernie-4.5-21b-a3b-thinking/novita",
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
        model: "ernie-4.5-21b-a3b-thinking/novita",
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
        model: "ernie-4.5-21b-a3b-thinking/novita",
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

  // Provider URL validation and model mapping
  describe("Provider validation - ernie-4.5-21b-a3b-thinking with Novita", () => {
    it("should construct correct Novita URL for ernie-4.5-21b-a3b-thinking", () =>
      runGatewayTest({
        model: "ernie-4.5-21b-a3b-thinking/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "baidu/ernie-4.5-21B-A3B-Thinking",
              data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              }
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "ernie-4.5-21b-a3b-thinking/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "baidu/ernie-4.5-21B-A3B-Thinking", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
              expects: novitaAuthExpectations
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "ernie-4.5-21b-a3b-thinking/novita",
        request: {
          bodyMapping: "NO_MAPPING"
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "baidu/ernie-4.5-21B-A3B-Thinking",
              data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
              expects: {
                ...novitaAuthExpectations
              }
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle penalty parameters with Novita", () =>
      runGatewayTest({
        model: "ernie-4.5-21b-a3b-thinking/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Generate diverse text" }],
            frequency_penalty: 0.5,
            presence_penalty: 0.3,
            repetition_penalty: 1.2
          }
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "baidu/ernie-4.5-21B-A3B-Thinking",
              data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: [
                  "frequency_penalty",
                  "presence_penalty",
                  "repetition_penalty"
                ]
              }
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle advanced sampling parameters with Novita", () =>
      runGatewayTest({
        model: "ernie-4.5-21b-a3b-thinking/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Generate controlled output" }],
            top_k: 50,
            min_p: 0.1,
            seed: 42
          }
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "baidu/ernie-4.5-21B-A3B-Thinking",
              data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["top_k", "min_p", "seed"]
              }
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle logit_bias parameter with Novita", () =>
      runGatewayTest({
        model: "ernie-4.5-21b-a3b-thinking/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Generate biased output" }],
            logit_bias: { "100": -100, "200": 50 }
          }
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "baidu/ernie-4.5-21B-A3B-Thinking",
              data: createOpenAIMockResponse("baidu/ernie-4.5-21B-A3B-Thinking"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["logit_bias"]
              }
            }
          ],
          finalStatus: 200
        }
      }));
  });
});

