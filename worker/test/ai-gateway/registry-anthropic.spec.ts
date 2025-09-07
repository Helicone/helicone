import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createAnthropicMockResponse } from "../test-utils";

// Define auth expectations for different providers
const anthropicAuthExpectations = {
  headers: {
    // Anthropic uses OpenAI compatibility mode with Authorization header for /v1/chat/completions
    Authorization: /^Bearer /,
  },
};

const vertexAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const bedrockAuthExpectations = {
  headers: {
    // Bedrock uses AWS Signature v4 authentication
    Authorization: /^AWS4-HMAC-SHA256/,
  },
};

describe("Anthropic Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Anthropic Models", () => {
    // Claude 3.5 Haiku Tests
    describe("claude-3.5-haiku", () => {
      it("should handle anthropic provider", () =>
        runGatewayTest({
          model: "claude-3.5-haiku/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-3-5-haiku-20241022",
                data: createAnthropicMockResponse("claude-3.5-haiku"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle vertex provider", () =>
        runGatewayTest({
          model: "claude-3.5-haiku/vertex",
          expected: {
            providers: [
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-haiku@20241022:streamRawPredict",
                response: "success",
                model: "claude-3-5-haiku@20241022",
                data: createAnthropicMockResponse("claude-3.5-haiku"),
                expects: vertexAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle bedrock provider with region", () =>
        runGatewayTest({
          model: "claude-3.5-haiku/bedrock",
          expected: {
            providers: [
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-5-haiku-20241022-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-3-5-haiku-20241022-v1:0",
                data: createAnthropicMockResponse("claude-3.5-haiku"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select first provider when none specified", () =>
        runGatewayTest({
          model: "claude-3.5-haiku",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-3-5-haiku-20241022",
                data: createAnthropicMockResponse("claude-3.5-haiku"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback through providers when none specified", () =>
        runGatewayTest({
          model: "claude-3.5-haiku",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Anthropic provider failed",
              },
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-haiku@20241022:streamRawPredict",
                response: "failure",
                statusCode: 500,
                errorMessage: "Vertex provider failed",
              },
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-5-haiku-20241022-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-3-5-haiku-20241022-v1:0",
                data: createAnthropicMockResponse("claude-3.5-haiku"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Claude 3.5 Sonnet V2 Tests
    describe("claude-3.5-sonnet-v2", () => {
      it("should handle anthropic provider", () =>
        runGatewayTest({
          model: "claude-3.5-sonnet-v2/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-3-5-sonnet-20241022",
                data: createAnthropicMockResponse("claude-3.5-sonnet-v2"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle vertex provider", () =>
        runGatewayTest({
          model: "claude-3.5-sonnet-v2/vertex",
          expected: {
            providers: [
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-sonnet-v2@20241022:streamRawPredict",
                response: "success",
                model: "claude-3-5-sonnet-v2@20241022",
                data: createAnthropicMockResponse("claude-3.5-sonnet-v2"),
                expects: vertexAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle bedrock provider", () =>
        runGatewayTest({
          model: "claude-3.5-sonnet-v2/bedrock",
          expected: {
            providers: [
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-5-sonnet-20241022-v2:0/invoke",
                response: "success",
                model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
                data: createAnthropicMockResponse("claude-3.5-sonnet-v2"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select provider when none specified", () =>
        runGatewayTest({
          model: "claude-3.5-sonnet-v2",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-3-5-sonnet-20241022",
                data: createAnthropicMockResponse("claude-3.5-sonnet-v2"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback through providers when none specified", () =>
        runGatewayTest({
          model: "claude-3.5-sonnet-v2",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-sonnet-v2@20241022:streamRawPredict",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-5-sonnet-20241022-v2:0/invoke",
                response: "success",
                model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
                data: createAnthropicMockResponse("claude-3.5-sonnet-v2"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Claude 3.7 Sonnet Tests
    describe("claude-3.7-sonnet", () => {
      it("should handle anthropic provider", () =>
        runGatewayTest({
          model: "claude-3.7-sonnet/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-3-7-sonnet-20250219",
                data: createAnthropicMockResponse("claude-3.7-sonnet"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle vertex provider", () =>
        runGatewayTest({
          model: "claude-3.7-sonnet/vertex",
          expected: {
            providers: [
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-7-sonnet@20250219:streamRawPredict",
                response: "success",
                model: "claude-3-7-sonnet@20250219",
                data: createAnthropicMockResponse("claude-3.7-sonnet"),
                expects: vertexAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle bedrock provider", () =>
        runGatewayTest({
          model: "claude-3.7-sonnet/bedrock",
          expected: {
            providers: [
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-3-7-sonnet-20250219-v1:0",
                data: createAnthropicMockResponse("claude-3.7-sonnet"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select provider when none specified", () =>
        runGatewayTest({
          model: "claude-3.7-sonnet",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-3-7-sonnet-20250219",
                data: createAnthropicMockResponse("claude-3.7-sonnet"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback through providers when none specified", () =>
        runGatewayTest({
          model: "claude-3.7-sonnet",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-7-sonnet@20250219:streamRawPredict",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-3-7-sonnet-20250219-v1:0",
                data: createAnthropicMockResponse("claude-3.7-sonnet"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Claude Opus 4 Tests
    describe("claude-opus-4", () => {
      it("should handle anthropic provider", () =>
        runGatewayTest({
          model: "claude-opus-4/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-opus-4-20250514",
                data: createAnthropicMockResponse("claude-opus-4"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle vertex provider", () =>
        runGatewayTest({
          model: "claude-opus-4/vertex",
          expected: {
            providers: [
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4@20250514:streamRawPredict",
                response: "success",
                model: "claude-opus-4@20250514",
                data: createAnthropicMockResponse("claude-opus-4"),
                expects: vertexAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle bedrock provider", () =>
        runGatewayTest({
          model: "claude-opus-4/bedrock",
          expected: {
            providers: [
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-opus-4-20250514-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-opus-4-20250514-v1:0",
                data: createAnthropicMockResponse("claude-opus-4"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select provider when none specified", () =>
        runGatewayTest({
          model: "claude-opus-4",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-opus-4-20250514",
                data: createAnthropicMockResponse("claude-opus-4"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback through providers when none specified", () =>
        runGatewayTest({
          model: "claude-opus-4",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4@20250514:streamRawPredict",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-opus-4-20250514-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-opus-4-20250514-v1:0",
                data: createAnthropicMockResponse("claude-opus-4"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Claude Opus 4.1 Tests
    describe("claude-opus-4-1", () => {
      it("should handle anthropic provider", () =>
        runGatewayTest({
          model: "claude-opus-4-1/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-opus-4-1-20250805",
                data: createAnthropicMockResponse("claude-opus-4-1"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle vertex provider", () =>
        runGatewayTest({
          model: "claude-opus-4-1/vertex",
          expected: {
            providers: [
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4-1@20250805:streamRawPredict",
                response: "success",
                model: "claude-opus-4-1@20250805",
                data: createAnthropicMockResponse("claude-opus-4-1"),
                expects: vertexAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle bedrock provider", () =>
        runGatewayTest({
          model: "claude-opus-4-1/bedrock",
          expected: {
            providers: [
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-opus-4-1-20250805-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-opus-4-1-20250805-v1:0",
                data: createAnthropicMockResponse("claude-opus-4-1"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select provider when none specified", () =>
        runGatewayTest({
          model: "claude-opus-4-1",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-opus-4-1-20250805",
                data: createAnthropicMockResponse("claude-opus-4-1"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback through providers when none specified", () =>
        runGatewayTest({
          model: "claude-opus-4-1",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4-1@20250805:streamRawPredict",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-opus-4-1-20250805-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-opus-4-1-20250805-v1:0",
                data: createAnthropicMockResponse("claude-opus-4-1"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Claude Sonnet 4 Tests
    describe("claude-sonnet-4", () => {
      it("should handle anthropic provider", () =>
        runGatewayTest({
          model: "claude-sonnet-4/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-sonnet-4-20250514",
                data: createAnthropicMockResponse("claude-sonnet-4"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle vertex provider", () =>
        runGatewayTest({
          model: "claude-sonnet-4/vertex",
          expected: {
            providers: [
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-sonnet-4@20250514:streamRawPredict",
                response: "success",
                model: "claude-sonnet-4@20250514",
                data: createAnthropicMockResponse("claude-sonnet-4"),
                expects: vertexAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle bedrock provider", () =>
        runGatewayTest({
          model: "claude-sonnet-4/bedrock",
          expected: {
            providers: [
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-sonnet-4-20250514-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-sonnet-4-20250514-v1:0",
                data: createAnthropicMockResponse("claude-sonnet-4"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select provider when none specified", () =>
        runGatewayTest({
          model: "claude-sonnet-4",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "success",
                model: "claude-sonnet-4-20250514",
                data: createAnthropicMockResponse("claude-sonnet-4"),
                expects: anthropicAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should fallback through providers when none specified", () =>
        runGatewayTest({
          model: "claude-sonnet-4",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-sonnet-4@20250514:streamRawPredict",
                response: "failure",
                statusCode: 500,
                errorMessage: "Service unavailable",
              },
              {
                url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-sonnet-4-20250514-v1:0/invoke",
                response: "success",
                model: "anthropic.claude-sonnet-4-20250514-v1:0",
                data: createAnthropicMockResponse("claude-sonnet-4"),
                expects: bedrockAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Error Scenarios
    describe("Error scenarios", () => {
      it("should handle Anthropic provider failure", () =>
        runGatewayTest({
          model: "claude-3.5-haiku/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Anthropic service unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle rate limiting from Anthropic", () =>
        runGatewayTest({
          model: "claude-3.5-sonnet-v2/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
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
          model: "claude-opus-4/anthropic",
          expected: {
            providers: [
              {
                url: "https://api.anthropic.com/v1/chat/completions",
                response: "failure",
                statusCode: 401,
                errorMessage: "Invalid API key",
              },
            ],
            finalStatus: 401,
          },
        }));
    });
  });
});