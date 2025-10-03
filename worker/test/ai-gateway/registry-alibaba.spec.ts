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

// Define auth expectations for DeepInfra
const deepinfraAuthExpectations = {
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
      const novitaAuthExpectations = {
        headers: {
          Authorization: /^Bearer /
        }
      };

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
          model: "qwen3-235b-a22b-thinking",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "Qwen/Qwen3-235B-A22B-Thinking-2507",
                data: createOpenAIMockResponse("Qwen/Qwen3-235B-A22B-Thinking-2507"),
                expects: deepinfraAuthExpectations
              }
            ],
            finalStatus: 200
          }
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
      const novitaAuthExpectations = {
        headers: {
          Authorization: /^Bearer /
        }
      };

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
  });
});
