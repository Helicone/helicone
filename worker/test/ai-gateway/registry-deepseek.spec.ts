import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

const deepseekAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const groqAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const deepinfraAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("DeepSeek Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Native DeepSeek Models", () => {
    describe("deepseek-v3", () => {
      it("should handle deepseek provider", () =>
        runGatewayTest({
          model: "deepseek-v3/deepseek",
          expected: {
            providers: [
              {
                url: "https://api.deepseek.com/chat/completions",
                response: "success",
                model: "deepseek-chat", // Maps to deepseek-chat on API
                expects: deepseekAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepseek provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-v3",
          expected: {
            providers: [
              {
                url: "https://api.deepseek.com/chat/completions",
                response: "success",
                model: "deepseek-chat", // Maps to deepseek-chat on API
                expects: deepseekAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1",
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-reasoner", () => {
      it("should handle deepseek provider", () =>
        runGatewayTest({
          model: "deepseek-reasoner/deepseek",
          expected: {
            providers: [
              {
                url: "https://api.deepseek.com/chat/completions",
                response: "success",
                model: "deepseek-reasoner",
                expects: deepseekAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepseek provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-reasoner",
          expected: {
            providers: [
              {
                url: "https://api.deepseek.com/chat/completions",
                response: "success",
                model: "deepseek-reasoner",
                expects: deepseekAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "deepseek-reasoner/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-0528",
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-R1-0528"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-v3.1-terminus", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1-Terminus", // Provider model ID on DeepInfra
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1-Terminus",
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-v3.1-terminus", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1-Terminus", // Provider model ID on DeepInfra
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1-Terminus",
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-v3.1-terminus", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1-Terminus", // Provider model ID on DeepInfra
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1-Terminus",
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("BYOK Tests - DeepSeek Models on Groq", () => {
    describe("deepseek-r1-distill-llama-70b", () => {
      it("should handle groq provider", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b/groq",
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "deepseek-r1-distill-llama-70b",
                expects: groqAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select groq provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b",
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "deepseek-r1-distill-llama-70b",
                expects: groqAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - DeepSeek Provider", () => {
    it("should handle DeepSeek provider failure", () =>
      runGatewayTest({
        model: "deepseek-v3/deepseek",
        expected: {
          providers: [
            {
              url: "https://api.deepseek.com/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "DeepSeek service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from DeepSeek", () =>
      runGatewayTest({
        model: "deepseek-v3/deepseek",
        expected: {
          providers: [
            {
              url: "https://api.deepseek.com/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from DeepSeek", () =>
      runGatewayTest({
        model: "deepseek-v3/deepseek",
        expected: {
          providers: [
            {
              url: "https://api.deepseek.com/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));
  });

  describe("Error scenarios - DeepInfra Provider with DeepSeek V3", () => {
    it("should handle DeepInfra provider failure", () =>
      runGatewayTest({
        model: "deepseek-v3/deepinfra",
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
        model: "deepseek-v3/deepinfra",
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
        model: "deepseek-v3/deepinfra",
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
  });

  describe("Error scenarios - DeepInfra Provider with DeepSeek R1", () => {
    it("should handle DeepInfra provider failure for R1", () =>
      runGatewayTest({
        model: "deepseek-reasoner/deepinfra",
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

    it("should handle rate limiting from DeepInfra for R1", () =>
      runGatewayTest({
        model: "deepseek-reasoner/deepinfra",
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

    it("should handle authentication failure from DeepInfra for R1", () =>
      runGatewayTest({
        model: "deepseek-reasoner/deepinfra",
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
  });

  describe("Error scenarios - DeepInfra Provider with DeepSeek V3.1 Terminus", () => {
    it("should handle DeepInfra provider failure for V3.1 Terminus", () =>
      runGatewayTest({
        model: "deepseek-v3.1-terminus/deepinfra",
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

    it("should handle rate limiting from DeepInfra for V3.1 Terminus", () =>
      runGatewayTest({
        model: "deepseek-v3.1-terminus/deepinfra",
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

    it("should handle authentication failure from DeepInfra for V3.1 Terminus", () =>
      runGatewayTest({
        model: "deepseek-v3.1-terminus/deepinfra",
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
  });
  describe("Error scenarios - Groq Provider with DeepSeek Model", () => {
    it("should handle Groq provider failure", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/groq",
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Groq service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Groq", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/groq",
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Groq", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/groq",
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));
  });

  describe("Provider URL validation and model mapping", () => {
    it("should construct correct DeepInfra URL for DeepSeek V3", () =>
      runGatewayTest({
        model: "deepseek-v3/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-V3.1",
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1"),
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

    it("should construct correct DeepInfra URL for DeepSeek R1", () =>
      runGatewayTest({
        model: "deepseek-reasoner/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-0528",
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-R1-0528"),
              expects: deepinfraAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed for R1 model
                // Base URL: https://api.deepinfra.com/
                // Built URL: https://api.deepinfra.com/v1/openai/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for DeepInfra V3", () =>
      runGatewayTest({
        model: "deepseek-v3/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-V3.1", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1"),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for DeepInfra R1", () =>
      runGatewayTest({
        model: "deepseek-reasoner/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-0528", // Should map to the correct provider model ID for R1
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-R1-0528"),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra V3", () =>
      runGatewayTest({
        model: "deepseek-v3/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-V3.1",
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1"),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra R1", () =>
      runGatewayTest({
        model: "deepseek-reasoner/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-0528",
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-R1-0528"),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should construct correct DeepInfra URL for DeepSeek V3.1 Terminus", () =>
      runGatewayTest({
        model: "deepseek-v3.1-terminus/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-V3.1-Terminus",
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
              expects: deepinfraAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed for V3.1 Terminus
                // Base URL: https://api.deepinfra.com/
                // Built URL: https://api.deepinfra.com/v1/openai/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for DeepInfra V3.1 Terminus", () =>
      runGatewayTest({
        model: "deepseek-v3.1-terminus/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-V3.1-Terminus", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra V3.1 Terminus", () =>
      runGatewayTest({
        model: "deepseek-v3.1-terminus/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-V3.1-Terminus",
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.1-Terminus"),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));
    it("should handle request body mapping for DeepInfra DeepSeek-R1-0528", () =>
      runGatewayTest({
        model: "deepseek-reasoner/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-0528",
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-R1-0528"),
              expects: {
                ...deepinfraAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });
});
