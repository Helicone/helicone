import { describe, it, beforeEach, vi, expect } from "vitest";
import "../setup";
import { runGatewayTest, GatewayTestScenario } from "./test-framework";
import { SELF } from "cloudflare:test";

// Mock the PromptManager to return a specific model
vi.mock("../../src/lib/managers/PromptManager", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../src/lib/managers/PromptManager")
  >();
  return {
    ...actual,
    PromptManager: class MockPromptManager {
      constructor() {}

      async getModelFromPrompt(
        params: { prompt_id?: string; version_id?: string; environment?: string },
        orgId: string
      ) {
        // Return model based on prompt_id for testing
        if (params.prompt_id === "test-prompt-gpt4") {
          return { data: "gpt-4o/openai", error: null };
        }
        if (params.prompt_id === "test-prompt-claude") {
          return { data: "claude-3-5-sonnet-20241022/anthropic", error: null };
        }
        if (params.prompt_id === "test-prompt-env" && params.environment === "production") {
          return { data: "gpt-4o-mini/openai", error: null };
        }
        if (params.prompt_id === "invalid-prompt") {
          return { data: null, error: "Invalid prompt ID - no valid version found" };
        }
        return { data: null, error: "Prompt not found" };
      }

      async getMergedPromptBody(params: any, orgId: string) {
        // Return a simple merged body for testing
        return {
          data: {
            body: {
              model: params.model,
              messages: [{ role: "user", content: "Test message" }],
            },
            errors: [],
            promptVersionId: "test-version-id",
          },
          error: null,
        };
      }

      async getMergedPromptBodyForResponses(params: any, orgId: string) {
        return this.getMergedPromptBody(params, orgId);
      }
    },
  };
});

describe("Prompt Model Auto-Resolution Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Model fetched from prompt when not provided in request", () => {
    it("should fetch model from prompt_id when model is not provided", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-gpt4",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 100,
          }),
        }
      );

      // The request should not fail with "missing model" error
      // It should either succeed or fail for other reasons (like provider being unavailable)
      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should use provided model even when prompt_id is present", async () => {
      // When model is explicitly provided, it should be used
      const scenario: GatewayTestScenario = {
        model: "gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "Hello" }],
          maxTokens: 100,
          body: {
            prompt_id: "test-prompt-claude", // Prompt has claude model, but we provide gpt-4o
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
              data: {
                id: "chatcmpl-test",
                object: "chat.completion",
                created: Date.now(),
                model: "gpt-4o",
                choices: [
                  {
                    index: 0,
                    message: { role: "assistant", content: "Test response" },
                    finish_reason: "stop",
                  },
                ],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
              },
            },
          ],
          finalStatus: 200,
        },
      };

      await runGatewayTest(scenario);
    });

    it("should return error when prompt_id is invalid and model is not provided", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "invalid-prompt",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 100,
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = await response.json() as { error: string };
      expect(json.error).toContain("Failed to fetch model from prompt");
    });

    it("should require prompt_id when using prompt fields without model", async () => {
      // When inputs are provided but no prompt_id or model
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            inputs: { name: "John" },
            messages: [{ role: "user", content: "Hello {{name}}" }],
            max_tokens: 100,
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = await response.json() as { error: string };
      expect(json.error).toContain("prompt_id is required");
    });
  });
});
