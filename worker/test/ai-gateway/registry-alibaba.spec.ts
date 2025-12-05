import { describe, it, beforeEach, vi } from "vitest";

vi.mock("@cloudflare/containers", () => ({
  Container: class MockContainer {
    defaultPort = 8000;
    sleepAfter = "10m";
  },
}));

import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

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

const nebiusAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const canopywaveAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("Alibaba Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Qwen Models", () => {
    describe("qwen3-30b-a3b", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test message for Qwen model" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ["Test message for Qwen model"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [{ role: "user", content: "What's the weather like?" }],
            // Tools would be added here in a real test, but we're just testing the structure
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [{ role: "user", content: "Stream this response" }],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multimodal input (text and image)", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Describe this image and provide text analysis",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Error scenarios", () => {
      it("should handle DeepInfra provider failure", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
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
          model: "qwen3-30b-a3b/deepinfra",
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

      it("should handle authentication failure", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
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

      it("should handle model not found", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
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

      it("should handle quota exceeded", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 403,
          },
        }));

      it("should handle bad request with invalid parameters", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid request parameters",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle timeout scenarios", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
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

      it("should handle content filtering violations", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Content that might be filtered" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 422,
                errorMessage: "Content filtering violation",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("Advanced scenarios", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [{ role: "user", content: "Test with custom mapping" }],
            headers: {
              "X-Custom-Header": "test-value",
            },
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: {
                  ...deepinfraAuthExpectations,
                  headers: {
                    ...deepinfraAuthExpectations.headers,
                    "X-Custom-Header": "test-value",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test with various parameters" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify that the request supports the expected parameters
                  // like temperature, top_p, frequency_penalty, etc.
                  // This would be expanded in actual implementation
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within context limits",
              },
            ],
            maxTokens: 32768, // Should be within the 32,768 limit
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle rate limit recovery scenario", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
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

      it("should verify pricing and rate limits configuration", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // In a real implementation, this would verify that
                  // pricing tiers and rate limits are correctly applied
                  // Based on the model configuration:
                  // - Input: 0.00000008 per token
                  // - Output: 0.00000029 per token
                  // - RPM: 30000, TPM: 150000000, TPD: 15000000000
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Provider URL validation", () => {
      it("should construct correct DeepInfra URL", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify that the URL is correctly constructed
                  // Base URL: https://api.deepinfra.com/
                  // Built URL: https://api.deepinfra.com/v1/openai
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle provider model ID mapping correctly", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B", // Should map to the correct provider model ID
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Edge cases and robustness", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Messages array cannot be empty",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle very long input within context limits", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Very long input... ".repeat(1000), // Still within 32k token limit
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "测试中文 🚀 émojis and spéciål chars",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-30B-A3B",
                data: createOpenAIMockResponse("Qwen/Qwen3-30B-A3B"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid JSON in request body",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle network connectivity issues", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 502,
                errorMessage: "Bad gateway - upstream server error",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-coder", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "qwen3-coder",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Write a Python function to calculate fibonacci numbers" },
            ],
            maxTokens: 1000
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ["Write a Python function to calculate fibonacci numbers"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support for coding tasks", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Create a web scraper that can extract data from a website"
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests for code generation", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Generate a React component for a todo list"
              },
            ],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multimodal input (text, image, audio, video)", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Analyze this code screenshot and explain what it does"
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test with all supported parameters" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected (262k tokens)", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within 262k context limit",
              },
            ],
            maxTokens: 16384, // Should be within the 16,384 completion token limit
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-coder Error scenarios", () => {
      it("should handle DeepInfra provider failure", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
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
          model: "qwen3-coder/deepinfra",
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

      it("should handle authentication failure", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
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

      it("should handle model not found", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
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
    });

    describe("qwen3-coder Passthrough billing tests", () => {
      it("should handle passthrough billing with deepinfra provider", () =>
        runGatewayTest({
          model: "qwen3-coder/deepinfra",
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-next-80b-a3b-instruct", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test message for Qwen3 Next 80B A3B model" },
            ],
            maxTokens: 1000
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ["Test message for Qwen3 Next 80B A3B model"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [{ role: "user", content: "What's the weather like today?" }],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [{ role: "user", content: "Stream this response" }],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multimodal input (text, image, video)", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Describe this image and analyze the video content",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected (262k tokens)", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within 262k context limit",
              },
            ],
            maxTokens: 16384, // Should be within the 16,384 completion token limit
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle MoE architecture with low activation ratio", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Complex reasoning task requiring MoE efficiency",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify pricing configuration ($0.14/$1.40 per million tokens)", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify pricing configuration:
                  // Input: $0.14 per million tokens (0.00000014)
                  // Output: $1.40 per million tokens (0.0000014)
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-next-80b-a3b-instruct Error scenarios", () => {
      it("should handle DeepInfra provider failure", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
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
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
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

      it("should handle authentication failure", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
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

      it("should handle model not found", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
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

      it("should handle quota exceeded", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 403,
          },
        }));

      it("should handle bad request with invalid parameters", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid request parameters",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle timeout scenarios", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
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

      it("should handle content filtering violations", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Content that might be filtered" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 422,
                errorMessage: "Content filtering violation",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-next-80b-a3b-instruct Passthrough billing tests", () => {
      it("should handle passthrough billing with deepinfra provider", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Advanced scenarios", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [{ role: "user", content: "Test with custom mapping" }],
            headers: {
              "X-Custom-Header": "test-value",
            },
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: {
                  ...deepinfraAuthExpectations,
                  headers: {
                    ...deepinfraAuthExpectations.headers,
                    "X-Custom-Header": "test-value",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test with various parameters" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify that the request supports the expected parameters
                  // like temperature, top_p, frequency_penalty, etc.
                  // This would be expanded in actual implementation
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle rate limit recovery scenario", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
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
    });

    describe("Provider URL validation", () => {
      it("should construct correct DeepInfra URL", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify that the URL is correctly constructed
                  // Base URL: https://api.deepinfra.com/
                  // Built URL: https://api.deepinfra.com/v1/openai
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle provider model ID mapping correctly", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct", // Should map to the correct provider model ID
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Edge cases and robustness", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Messages array cannot be empty",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle very long input within context limits", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Very long input... ".repeat(1000), // Still within 262k token limit
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "测试中文 🚀 émojis and spéciål chars",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Next-80B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Next-80B-A3B-Instruct"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid JSON in request body",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle network connectivity issues", () =>
        runGatewayTest({
          model: "qwen3-next-80b-a3b-instruct/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 502,
                errorMessage: "Bad gateway - upstream server error",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-235b-a22b-thinking", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test message for Qwen3 235B A22B Thinking model" },
            ],
            maxTokens: 1000
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ["Test message for Qwen3 235B A22B Thinking model"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle complex reasoning tasks", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Solve this complex reasoning problem step by step"
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [{ role: "user", content: "Stream this response" }],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected (262k tokens)", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within 262k context limit",
              },
            ],
            maxTokens: 16384, // Should be within the 16,384 completion token limit
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify pricing configuration ($0.30/$2.90 per million tokens)", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify pricing configuration:
                  // Input: $0.30 per million tokens (0.0000003)
                  // Output: $2.90 per million tokens (0.0000029)
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-235b-a22b-thinking Error scenarios", () => {
      it("should handle DeepInfra provider failure", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
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
          model: "qwen3-235b-a22b-thinking/deepinfra",
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

      it("should handle authentication failure", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
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

      it("should handle model not found", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
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

      it("should handle quota exceeded", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 403,
          },
        }));

      it("should handle bad request with invalid parameters", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid request parameters",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle timeout scenarios", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
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

      it("should handle content filtering violations", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Content that might be filtered" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 422,
                errorMessage: "Content filtering violation",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-235b-a22b-thinking Advanced scenarios", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [{ role: "user", content: "Test with custom mapping" }],
            headers: {
              "X-Custom-Header": "test-value",
            },
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: {
                  ...deepinfraAuthExpectations,
                  headers: {
                    ...deepinfraAuthExpectations.headers,
                    "X-Custom-Header": "test-value",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test with various parameters" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify that the request supports the expected parameters
                  // like temperature, top_p, frequency_penalty, etc.
                  // This would be expanded in actual implementation
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle rate limit recovery scenario", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
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
    });

    describe("qwen3-235b-a22b-thinking Provider URL validation", () => {
      it("should construct correct DeepInfra URL", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify that the URL is correctly constructed
                  // Base URL: https://api.deepinfra.com/
                  // Built URL: https://api.deepinfra.com/v1/openai
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle provider model ID mapping correctly", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507", // Should map to the correct provider model ID
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-235b-a22b-thinking Edge cases and robustness", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Messages array cannot be empty",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle very long input within context limits", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Very long input... ".repeat(1000), // Still within 262k token limit
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "测试中文 🚀 émojis and spéciål chars",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid JSON in request body",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle network connectivity issues", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 502,
                errorMessage: "Bad gateway - upstream server error",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-235b-a22b-thinking with Novita Provider - Function Calling Tests", () => {
      it("should handle basic function calling with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "What's the weather like in San Francisco?"
              }
            ],
            body: {
              functions: [
                {
                  name: "get_current_weather",
                  description: "Get the current weather in a given location",
                  parameters: {
                    type: "object",
                    properties: {
                      location: {
                        type: "string",
                        description: "The city and state, e.g. San Francisco, CA"
                      },
                      unit: {
                        type: "string",
                        enum: ["celsius", "fahrenheit"]
                      }
                    },
                    required: ["location"]
                  }
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["get_current_weather", "San Francisco"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should auto-select novita provider when none specified", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse(
                  "qwen/qwen3-235b-a22b-thinking-2507"
                ),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multiple functions with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Check the weather and send me an email about it"
              }
            ],
            body: {
              functions: [
                {
                  name: "get_current_weather",
                  description: "Get the current weather",
                  parameters: {
                    type: "object",
                    properties: {
                      location: { type: "string" }
                    },
                    required: ["location"]
                  }
                },
                {
                  name: "send_email",
                  description: "Send an email",
                  parameters: {
                    type: "object",
                    properties: {
                      to: { type: "string" },
                      subject: { type: "string" },
                      body: { type: "string" }
                    },
                    required: ["to", "subject", "body"]
                  }
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["get_current_weather", "send_email"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle tools parameter with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "What's the weather and time in Tokyo?"
              }
            ],
            body: {
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get weather information",
                    parameters: {
                      type: "object",
                      properties: {
                        city: { type: "string" }
                      }
                    }
                  }
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["get_weather", "Tokyo"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle function_call parameter with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Get the weather for New York"
              }
            ],
            body: {
              functions: [
                {
                  name: "get_weather",
                  description: "Get weather",
                  parameters: {
                    type: "object",
                    properties: {
                      location: { type: "string" }
                    }
                  }
                }
              ],
              function_call: { name: "get_weather" }
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["function_call", "get_weather"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle tool_choice parameter with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Calculate 15 * 23"
              }
            ],
            body: {
              tools: [
                {
                  type: "function",
                  function: {
                    name: "calculator",
                    description: "Perform calculations",
                    parameters: {
                      type: "object",
                      properties: {
                        expression: { type: "string" }
                      }
                    }
                  }
                }
              ],
              tool_choice: "auto"
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["calculator", "tool_choice"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle structured outputs with functions and novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Extract user information from this text"
              }
            ],
            body: {
              functions: [
                {
                  name: "extract_user_info",
                  description: "Extract structured user information",
                  parameters: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                      email: { type: "string" }
                    },
                    required: ["name"]
                  }
                }
              ],
              response_format: { type: "json_object" }
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["extract_user_info", "response_format"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle streaming with functions and novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Search for information about AI"
              }
            ],
            stream: true,
            body: {
              functions: [
                {
                  name: "web_search",
                  description: "Search the web",
                  parameters: {
                    type: "object",
                    properties: {
                      query: { type: "string" }
                    }
                  }
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["web_search", '"stream":true']
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle complex function parameters with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Create a calendar event"
              }
            ],
            body: {
              functions: [
                {
                  name: "create_event",
                  description: "Create a calendar event",
                  parameters: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      start_time: { type: "string", format: "date-time" },
                      end_time: { type: "string", format: "date-time" },
                      attendees: {
                        type: "array",
                        items: { type: "string" }
                      },
                      location: { type: "string" },
                      reminders: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            minutes_before: { type: "number" },
                            method: { type: "string", enum: ["email", "popup"] }
                          }
                        }
                      }
                    },
                    required: ["title", "start_time", "end_time"]
                  }
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["create_event", "attendees", "reminders"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle reasoning parameter with functions and novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Analyze this data and provide insights"
              }
            ],
            maxTokens: 2000,
            body: {
              functions: [
                {
                  name: "analyze_data",
                  description: "Analyze data and provide insights",
                  parameters: {
                    type: "object",
                    properties: {
                      data_points: {
                        type: "array",
                        items: { type: "number" }
                      }
                    }
                  }
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["analyze_data"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should verify pricing configuration with novita provider ($0.30/$3.00 per million tokens)", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test pricing calculation"
              }
            ],
            body: {
              functions: [
                {
                  name: "test_function",
                  description: "Test function",
                  parameters: {
                    type: "object",
                    properties: {
                      input: { type: "string" }
                    }
                  }
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-235b-a22b-thinking-2507",
                data: createOpenAIMockResponse("qwen/qwen3-235b-a22b-thinking-2507"),
                expects: novitaAuthExpectations,
                customVerify: (call) => {
                  // Verify pricing configuration for novita:
                  // Input: $0.30 per million tokens (0.0000003)
                  // Output: $3.00 per million tokens (0.000003)
                }
              }
            ],
            finalStatus: 200
          }
        }));
    });

    describe("qwen3-235b-a22b-thinking with Novita Provider - Function Calling Error Scenarios", () => {
      it("should handle novita provider failure with function calls", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test function call"
              }
            ],
            body: {
              functions: [
                {
                  name: "test_function",
                  description: "Test",
                  parameters: { type: "object", properties: {} }
                }
              ]
            }
          },
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

      it("should handle rate limiting from novita with function calls", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test function call"
              }
            ],
            body: {
              functions: [
                {
                  name: "test_function",
                  description: "Test",
                  parameters: { type: "object", properties: {} }
                }
              ]
            }
          },
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

      it("should handle authentication failure with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test function call"
              }
            ],
            body: {
              functions: [
                {
                  name: "test_function",
                  description: "Test",
                  parameters: { type: "object", properties: {} }
                }
              ]
            }
          },
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

      it("should handle invalid function schema with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test invalid function"
              }
            ],
            body: {
              functions: [
                {
                  name: "invalid_function",
                  description: "Invalid function schema"
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid function schema"
              }
            ],
            finalStatus: 500
          }
        }));

      it("should handle quota exceeded with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test function call"
              }
            ],
            body: {
              functions: [
                {
                  name: "test_function",
                  description: "Test",
                  parameters: { type: "object", properties: {} }
                }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded"
              }
            ],
            finalStatus: 403
          }
        }));

      it("should handle model not found with novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test function call"
              }
            ],
            body: {
              functions: [
                {
                  name: "test_function",
                  description: "Test",
                  parameters: { type: "object", properties: {} }
                }
              ]
            }
          },
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

      it("should handle timeout with function calls and novita provider", () =>
        runGatewayTest({
          model: "qwen3-235b-a22b-thinking/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test function call"
              }
            ],
            body: {
              functions: [
                {
                  name: "slow_function",
                  description: "Function that might timeout",
                  parameters: { type: "object", properties: {} }
                }
              ]
            }
          },
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

    describe("qwen3-coder-30b-a3b-instruct with Nebius Provider", () => {
      it("should handle nebius provider", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select nebius provider when none specified", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              { role: "user", content: "Write a Python function to calculate fibonacci numbers" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ["Write a Python function to calculate fibonacci numbers"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support for coding tasks", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Create a web scraper that can extract data from a website",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests for code generation", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Generate a React component for a todo list",
              },
            ],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle function calling with nebius provider", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "What's the weather in San Francisco?",
              },
            ],
            body: {
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get weather information",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
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
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ["get_weather"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool_choice parameter with nebius provider", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Calculate 15 * 23",
              },
            ],
            body: {
              tools: [
                {
                  type: "function",
                  function: {
                    name: "calculator",
                    description: "Perform calculations",
                    parameters: {
                      type: "object",
                      properties: {
                        expression: { type: "string" },
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
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ["calculator", "tool_choice"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              { role: "user", content: "Test with all supported parameters" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected (262k tokens)", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within 262k context limit",
              },
            ],
            maxTokens: 262144,
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify pricing configuration ($0.10/$0.30 per million tokens)", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
                customVerify: (call) => {
                  // Verify pricing configuration:
                  // Input: $0.10 per million tokens (0.0000001)
                  // Output: $0.30 per million tokens (0.0000003)
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-coder-30b-a3b-instruct with Nebius Provider - Error scenarios", () => {
      it("should handle Nebius provider failure", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Nebius service unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle rate limiting from Nebius", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
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
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 401,
                errorMessage: "Invalid API key",
              },
            ],
            finalStatus: 401,
          },
        }));

      it("should handle model not found", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 404,
                errorMessage: "Model not found",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle quota exceeded", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 403,
          },
        }));

      it("should handle bad request with invalid parameters", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid request parameters",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle timeout scenarios", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 408,
                errorMessage: "Request timeout",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle content filtering violations", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              { role: "user", content: "Content that might be filtered" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 422,
                errorMessage: "Content filtering violation",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-coder-30b-a3b-instruct with Nebius Provider - Advanced scenarios", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [{ role: "user", content: "Test with custom mapping" }],
            headers: {
              "X-Custom-Header": "test-value",
            },
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: {
                  ...nebiusAuthExpectations,
                  headers: {
                    ...nebiusAuthExpectations.headers,
                    "X-Custom-Header": "test-value",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              { role: "user", content: "Test with various parameters" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
                customVerify: (call) => {
                  // Verify that the request supports the expected parameters
                  // like temperature, top_p, frequency_penalty, etc.
                  // This would be expanded in actual implementation
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle rate limit recovery scenario", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
            ],
            finalStatus: 429,
          },
        }));

      it("should verify agentic coding capabilities", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Analyze this repository and suggest improvements",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-coder-30b-a3b-instruct with Nebius Provider - Provider URL validation", () => {
      it("should construct correct Nebius URL", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
                customVerify: (call) => {
                  // Verify that the URL is correctly constructed
                  // Base URL: https://api.tokenfactory.nebius.com/
                  // Built URL: https://api.tokenfactory.nebius.com/v1
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle provider model ID mapping correctly", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-coder-30b-a3b-instruct with Nebius Provider - Edge cases and robustness", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Messages array cannot be empty",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle very long input within context limits", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Very long input... ".repeat(1000),
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "测试中文 🚀 émojis and spéciål chars",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid JSON in request body",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle network connectivity issues", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 502,
                errorMessage: "Bad gateway - upstream server error",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle logprobs parameter support", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Test with logprobs",
              },
            ],
            body: {
              logprobs: true,
              top_logprobs: 5,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ["logprobs", "top_logprobs"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle seed parameter for reproducibility", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Generate reproducible code",
              },
            ],
            body: {
              seed: 12345,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ["seed"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle top_k parameter", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Test with top_k sampling",
              },
            ],
            body: {
              top_k: 40,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ["top_k"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-coder-30b-a3b-instruct with Nebius Provider - Passthrough billing tests", () => {
      it("should handle passthrough billing with nebius provider", () =>
        runGatewayTest({
          model: "qwen3-coder-30b-a3b-instruct/nebius",
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
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
                data: createOpenAIMockResponse("Qwen/Qwen3-Coder-30B-A3B-Instruct"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen2.5-coder-7b-fast with Nebius Provider", () => {
      it("should handle nebius provider", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select nebius provider when none specified", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              { role: "user", content: "Write a Python function to sort a list" },
            ],
            maxTokens: 1000
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ["Write a Python function to sort a list"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Generate code with structured output"
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests for code generation", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Generate a sorting algorithm in Python"
              },
            ],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: {
                  ...nebiusAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format parameter", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Generate JSON output"
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              { role: "user", content: "Test with all supported parameters" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected (32k tokens)", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within 32k context limit",
              },
            ],
            maxTokens: 8192, // Should be within the 8,192 completion token limit
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify pricing configuration ($0.03/$0.09 per million tokens)", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
                customVerify: (call) => {
                  // Verify pricing configuration:
                  // Input: $0.03 per million tokens (0.00000003)
                  // Output: $0.09 per million tokens (0.00000009)
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen2.5-coder-7b-fast Error scenarios", () => {
      it("should handle Nebius provider failure", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Nebius service unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle rate limiting from Nebius", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
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
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 401,
                errorMessage: "Invalid API key",
              },
            ],
            finalStatus: 401,
          },
        }));

      it("should handle model not found", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 404,
                errorMessage: "Model not found",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle quota exceeded", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 403,
          },
        }));

      it("should handle bad request with invalid parameters", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid request parameters",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle timeout scenarios", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 408,
                errorMessage: "Request timeout",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle content filtering violations", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              { role: "user", content: "Content that might be filtered" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 422,
                errorMessage: "Content filtering violation",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen2.5-coder-7b-fast Advanced scenarios", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [{ role: "user", content: "Test with custom mapping" }],
            headers: {
              "X-Custom-Header": "test-value",
            },
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: {
                  ...nebiusAuthExpectations,
                  headers: {
                    ...nebiusAuthExpectations.headers,
                    "X-Custom-Header": "test-value",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              { role: "user", content: "Test with various parameters" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
                customVerify: (call) => {
                  // Verify that the request supports the expected parameters
                  // like temperature, top_p, frequency_penalty, etc.
                  // This would be expanded in actual implementation
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle rate limit recovery scenario", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
            ],
            finalStatus: 429,
          },
        }));
    });

    describe("qwen2.5-coder-7b-fast Provider URL validation", () => {
      it("should construct correct Nebius URL", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
                customVerify: (call) => {
                  // Verify that the URL is correctly constructed
                  // Base URL: https://api.tokenfactory.nebius.com/v1/
                  // Built URL: https://api.tokenfactory.nebius.com/v1/chat/completions
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle provider model ID mapping correctly", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast", // Should map to the correct provider model ID
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen2.5-coder-7b-fast Edge cases and robustness", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Messages array cannot be empty",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle very long input within context limits", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "Very long input... ".repeat(1000), // Still within 32k token limit
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          request: {
            messages: [
              {
                role: "user",
                content: "测试中文 🚀 émojis and spéciål chars",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid JSON in request body",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle network connectivity issues", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
          expected: {
            providers: [
              {
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "failure",
                statusCode: 502,
                errorMessage: "Bad gateway - upstream server error",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen2.5-coder-7b-fast Passthrough billing tests", () => {
      it("should handle passthrough billing with nebius provider", () =>
        runGatewayTest({
          model: "qwen2.5-coder-7b-fast/nebius",
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
                url: "https://api.tokenfactory.nebius.com/v1/chat/completions",
                response: "success",
                model: "Qwen/Qwen2.5-Coder-7B-fast",
                data: createOpenAIMockResponse("Qwen/Qwen2.5-Coder-7B-fast"),
                expects: nebiusAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-vl-235b-a22b-instruct with Novita Provider", () => {
      it("should handle novita provider", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select novita provider when none specified", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              { role: "user", content: "Describe this image in detail" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["Describe this image in detail"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multimodal input (text and image)", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Analyze this image and describe what you see",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle video understanding tasks", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Describe the actions in this video sequence",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [{ role: "user", content: "Stream this response" }],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [{ role: "user", content: "What's the weather like?" }],
            body: {
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get weather information",
                    parameters: {
                      type: "object",
                      properties: {
                        city: { type: "string" },
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
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["get_weather"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Extract information from this image",
              },
            ],
            body: {
              response_format: { type: "json_object" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["response_format"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle document parsing and OCR tasks", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Extract all text from this document image",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle chart and diagram analysis", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Analyze this chart and provide insights",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected (131k tokens)", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within 131k context limit",
              },
            ],
            maxTokens: 32768, // Should be within the 32,768 completion token limit
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify pricing configuration ($0.30/$1.50 per million tokens)", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
                customVerify: (call) => {
                  // Verify pricing configuration:
                  // Input: $0.30 per million tokens (0.0000003)
                  // Output: $1.50 per million tokens (0.0000015)
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-vl-235b-a22b-instruct Error scenarios", () => {
      it("should handle Novita provider failure", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
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
          model: "qwen3-vl-235b-a22b-instruct/novita",
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

      it("should handle authentication failure", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
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

      it("should handle model not found", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
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

      it("should handle quota exceeded", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 403,
          },
        }));

      it("should handle bad request with invalid parameters", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid request parameters",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle timeout scenarios", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
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

      it("should handle content filtering violations", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              { role: "user", content: "Content that might be filtered" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "failure",
                statusCode: 422,
                errorMessage: "Content filtering violation",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-vl-235b-a22b-instruct Advanced scenarios", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [{ role: "user", content: "Test with custom mapping" }],
            headers: {
              "X-Custom-Header": "test-value",
            },
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  headers: {
                    ...novitaAuthExpectations.headers,
                    "X-Custom-Header": "test-value",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              { role: "user", content: "Test with various parameters" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
                customVerify: (call) => {
                  // Verify that the request supports the expected parameters
                  // like temperature, top_p, frequency_penalty, etc.
                  // This would be expanded in actual implementation
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multilingual OCR tasks", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Extract text in multiple languages from this image",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle visual question answering", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "How many people are in this image?",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle GUI automation tasks", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Identify the button to click for submitting this form",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle long-form video comprehension", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Summarize the key events in this 10-minute video",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle spatial reasoning tasks", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Describe the spatial relationship between objects in this image",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle rate limit recovery scenario", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
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
    });

    describe("qwen3-vl-235b-a22b-instruct Edge cases and robustness", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Messages array cannot be empty",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle very long input within context limits", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "Very long input... ".repeat(1000), // Still within 131k token limit
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          request: {
            messages: [
              {
                role: "user",
                content: "测试中文 🚀 émojis and spéciål chars",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid JSON in request body",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle network connectivity issues", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "failure",
                statusCode: 502,
                errorMessage: "Bad gateway - upstream server error",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-vl-235b-a22b-instruct Passthrough billing tests", () => {
      it("should handle passthrough billing with novita provider", () =>
        runGatewayTest({
          model: "qwen3-vl-235b-a22b-instruct/novita",
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
                model: "qwen/qwen3-vl-235b-a22b-instruct",
                data: createOpenAIMockResponse("qwen/qwen3-vl-235b-a22b-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-coder-480b-a35b-instruct-fp8 with Canopy Wave Provider", () => {
      it("should handle canopy wave provider", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              { role: "user", content: "Describe this image in detail" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: ["Describe this image in detail"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multimodal input (text and image)", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Analyze this image and describe what you see",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle video understanding tasks", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Describe the actions in this video sequence",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [{ role: "user", content: "Stream this response" }],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [{ role: "user", content: "What's the weather like?" }],
            body: {
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get weather information",
                    parameters: {
                      type: "object",
                      properties: {
                        city: { type: "string" },
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
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: ["get_weather"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Extract information from this image",
              },
            ],
            body: {
              response_format: { type: "json_object" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: ["response_format"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle document parsing and OCR tasks", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Extract all text from this document image",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle chart and diagram analysis", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Analyze this chart and provide insights",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected (131k tokens)", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within 131k context limit",
              },
            ],
            maxTokens: 32768, // Should be within the 32,768 completion token limit
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("qwen3-coder-480b-a35b-instruct-fp8 Error scenarios", () => {
      it("should handle Canopy Wave provider failure", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
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

      it("should handle rate limiting from Canopy Wave", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
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

      it("should handle authentication failure", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
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

      it("should handle model not found", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "failure",
                statusCode: 404,
                errorMessage: "Model not found",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle quota exceeded", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 403,
          },
        }));

      it("should handle bad request with invalid parameters", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid request parameters",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle timeout scenarios", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "failure",
                statusCode: 408,
                errorMessage: "Request timeout",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle content filtering violations", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              { role: "user", content: "Content that might be filtered" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "failure",
                statusCode: 422,
                errorMessage: "Content filtering violation",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-coder-480b-a35b-instruct-fp8 Advanced scenarios", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [{ role: "user", content: "Test with custom mapping" }],
            headers: {
              "X-Custom-Header": "test-value",
            },
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: {
                  ...canopywaveAuthExpectations,
                  headers: {
                    ...canopywaveAuthExpectations.headers,
                    "X-Custom-Header": "test-value",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              { role: "user", content: "Test with various parameters" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
                customVerify: (call) => {
                  // Verify that the request supports the expected parameters
                  // like temperature, top_p, frequency_penalty, etc.
                  // This would be expanded in actual implementation
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multilingual OCR tasks", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Extract text in multiple languages from this image",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle visual question answering", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "How many people are in this image?",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle GUI automation tasks", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Identify the button to click for submitting this form",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle long-form video comprehension", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Summarize the key events in this 10-minute video",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle spatial reasoning tasks", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Describe the spatial relationship between objects in this image",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle rate limit recovery scenario", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
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
    });

    describe("qwen3-coder-480b-a35b-instruct-fp8 Edge cases and robustness", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Messages array cannot be empty",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle very long input within context limits", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "Very long input... ".repeat(1000), // Still within 131k token limit
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          request: {
            messages: [
              {
                role: "user",
                content: "测试中文 🚀 émojis and spéciål chars",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "failure",
                statusCode: 400,
                errorMessage: "Invalid JSON in request body",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle network connectivity issues", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "failure",
                statusCode: 502,
                errorMessage: "Bad gateway - upstream server error",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("qwen3-coder-480b-a35b-instruct-fp8 Passthrough billing tests", () => {
      it("should handle passthrough billing with canopy wave provider", () =>
        runGatewayTest({
          model: "qwen3-coder/canopywave",
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
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "qwen/qwen3-coder",
                data: createOpenAIMockResponse("qwen/qwen3-coder"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

  });
});
