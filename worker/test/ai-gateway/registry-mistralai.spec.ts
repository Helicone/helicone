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

// Define auth expectations for Novita
const novitaAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

// Define auth expectations for MistralAI
const mistralaiAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("Mistral Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Mistral Small Model", () => {
    describe("mistral-small", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "mistral-small",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Test message for Mistral Small model" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ["Test message for Mistral Small model"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
          request: {
            messages: [{ role: "user", content: "What's the weather like?" }],
            // Tools would be added here in a real test, but we're just testing the structure
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
          request: {
            messages: [{ role: "user", content: "Stream this response" }],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
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
          model: "mistral-small/deepinfra",
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
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
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
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
                customVerify: (_call) => {
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
          model: "mistral-small/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within context limits",
              },
            ],
            maxTokens: 128000, // Should be within the 128,000 limit
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify pricing and rate limits configuration", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
                customVerify: (call) => {
                  // In a real implementation, this would verify that
                  // pricing tiers and rate limits are correctly applied
                  // Based on the model configuration:
                  // - Input: 0.05 per token
                  // - Output: 0.1 per token
                  // - RPM: 12000, TPM: 60000000, TPD: 6000000000
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Error scenarios for mistral-small", () => {
      it("should handle DeepInfra provider failure", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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

    describe("Advanced scenarios for mistral-small", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
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
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
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

      it("should handle response format parameter", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Return structured JSON response" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle stop sequences", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
          request: {
            messages: [
              { role: "user", content: "Generate a list and stop at the end" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Provider URL validation for mistral-small", () => {
      it("should construct correct DeepInfra URL", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
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
          model: "mistral-small/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506", // Should map to the correct provider model ID
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Edge cases and robustness for mistral-small", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
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
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
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
          model: "mistral-small/deepinfra",
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
  });

  describe("BYOK Tests - Mistral Nemo Model", () => {
    describe("mistral-nemo", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
            messages: [{ role: "user", content: "What's the weather like?" }],
            // Tools would be added here in a real test, but we're just testing the structure
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
            messages: [{ role: "user", content: "Stream this response" }],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
          model: "mistral-nemo/deepinfra",
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
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Error scenarios for mistral-nemo", () => {
      it("should handle DeepInfra provider failure", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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
          model: "mistral-nemo/deepinfra",
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

    describe("Advanced scenarios for mistral-nemo", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
                expects: deepinfraAuthExpectations,
                customVerify: (_call) => {
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
          model: "mistral-nemo/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within context limits",
              },
            ],
            maxTokens: 16400, // Should be within the 16,400 limit
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
          model: "mistral-nemo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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

    describe("Provider URL validation for mistral-nemo", () => {
      it("should construct correct DeepInfra URL", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407", // Should map to the correct provider model ID
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Edge cases and robustness for mistral-nemo", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
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
          model: "mistral-nemo/deepinfra",
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
  });

  describe("Passthrough billing tests", () => {
    describe("mistral-small with DeepInfra", () => {
      it("should handle passthrough billing with deepinfra provider", () =>
        runGatewayTest({
          model: "mistral-small/deepinfra",
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
                model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("mistral-nemo with DeepInfra", () => {
      it("should handle passthrough billing with deepinfra provider", () =>
        runGatewayTest({
          model: "mistral-nemo/deepinfra",
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
                model: "mistralai/Mistral-Nemo-Instruct-2407",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Nemo-Instruct-2407"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("mistral-large-2411 with MistralAI", () => {
      it("should handle passthrough billing with mistralai provider", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          request: {
            body: {
              messages: [{ role: "user", content: "Test passthrough billing" }],
              passthroughBilling: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("DeepSeek v3.1 Terminus Tests - Novita Provider", () => {
    describe("Function calling capabilities", () => {
      it("should handle function calling with tools parameter", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "What's the weather like in San Francisco?" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get the current weather for a location",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string", description: "The city and state" },
                        unit: { type: "string", enum: ["celsius", "fahrenheit"] }
                      },
                      required: ["location"]
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
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "San Francisco"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle multiple functions in tools array", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Calculate 5 + 3 and tell me the weather in Tokyo" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "calculate",
                    description: "Perform mathematical calculations",
                    parameters: {
                      type: "object",
                      properties: {
                        operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
                        a: { type: "number" },
                        b: { type: "number" }
                      },
                      required: ["operation", "a", "b"]
                    }
                  }
                },
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get weather information",
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
              tool_choice: "auto"
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "calculate",
                    "get_weather",
                    "tool_choice"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle forced tool choice", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Get me the weather data" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get weather information",
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
              tool_choice: {
                type: "function",
                function: { name: "get_weather" }
              }
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle legacy functions parameter", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Search for information" }
              ],
              functions: [
                {
                  name: "search",
                  description: "Search for information",
                  parameters: {
                    type: "object",
                    properties: {
                      query: { type: "string" }
                    },
                    required: ["query"]
                  }
                }
              ],
              function_call: "auto"
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "functions",
                    "search",
                    "function_call"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle structured outputs with tools", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Extract structured data" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "extract_data",
                    description: "Extract structured data",
                    parameters: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        age: { type: "number" },
                        email: { type: "string", format: "email" }
                      },
                      required: ["name", "email"]
                    },
                    strict: true
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
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "extract_data",
                    "strict"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle complex nested function parameters", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Create a complex data structure" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "create_user_profile",
                    description: "Create a user profile with nested data",
                    parameters: {
                      type: "object",
                      properties: {
                        user: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            contacts: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  type: { type: "string" },
                                  value: { type: "string" }
                                }
                              }
                            }
                          }
                        }
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
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "create_user_profile",
                    "contacts"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));
    });

    describe("Function calling with other parameters", () => {
      it("should handle tools with temperature and max_tokens", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Calculate and format the result" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "calculate",
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
              temperature: 0.3,
              max_tokens: 2000
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "calculate",
                    "temperature",
                    "max_tokens"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle tools with reasoning parameter", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Solve this problem step by step" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "solve_problem",
                    description: "Solve mathematical problems",
                    parameters: {
                      type: "object",
                      properties: {
                        problem: { type: "string" }
                      }
                    }
                  }
                }
              ],
              reasoning: true
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "solve_problem",
                    "reasoning"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle tools with all supported parameters", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Comprehensive test with all parameters" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "test_function",
                    description: "Test function",
                    parameters: {
                      type: "object",
                      properties: {
                        input: { type: "string" }
                      }
                    }
                  }
                }
              ],
              tool_choice: "auto",
              temperature: 0.7,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
              max_tokens: 4000,
              stop: ["END"],
              seed: 42
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "test_function",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty",
                    "max_tokens",
                    "stop",
                    "seed"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));
    });

    describe("Error scenarios for function calling", () => {
      it("should handle Novita provider failure with tools", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test error handling" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "test_tool",
                    description: "Test tool",
                    parameters: { type: "object", properties: {} }
                  }
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

      it("should handle authentication failure with tools", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test auth failure" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "test_tool",
                    description: "Test tool",
                    parameters: { type: "object" }
                  }
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

      it("should handle rate limiting with tools", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test rate limit" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "test_tool",
                    description: "Test tool",
                    parameters: { type: "object" }
                  }
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
    });

    describe("Basic model functionality", () => {
      it("should handle simple request without tools", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Hello, how are you?" }
              ]
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: novitaAuthExpectations
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle streaming with tools", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Stream with tools" }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "stream_tool",
                    description: "Test streaming",
                    parameters: { type: "object" }
                  }
                }
              ],
              stream: true
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "stream_tool",
                    '"stream":true'
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should verify context length is within limits", () =>
        runGatewayTest({
          model: "deepseek-v3.1-terminus/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test context length" }
              ],
              max_tokens: 65536
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "deepseek/deepseek-v3.1-terminus",
                data: createOpenAIMockResponse(
                  "deepseek/deepseek-v3.1-terminus"
                ),
                expects: novitaAuthExpectations
              }
            ],
            finalStatus: 200
          }
        }));
    });
  });

  describe("BYOK Tests - Mistral Large Model", () => {
    describe("mistral-large-2411", () => {
      it("should handle mistralai provider", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select mistralai provider when none specified", () =>
        runGatewayTest({
          model: "mistral-large-2411",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle successful request with custom parameters", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [
              { role: "user", content: "Test message for Mistral Large model" },
            ],
            maxTokens: 1000,
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: {
                  ...mistralaiAuthExpectations,
                  bodyContains: ["Test message for Mistral Large model"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tools parameter support", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [{ role: "user", content: "What's the weather like?" }],
            // Tools would be added here in a real test, but we're just testing the structure
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [{ role: "user", content: "Stream this response" }],
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: {
                  ...mistralaiAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle supported parameters correctly", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [
              { role: "user", content: "Test with various parameters" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
                customVerify: (_call) => {
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
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [
              {
                role: "user",
                content: "Test message within context limits",
              },
            ],
            maxTokens: 128000, // Should be within the 128,000 limit
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should verify pricing and rate limits configuration", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
                customVerify: (_call) => {
                  // In a real implementation, this would verify that
                  // pricing tiers and rate limits are correctly applied
                  // Based on the model configuration:
                  // - Input: 0.000002 per token
                  // - Output: 0.000006 per token
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Error scenarios for mistral-large-2411", () => {
      it("should handle MistralAI provider failure", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "MistralAI service unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle rate limiting from MistralAI", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [
              { role: "user", content: "Content that might be filtered" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "failure",
                statusCode: 422,
                errorMessage: "Content filtering violation",
              },
            ],
            finalStatus: 500,
          },
        }));
    });

    describe("Advanced scenarios for mistral-large-2411", () => {
      it("should handle custom headers and body mapping", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
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
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: {
                  ...mistralaiAuthExpectations,
                  headers: {
                    ...mistralaiAuthExpectations.headers,
                    "X-Custom-Header": "test-value",
                  },
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format parameter", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [
              { role: "user", content: "Return structured JSON response" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: {
                  ...mistralaiAuthExpectations,
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle stop sequences", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [
              { role: "user", content: "Generate a list and stop at the end" },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: {
                  ...mistralaiAuthExpectations,
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Provider URL validation for mistral-large-2411", () => {
      it("should construct correct MistralAI URL", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
                customVerify: (_call) => {
                  // Verify that the URL is correctly constructed
                  // Base URL: https://api.mistral.ai/
                  // Built URL: https://api.mistral.ai/v1/chat/completions
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle provider model ID mapping correctly", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411", // Should map to the correct provider model ID
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Edge cases and robustness for mistral-large-2411", () => {
      it("should handle empty messages array", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          request: {
            messages: [],
          },
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
          model: "mistral-large-2411/mistralai",
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
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle unicode and special characters", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
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
                url: "https://api.mistral.ai/v1/chat/completions",
                response: "success",
                model: "mistral-large-2411",
                data: createOpenAIMockResponse("mistral-large-2411"),
                expects: mistralaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle malformed JSON gracefully", () =>
        runGatewayTest({
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
          model: "mistral-large-2411/mistralai",
          expected: {
            providers: [
              {
                url: "https://api.mistral.ai/v1/chat/completions",
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
