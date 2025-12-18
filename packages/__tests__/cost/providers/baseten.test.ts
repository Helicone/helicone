import { describe, it, expect } from "@jest/globals";
import { registry } from "../../../cost/models/registry";
import { buildRequestBody } from "../../../cost/models/provider-helpers";

describe("Baseten provider", () => {
  describe("kimi-k2-0905:baseten endpoint", () => {
    it("should have correct providerModelId with moonshotai/ prefix", () => {
      const configResult = registry.getModelProviderConfig(
        "kimi-k2-0905",
        "baseten"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.providerModelId).toBe(
        "moonshotai/Kimi-K2-Instruct-0905"
      );
    });

    it("should build endpoint with correct providerModelId", () => {
      const configResult = registry.getModelProviderConfig(
        "kimi-k2-0905",
        "baseten"
      );
      expect(configResult.data).toBeDefined();

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();
      expect(endpointResult.data?.providerModelId).toBe(
        "moonshotai/Kimi-K2-Instruct-0905"
      );
    });

    it("should include correct model in request body", async () => {
      const configResult = registry.getModelProviderConfig(
        "kimi-k2-0905",
        "baseten"
      );
      expect(configResult.data).toBeDefined();

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();

      const mockParsedBody = {
        model: "kimi-k2-0905",
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
      // The model in the request body should be the provider model ID
      expect(parsed.model).toBe("moonshotai/Kimi-K2-Instruct-0905");
    });
  });

  describe("gpt-oss-120b:baseten endpoint", () => {
    it("should have correct providerModelId with openai/ prefix", () => {
      const configResult = registry.getModelProviderConfig(
        "gpt-oss-120b",
        "baseten"
      );
      expect(configResult.data).toBeDefined();
      expect(configResult.data?.providerModelId).toBe("openai/gpt-oss-120b");
    });

    it("should build endpoint with correct providerModelId", () => {
      const configResult = registry.getModelProviderConfig(
        "gpt-oss-120b",
        "baseten"
      );
      expect(configResult.data).toBeDefined();

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();
      expect(endpointResult.data?.providerModelId).toBe("openai/gpt-oss-120b");
    });

    it("should include correct model in request body", async () => {
      const configResult = registry.getModelProviderConfig(
        "gpt-oss-120b",
        "baseten"
      );
      expect(configResult.data).toBeDefined();

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();

      const mockParsedBody = {
        model: "gpt-oss-120b",
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
      // The model in the request body should be the provider model ID, not the user's input
      expect(parsed.model).toBe("openai/gpt-oss-120b");
    });
  });
});
