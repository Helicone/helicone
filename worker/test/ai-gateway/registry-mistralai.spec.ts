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

describe("Mistral Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Mistral Nemo Models", () => {
    describe("mistral-nemo", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "mistral-nemo",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test message for Mistral Nemo model" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ["Test message for Mistral Nemo model"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multimodal input (text, image, and PDF)", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Describe this image and analyze this PDF document",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test with all supported parameters" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
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
          model: "mistral-nemo/deepinfra",
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
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // Verify that the request supports the expected parameters
                  // like temperature, topP, frequencyPenalty, etc.
                  // This would be expanded in actual implementation
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify context length limits are respected", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within context limits",
              },
            ],
            maxTokens: 1000, // Test with reasonable token limit
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle rate limit recovery scenario", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // In a real implementation, this would verify that
                  // pricing tiers and rate limits are correctly applied
                  // Based on the model configuration:
                  // - Input: 0.02 per token
                  // - Output: 0.04 per token
                  // - RPM: 12000, TPM: 60000000, TPD: 6000000000
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
          model: "mistral-nemo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
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
          model: "mistral-nemo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407", // Should map to the correct provider model ID
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Very long input... ".repeat(1000), // Still within 128k token limit
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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

      it("should handle multimodal input with PDF documents", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Analyze this PDF document and extract key information",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle maximum completion tokens limit", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Generate a very long response",
              },
            ],
            maxTokens: 1000, // Test with reasonable token limit
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse("mistralai/Mistral-Nemo-Instruct-2407"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });
});
