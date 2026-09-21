import { describe, it, expect } from "@jest/globals";
import { registry } from "../../../cost/models/registry";
import {
  buildEndpointUrl,
  buildRequestBody,
  parseModelString,
} from "../../../cost/models/provider-helpers";
import { getUsageProcessor } from "../../../cost/usage/getUsageProcessor";

describe("MiniMax integration", () => {
  describe("model string parsing", () => {
    it("should parse minimax-m2.7 without provider", () => {
      const result = parseModelString("minimax-m2.7");
      expect(result.data).toBeDefined();
      expect(result.data?.modelName).toBe("minimax-m2.7");
      expect(result.data?.provider).toBeUndefined();
    });

    it("should parse minimax-m2.7/minimax with provider", () => {
      const result = parseModelString("minimax-m2.7/minimax");
      expect(result.data).toBeDefined();
      expect(result.data?.modelName).toBe("minimax-m2.7");
      expect(result.data?.provider).toBe("minimax");
    });

    it("should parse minimax-m2.5-highspeed/minimax", () => {
      const result = parseModelString("minimax-m2.5-highspeed/minimax");
      expect(result.data).toBeDefined();
      expect(result.data?.modelName).toBe("minimax-m2.5-highspeed");
      expect(result.data?.provider).toBe("minimax");
    });
  });

  describe("endpoint URL building", () => {
    it("should build correct URL for minimax-m2.7", () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data).toBeDefined();

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();

      const urlResult = buildEndpointUrl(endpointResult.data!, {});
      expect(urlResult.data).toBe(
        "https://api.minimax.io/v1/chat/completions"
      );
    });
  });

  describe("usage processing", () => {
    it("should process OpenAI-format usage for minimax", async () => {
      const processor = getUsageProcessor("minimax");
      expect(processor).not.toBeNull();

      const mockResponse = {
        id: "minimax-test-123",
        object: "chat.completion",
        created: Date.now(),
        model: "MiniMax-M2.7",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello! How can I help you?",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
      };

      const result = await processor!.parse({
        responseBody: JSON.stringify(mockResponse),
        model: "MiniMax-M2.7",
        isStream: false,
      });
      expect(result.data).toBeDefined();
      expect(result.data?.input).toBe(10);
      expect(result.data?.output).toBe(8);
    });
  });

  describe("PTB endpoints", () => {
    it("should return PTB endpoints for minimax-m2.7", () => {
      const result = registry.getPtbEndpointsByProvider(
        "minimax-m2.7",
        "minimax"
      );
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0].provider).toBe("minimax");
    });

    it("should return PTB endpoints for all MiniMax models", () => {
      const models = [
        "minimax-m2.7",
        "minimax-m2.7-highspeed",
        "minimax-m2.5",
        "minimax-m2.5-highspeed",
      ];

      for (const model of models) {
        const result = registry.getPtbEndpointsByProvider(model, "minimax");
        expect(result.data).toBeDefined();
        expect(result.data!.length).toBeGreaterThan(0);
      }
    });
  });

  describe("full request flow", () => {
    it("should build complete request for minimax-m2.7", async () => {
      const configResult = registry.getModelProviderConfig(
        "minimax-m2.7",
        "minimax"
      );
      expect(configResult.data).toBeDefined();

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();

      // Build URL
      const urlResult = buildEndpointUrl(endpointResult.data!, {});
      expect(urlResult.data).toBe(
        "https://api.minimax.io/v1/chat/completions"
      );

      // Build request body
      const mockBody = {
        model: "minimax-m2.7",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "What is 1+1?" },
        ],
        temperature: 0.7,
        max_tokens: 100,
      };

      const bodyResult = await buildRequestBody(endpointResult.data!, {
        parsedBody: mockBody,
        bodyMapping: "OPENAI",
        toAnthropic: (body: any) => body,
        toChatCompletions: (body: any) => body,
      });

      expect(bodyResult.data).toBeDefined();
      const parsed = JSON.parse(bodyResult.data!);
      expect(parsed.model).toBe("MiniMax-M2.7");
      expect(parsed.messages).toHaveLength(2);
      expect(parsed.temperature).toBe(0.7);
      expect(parsed.max_tokens).toBe(100);
    });
  });
});
