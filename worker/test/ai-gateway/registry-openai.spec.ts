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

const cerebrasAuthExpectations = {
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

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "gpt-5/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-5",
                data: createOpenAIMockResponse("gpt-5"),
                expects: azureAuthExpectations,
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

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "gpt-5",
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
                model: "gpt-5",
                data: createOpenAIMockResponse("gpt-5"),
                expects: azureAuthExpectations,
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

      it("should handle azure provider", () =>
        runGatewayTest({
          model: "gpt-5-mini/azure",
          expected: {
            providers: [
              {
                url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
                response: "success",
                model: "gpt-5-mini",
                data: createOpenAIMockResponse("gpt-5-mini"),
                expects: azureAuthExpectations,
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

      it("should fallback from openai to azure when openai fails", () =>
        runGatewayTest({
          model: "gpt-5-mini",
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
                model: "gpt-5-mini",
                data: createOpenAIMockResponse("gpt-5-mini"),
                expects: azureAuthExpectations,
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
                model: "o3-2025-04-16",
                data: createOpenAIMockResponse("o3-2025-04-16"),
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
                model: "o3-2025-04-16",
                data: createOpenAIMockResponse("o3-2025-04-16"),
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
                model: "o3-pro-2025-06-10",
                data: createOpenAIMockResponse("o3-pro-2025-06-10"),
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
                model: "o3-pro-2025-06-10",
                data: createOpenAIMockResponse("o3-pro-2025-06-10"),
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

      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "gpt-oss-120b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
                expects: deepinfraAuthExpectations,
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

      // Test tool usage with DeepInfra
      it("should handle tool calls with deepinfra provider", () =>
        runGatewayTest({
          model: "gpt-oss-120b/deepinfra",
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
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
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
          model: "gpt-oss-120b/deepinfra",
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
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
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

    describe("gpt-oss-120b with cerebras provider", () => {
      it("should handle cerebras provider", () =>
        runGatewayTest({
          model: "gpt-oss-120b/cerebras",
          expected: {
            providers: [
              {
                url: "https://api.cerebras.ai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
                expects: cerebrasAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with cerebras provider", () =>
        runGatewayTest({
          model: "gpt-oss-120b/cerebras",
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
                url: "https://api.cerebras.ai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
                expects: {
                  ...cerebrasAuthExpectations,
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

      it("should handle response format with cerebras provider", () =>
        runGatewayTest({
          model: "gpt-oss-120b/cerebras",
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
                url: "https://api.cerebras.ai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
                expects: {
                  ...cerebrasAuthExpectations,
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

      it("should handle all supported parameters with cerebras provider", () =>
        runGatewayTest({
          model: "gpt-oss-120b/cerebras",
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
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.cerebras.ai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
                expects: {
                  ...cerebrasAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "top_p",
                    "stop",
                    "frequency_penalty",
                    "presence_penalty",
                    "seed",
                  ],
                },
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

      it("should handle novita provider", () =>
        runGatewayTest({
          model: "gpt-oss-20b/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-20b",
                data: createOpenAIMockResponse("openai/gpt-oss-20b"),
                expects: novitaAuthExpectations,
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

      it("should handle tool calls with novita provider", () =>
        runGatewayTest({
          model: "gpt-oss-20b/novita",
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
                model: "openai/gpt-oss-20b",
                data: createOpenAIMockResponse("openai/gpt-oss-20b"),
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
          model: "gpt-oss-20b/novita",
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
                model: "openai/gpt-oss-20b",
                data: createOpenAIMockResponse("openai/gpt-oss-20b"),
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
          model: "gpt-oss-20b/novita",
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
              logit_bias: { "100": -100 },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-20b",
                data: createOpenAIMockResponse("openai/gpt-oss-20b"),
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
                    "logit_bias",
                  ],
                },
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
              {
                url: "https://openrouter.ai/api/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "OpenRouter endpoint unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));
    });
  });

  // Error scenarios and edge cases for gpt-oss with DeepInfra
  describe("Error scenarios - gpt-oss-120b with DeepInfra Provider", () => {
    it("should handle DeepInfra provider failure", () =>
      runGatewayTest({
        model: "gpt-oss-120b/deepinfra",
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
        model: "gpt-oss-120b/deepinfra",
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
        model: "gpt-oss-120b/deepinfra",
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
        model: "gpt-oss-120b/deepinfra",
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
        model: "gpt-oss-120b/deepinfra",
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

  // Error scenarios and edge cases for gpt-oss-120b with Cerebras
  describe("Error scenarios - gpt-oss-120b with Cerebras Provider", () => {
    it("should handle Cerebras provider failure", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Cerebras service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Cerebras", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Cerebras", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Cerebras", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Cerebras", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  // Error scenarios and edge cases for gpt-oss-20b with Novita
  describe("Error scenarios - gpt-oss-20b with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "gpt-oss-20b/novita",
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
        model: "gpt-oss-20b/novita",
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
        model: "gpt-oss-20b/novita",
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
        model: "gpt-oss-20b/novita",
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
        model: "gpt-oss-20b/novita",
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

  // Provider URL validation and model mapping for gpt-oss with DeepInfra
  describe("Provider validation - gpt-oss-120b with DeepInfra", () => {
    it("should construct correct DeepInfra URL for gpt-oss-120b", () =>
      runGatewayTest({
        model: "gpt-oss-120b/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "openai/gpt-oss-120b",
              data: createOpenAIMockResponse("openai/gpt-oss-120b"),
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
        model: "gpt-oss-120b/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "openai/gpt-oss-120b", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("openai/gpt-oss-120b"),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra", () =>
      runGatewayTest({
        model: "gpt-oss-120b/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "openai/gpt-oss-120b",
              data: createOpenAIMockResponse("openai/gpt-oss-120b"),
              expects: {
                ...deepinfraAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    // Test all supported parameters
    it("should handle all supported parameters with DeepInfra", () =>
      runGatewayTest({
        model: "gpt-oss-120b/deepinfra",
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
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "openai/gpt-oss-120b",
              data: createOpenAIMockResponse("openai/gpt-oss-120b"),
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
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  // Provider URL validation and model mapping for gpt-oss-120b with Cerebras
  describe("Provider validation - gpt-oss-120b with Cerebras", () => {
    it("should construct correct Cerebras URL for gpt-oss-120b", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-120b",
              data: createOpenAIMockResponse("openai/gpt-oss-120b"),
              expects: cerebrasAuthExpectations,
              customVerify: (_call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.cerebras.ai/
                // Built URL: https://api.cerebras.ai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Cerebras", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-120b", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("openai/gpt-oss-120b"),
              expects: cerebrasAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Cerebras", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-120b",
              data: createOpenAIMockResponse("openai/gpt-oss-120b"),
              expects: {
                ...cerebrasAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle all supported parameters with Cerebras", () =>
      runGatewayTest({
        model: "gpt-oss-120b/cerebras",
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
            response_format: { type: "text" },
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.cerebras.ai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-120b",
              data: createOpenAIMockResponse("openai/gpt-oss-120b"),
              expects: {
                ...cerebrasAuthExpectations,
                bodyContains: [
                  "max_tokens",
                  "temperature",
                  "top_p",
                  "stop",
                  "frequency_penalty",
                  "presence_penalty",
                  "seed",
                  "response_format",
                ],
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  // Provider URL validation and model mapping for gpt-oss-20b with Novita
  describe("Provider validation - gpt-oss-20b with Novita", () => {
    it("should construct correct Novita URL for gpt-oss-20b", () =>
      runGatewayTest({
        model: "gpt-oss-20b/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-20b",
              data: createOpenAIMockResponse("openai/gpt-oss-20b"),
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
        model: "gpt-oss-20b/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-20b", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("openai/gpt-oss-20b"),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "gpt-oss-20b/novita",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-20b",
              data: createOpenAIMockResponse("openai/gpt-oss-20b"),
              expects: {
                ...novitaAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle structured outputs with Novita", () =>
      runGatewayTest({
        model: "gpt-oss-20b/novita",
        request: {
          body: {
            messages: [{ role: "user", content: "Generate structured data" }],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "user_data",
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    age: { type: "number" },
                  },
                  required: ["name", "age"],
                },
              },
            },
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-20b",
              data: createOpenAIMockResponse("openai/gpt-oss-20b"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["response_format", "json_schema", "user_data"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle reasoning parameters with Novita", () =>
      runGatewayTest({
        model: "gpt-oss-20b/novita",
        request: {
          body: {
            messages: [
              { role: "user", content: "Solve this problem step by step" },
            ],
            reasoning: { enabled: true },
            max_tokens: 2000,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "openai/gpt-oss-20b",
              data: createOpenAIMockResponse("openai/gpt-oss-20b"),
              expects: {
                ...novitaAuthExpectations,
                bodyContains: ["reasoning", "max_tokens"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });
});
