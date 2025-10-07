import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";

const xaiAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("xAI Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - xAI Grok Models", () => {
    describe("grok-code-fast-1", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-code-fast-1/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-code-fast-1",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-code-fast-1",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-code-fast-1",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("grok-4", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-4/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-4",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-4",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("grok-3", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-3/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-3",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-3",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-3",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("grok-3-mini", () => {
      it("should handle xai provider", () =>
        runGatewayTest({
          model: "grok-3-mini/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-3-mini",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select xai provider when none specified", () =>
        runGatewayTest({
          model: "grok-3-mini",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "success",
                model: "grok-3-mini",
                expects: xaiAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("Error scenarios", () => {
      it("should handle xAI provider failure", () =>
        runGatewayTest({
          model: "grok-3/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "xAI service unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle rate limiting from xAI", () =>
        runGatewayTest({
          model: "grok-3/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
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
          model: "grok-3/xai",
          expected: {
            providers: [
              {
                url: "https://api.x.ai/v1/chat/completions",
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
