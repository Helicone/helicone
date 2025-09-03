import { SELF } from "cloudflare:test";
import { fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../setup";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockOpenAIEndpoint,
  mockAzureOpenAIEndpoint,
  mockGroqEndpoint,
  createAIGatewayRequest,
} from "../test-utils";

describe("OpenAI Registry Tests", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe("BYOK Tests - OpenAI Models", () => {
    // Note: OpenAI models only have the 'openai' provider, no vertex/bedrock

    // GPT-4o Tests
    describe("gpt-4o", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-4o");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4o/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should handle azure-openai provider", async () => {
        mockAzureOpenAIEndpoint("gpt-4o");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4o/azure-openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-4o");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4o")
        );

        expect(response.status).toBe(200);
      });

      it("should fallback from openai to azure-openai when openai fails", async () => {
        // Mock OpenAI failure
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "OpenAI provider failed" },
          }))
          .persist();

        // Mock Azure success
        mockAzureOpenAIEndpoint("gpt-4o");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4o") // No provider specified, should try openai -> azure
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-4o-mini Tests
    describe("gpt-4o-mini", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-4o-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4o-mini/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should handle azure-openai provider", async () => {
        mockAzureOpenAIEndpoint("gpt-4o-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4o-mini/azure-openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-4o-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4o-mini")
        );

        expect(response.status).toBe(200);
      });

      it("should fallback from openai to azure-openai when openai fails", async () => {
        // Mock OpenAI failure
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "OpenAI provider failed" },
          }))
          .persist();

        // Mock Azure success
        mockAzureOpenAIEndpoint("gpt-4o-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4o-mini") // No provider specified, should try openai -> azure
        );

        expect(response.status).toBe(200);
      });
    });

    // ChatGPT-4o-latest Tests
    describe("chatgpt-4o-latest", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("chatgpt-4o-latest");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("chatgpt-4o-latest/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("chatgpt-4o-latest");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("chatgpt-4o-latest")
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-4.1 Tests
    describe("gpt-4.1", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-4.1");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should handle azure-openai provider", async () => {
        mockAzureOpenAIEndpoint("gpt-4.1");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1/azure-openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-4.1");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1")
        );

        expect(response.status).toBe(200);
      });

      it("should fallback from openai to azure-openai when openai fails", async () => {
        // Mock OpenAI failure
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "OpenAI provider failed" },
          }))
          .persist();

        // Mock Azure success
        mockAzureOpenAIEndpoint("gpt-4.1");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1") // No provider specified, should try openai -> azure
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-4.1-mini Tests
    describe("gpt-4.1-mini", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-4.1-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1-mini/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should handle azure-openai provider", async () => {
        mockAzureOpenAIEndpoint("gpt-4.1-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1-mini/azure-openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-4.1-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1-mini")
        );

        expect(response.status).toBe(200);
      });

      it("should fallback from openai to azure-openai when openai fails", async () => {
        // Mock OpenAI failure
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "OpenAI provider failed" },
          }))
          .persist();

        // Mock Azure success
        mockAzureOpenAIEndpoint("gpt-4.1-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1-mini") // No provider specified, should try openai -> azure
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-4.1-nano Tests
    describe("gpt-4.1-nano", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-4.1-nano");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1-nano/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should handle azure-openai provider", async () => {
        mockAzureOpenAIEndpoint("gpt-4.1-nano");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1-nano/azure-openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-4.1-nano");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1-nano")
        );

        expect(response.status).toBe(200);
      });

      it("should fallback from openai to azure-openai when openai fails", async () => {
        // Mock OpenAI failure
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 500,
            data: { error: "OpenAI provider failed" },
          }))
          .persist();

        // Mock Azure success
        mockAzureOpenAIEndpoint("gpt-4.1-nano");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-4.1-nano") // No provider specified, should try openai -> azure
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-5 Tests
    describe("gpt-5", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-5");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-5/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-5");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-5")
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-5-mini Tests
    describe("gpt-5-mini", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-5-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-5-mini/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-5-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-5-mini")
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-5-nano Tests
    describe("gpt-5-nano", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-5-nano");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-5-nano/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-5-nano");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-5-nano")
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-5-chat-latest Tests
    describe("gpt-5-chat-latest", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("gpt-5-chat-latest");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-5-chat-latest/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("gpt-5-chat-latest");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-5-chat-latest")
        );

        expect(response.status).toBe(200);
      });
    });

    // O3 Tests
    describe("o3", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("o3");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("o3/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("o3");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("o3")
        );

        expect(response.status).toBe(200);
      });
    });

    // O3-pro Tests
    describe("o3-pro", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("o3-pro");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("o3-pro/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("o3-pro");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("o3-pro")
        );

        expect(response.status).toBe(200);
      });
    });

    // O3-mini Tests
    describe("o3-mini", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("o3-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("o3-mini/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("o3-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("o3-mini")
        );

        expect(response.status).toBe(200);
      });
    });

    // O4-mini Tests
    describe("o4-mini", () => {
      it("should handle openai provider", async () => {
        mockOpenAIEndpoint("o4-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("o4-mini/openai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        mockOpenAIEndpoint("o4-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("o4-mini")
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-OSS-120b Tests (OpenAI model via Groq)
    describe("gpt-oss-120b", () => {
      it("should handle groq provider", async () => {
        mockGroqEndpoint("gpt-oss-120b");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-oss-120b/groq")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select groq provider when none specified", async () => {
        mockGroqEndpoint("gpt-oss-120b");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-oss-120b")
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-OSS-20b Tests (OpenAI model via Groq)
    describe("gpt-oss-20b", () => {
      it("should handle groq provider", async () => {
        mockGroqEndpoint("gpt-oss-20b");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-oss-20b/groq")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select groq provider when none specified", async () => {
        mockGroqEndpoint("gpt-oss-20b");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gpt-oss-20b")
        );

        expect(response.status).toBe(200);
      });
    });
  });
});