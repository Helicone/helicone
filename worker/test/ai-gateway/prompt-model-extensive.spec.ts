import { describe, it, beforeEach, vi, expect } from "vitest";
import "../setup";
import {
  runGatewayTest,
  GatewayTestScenario,
} from "./test-framework";
import { SELF } from "cloudflare:test";
import {
  createOpenAIMockResponse,
  createAnthropicMockResponse,
} from "../test-utils";

/**
 * Comprehensive test suite for the prompt model auto-resolution feature.
 *
 * This feature allows users to run prompts without specifying a model in the request body.
 * The worker will fetch the model from the stored prompt version based on:
 * 1. Environment-specific version (if environment is specified)
 * 2. Specific version (if version_id is specified)
 * 3. Production version (default fallback)
 */

// Mock the PromptManager to return specific models based on test scenarios
vi.mock("../../src/lib/managers/PromptManager", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../src/lib/managers/PromptManager")
  >();
  return {
    ...actual,
    PromptManager: class MockPromptManager {
      constructor() {}

      async getModelFromPrompt(
        params: {
          prompt_id?: string;
          version_id?: string;
          environment?: string;
        },
        orgId: string
      ) {
        // ==========================================
        // OpenAI Model Prompts
        // ==========================================
        if (params.prompt_id === "test-prompt-gpt4") {
          return { data: "gpt-4o/openai", error: null };
        }
        if (params.prompt_id === "test-prompt-gpt4-mini") {
          return { data: "gpt-4o-mini/openai", error: null };
        }
        if (params.prompt_id === "test-prompt-gpt35") {
          return { data: "gpt-3.5-turbo/openai", error: null };
        }
        if (params.prompt_id === "test-prompt-o1") {
          return { data: "o1/openai", error: null };
        }
        if (params.prompt_id === "test-prompt-o3-mini") {
          return { data: "o3-mini/openai", error: null };
        }

        // ==========================================
        // Anthropic Model Prompts
        // ==========================================
        if (params.prompt_id === "test-prompt-claude") {
          return { data: "claude-3-5-sonnet-20241022/anthropic", error: null };
        }
        if (params.prompt_id === "test-prompt-claude-opus") {
          return { data: "claude-3-opus-20240229/anthropic", error: null };
        }
        if (params.prompt_id === "test-prompt-claude-haiku") {
          return { data: "claude-3-5-haiku-20241022/anthropic", error: null };
        }

        // ==========================================
        // Google/Gemini Model Prompts
        // ==========================================
        if (params.prompt_id === "test-prompt-gemini") {
          return { data: "gemini-2.0-flash-exp/google", error: null };
        }
        if (params.prompt_id === "test-prompt-gemini-pro") {
          return { data: "gemini-1.5-pro/google", error: null };
        }

        // ==========================================
        // Other Provider Model Prompts
        // ==========================================
        if (params.prompt_id === "test-prompt-deepseek") {
          return { data: "deepseek-chat/deepseek", error: null };
        }
        if (params.prompt_id === "test-prompt-groq") {
          return { data: "llama-3.1-70b-versatile/groq", error: null };
        }
        if (params.prompt_id === "test-prompt-xai") {
          return { data: "grok-beta/xai", error: null };
        }
        if (params.prompt_id === "test-prompt-mistral") {
          return { data: "mistral-large-latest/mistral", error: null };
        }
        if (params.prompt_id === "test-prompt-together") {
          return {
            data: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo/together",
            error: null,
          };
        }
        if (params.prompt_id === "test-prompt-fireworks") {
          return {
            data: "accounts/fireworks/models/llama-v3p1-70b-instruct/fireworks",
            error: null,
          };
        }

        // ==========================================
        // Environment-based Model Resolution
        // ==========================================
        if (params.prompt_id === "test-prompt-env") {
          if (params.environment === "production") {
            return { data: "gpt-4o-mini/openai", error: null };
          }
          if (params.environment === "staging") {
            return { data: "gpt-4o/openai", error: null };
          }
          if (params.environment === "development") {
            return { data: "gpt-3.5-turbo/openai", error: null };
          }
          if (params.environment === "testing") {
            return { data: "claude-3-5-haiku-20241022/anthropic", error: null };
          }
          // Default to production if no environment matches
          return { data: "gpt-4o-mini/openai", error: null };
        }

        // ==========================================
        // Version-based Model Resolution
        // ==========================================
        if (params.prompt_id === "test-prompt-versioned") {
          if (params.version_id === "v1-uuid-1234") {
            return { data: "gpt-3.5-turbo/openai", error: null };
          }
          if (params.version_id === "v2-uuid-5678") {
            return { data: "gpt-4o/openai", error: null };
          }
          if (params.version_id === "v3-uuid-9012") {
            return { data: "claude-3-5-sonnet-20241022/anthropic", error: null };
          }
          // Default to production version
          return { data: "gpt-4o/openai", error: null };
        }

        // ==========================================
        // Multi-model/Fallback Prompts
        // ==========================================
        if (params.prompt_id === "test-prompt-fallback-config") {
          // Returns a comma-separated model string for fallback
          return {
            data: "gpt-4o/openai,claude-3-5-sonnet-20241022/anthropic",
            error: null,
          };
        }

        // ==========================================
        // Prompts with Empty/Null Models
        // ==========================================
        if (params.prompt_id === "test-prompt-no-model") {
          return { data: null, error: "Prompt version has no model configured" };
        }
        if (params.prompt_id === "test-prompt-empty-model") {
          return { data: "", error: null };
        }

        // ==========================================
        // Error Cases
        // ==========================================
        if (params.prompt_id === "invalid-prompt") {
          return {
            data: null,
            error: "Invalid prompt ID - no valid version found",
          };
        }
        if (params.prompt_id === "deleted-prompt") {
          return {
            data: null,
            error: "Prompt has been deleted",
          };
        }
        if (params.prompt_id === "unauthorized-prompt") {
          return {
            data: null,
            error: "You do not have access to this prompt",
          };
        }
        if (params.prompt_id === "malformed-prompt") {
          return {
            data: null,
            error: "Prompt data is malformed",
          };
        }

        // Default: prompt not found
        return { data: null, error: "Prompt not found" };
      }

      async getMergedPromptBody(params: any, orgId: string) {
        // Simulate prompt body merging with inputs
        const messages = params.messages || [
          { role: "user", content: "Default message" },
        ];

        // If inputs are provided, simulate variable substitution
        if (params.inputs) {
          const processedMessages = messages.map((msg: any) => {
            let content = msg.content;
            for (const [key, value] of Object.entries(params.inputs)) {
              content = content.replace(
                new RegExp(`\\{\\{${key}\\}\\}`, "g"),
                String(value)
              );
            }
            return { ...msg, content };
          });

          return {
            data: {
              body: {
                model: params.model,
                messages: processedMessages,
                ...(params.max_tokens && { max_tokens: params.max_tokens }),
              },
              errors: [],
              promptVersionId: `version-${params.prompt_id || "default"}`,
            },
            error: null,
          };
        }

        return {
          data: {
            body: {
              model: params.model,
              messages,
              ...(params.max_tokens && { max_tokens: params.max_tokens }),
            },
            errors: [],
            promptVersionId: `version-${params.prompt_id || "default"}`,
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

describe("Prompt Model Auto-Resolution - Extensive Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // SECTION 1: Basic Model Resolution from prompt_id
  // ============================================================================
  describe("Basic Model Resolution", () => {
    describe("OpenAI Models", () => {
      it("should fetch GPT-4o model from prompt_id", async () => {
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

        // Should not return 400 for missing model
        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch GPT-4o-mini model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-gpt4-mini",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch GPT-3.5-turbo model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-gpt35",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch o1 model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-o1",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch o3-mini model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-o3-mini",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });
    });

    describe("Anthropic Models", () => {
      it("should fetch Claude 3.5 Sonnet model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-claude",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch Claude 3 Opus model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-claude-opus",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch Claude 3.5 Haiku model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-claude-haiku",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });
    });

    describe("Google/Gemini Models", () => {
      it("should fetch Gemini 2.0 Flash model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-gemini",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch Gemini 1.5 Pro model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-gemini-pro",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });
    });

    describe("Other Providers", () => {
      it("should fetch DeepSeek model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-deepseek",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch Groq model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-groq",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch xAI/Grok model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-xai",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch Mistral model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-mistral",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch Together AI model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-together",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });

      it("should fetch Fireworks AI model from prompt_id", async () => {
        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
            },
            body: JSON.stringify({
              prompt_id: "test-prompt-fireworks",
              messages: [{ role: "user", content: "Hello" }],
            }),
          }
        );

        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      });
    });
  });

  // ============================================================================
  // SECTION 2: Environment-based Model Resolution
  // ============================================================================
  describe("Environment-based Model Resolution", () => {
    it("should fetch production model when environment=production", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-env",
            environment: "production",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should fetch staging model when environment=staging", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-env",
            environment: "staging",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should fetch development model when environment=development", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-env",
            environment: "development",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should fetch testing model (different provider) when environment=testing", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-env",
            environment: "testing",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should fallback to production when environment is not found", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-env",
            environment: "unknown-environment",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      // Should fall back to production, not fail
      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });
  });

  // ============================================================================
  // SECTION 3: Version-based Model Resolution
  // ============================================================================
  describe("Version-based Model Resolution", () => {
    it("should fetch model from specific version v1", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-versioned",
            version_id: "v1-uuid-1234",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should fetch model from specific version v2", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-versioned",
            version_id: "v2-uuid-5678",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should fetch model from specific version v3 (different provider)", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-versioned",
            version_id: "v3-uuid-9012",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should fallback to production when version_id is not found", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-versioned",
            version_id: "unknown-version-id",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      // Should fall back to production version
      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });
  });

  // ============================================================================
  // SECTION 4: Model Override Behavior (explicit model takes precedence)
  // ============================================================================
  describe("Model Override Behavior", () => {
    it("should use provided model even when prompt_id has different model", async () => {
      // The prompt "test-prompt-claude" returns claude model, but we provide gpt-4o
      const scenario: GatewayTestScenario = {
        model: "gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "Hello" }],
          maxTokens: 100,
          body: {
            prompt_id: "test-prompt-claude", // This would return claude, but explicit model wins
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
              data: createOpenAIMockResponse("gpt-4o"),
            },
          ],
          finalStatus: 200,
        },
      };

      await runGatewayTest(scenario);
    });

    it("should use provided model with environment prompt", async () => {
      const scenario: GatewayTestScenario = {
        model: "claude-3-5-sonnet-20241022/anthropic",
        request: {
          messages: [{ role: "user", content: "Hello" }],
          maxTokens: 100,
          body: {
            prompt_id: "test-prompt-env",
            environment: "production", // Would return gpt-4o-mini
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.anthropic.com/v1/messages",
              response: "success",
              model: "claude-3-5-sonnet-20241022",
              data: createAnthropicMockResponse("claude-3-5-sonnet-20241022"),
            },
          ],
          finalStatus: 200,
        },
      };

      await runGatewayTest(scenario);
    });

    it("should use provided model with version_id prompt", async () => {
      const scenario: GatewayTestScenario = {
        model: "gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "Hello" }],
          maxTokens: 100,
          body: {
            prompt_id: "test-prompt-versioned",
            version_id: "v1-uuid-1234", // Would return gpt-3.5-turbo
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
              data: createOpenAIMockResponse("gpt-4o"),
            },
          ],
          finalStatus: 200,
        },
      };

      await runGatewayTest(scenario);
    });
  });

  // ============================================================================
  // SECTION 5: Error Cases
  // ============================================================================
  describe("Error Cases", () => {
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
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("Failed to fetch model from prompt");
    });

    it("should return error when prompt_id does not exist", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "nonexistent-prompt-xyz-123",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("Failed to fetch model from prompt");
    });

    it("should return error when prompt has been deleted", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "deleted-prompt",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("Failed to fetch model from prompt");
    });

    it("should return error when user lacks access to prompt", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "unauthorized-prompt",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("Failed to fetch model from prompt");
    });

    it("should return error when prompt data is malformed", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "malformed-prompt",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("Failed to fetch model from prompt");
    });

    it("should return error when prompt has no model configured", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-no-model",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("Failed to fetch model from prompt");
    });

    it("should require prompt_id when using inputs without model", async () => {
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
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("prompt_id is required");
    });

    it("should require prompt_id when using environment without model", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            environment: "production",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 100,
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("prompt_id is required");
    });

    it("should require prompt_id when using version_id without model", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            version_id: "some-version-id",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 100,
          }),
        }
      );

      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("prompt_id is required");
    });

    it("should return proper error for missing model when no prompt fields", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 100,
          }),
        }
      );

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("Invalid body or missing model");
    });
  });

  // ============================================================================
  // SECTION 6: Prompt with Inputs (Variable Substitution)
  // ============================================================================
  describe("Prompt with Inputs", () => {
    it("should resolve model and process inputs together", async () => {
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
            inputs: {
              name: "Alice",
              topic: "AI",
            },
            messages: [
              { role: "user", content: "Hello {{name}}, let's talk about {{topic}}" },
            ],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
      expect(text).not.toContain("prompt_id is required");
    });

    it("should resolve model from environment with inputs", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-env",
            environment: "staging",
            inputs: {
              user_name: "Bob",
            },
            messages: [{ role: "user", content: "Welcome {{user_name}}" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should resolve model from version with inputs", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-versioned",
            version_id: "v2-uuid-5678",
            inputs: {
              question: "What is the meaning of life?",
            },
            messages: [{ role: "user", content: "{{question}}" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });
  });

  // ============================================================================
  // SECTION 7: Full Integration Tests with Provider Verification
  // ============================================================================
  describe("Full Integration with Provider Verification", () => {
    it("should route to OpenAI when prompt resolves to OpenAI model", async () => {
      const scenario: GatewayTestScenario = {
        model: "gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "Hello" }],
          maxTokens: 100,
          body: {
            prompt_id: "test-prompt-gpt4",
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
              data: createOpenAIMockResponse("gpt-4o"),
              expects: {
                headers: {
                  Authorization: /^Bearer /,
                },
              },
            },
          ],
          finalStatus: 200,
        },
      };

      // Note: This test uses explicit model to verify routing
      // The actual prompt resolution without model is tested above
      await runGatewayTest(scenario);
    });

    it("should route to Anthropic when prompt resolves to Anthropic model", async () => {
      const scenario: GatewayTestScenario = {
        model: "claude-3-5-sonnet-20241022/anthropic",
        request: {
          messages: [{ role: "user", content: "Hello" }],
          maxTokens: 100,
          body: {
            prompt_id: "test-prompt-claude",
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.anthropic.com/v1/messages",
              response: "success",
              model: "claude-3-5-sonnet-20241022",
              data: createAnthropicMockResponse("claude-3-5-sonnet-20241022"),
            },
          ],
          finalStatus: 200,
        },
      };

      await runGatewayTest(scenario);
    });
  });

  // ============================================================================
  // SECTION 8: Edge Cases
  // ============================================================================
  describe("Edge Cases", () => {
    it("should handle prompt_id with special characters", async () => {
      // Most IDs are UUIDs, but test edge cases
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-with-dashes-123",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      // Should fail gracefully with proper error
      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain("Failed to fetch model from prompt");
    });

    it("should handle empty prompt_id", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      // Empty prompt_id should be treated as no prompt_id
      expect(response.status).toBe(400);
    });

    it("should handle null prompt_id", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: null,
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      // Null prompt_id should be treated as missing model
      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("Invalid body or missing model");
    });

    it("should handle very long prompt_id", async () => {
      const longPromptId = "a".repeat(1000);
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: longPromptId,
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      // Should fail gracefully
      expect(response.status).toBe(400);
    });

    it("should handle empty inputs object", async () => {
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
            inputs: {},
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      // Empty inputs should be fine, model should still resolve
      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should handle multiple prompt fields together", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-versioned",
            version_id: "v2-uuid-5678",
            environment: "staging", // environment should be ignored when version_id is present
            inputs: { key: "value" },
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should handle request with only max_tokens and prompt_id", async () => {
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
            max_tokens: 500,
            // Note: messages will come from the prompt body
          }),
        }
      );

      // Should resolve model from prompt
      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });
  });

  // ============================================================================
  // SECTION 9: Streaming Requests
  // ============================================================================
  describe("Streaming Requests with Prompt Model Resolution", () => {
    it("should resolve model for streaming request", async () => {
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
            stream: true,
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should resolve model for streaming request with environment", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-env",
            environment: "production",
            messages: [{ role: "user", content: "Hello" }],
            stream: true,
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });
  });

  // ============================================================================
  // SECTION 10: Fallback Model Configuration
  // ============================================================================
  describe("Fallback Model Configuration from Prompt", () => {
    it("should handle comma-separated model string from prompt (fallback)", async () => {
      // This tests when a prompt returns a fallback configuration
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-fallback-config",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });
  });

  // ============================================================================
  // SECTION 11: Concurrent Requests
  // ============================================================================
  describe("Concurrent Requests", () => {
    it("should handle multiple concurrent requests with different prompts", async () => {
      const requests = [
        SELF.fetch("https://ai-gateway.helicone.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-gpt4",
            messages: [{ role: "user", content: "Request 1" }],
          }),
        }),
        SELF.fetch("https://ai-gateway.helicone.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-claude",
            messages: [{ role: "user", content: "Request 2" }],
          }),
        }),
        SELF.fetch("https://ai-gateway.helicone.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-gemini",
            messages: [{ role: "user", content: "Request 3" }],
          }),
        }),
      ];

      const responses = await Promise.all(requests);

      for (const response of responses) {
        expect(response.status).not.toBe(400);
        const text = await response.text();
        expect(text).not.toContain("Invalid body or missing model");
      }
    });
  });

  // ============================================================================
  // SECTION 12: Request Body Preservation
  // ============================================================================
  describe("Request Body Preservation", () => {
    it("should preserve other request parameters when resolving model", async () => {
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
            max_tokens: 150,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0.5,
            presence_penalty: 0.5,
            stop: ["\\n"],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should preserve response_format when resolving model", async () => {
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
            messages: [{ role: "user", content: "Return JSON" }],
            response_format: { type: "json_object" },
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });

    it("should preserve tools/functions when resolving model", async () => {
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
            messages: [{ role: "user", content: "Get the weather" }],
            tools: [
              {
                type: "function",
                function: {
                  name: "get_weather",
                  description: "Get weather for a location",
                  parameters: {
                    type: "object",
                    properties: {
                      location: { type: "string" },
                    },
                    required: ["location"],
                  },
                },
              },
            ],
          }),
        }
      );

      expect(response.status).not.toBe(400);
      const text = await response.text();
      expect(text).not.toContain("Invalid body or missing model");
    });
  });

  // ============================================================================
  // SECTION 13: Empty Model String Handling
  // ============================================================================
  describe("Empty Model String Handling", () => {
    it("should fail gracefully when prompt returns empty model string", async () => {
      const response = await SELF.fetch(
        "https://ai-gateway.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
          },
          body: JSON.stringify({
            prompt_id: "test-prompt-empty-model",
            messages: [{ role: "user", content: "Hello" }],
          }),
        }
      );

      // Empty model string should be handled
      expect(response.status).toBe(400);
    });
  });
});
