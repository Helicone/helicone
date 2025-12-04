import { AnthropicProvider } from "../../../cost/models/providers/anthropic";

describe("AnthropicProvider", () => {
  const provider = new AnthropicProvider();

  describe("buildUrl", () => {
    it("should return the Anthropic messages endpoint", () => {
      const url = provider.buildUrl(
        { providerModelId: "claude-3-haiku" } as any,
        { isStreaming: false }
      );

      expect(url).toBe("https://api.anthropic.com/v1/messages");
    });
  });

  describe("authenticate", () => {
    it("should return x-api-key header with provided key", () => {
      const result = provider.authenticate(
        { apiKey: "test-api-key" },
        { providerModelId: "claude-3-haiku" } as any
      );

      expect(result.headers["x-api-key"]).toBe("test-api-key");
    });

    it("should return anthropic-version header", () => {
      const result = provider.authenticate(
        { apiKey: "test-api-key", bodyMapping: "OPENAI" },
        { providerModelId: "claude-3-haiku" } as any
      );

      expect(result.headers["anthropic-version"]).toBe("2023-06-01");
    });

    it("should include anthropic-beta header for sonnet-4 models", () => {
      const result = provider.authenticate(
        { apiKey: "test-api-key" },
        { providerModelId: "claude-sonnet-4-20250514" } as any
      );

      expect(result.headers["x-api-key"]).toBe("test-api-key");
      expect(result.headers["anthropic-beta"]).toBe("context-management-2025-06-27,context-1m-2025-08-07");
    });

    it("should not include anthropic-beta header for non-sonnet-4 models", () => {
      const result = provider.authenticate(
        { apiKey: "test-api-key" },
        { providerModelId: "claude-3-5-sonnet-20241022" } as any
      );

      expect(result.headers["x-api-key"]).toBe("test-api-key");
      expect(result.headers["anthropic-beta"]).toBe("context-management-2025-06-27");
    });
  });

  describe("provider metadata", () => {
    it("should have correct display name", () => {
      expect(provider.displayName).toBe("Anthropic");
    });

    it("should have correct auth type", () => {
      expect(provider.auth).toBe("api-key");
    });

    it("should have correct base URL", () => {
      expect(provider.baseUrl).toBe("https://api.anthropic.com");
    });
  });
});
