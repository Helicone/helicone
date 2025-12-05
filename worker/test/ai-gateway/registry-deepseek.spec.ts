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

const novitaAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const chutesAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const canopywaveAuthExpectations = {
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

      it("should handle canopywave provider", () =>
        runGatewayTest({
          model: "deepseek-v3/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-chat-v3.1",
                expects: canopywaveAuthExpectations,
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
                data: createOpenAIMockResponse(
                  "deepseek-ai/DeepSeek-V3.1-Terminus"
                ),
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
                data: createOpenAIMockResponse(
                  "deepseek-ai/DeepSeek-V3.1-Terminus"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-v3.2", () => {
      it("should handle novita provider", () =>
        runGatewayTest({
          model: "deepseek-v3.2/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.2-exp",
                data: createOpenAIMockResponse("deepseek/deepseek-v3.2-exp"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select novita provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-v3.2",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.2-exp",
                data: createOpenAIMockResponse("deepseek/deepseek-v3.2-exp"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-tng-r1t2-chimera", () => {
      it("should handle chutes provider", () =>
        runGatewayTest({
          model: "deepseek-tng-r1t2-chimera/chutes",
          expected: {
            providers: [
              {
                url: "https://llm.chutes.ai/v1/chat/completions",
                response: "success",
                model: "tngtech/DeepSeek-TNG-R1T2-Chimera",
                data: createOpenAIMockResponse(
                  "tngtech/DeepSeek-TNG-R1T2-Chimera"
                ),
                expects: chutesAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select chutes provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-tng-r1t2-chimera",
          expected: {
            providers: [
              {
                url: "https://llm.chutes.ai/v1/chat/completions",
                response: "success",
                model: "tngtech/DeepSeek-TNG-R1T2-Chimera",
                data: createOpenAIMockResponse(
                  "tngtech/DeepSeek-TNG-R1T2-Chimera"
                ),
                expects: chutesAuthExpectations,
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

      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                data: createOpenAIMockResponse(
                  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle chutes provider", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b/chutes",
          expected: {
            providers: [
              {
                url: "https://llm.chutes.ai/v1/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                data: createOpenAIMockResponse(
                  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
                ),
                expects: chutesAuthExpectations,
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

  describe("Error scenarios - DeepInfra Provider with DeepSeek R1 Distill Llama 70B", () => {
    it("should handle DeepInfra provider failure for R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/deepinfra",
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

    it("should handle rate limiting from DeepInfra for R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/deepinfra",
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

    it("should handle authentication failure from DeepInfra for R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/deepinfra",
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

  describe("Error scenarios - Chutes Provider with DeepSeek R1 Distill Llama 70B", () => {
    it("should handle Chutes provider failure for R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Chutes service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Chutes for R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Chutes for R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));
  });

  describe("Error scenarios - Novita Provider with DeepSeek V3.2", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "deepseek-v3.2/novita",
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
        model: "deepseek-v3.2/novita",
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
        model: "deepseek-v3.2/novita",
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
  });

  describe("Error scenarios - Chutes Provider with DeepSeek TNG R1T2 Chimera", () => {
    it("should handle Chutes provider failure", () =>
      runGatewayTest({
        model: "deepseek-tng-r1t2-chimera/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Chutes service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Chutes", () =>
      runGatewayTest({
        model: "deepseek-tng-r1t2-chimera/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Chutes", () =>
      runGatewayTest({
        model: "deepseek-tng-r1t2-chimera/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));
  });

  describe("Error scenarios - Canopy Wave Provider with DeepSeek V3.1", () => {
    it("should handle canopywave provider failure for DeepSeek V3.1", () =>
      runGatewayTest({
        model: "deepseek-v3/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Canopy Wave service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Canopy Wave for DeepSeek V3.1", () =>
      runGatewayTest({
        model: "deepseek-v3/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Canopy Wave for DeepSeek V3.1", () =>
      runGatewayTest({
        model: "deepseek-v3/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
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
              customVerify: (_call) => {
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
              customVerify: (_call) => {
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
              model: "deepseek-ai/DeepSeek-R1-0528",
              data: createOpenAIMockResponse("deepseek-ai/DeepSeek-R1-0528"),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra", () =>
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

    it("should construct correct DeepInfra URL for DeepSeek V3.1 Terminus", () =>
      runGatewayTest({
        model: "deepseek-v3.1-terminus/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-V3.1-Terminus",
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-V3.1-Terminus"
              ),
              expects: deepinfraAuthExpectations,
              customVerify: (_call) => {
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
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-V3.1-Terminus"
              ),
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
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-V3.1-Terminus"
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

    it("should construct correct Novita URL for DeepSeek V3.2", () =>
      runGatewayTest({
        model: "deepseek-v3.2/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "deepseek/deepseek-v3.2-exp",
              data: createOpenAIMockResponse("deepseek/deepseek-v3.2-exp"),
              expects: novitaAuthExpectations,
              customVerify: (_call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "deepseek-v3.2/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "deepseek/deepseek-v3.2-exp", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("deepseek/deepseek-v3.2-exp"),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "deepseek-v3.2/novita",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "deepseek/deepseek-v3.2-exp",
              data: createOpenAIMockResponse("deepseek/deepseek-v3.2-exp"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should construct correct DeepInfra URL for DeepSeek R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
              ),
              expects: deepinfraAuthExpectations,
              customVerify: (_call) => {
                // Verify that the URL is correctly constructed for R1 Distill Llama 70B
                // Base URL: https://api.deepinfra.com/
                // Built URL: https://api.deepinfra.com/v1/openai/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for DeepInfra R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
              ),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
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

    it("should construct correct Chutes URL for DeepSeek R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
              ),
              expects: chutesAuthExpectations,
              customVerify: (_call) => {
                // Verify that the URL is correctly constructed for R1 Distill Llama 70B
                // Base URL: https://llm.chutes.ai/
                // Built URL: https://llm.chutes.ai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Chutes R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
              ),
              expects: chutesAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Chutes R1 Distill Llama 70B", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/chutes",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "success",
              model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
              data: createOpenAIMockResponse(
                "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
              ),
              expects: {
                ...chutesAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should construct correct Chutes URL for DeepSeek TNG R1T2 Chimera", () =>
      runGatewayTest({
        model: "deepseek-tng-r1t2-chimera/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "success",
              model: "tngtech/DeepSeek-TNG-R1T2-Chimera",
              data: createOpenAIMockResponse(
                "tngtech/DeepSeek-TNG-R1T2-Chimera"
              ),
              expects: chutesAuthExpectations,
              customVerify: (_call) => {
                // Verify that the URL is correctly constructed for TNG R1T2 Chimera
                // Base URL: https://api.chutes.ai/
                // Built URL: https://llm.chutes.ai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Chutes", () =>
      runGatewayTest({
        model: "deepseek-tng-r1t2-chimera/chutes",
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "success",
              model: "tngtech/DeepSeek-TNG-R1T2-Chimera", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "tngtech/DeepSeek-TNG-R1T2-Chimera"
              ),
              expects: chutesAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Chutes", () =>
      runGatewayTest({
        model: "deepseek-tng-r1t2-chimera/chutes",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://llm.chutes.ai/v1/chat/completions",
              response: "success",
              model: "tngtech/DeepSeek-TNG-R1T2-Chimera",
              data: createOpenAIMockResponse(
                "tngtech/DeepSeek-TNG-R1T2-Chimera"
              ),
              expects: {
                ...chutesAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should construct correct Canopy Wave URL for DeepSeek V3.1", () =>
      runGatewayTest({
        model: "deepseek-v3/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "deepseek/deepseek-chat-v3.1",
              data: createOpenAIMockResponse("deepseek/deepseek-chat-v3.1"),
              expects: canopywaveAuthExpectations,
              customVerify: (_call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://inference.canopywave.io/
                // Built URL: https://inference.canopywave.io/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Canopy Wave", () =>
      runGatewayTest({
        model: "deepseek-v3/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "deepseek/deepseek-chat-v3.1", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("deepseek/deepseek-chat-v3.1"),
              expects: canopywaveAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Canopy Wave", () =>
      runGatewayTest({
        model: "deepseek-v3/canopywave",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "deepseek/deepseek-chat-v3.1",
              data: createOpenAIMockResponse("deepseek/deepseek-chat-v3.1"),
              expects: {
                ...canopywaveAuthExpectations,
                bodyContains: ["user", "Test"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("Passthrough billing tests", () => {
    describe("deepseek-v3 with DeepInfra", () => {
      it("should handle passthrough billing with deepinfra provider", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "Test passthrough billing" }],
              passthroughBilling: true,
            },
          },
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

    describe("deepseek-v3.1-terminus with DeepInfra", () => {
      it("should handle passthrough billing with deepinfra provider", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "Test passthrough billing" }],
              passthroughBilling: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1-Terminus",
                data: createOpenAIMockResponse(
                  "deepseek-ai/DeepSeek-V3.1-Terminus"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-v3.2 with Novita", () => {
      it("should handle passthrough billing with novita provider", () =>
        runGatewayTest({
          model: "deepseek-v3.2/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Test passthrough billing" }],
              passthroughBilling: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.2-exp",
                data: createOpenAIMockResponse("deepseek/deepseek-v3.2-exp"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-tng-r1t2-chimera with Chutes", () => {
      it("should handle passthrough billing with chutes provider", () =>
        runGatewayTest({
          model: "deepseek-tng-r1t2-chimera/chutes",
          request: {
            body: {
              messages: [{ role: "user", content: "Test passthrough billing" }],
              passthroughBilling: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://llm.chutes.ai/v1/chat/completions",
                response: "success",
                model: "tngtech/DeepSeek-TNG-R1T2-Chimera",
                data: createOpenAIMockResponse(
                  "tngtech/DeepSeek-TNG-R1T2-Chimera"
                ),
                expects: chutesAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-r1-distill-llama-70b with Chutes", () => {
      it("should handle passthrough billing with chutes provider", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b/chutes",
          request: {
            body: {
              messages: [{ role: "user", content: "Test passthrough billing" }],
              passthroughBilling: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://llm.chutes.ai/v1/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                data: createOpenAIMockResponse(
                  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
                ),
                expects: chutesAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Caching tests - DeepInfra Provider", () => {
    describe("deepseek-v3 with cache tokens", () => {
      it("should handle response with cached input tokens", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1",
                data: {
                  id: "chatcmpl-test-cached",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-V3.1",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Test response with caching",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 100,
                    completion_tokens: 20,
                    total_tokens: 120,
                    prompt_tokens_details: {
                      cached_tokens: 80,
                    },
                  },
                },
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle request with cache control parameters", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "Test with cache control" }],
              cache_control: { type: "ephemeral" },
            },
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
                  bodyContains: ["cache_control"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle high cache hit ratio response", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1",
                data: {
                  id: "chatcmpl-test-high-cache",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-V3.1",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Response with high cache hit",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 1000,
                    completion_tokens: 50,
                    total_tokens: 1050,
                    prompt_tokens_details: {
                      cached_tokens: 950,
                    },
                  },
                },
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle zero cached tokens", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1",
                data: {
                  id: "chatcmpl-test-no-cache",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-V3.1",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Response without cache",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 100,
                    completion_tokens: 20,
                    total_tokens: 120,
                    prompt_tokens_details: {
                      cached_tokens: 0,
                    },
                  },
                },
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-reasoner with cache tokens", () => {
      it("should handle response with cached input tokens", () =>
        runGatewayTest({
          model: "deepseek-reasoner/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-0528",
                data: {
                  id: "chatcmpl-test-cached-r1",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-R1-0528",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Reasoning response with caching",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 200,
                    completion_tokens: 150,
                    total_tokens: 350,
                    prompt_tokens_details: {
                      cached_tokens: 180,
                    },
                  },
                },
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle request with cache control for reasoner model", () =>
        runGatewayTest({
          model: "deepseek-reasoner/deepinfra",
          request: {
            body: {
              messages: [
                { role: "user", content: "Complex reasoning task with cache" },
              ],
              cache_control: { type: "ephemeral" },
            },
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
                  bodyContains: ["cache_control", "Complex reasoning task"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-v3.1-terminus with cache tokens", () => {
      it("should handle response with cached input tokens", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1-Terminus",
                data: {
                  id: "chatcmpl-test-cached-terminus",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-V3.1-Terminus",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Terminus response with caching",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 500,
                    completion_tokens: 100,
                    total_tokens: 600,
                    prompt_tokens_details: {
                      cached_tokens: 400,
                    },
                  },
                },
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-r1-distill-llama-70b with cache tokens", () => {
      it("should handle response with cached input tokens", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                data: {
                  id: "chatcmpl-test-cached-distill",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Distilled model response with caching",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 300,
                    completion_tokens: 80,
                    total_tokens: 380,
                    prompt_tokens_details: {
                      cached_tokens: 250,
                    },
                  },
                },
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Cache billing verification", () => {
      it("should apply cache multiplier for deepseek-v3 cached tokens", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1",
                data: {
                  id: "chatcmpl-test-billing",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-V3.1",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Test for cache billing",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 1000000,
                    completion_tokens: 1000000,
                    total_tokens: 2000000,
                    prompt_tokens_details: {
                      cached_tokens: 800000,
                    },
                  },
                },
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle mixed cached and non-cached tokens", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.1",
                data: {
                  id: "chatcmpl-test-mixed",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-V3.1",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Mixed cache response",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 1000,
                    completion_tokens: 200,
                    total_tokens: 1200,
                    prompt_tokens_details: {
                      cached_tokens: 500,
                    },
                  },
                },
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Cache with streaming", () => {
      it("should handle cached tokens in streaming mode", () =>
        runGatewayTest({
          model: "deepseek-v3/deepinfra",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test streaming with cache" },
              ],
              stream: true,
            },
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
                  bodyContains: ["stream", "true"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-r1-distill-llama-70b with Chutes cache tokens", () => {
      it("should handle response with cached input tokens", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b/chutes",
          expected: {
            providers: [
              {
                url: "https://llm.chutes.ai/v1/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                data: {
                  id: "chatcmpl-test-cached-chutes",
                  object: "chat.completion",
                  created: Date.now(),
                  model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                  choices: [
                    {
                      index: 0,
                      message: {
                        role: "assistant",
                        content: "Chutes response with caching",
                      },
                      finish_reason: "stop",
                    },
                  ],
                  usage: {
                    prompt_tokens: 300,
                    completion_tokens: 80,
                    total_tokens: 380,
                    prompt_tokens_details: {
                      cached_tokens: 250,
                    },
                  },
                },
                expects: chutesAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle request with cache control parameters", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b/chutes",
          request: {
            body: {
              messages: [{ role: "user", content: "Test with cache control" }],
              cache_control: { type: "ephemeral" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://llm.chutes.ai/v1/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                data: createOpenAIMockResponse(
                  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
                ),
                expects: {
                  ...chutesAuthExpectations,
                  bodyContains: ["cache_control"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });
});
