import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";

const deepseekAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const groqAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("DeepSeek Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Native DeepSeek Models", () => {
    describe("deepseek-v3", () => {
      it("should handle deepseek provider", () =>
        runGatewayTest({
          model: "deepseek-v3/deepseek",
          expected: {
            providers: [
              {
                url: "https://api.deepseek.com/chat/completions",
                response: "success",
                model: "deepseek-chat", // Maps to deepseek-chat on API
                expects: deepseekAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepseek provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-v3",
          expected: {
            providers: [
              {
                url: "https://api.deepseek.com/chat/completions",
                response: "success",
                model: "deepseek-chat", // Maps to deepseek-chat on API
                expects: deepseekAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-reasoner", () => {
      it("should handle deepseek provider", () =>
        runGatewayTest({
          model: "deepseek-reasoner/deepseek",
          expected: {
            providers: [
              {
                url: "https://api.deepseek.com/chat/completions",
                response: "success",
                model: "deepseek-reasoner",
                expects: deepseekAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepseek provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-reasoner",
          expected: {
            providers: [
              {
                url: "https://api.deepseek.com/chat/completions",
                response: "success",
                model: "deepseek-reasoner",
                expects: deepseekAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("BYOK Tests - DeepSeek Models on Groq", () => {
    describe("deepseek-r1-distill-llama-70b", () => {
      it("should handle groq provider", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b/groq",
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "deepseek-r1-distill-llama-70b",
                expects: groqAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select groq provider when none specified", () =>
        runGatewayTest({
          model: "deepseek-r1-distill-llama-70b",
          expected: {
            providers: [
              {
                url: "https://api.groq.com/openai/v1/chat/completions",
                response: "success",
                model: "deepseek-r1-distill-llama-70b",
                expects: groqAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - DeepSeek Provider", () => {
    it("should handle DeepSeek provider failure", () =>
      runGatewayTest({
        model: "deepseek-v3/deepseek",
        expected: {
          providers: [
            {
              url: "https://api.deepseek.com/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "DeepSeek service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from DeepSeek", () =>
      runGatewayTest({
        model: "deepseek-v3/deepseek",
        expected: {
          providers: [
            {
              url: "https://api.deepseek.com/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from DeepSeek", () =>
      runGatewayTest({
        model: "deepseek-v3/deepseek",
        expected: {
          providers: [
            {
              url: "https://api.deepseek.com/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));
  });

  describe("Error scenarios - Groq Provider with DeepSeek Model", () => {
    it("should handle Groq provider failure", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/groq",
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Groq service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Groq", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/groq",
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Groq", () =>
      runGatewayTest({
        model: "deepseek-r1-distill-llama-70b/groq",
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
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
