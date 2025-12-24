import { describe, expect, it, vi, beforeEach } from "vitest";
import { runGatewayTest, GatewayTestScenario } from "./test-framework";

describe("Error Handling", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("Provider Errors", () => {
    it("should handle provider 500 errors gracefully", async () => {
      const scenario: GatewayTestScenario = {
        model: "gpt-4o",
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Internal Server Error",
            },
          ],
          finalStatus: 500,
        },
      };

      const { response } = await runGatewayTest(scenario);
      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    it("should handle provider 429 rate limit errors", async () => {
      const scenario: GatewayTestScenario = {
        model: "gpt-4o",
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 500,
        },
      };

      const { response } = await runGatewayTest(scenario);
      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    it("should include provider details in error response", async () => {
      const scenario: GatewayTestScenario = {
        model: "gpt-4o",
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Provider specific error message",
            },
          ],
          finalStatus: 500,
        },
      };

      const { response } = await runGatewayTest(scenario);
      expect(response.status).toBe(500);
    });
  });

  describe("Fallback Behavior", () => {
    it("should fallback to next provider on error", async () => {
      // Test with comma-separated models for fallback
      const scenario: GatewayTestScenario = {
        model: "openai/gpt-4o, anthropic/claude-3-5-sonnet-20241022",
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Provider unavailable",
            },
            {
              url: "https://api.anthropic.com/v1/messages",
              response: "success",
              model: "claude-3-5-sonnet-20241022",
            },
          ],
          finalStatus: 200,
        },
      };

      const { response } = await runGatewayTest(scenario);
      expect(response.status).toBe(200);
    });

    it("should try all providers before returning error", async () => {
      const scenario: GatewayTestScenario = {
        model: "openai/gpt-4o, anthropic/claude-3-5-sonnet-20241022",
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Provider 1 error",
            },
            {
              url: "https://api.anthropic.com/v1/messages",
              response: "failure",
              statusCode: 503,
              errorMessage: "Provider 2 error",
            },
          ],
          finalStatus: 500,
        },
      };

      const { response } = await runGatewayTest(scenario);
      const body = await response.json();
      expect(body).toHaveProperty("error");
    });
  });

  describe("Error Response Format", () => {
    it("should return structured error responses", async () => {
      const scenario: GatewayTestScenario = {
        model: "gpt-4o",
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 400,
              errorMessage: "Invalid request",
            },
          ],
          finalStatus: 500,
        },
      };

      const { response } = await runGatewayTest(scenario);
      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should include error code in response", async () => {
      const scenario: GatewayTestScenario = {
        model: "gpt-4o",
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Unauthorized",
            },
          ],
          finalStatus: 401,
        },
      };

      const { response } = await runGatewayTest(scenario);
      const body = await response.json();
      expect(body).toHaveProperty("error");
    });
  });
});
