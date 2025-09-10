import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

// Define auth expectations for Google AI Studio
const googleAuthExpectations = {
  headers: {
    // Google AI Studio uses OpenAI compatibility mode with Authorization header
    Authorization: /^Bearer /,
  },
};

describe("Google Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Google Gemini Models", () => {
    // Note: Google models only have the 'google-ai-studio' provider, no vertex/bedrock

    // Gemini 2.5 Flash Tests
    describe("gemini-2.5-flash", () => {
      it("should handle google-ai-studio provider", () =>
        runGatewayTest({
          model: "gemini-2.5-flash/google-ai-studio",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                response: "success",
                model: "gemini-2.5-flash",
                data: createOpenAIMockResponse("gemini-2.5-flash"),
                expects: googleAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select google-ai-studio provider when none specified", () =>
        runGatewayTest({
          model: "gemini-2.5-flash",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                response: "success",
                model: "gemini-2.5-flash",
                data: createOpenAIMockResponse("gemini-2.5-flash"),
                expects: googleAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Gemini 2.5 Flash Lite Tests
    describe("gemini-2.5-flash-lite", () => {
      it("should handle google-ai-studio provider", () =>
        runGatewayTest({
          model: "gemini-2.5-flash-lite/google-ai-studio",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                response: "success",
                model: "gemini-2.5-flash-lite",
                data: createOpenAIMockResponse("gemini-2.5-flash-lite"),
                expects: googleAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select google-ai-studio provider when none specified", () =>
        runGatewayTest({
          model: "gemini-2.5-flash-lite",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                response: "success",
                model: "gemini-2.5-flash-lite",
                data: createOpenAIMockResponse("gemini-2.5-flash-lite"),
                expects: googleAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Gemini 2.5 Pro Tests
    describe("gemini-2.5-pro", () => {
      it("should handle google-ai-studio provider", () =>
        runGatewayTest({
          model: "gemini-2.5-pro/google-ai-studio",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                response: "success",
                model: "gemini-2.5-pro",
                data: createOpenAIMockResponse("gemini-2.5-pro"),
                expects: googleAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select google-ai-studio provider when none specified", () =>
        runGatewayTest({
          model: "gemini-2.5-pro",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                response: "success",
                model: "gemini-2.5-pro",
                data: createOpenAIMockResponse("gemini-2.5-pro"),
                expects: googleAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    // Note: Since Google models only have one provider, fallback tests aren't needed
    // as there's nothing to fallback to

    describe("Error scenarios", () => {
      it("should handle Google AI Studio provider failure", () =>
        runGatewayTest({
          model: "gemini-2.5-flash/google-ai-studio",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "Google AI Studio service unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle rate limiting from Google", () =>
        runGatewayTest({
          model: "gemini-2.5-pro/google-ai-studio",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
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
          model: "gemini-2.5-flash/google-ai-studio",
          expected: {
            providers: [
              {
                url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
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
