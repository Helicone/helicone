import { SELF } from "cloudflare:test";
import { fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import "../setup";
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment,
  mockAnthropicEndpoint,
  mockVertexAnthropicEndpoint,
  mockBedrockAnthropicEndpoint,
  createAIGatewayRequest,
  createAnthropicMockResponse
} from "../test-utils";

describe("Anthropic Registry Tests", () => {
  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  describe("BYOK Tests - Anthropic Models", () => {
    // Claude 3.5 Haiku Tests
    describe("claude-3.5-haiku", () => {
      it("should handle anthropic provider", async () => {
        mockAnthropicEndpoint("claude-3-5-haiku-20241022");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("claude-3.5-haiku/anthropic")
        );

        expect(response.status).toBe(200);
        const body = (await response.json()) as any;
        expect(body).toHaveProperty("model");
        expect(body.model).toContain("claude-3-5-haiku");
      });

      it("should handle vertex provider", async () => {
        mockVertexAnthropicEndpoint("claude-3-5-haiku@20241022");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("claude-3.5-haiku/vertex")
        );

        expect(response.status).toBe(200);
      });

      it("should handle bedrock provider with region", async () => {
        mockBedrockAnthropicEndpoint("anthropic.claude-3-5-haiku-20241022-v1:0");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("claude-3.5-haiku/bedrock")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select first provider when none specified", async () => {
        // The first provider in registry should be selected automatically
        // For claude-3.5-haiku, first provider is anthropic
        mockAnthropicEndpoint("claude-3-5-haiku-20241022");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("claude-3.5-haiku")
        );

        expect(response.status).toBe(200);
        const body = (await response.json()) as any;
        expect(body).toHaveProperty("model");
        expect(body.model).toContain("claude-3-5-haiku");
      });

      it("should fallback through providers when none specified", async () => {
        // Mock first provider (anthropic) failure
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Anthropic provider failed" },
          }))
          .persist();

        // Mock second provider (vertex) failure
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ path: "/*", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Vertex provider failed" },
          }))
          .persist();

        // Mock third provider (bedrock) success
        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-3-5-haiku-20241022-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-3.5-haiku"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.5-haiku", // No provider, should try anthropic -> vertex -> bedrock
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Claude 3.5 Sonnet V2 Tests
    describe("claude-3.5-sonnet-v2", () => {
      it("should handle anthropic provider", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse(
              "claude-3.5-sonnet-v2"
            ),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.5-sonnet-v2/anthropic",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle vertex provider", async () => {
        // Mock Vertex AI endpoint
        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-sonnet-v2@20241022:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [
                {
                  content: {
                    parts: [{ text: "Test response from Vertex" }],
                    role: "model",
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.5-sonnet-v2/vertex",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle bedrock provider", async () => {
        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-3-5-sonnet-20241022-v2:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse(
              "claude-3.5-sonnet-v2"
            ),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.5-sonnet-v2/bedrock",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select provider when none specified", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse(
              "claude-3.5-sonnet-v2"
            ),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.5-sonnet-v2", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should fallback through providers when none specified", async () => {
        // First anthropic fails, then tries vertex, then bedrock
        let anthropicCalled = false;
        let vertexCalled = false;

        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => {
            anthropicCalled = true;
            return { statusCode: 500, data: { error: "Service unavailable" } };
          })
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-sonnet-v2@20241022:streamRawPredict",
            method: "POST",
          })
          .reply(() => {
            vertexCalled = true;
            return { statusCode: 500, data: { error: "Service unavailable" } };
          })
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-3-5-sonnet-20241022-v2:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse(
              "claude-3.5-sonnet-v2"
            ),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.5-sonnet-v2", // No provider, should try anthropic -> vertex -> bedrock
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Claude 3.7 Sonnet Tests
    describe("claude-3.7-sonnet", () => {
      it("should handle anthropic provider", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-3.7-sonnet"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.7-sonnet/anthropic",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle vertex provider", async () => {
        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-7-sonnet@20250219:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [
                {
                  content: {
                    parts: [{ text: "Test response from Vertex" }],
                    role: "model",
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.7-sonnet/vertex",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle bedrock provider", async () => {
        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-3.7-sonnet"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.7-sonnet/bedrock",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select provider when none specified", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-3.7-sonnet"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.7-sonnet", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should fallback through providers when none specified", async () => {
        // First anthropic fails, then tries vertex, then bedrock
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Service unavailable" },
          }))
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-7-sonnet@20250219:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Service unavailable" },
          }))
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-3.7-sonnet"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-3.7-sonnet", // No provider, should fallback
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Claude Opus 4 Tests
    describe("claude-opus-4", () => {
      it("should handle anthropic provider", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-opus-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4/anthropic",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle vertex provider", async () => {
        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4@20250514:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [
                {
                  content: {
                    parts: [{ text: "Test response from Vertex" }],
                    role: "model",
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4/vertex",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle bedrock provider", async () => {
        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-opus-4-20250514-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-opus-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4/bedrock",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select provider when none specified", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-opus-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should fallback through providers when none specified", async () => {
        // First anthropic fails, then tries vertex, then bedrock
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Service unavailable" },
          }))
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4@20250514:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Service unavailable" },
          }))
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-opus-4-20250514-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-opus-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4", // No provider, should fallback
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Claude Opus 4.1 Tests
    describe("claude-opus-4-1", () => {
      it("should handle anthropic provider", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-opus-4-1"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4-1/anthropic",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle vertex provider", async () => {
        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4-1@20250805:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [
                {
                  content: {
                    parts: [{ text: "Test response from Vertex" }],
                    role: "model",
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4-1/vertex",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle bedrock provider", async () => {
        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-opus-4-1-20250805-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-opus-4-1"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4-1/bedrock",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select provider when none specified", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-opus-4-1"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4-1", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should fallback through providers when none specified", async () => {
        // First anthropic fails, then tries vertex, then bedrock
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Service unavailable" },
          }))
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4-1@20250805:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Service unavailable" },
          }))
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-opus-4-1-20250805-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-opus-4-1"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-opus-4-1", // No provider, should fallback
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Claude Sonnet 4 Tests
    describe("claude-sonnet-4", () => {
      it("should handle anthropic provider", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-sonnet-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4/anthropic",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle vertex provider", async () => {
        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-sonnet-4@20250514:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [
                {
                  content: {
                    parts: [{ text: "Test response from Vertex" }],
                    role: "model",
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4/vertex",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle bedrock provider", async () => {
        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-sonnet-4-20250514-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-sonnet-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4/bedrock",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select provider when none specified", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-sonnet-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should fallback through providers when none specified", async () => {
        // First anthropic fails, then tries vertex, then bedrock
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Service unavailable" },
          }))
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-sonnet-4@20250514:streamRawPredict",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 500,
            data: { error: "Service unavailable" },
          }))
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-sonnet-4-20250514-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: createAnthropicMockResponse("claude-sonnet-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4", // No provider, should fallback
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });
  });
});
