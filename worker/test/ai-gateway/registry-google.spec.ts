import { SELF } from "cloudflare:test";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../setup";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockGoogleEndpoint,
  createAIGatewayRequest,
} from "../test-utils";

describe("Google Registry Tests", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe("BYOK Tests - Google Gemini Models", () => {
    // Note: Google models only have the 'google-ai-studio' provider, no vertex/bedrock

    // Gemini 2.5 Flash Tests
    describe("gemini-2.5-flash", () => {
      it("should handle google-ai-studio provider", async () => {
        mockGoogleEndpoint("gemini-2.5-flash");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gemini-2.5-flash/google-ai-studio")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select google-ai-studio provider when none specified", async () => {
        mockGoogleEndpoint("gemini-2.5-flash");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gemini-2.5-flash")
        );

        expect(response.status).toBe(200);
      });
    });

    // Gemini 2.5 Flash Lite Tests
    describe("gemini-2.5-flash-lite", () => {
      it("should handle google-ai-studio provider", async () => {
        mockGoogleEndpoint("gemini-2.5-flash-lite");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gemini-2.5-flash-lite/google-ai-studio")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select google-ai-studio provider when none specified", async () => {
        mockGoogleEndpoint("gemini-2.5-flash-lite");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gemini-2.5-flash-lite")
        );

        expect(response.status).toBe(200);
      });
    });

    // Gemini 2.5 Pro Tests
    describe("gemini-2.5-pro", () => {
      it("should handle google-ai-studio provider", async () => {
        mockGoogleEndpoint("gemini-2.5-pro");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gemini-2.5-pro/google-ai-studio")
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select google-ai-studio provider when none specified", async () => {
        mockGoogleEndpoint("gemini-2.5-pro");

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          createAIGatewayRequest("gemini-2.5-pro")
        );

        expect(response.status).toBe(200);
      });
    });

    // Note: Since Google models only have one provider, fallback tests aren't needed
    // as there's nothing to fallback to
  });
});
