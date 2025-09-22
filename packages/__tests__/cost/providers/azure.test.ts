import { describe, it, expect } from "@jest/globals";
import { AzureOpenAIProvider } from "../../../cost/models/providers/azure";
import type { ModelProviderConfig, UserEndpointConfig, Endpoint } from "../../../cost/models/types";

describe("AzureOpenAIProvider", () => {
  const provider = new AzureOpenAIProvider();

  const createMockEndpoint = (userConfig: UserEndpointConfig): Endpoint => ({
    providerModelId: "gpt-4o",
    provider: "azure",
    author: "openai",
    pricing: [{
      threshold: 0,
      input: 0.0000025,
      output: 0.00001,
    }],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    ptbEnabled: false,
    supportedParameters: ["temperature", "max_tokens"],
    userConfig,
    modelConfig: {
      providerModelId: "gpt-4o",
      provider: "azure",
      author: "openai",
      supportedParameters: ["temperature", "max_tokens"],
      pricing: [{
        threshold: 0,
        input: 0.0000025,
        output: 0.00001,
      }],
      contextLength: 128000,
      maxCompletionTokens: 16384,
      ptbEnabled: false,
      endpointConfigs: {
        "*": {}
      }
    }
  });

  const mockEndpoint = createMockEndpoint({});

  describe("buildUrl", () => {
    describe("deployment name fallback chain", () => {
      it("should handle EMPTY STRING deploymentName by falling back to providerModelId", () => {
        // This is the bug that was missed - frontend sends empty string, not undefined!
        const config: UserEndpointConfig = {
          deploymentName: "",  // Empty string from frontend form
          baseUri: "https://test-resource.openai.azure.com",
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        // Should use providerModelId (gpt-4o) since deploymentName is empty
        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should handle whitespace-only deploymentName by falling back", () => {
        const config: UserEndpointConfig = {
          deploymentName: "   ",  // Only whitespace
          baseUri: "https://test-resource.openai.azure.com",
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        // Should trim and fallback to providerModelId
        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should handle undefined deploymentName by falling back to providerModelId", () => {
        const config: UserEndpointConfig = {
          deploymentName: undefined,
          baseUri: "https://test-resource.openai.azure.com",
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should handle null deploymentName by falling back to providerModelId", () => {
        const config: UserEndpointConfig = {
          deploymentName: null as any,
          baseUri: "https://test-resource.openai.azure.com",
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should use valid deploymentName when provided", () => {
        const config: UserEndpointConfig = {
          deploymentName: "my-custom-deployment",
          baseUri: "https://test-resource.openai.azure.com",
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/my-custom-deployment/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should fallback to modelName when deploymentName and providerModelId are empty", () => {
        const config: UserEndpointConfig = {
          deploymentName: "",
          modelName: "fallback-model-name",
          baseUri: "https://test-resource.openai.azure.com",
        };

        const endpointNoModelId = createMockEndpoint(config);
        endpointNoModelId.providerModelId = "";

        const url = provider.buildUrl(endpointNoModelId, { isStreaming: false });

        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/fallback-model-name/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should throw error when no deployment name option is available", () => {
        const config: UserEndpointConfig = {
          deploymentName: "",
          modelName: "",
          baseUri: "https://test-resource.openai.azure.com",
        };

        const endpointNoModelId = createMockEndpoint(config);
        endpointNoModelId.providerModelId = "";

        expect(() => provider.buildUrl(endpointNoModelId, { isStreaming: false })).toThrow(
          "Azure OpenAI requires a deployment name, provider model ID, or model name"
        );
      });
    });

    describe("base URI handling", () => {
      it("should use PTB gateway URL when ptbEnabled and no baseUri provided", () => {
        const config: UserEndpointConfig = {
          deploymentName: "test-deployment",
        };

        const ptbEndpoint = createMockEndpoint(config);
        ptbEndpoint.ptbEnabled = true;

        const url = provider.buildUrl(ptbEndpoint, { isStreaming: false });

        expect(url).toBe(
          "https://helicone-gateway.cognitiveservices.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should prefer provided baseUri over PTB gateway", () => {
        const config: UserEndpointConfig = {
          deploymentName: "test-deployment",
          baseUri: "https://custom.openai.azure.com",
        };

        const ptbEndpoint = createMockEndpoint(config);
        ptbEndpoint.ptbEnabled = true;

        const url = provider.buildUrl(ptbEndpoint, { isStreaming: false });

        expect(url).toBe(
          "https://custom.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should throw error when no baseUri and PTB is disabled", () => {
        const config: UserEndpointConfig = {
          deploymentName: "test-deployment",
        };

        const endpoint = createMockEndpoint(config);
        expect(() => provider.buildUrl(endpoint, { isStreaming: false })).toThrow(
          "Azure OpenAI requires baseUri"
        );
      });

      it("should handle baseUri with trailing slash", () => {
        const config: UserEndpointConfig = {
          deploymentName: "test-deployment",
          baseUri: "https://test-resource.openai.azure.com/",  // Trailing slash
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        // Should not have double slash
        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview"
        );
      });

      it("should handle baseUri without trailing slash", () => {
        const config: UserEndpointConfig = {
          deploymentName: "test-deployment",
          baseUri: "https://test-resource.openai.azure.com",  // No trailing slash
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview"
        );
      });
    });

    describe("API version handling", () => {
      it("should use default API version when not specified", () => {
        const config: UserEndpointConfig = {
          deploymentName: "test-deployment",
          baseUri: "https://test-resource.openai.azure.com",
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        expect(url).toContain("api-version=2025-01-01-preview");
      });

      it("should use custom API version when provided", () => {
        const config: UserEndpointConfig = {
          deploymentName: "test-deployment",
          baseUri: "https://test-resource.openai.azure.com",
          apiVersion: "2024-06-01",
        };

        const endpoint = createMockEndpoint(config);
        const url = provider.buildUrl(endpoint, { isStreaming: false });

        expect(url).toBe(
          "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2024-06-01"
        );
      });
    });
  });

  describe("authenticate", () => {
    it("should return api-key header with provided key", () => {
      const context = {
        endpoint: {} as any,
        config: {},
        apiKey: "test-azure-api-key",
      };

      const result = provider.authenticate(context);

      expect(result).toEqual({
        headers: {
          "api-key": "test-azure-api-key",
        },
      });
    });

    it("should return api-key header with empty string when no key provided", () => {
      const context = {
        endpoint: {} as any,
        config: {},
        apiKey: undefined,
      };

      const result = provider.authenticate(context);

      expect(result).toEqual({
        headers: {
          "api-key": "",
        },
      });
    });
  });

  describe("provider metadata", () => {
    it("should have correct display name", () => {
      expect(provider.displayName).toBe("Azure OpenAI");
    });

    it("should have correct auth type", () => {
      expect(provider.auth).toBe("api-key");
    });

    it("should have required config fields", () => {
      expect(provider.requiredConfig).toEqual(["resourceName", "deploymentName"]);
    });

    it("should have correct base URL template", () => {
      expect(provider.baseUrl).toBe("https://{resourceName}.openai.azure.com");
    });
  });
});