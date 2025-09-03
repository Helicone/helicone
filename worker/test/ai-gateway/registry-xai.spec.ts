import { SELF } from "cloudflare:test";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../setup";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockXAIEndpoint,
  createAIGatewayRequest,
} from "../test-utils";

describe("xAI Registry Tests", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe("BYOK Tests - xAI Grok Models", () => {
    // Note: xAI models only have the 'xai' provider

    // Grok Code Fast 1 Tests
    describe("grok-code-fast-1", () => {
      it("should handle xai provider", async () => {
        mockXAIEndpoint("grok-code-fast-1");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("grok-code-fast-1/xai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select xai provider when none specified", async () => {
        mockXAIEndpoint("grok-code-fast-1");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("grok-code-fast-1")
        );

        expect(response.status).toBe(200);
      });
    });

    // Grok 4 Tests
    describe("grok-4-0709", () => {
      it("should handle xai provider", async () => {
        mockXAIEndpoint("grok-4-0709");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("grok-4-0709/xai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select xai provider when none specified", async () => {
        mockXAIEndpoint("grok-4-0709");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("grok-4-0709")
        );

        expect(response.status).toBe(200);
      });
    });

    // Grok 3 Tests
    describe("grok-3", () => {
      it("should handle xai provider", async () => {
        mockXAIEndpoint("grok-3");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("grok-3/xai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select xai provider when none specified", async () => {
        mockXAIEndpoint("grok-3");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("grok-3")
        );

        expect(response.status).toBe(200);
      });
    });

    // Grok 3 Mini Tests
    describe("grok-3-mini", () => {
      it("should handle xai provider", async () => {
        mockXAIEndpoint("grok-3-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("grok-3-mini/xai")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select xai provider when none specified", async () => {
        mockXAIEndpoint("grok-3-mini");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("grok-3-mini")
        );

        expect(response.status).toBe(200);
      });
    });

    // Note: Since xAI models only have one provider, fallback tests aren't needed
    // as there's nothing to fallback to
  });
});