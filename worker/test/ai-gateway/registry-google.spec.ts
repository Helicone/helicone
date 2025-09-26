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

// Define auth expectations for DeepInfra
const deepinfraAuthExpectations = {
  headers: {
    // DeepInfra uses Authorization header with Bearer token
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

    // Gemma 3 Tests
    describe("gemma-3-12b-it", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "google/gemma-3-12b-it",
                data: createOpenAIMockResponse("google/gemma-3-12b-it"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should auto-select deepinfra provider when none specified", () =>
        runGatewayTest({
          model: "gemma-3-12b-it",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "google/gemma-3-12b-it",
                data: createOpenAIMockResponse("google/gemma-3-12b-it"),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle streaming requests", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          request: {
            stream: true,
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "google/gemma-3-12b-it",
                data: createOpenAIMockResponse("google/gemma-3-12b-it"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: ['"stream":true'],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it.skip("should handle supported parameters", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          request: {
            maxTokens: 1000,
            headers: {
              "Helicone-Gateway-Body-Mapping": "OPENAI",
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "google/gemma-3-12b-it",
                data: createOpenAIMockResponse("google/gemma-3-12b-it"),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    '"max_tokens":1000',
                    '"temperature":',
                    '"top_p":',
                    '"frequency_penalty":',
                    '"presence_penalty":',
                    '"repetition_penalty":',
                    '"top_k":',
                    '"seed":',
                    '"min_p":',
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle multimodal requests with images", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          request: {
            messages: [
              {
                role: "user",
                content: "What do you see in this image?",
              },
            ],
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "google/gemma-3-12b-it",
                data: createOpenAIMockResponse("google/gemma-3-12b-it"),
                expects: deepinfraAuthExpectations,
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

    describe("DeepInfra Error scenarios", () => {
      it("should handle DeepInfra provider failure", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 500,
                errorMessage: "DeepInfra service unavailable",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle rate limiting from DeepInfra", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 429,
                errorMessage: "Rate limit exceeded",
              },
            ],
            finalStatus: 429,
          },
        }));

      it("should handle DeepInfra authentication failure", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 401,
                errorMessage: "Invalid API key",
              },
            ],
            finalStatus: 401,
          },
        }));

      it("should handle model not found error on DeepInfra", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 404,
                errorMessage: "Model not found",
              },
            ],
            finalStatus: 500,
          },
        }));

      it("should handle quota exceeded error on DeepInfra", () =>
        runGatewayTest({
          model: "gemma-3-12b-it/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "failure",
                statusCode: 402,
                errorMessage: "Quota exceeded",
              },
            ],
            finalStatus: 500,
          },
        }));
    });
  });
});
