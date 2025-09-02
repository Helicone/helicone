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

    // ChatGPT-4o-latest Tests
    describe("chatgpt-4o-latest", () => {
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
              model: "chatgpt-4o-latest",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from ChatGPT-4o-latest",
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
              model: "chatgpt-4o-latest/openai",
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
              model: "chatgpt-4o-latest",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from ChatGPT-4o-latest",
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
              model: "chatgpt-4o-latest", // No provider specified
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

    // GPT-4.1-mini Tests
    describe("gpt-4.1-mini", () => {
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
              model: "gpt-4.1-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4.1-mini",
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
              model: "gpt-4.1-mini/openai",
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
              model: "gpt-4.1-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4.1-mini",
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
              model: "gpt-4.1-mini", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-4.1-nano Tests
    describe("gpt-4.1-nano", () => {
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
              model: "gpt-4.1-nano",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4.1-nano",
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
              model: "gpt-4.1-nano/openai",
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
              model: "gpt-4.1-nano",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-4.1-nano",
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
              model: "gpt-4.1-nano", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-5 Tests
    describe("gpt-5", () => {
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
              model: "gpt-5",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-5",
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
              model: "gpt-5/openai",
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
              model: "gpt-5",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-5",
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
              model: "gpt-5", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-5-mini Tests
    describe("gpt-5-mini", () => {
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
              model: "gpt-5-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-5-mini",
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
              model: "gpt-5-mini/openai",
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
              model: "gpt-5-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-5-mini",
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
              model: "gpt-5-mini", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-5-nano Tests
    describe("gpt-5-nano", () => {
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
              model: "gpt-5-nano",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-5-nano",
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
              model: "gpt-5-nano/openai",
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
              model: "gpt-5-nano",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-5-nano",
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
              model: "gpt-5-nano", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // GPT-5-chat-latest Tests
    describe("gpt-5-chat-latest", () => {
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
              model: "gpt-5-chat-latest",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-5-chat-latest",
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
              model: "gpt-5-chat-latest/openai",
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
              model: "gpt-5-chat-latest",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from GPT-5-chat-latest",
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
              model: "gpt-5-chat-latest", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // O3 Tests
    describe("o3", () => {
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
              model: "o3",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from O3",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 50,
                completion_tokens: 25,
                total_tokens: 75,
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
              model: "o3/openai",
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
              model: "o3",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from O3",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 50,
                completion_tokens: 25,
                total_tokens: 75,
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
              model: "o3", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // O3-pro Tests
    describe("o3-pro", () => {
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
              model: "o3-pro",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from O3-pro",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 50,
                completion_tokens: 25,
                total_tokens: 75,
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
              model: "o3-pro/openai",
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
              model: "o3-pro",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from O3-pro",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 50,
                completion_tokens: 25,
                total_tokens: 75,
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
              model: "o3-pro", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // O3-mini Tests
    describe("o3-mini", () => {
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
              model: "o3-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from O3-mini",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 30,
                completion_tokens: 15,
                total_tokens: 45,
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
              model: "o3-mini/openai",
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
              model: "o3-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from O3-mini",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 30,
                completion_tokens: 15,
                total_tokens: 45,
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
              model: "o3-mini", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // O4-mini Tests
    describe("o4-mini", () => {
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
              model: "o4-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from O4-mini",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 30,
                completion_tokens: 15,
                total_tokens: 45,
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
              model: "o4-mini/openai",
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
              model: "o4-mini",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Test response from O4-mini",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 30,
                completion_tokens: 15,
                total_tokens: 45,
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
              model: "o4-mini", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });
  });
});
