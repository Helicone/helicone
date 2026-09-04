import { describe, it, expect } from "@jest/globals";
import { registry } from "../../../cost/models/registry";
import { buildRequestBody } from "../../../cost/models/provider-helpers";
import { MiniMaxProvider } from "../../../cost/models/providers/minimax";
import { providers } from "../../../cost/models/providers";
import { getUsageProcessor } from "../../../cost/usage/getUsageProcessor";
import {
  heliconeProviderToModelProviderName,
  dbProviderToProvider,
} from "../../../cost/models/provider-helpers";

describe("MiniMax provider", () => {
  describe("provider class", () => {
    const provider = new MiniMaxProvider();

    it("should have correct display name", () => {
      expect(provider.displayName).toBe("MiniMax");
    });

    it("should have correct base URL", () => {
      expect(provider.baseUrl).toBe("https://api.minimax.io");
    });

    it("should use api-key auth", () => {
      expect(provider.auth).toBe("api-key");
    });

    it("should build correct URL", () => {
      const url = provider.buildUrl({} as any, {} as any);
      expect(url).toBe("https://api.minimax.io/v1/chat/completions");
    });

    it("should have pricing pages", () => {
      expect(provider.pricingPages.length).toBeGreaterThan(0);
    });

    it("should have model pages", () => {
      expect(provider.modelPages.length).toBeGreaterThan(0);
    });
  });

  describe("provider registry", () => {
    it("should be registered in providers", () => {
      expect(providers.minimax).toBeDefined();
      expect(providers.minimax).toBeInstanceOf(MiniMaxProvider);
    });

    it("should have usage processor", () => {
      const processor = getUsageProcessor("minimax");
      expect(processor).not.toBeNull();
    });
  });

  describe("provider name mapping", () => {
    it("should map MINIMAX to minimax", () => {
      expect(heliconeProviderToModelProviderName("MINIMAX")).toBe("minimax");
    });

    it("should map db provider names", () => {
      expect(dbProviderToProvider("minimax")).toBe("minimax");
      expect(dbProviderToProvider("MiniMax")).toBe("minimax");
    });
  });

  describe("minimax-m2.7:minimax endpoint", () => {
    it("should have correct model config", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.providerModelId).toBe("MiniMax-M2.7");
      expect(configResult.data?.provider).toBe("minimax");
      expect(configResult.data?.author).toBe("minimax");
    });

    it("should have correct pricing", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.pricing[0].input).toBe(0.0000002);
      expect(configResult.data?.pricing[0].output).toBe(0.0000011);
    });

    it("should have correct context length", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.contextLength).toBe(1_000_000);
      expect(configResult.data?.maxCompletionTokens).toBe(16_384);
    });

    it("should build endpoint with correct providerModelId", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data).toBeDefined();

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();
      expect(endpointResult.data?.providerModelId).toBe("MiniMax-M2.7");
    });

    it("should include correct model in request body", async () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data).toBeDefined();

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();

      const mockParsedBody = {
        model: "minimax-m2.7",
        messages: [{ role: "user", content: "hello" }],
      };
      const result = await buildRequestBody(endpointResult.data!, {
        parsedBody: mockParsedBody,
        bodyMapping: "OPENAI",
        toAnthropic: (body: any) => body,
        toChatCompletions: (body: any) => body,
      });

      expect(result.data).toBeDefined();
      const parsed = JSON.parse(result.data!);
      expect(parsed.model).toBe("MiniMax-M2.7");
    });

    it("should support required parameters", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data).toBeDefined();
      const params = configResult.data?.supportedParameters || [];
      expect(params).toContain("max_tokens");
      expect(params).toContain("temperature");
      expect(params).toContain("top_p");
      expect(params).toContain("stream");
      expect(params).toContain("tools");
      expect(params).toContain("tool_choice");
    });

    it("should have PTB enabled", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data?.ptbEnabled).toBe(true);
    });
  });

  describe("minimax-m2.7-highspeed:minimax endpoint", () => {
    it("should have correct model config", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7-highspeed",
        "minimax"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.providerModelId).toBe(
        "MiniMax-M2.7-highspeed"
      );
    });

    it("should have lower pricing than M2.7", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7-highspeed",
        "minimax"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.pricing[0].input).toBe(0.0000001);
      expect(configResult.data?.pricing[0].output).toBe(0.00000055);
    });
  });

  describe("minimax-m2.5:minimax endpoint", () => {
    it("should have correct model config", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.5",
        "minimax"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.providerModelId).toBe("MiniMax-M2.5");
      expect(configResult.data?.contextLength).toBe(204_000);
      expect(configResult.data?.maxCompletionTokens).toBe(8_192);
    });
  });

  describe("minimax-m2.5-highspeed:minimax endpoint", () => {
    it("should have correct model config", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.5-highspeed",
        "minimax"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.providerModelId).toBe(
        "MiniMax-M2.5-highspeed"
      );
    });
  });

  describe("model registry", () => {
    it("should list all MiniMax models", () => {
      const allModels = registry.getAllModelIds();
      expect(allModels.data).toBeDefined();
      expect(allModels.data).toContain("minimax-m2.7");
      expect(allModels.data).toContain("minimax-m2.7-highspeed");
      expect(allModels.data).toContain("minimax-m2.5");
      expect(allModels.data).toContain("minimax-m2.5-highspeed");
    });

    it("should return minimax provider for minimax models", () => {
      const providers = registry.getModelProviders("minimax-m2.7");
      expect(providers.data).toBeDefined();
      expect(providers.data?.has("minimax")).toBe(true);
    });

    it("should return correct author for minimax models", () => {
      const author = registry.getAuthorByModel("minimax-m2.7");
      expect(author).toBe("minimax");
    });
  });
});
