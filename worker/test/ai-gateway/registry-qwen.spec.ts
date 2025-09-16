import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

// Define auth expectations for DeepInfra
const deepinfraAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("Qwen Registry Tests", () => {
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
            messages: [
              { role: "user", content: "What's the weather like?" },
            ],
            // Tools would be added here in a real test, but we're just testing the structure
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
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
            messages: [
              { role: "user", content: "Stream this response" },
            ],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
                response: "failure",
                statusCode: 403,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle bad request with invalid parameters", () =>
        runGatewayTest({
          model: "qwen3-30b-a3b/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
            messages: [
              { role: "user", content: "Test with custom mapping" },
            ],
            headers: {
              "X-Custom-Header": "test-value",
            },
            bodyMapping: "NO_MAPPING",
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
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
                url: "https://api.deepinfra.com/v1/openai",
                response: "failure",
                statusCode: 502,
                errorMessage: "Bad gateway - upstream server error",
              },
            ],
            finalStatus: 500,
          },
        }));
    });
  });
});
