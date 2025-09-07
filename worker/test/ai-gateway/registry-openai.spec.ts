import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

// Define auth expectations for different providers
const openaiAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const azureAuthExpectations = {
  headers: {
    "api-key": "test-azure-api-key",
  },
};

const groqAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("OpenAI Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - OpenAI Models", () => {
    describe("gpt-4o", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-4o/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4o",
                data: createOpenAIMockResponse("gpt-4o"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "gpt-4o/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4o",
                data: createOpenAIMockResponse("gpt-4o"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-4o",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4o",
                data: createOpenAIMockResponse("gpt-4o"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "gpt-4o",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4o",
                data: createOpenAIMockResponse("gpt-4o"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-4o-mini", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-4o-mini/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4o-mini",
                data: createOpenAIMockResponse("gpt-4o-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "gpt-4o-mini/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4o-mini",
                data: createOpenAIMockResponse("gpt-4o-mini"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-4o-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4o-mini",
                data: createOpenAIMockResponse("gpt-4o-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "gpt-4o-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4o-mini",
                data: createOpenAIMockResponse("gpt-4o-mini"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("chatgpt-4o-latest", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "chatgpt-4o-latest/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "chatgpt-4o-latest",
                data: createOpenAIMockResponse("chatgpt-4o-latest"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "chatgpt-4o-latest",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "chatgpt-4o-latest",
                data: createOpenAIMockResponse("chatgpt-4o-latest"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-4.1", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-4.1/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4.1",
                data: createOpenAIMockResponse("gpt-4.1"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "gpt-4.1/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4.1",
                data: createOpenAIMockResponse("gpt-4.1"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-4.1",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4.1",
                data: createOpenAIMockResponse("gpt-4.1"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "gpt-4.1",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4.1",
                data: createOpenAIMockResponse("gpt-4.1"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-4.1-mini", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-4.1-mini/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4.1-mini",
                data: createOpenAIMockResponse("gpt-4.1-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "gpt-4.1-mini/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4.1-mini",
                data: createOpenAIMockResponse("gpt-4.1-mini"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-4.1-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4.1-mini",
                data: createOpenAIMockResponse("gpt-4.1-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "gpt-4.1-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4.1-mini",
                data: createOpenAIMockResponse("gpt-4.1-mini"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-4.1-nano", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-4.1-nano/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4.1-nano",
                data: createOpenAIMockResponse("gpt-4.1-nano"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "gpt-4.1-nano/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4.1-nano",
                data: createOpenAIMockResponse("gpt-4.1-nano"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-4.1-nano",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-4.1-nano",
                data: createOpenAIMockResponse("gpt-4.1-nano"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "gpt-4.1-nano",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4.1-nano",
                data: createOpenAIMockResponse("gpt-4.1-nano"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-5", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-5/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-5",
                data: createOpenAIMockResponse("gpt-5"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-5",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-5",
                data: createOpenAIMockResponse("gpt-5"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-5-mini", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-5-mini/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-5-mini",
                data: createOpenAIMockResponse("gpt-5-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-5-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-5-mini",
                data: createOpenAIMockResponse("gpt-5-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-5-nano", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-5-nano/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-5-nano",
                data: createOpenAIMockResponse("gpt-5-nano"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-5-nano",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-5-nano",
                data: createOpenAIMockResponse("gpt-5-nano"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-5-chat-latest", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "gpt-5-chat-latest/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-5-chat-latest",
                data: createOpenAIMockResponse("gpt-5-chat-latest"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "gpt-5-chat-latest",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "gpt-5-chat-latest",
                data: createOpenAIMockResponse("gpt-5-chat-latest"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("o3", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "o3/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "o3",
                data: createOpenAIMockResponse("o3"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "o3",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "o3",
                data: createOpenAIMockResponse("o3"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("o3-pro", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "o3-pro/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "o3-pro",
                data: createOpenAIMockResponse("o3-pro"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "o3-pro",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "o3-pro",
                data: createOpenAIMockResponse("o3-pro"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("o3-mini", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "o3-mini/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "o3-mini",
                data: createOpenAIMockResponse("o3-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "o3-mini/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "o3-mini",
                data: createOpenAIMockResponse("o3-mini"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "o3-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "o3-mini",
                data: createOpenAIMockResponse("o3-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "o3-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "o3-mini",
                data: createOpenAIMockResponse("o3-mini"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("o4-mini", () => {
      it("should handle openai provider", () =>
        runGatewayTest({
          model: "o4-mini/openai",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "o4-mini",
                data: createOpenAIMockResponse("o4-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "o4-mini/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "o4-mini",
                data: createOpenAIMockResponse("o4-mini"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select openai provider when none specified", () =>
        runGatewayTest({
          model: "o4-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "success",
                model: "o4-mini",
                data: createOpenAIMockResponse("o4-mini"),
                expects: openaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "o4-mini",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "o4-mini",
                data: createOpenAIMockResponse("o4-mini"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // OpenAI OSS models via Groq
    describe("gpt-oss-120b", () => {
      it("should handle groq provider", () =>
        runGatewayTest({
          model: "gpt-oss-120b/groq",
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
                expects: groqAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select groq provider when none specified", () =>
        runGatewayTest({
          model: "gpt-oss-120b",
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
                expects: groqAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("gpt-oss-20b", () => {
      it("should handle groq provider", () =>
        runGatewayTest({
          model: "gpt-oss-20b/groq",
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-20b",
                data: createOpenAIMockResponse("openai/gpt-oss-20b"),
                expects: groqAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select groq provider when none specified", () =>
        runGatewayTest({
          model: "gpt-oss-20b",
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-20b",
                data: createOpenAIMockResponse("openai/gpt-oss-20b"),
                expects: groqAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // More complex test using the full framework
    describe("Advanced scenarios", () => {
      it("should handle custom error messages", () =>
        runGatewayTest({
          model: "gpt-4o",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-4o",
                data: createOpenAIMockResponse("gpt-4o"),
                expects: azureAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fail when all providers fail", () =>
        runGatewayTest({
          model: "gpt-4o",
          expected: {
            providers: [
              {
                url: "https://api.openai.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Internal server error",
              },
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "failure",
                statusCode: 500,
                errorMessage: "Azure endpoint unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));
    });
  });
});