import { SELF, fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../setup";
import { setupTestEnvironment, cleanupTestEnvironment } from "../test-utils";

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
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "chatcmpl-test",
              object: "chat.completion",
              created: Date.now(),
              model: "gpt-4o",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4o",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
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
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "gpt-4o/openai",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "chatcmpl-test",
              object: "chat.completion",
              created: Date.now(),
              model: "gpt-4o",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4o",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
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
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "gpt-4o", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-4o-mini Tests
    describe("gpt-4o-mini", () => {
      it("should handle openai provider", async () => {
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "chatcmpl-test",
              object: "chat.completion",
              created: Date.now(),
              model: "gpt-4o-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4o-mini",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
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
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini/openai",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );
        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "chatcmpl-test",
              object: "chat.completion",
              created: Date.now(),
              model: "gpt-4o-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4o-mini",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
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
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-4.1 Tests
    describe("gpt-4.1", () => {
      it("should handle openai provider", async () => {
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "chatcmpl-test",
              object: "chat.completion",
              created: Date.now(),
              model: "gpt-4.1",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4.1",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
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
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "gpt-4.1/openai",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select openai provider when none specified", async () => {
        fetchMock
          .get("https://api.openai.com")
          .intercept({ path: "/v1/chat/completions", method: "POST" })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "chatcmpl-test",
              object: "chat.completion",
              created: Date.now(),
              model: "gpt-4.1",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4.1",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
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
              Authorization:
                "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              model: "gpt-4.1", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Note: Since OpenAI models only have one provider, fallback tests aren't needed
    // as there's nothing to fallback to
  });
});
