import { SELF, fetchMock } from "cloudflare:test";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import { registry } from "@helicone-package/cost/models/registry";
import { UserEndpointConfig } from "@helicone-package/cost/models/types";
import "../setup";
import { type TestCase } from "../providers/base.test-config";
import { anthropicTestConfig } from "../providers/anthropic.test-config";

function mockRequiredServices() {
  const callTrackers = {
    s3Called: false,
    loggingCalled: false,
  };

  const s3Mock = fetchMock
    .get("http://localhost:9000")
    .intercept({
      path: /.*/,
      method: "PUT",
    })
    .reply(() => {
      callTrackers.s3Called = true;
      return { statusCode: 200, data: "" };
    })
    .persist();

  const loggingMock = fetchMock
    .get("http://localhost:8585")
    .intercept({
      path: "/v1/log/request",
      method: "POST",
    })
    .reply(() => {
      callTrackers.loggingCalled = true;
      return { statusCode: 200, data: { success: true } };
    })
    .persist();
  return { s3Mock, loggingMock, callTrackers };
}

function mockProviderEndpoint(
  modelId: string,
  provider: string,
  statusCode: number,
  byokConfig: UserEndpointConfig = {}
) {
  const config = registry.getModelProviderConfig(modelId, provider).data;
  if (!config) return;

  const endpoint = registry.buildEndpoint(config, byokConfig).data;
  if (!endpoint) return;

  const url = new URL(endpoint.baseUrl);

  if (statusCode === 200) {
    // For now just use anthropic config, in future we'll have a map of providers
    const testConfig = anthropicTestConfig;

    fetchMock
      .get(`${url.protocol}//${url.host}`)
      .intercept({ path: url.pathname, method: "POST" })
      .reply((request) => {
        const body = JSON.parse(request.body as string);
        const modelName = body.model?.split("/")[0] || body.model;
        return {
          statusCode: 200,
          data: testConfig.generateMockResponse(modelName),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      })
      .persist();
  } else {
    fetchMock
      .get(`${url.protocol}//${url.host}`)
      .intercept({ path: url.pathname, method: "POST" })
      .reply(() => ({ statusCode, data: { error: "Provider failed" } }))
      .persist();
  }
}

describe("Anthropic Registry Tests", () => {
  beforeAll(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
    mockRequiredServices();
  });

  afterAll(() => {
    fetchMock.deactivate();
  });

  describe("BYOK Tests - Anthropic Models", () => {
    beforeAll(() => {
      fetchMock.activate();
      fetchMock.disableNetConnect();
      
      // Mock the required services (S3 and logging)
      const s3Mock = fetchMock
        .get("http://localhost:9000")
        .intercept({
          path: /.*/,
          method: "PUT",
        })
        .reply(() => {
          return { statusCode: 200, data: "" };
        })
        .persist();

      const loggingMock = fetchMock
        .get("http://localhost:8585")
        .intercept({
          path: "/v1/log/request",
          method: "POST",
        })
        .reply(() => {
          return { statusCode: 200, data: { success: true } };
        })
        .persist();
    });

    afterAll(() => {
      fetchMock.deactivate();
    });

    // Claude 3.5 Haiku Tests
    describe("claude-3.5-haiku", () => {
      it("should handle anthropic provider", async () => {
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "msg_test",
              type: "message",
              role: "assistant",
              content: [{ type: "text", text: "Test response" }],
              model: "claude-3-5-haiku-20241022",
              usage: { input_tokens: 10, output_tokens: 5 },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "claude-3.5-haiku/anthropic",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
        const body = (await response.json()) as any;
        expect(body).toHaveProperty("model");
        expect(body.model).toContain("claude-3-5-haiku");
      });

      it("should handle vertex provider", async () => {
        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({ 
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-haiku@20241022:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Vertex" }],
                  role: "model",
                },
                finishReason: "STOP",
              }],
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
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "claude-3.5-haiku/vertex",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should handle bedrock provider with region", async () => {
        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-3-5-haiku-20241022-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-3.5-haiku"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
              "Helicone-User-Endpoint-Config": JSON.stringify({
                region: "us-east-1",
              }),
            },
            body: JSON.stringify({
              model: "claude-3.5-haiku/bedrock",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select first provider when none specified", async () => {
        // The first provider in registry should be selected automatically
        // For claude-3.5-haiku, first provider is anthropic
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "msg_test",
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "text",
                  text: "Test response from auto-selected provider",
                },
              ],
              model: "claude-3-5-haiku-20241022",
              usage: { input_tokens: 10, output_tokens: 5 },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "claude-3.5-haiku", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
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
          .intercept({ path: "/v1/messages", method: "POST" })
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
            data: anthropicTestConfig.generateMockResponse("claude-3.5-haiku"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
              "Helicone-User-Endpoint-Config": JSON.stringify({
                region: "us-east-1",
              }),
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse(
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
              Authorization: "Bearer sk-helicone-test",
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
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-sonnet-v2@20241022:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Vertex" }],
                  role: "model",
                },
                finishReason: "STOP",
              }],
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
              Authorization: "Bearer sk-helicone-test",
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
            data: anthropicTestConfig.generateMockResponse("claude-3.5-sonnet-v2"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
              "Helicone-User-Endpoint-Config": JSON.stringify({
                region: "us-east-1",
              }),
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse(
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
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => {
            anthropicCalled = true;
            return { statusCode: 500, data: { error: "Service unavailable" } };
          })
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({ 
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-sonnet-v2@20241022:streamGenerateContent",
            method: "POST" 
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
            data: anthropicTestConfig.generateMockResponse("claude-3.5-sonnet-v2"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-3.7-sonnet"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-7-sonnet@20250219:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Vertex" }],
                  role: "model",
                },
                finishReason: "STOP",
              }],
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
              Authorization: "Bearer sk-helicone-test",
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
            data: anthropicTestConfig.generateMockResponse("claude-3.7-sonnet"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
              "Helicone-User-Endpoint-Config": JSON.stringify({
                region: "us-east-1",
              }),
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-3.7-sonnet"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({ statusCode: 500, data: { error: "Service unavailable" } }))
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({ 
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-7-sonnet@20250219:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({ statusCode: 500, data: { error: "Service unavailable" } }))
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-3.7-sonnet"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-opus-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4@20250514:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Vertex" }],
                  role: "model",
                },
                finishReason: "STOP",
              }],
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
              Authorization: "Bearer sk-helicone-test",
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
            data: anthropicTestConfig.generateMockResponse("claude-opus-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
              "Helicone-User-Endpoint-Config": JSON.stringify({
                region: "us-east-1",
              }),
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-opus-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({ statusCode: 500, data: { error: "Service unavailable" } }))
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({ 
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4@20250514:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({ statusCode: 500, data: { error: "Service unavailable" } }))
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-opus-4-20250514-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-opus-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-opus-4-1"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4-1@20250805:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Vertex" }],
                  role: "model",
                },
                finishReason: "STOP",
              }],
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
              Authorization: "Bearer sk-helicone-test",
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
            data: anthropicTestConfig.generateMockResponse("claude-opus-4-1"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
              "Helicone-User-Endpoint-Config": JSON.stringify({
                region: "us-east-1",
              }),
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-opus-4-1"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({ statusCode: 500, data: { error: "Service unavailable" } }))
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({ 
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-opus-4-1@20250805:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({ statusCode: 500, data: { error: "Service unavailable" } }))
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-opus-4-1-20250805-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-opus-4-1"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-sonnet-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-sonnet-4@20250514:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Vertex" }],
                  role: "model",
                },
                finishReason: "STOP",
              }],
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
              Authorization: "Bearer sk-helicone-test",
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
            data: anthropicTestConfig.generateMockResponse("claude-sonnet-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
              "Helicone-User-Endpoint-Config": JSON.stringify({
                region: "us-east-1",
              }),
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-sonnet-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
          .intercept({ path: "/v1/messages", method: "POST" })
          .reply(() => ({ statusCode: 500, data: { error: "Service unavailable" } }))
          .persist();

        fetchMock
          .get("https://us-central1-aiplatform.googleapis.com")
          .intercept({ 
            path: "/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-sonnet-4@20250514:streamGenerateContent",
            method: "POST" 
          })
          .reply(() => ({ statusCode: 500, data: { error: "Service unavailable" } }))
          .persist();

        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/anthropic.claude-sonnet-4-20250514-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: anthropicTestConfig.generateMockResponse("claude-sonnet-4"),
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
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
