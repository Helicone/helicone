import { SELF } from "cloudflare:test";
import { describe, it, beforeEach, expect, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";

describe("Request ID Header Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Response includes Helicone-Request-Id header", () => {
    it("should return Helicone-Request-Id header on successful responses", async () => {
      const result = await runGatewayTest({
        model: "gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "Test request ID" }],
          maxTokens: 100,
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
            },
          ],
          finalStatus: 200,
        },
      });

      // Check that the response has the Helicone-Request-Id header
      const requestIdHeader = result.response.headers.get("Helicone-Request-Id");
      expect(requestIdHeader).toBeDefined();
      expect(requestIdHeader).not.toBeNull();

      // Validate it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestIdHeader).toMatch(uuidRegex);
    });

    it("should return Helicone-Request-Id header on error responses", async () => {
      const result = await runGatewayTest({
        model: "gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "Test error request ID" }],
          maxTokens: 100,
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Provider error",
            },
          ],
          finalStatus: 500,
        },
      });

      // Check that even error responses have the Helicone-Request-Id header
      const requestIdHeader = result.response.headers.get("Helicone-Request-Id");
      expect(requestIdHeader).toBeDefined();
      expect(requestIdHeader).not.toBeNull();

      // Validate it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestIdHeader).toMatch(uuidRegex);
    });

    it("should use client-provided Helicone-Request-Id when valid UUID is provided", async () => {
      const clientRequestId = "12345678-1234-1234-1234-123456789abc";

      const result = await runGatewayTest({
        model: "gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "Test custom request ID" }],
          maxTokens: 100,
          headers: {
            "Helicone-Request-Id": clientRequestId,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
            },
          ],
          finalStatus: 200,
        },
      });

      // Check that the response uses the client-provided request ID
      const requestIdHeader = result.response.headers.get("Helicone-Request-Id");
      expect(requestIdHeader).toBe(clientRequestId);
    });

    it("should generate new UUID when client provides invalid Helicone-Request-Id", async () => {
      const invalidRequestId = "not-a-valid-uuid";

      const result = await runGatewayTest({
        model: "gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "Test invalid request ID" }],
          maxTokens: 100,
          headers: {
            "Helicone-Request-Id": invalidRequestId,
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
            },
          ],
          finalStatus: 200,
        },
      });

      // Check that the response has a valid UUID (not the invalid one)
      const requestIdHeader = result.response.headers.get("Helicone-Request-Id");
      expect(requestIdHeader).not.toBe(invalidRequestId);

      // Validate it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestIdHeader).toMatch(uuidRegex);
    });

    it("should return Helicone-Request-Id header on fallback success", async () => {
      const result = await runGatewayTest({
        model: "gpt-4o/openai,claude-3-7-sonnet-20250219/anthropic",
        request: {
          messages: [{ role: "user", content: "Test fallback request ID" }],
          maxTokens: 100,
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "OpenAI failed",
            },
            {
              url: "https://api.anthropic.com/v1/messages",
              response: "success",
              model: "claude-3-7-sonnet-20250219",
              data: {
                id: "msg_test",
                type: "message",
                role: "assistant",
                content: [{ type: "text", text: "Fallback response" }],
                model: "claude-3-7-sonnet-20250219",
                usage: { input_tokens: 10, output_tokens: 5 },
              },
            },
          ],
          finalStatus: 200,
        },
      });

      // Check that the response has the Helicone-Request-Id header even with fallback
      const requestIdHeader = result.response.headers.get("Helicone-Request-Id");
      expect(requestIdHeader).toBeDefined();
      expect(requestIdHeader).not.toBeNull();

      // Validate it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestIdHeader).toMatch(uuidRegex);
    });
  });
});
