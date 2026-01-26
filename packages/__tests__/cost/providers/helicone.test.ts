import { describe, it, expect } from "@jest/globals";
import { registry } from "../../../cost/models/registry";
import { buildRequestBody } from "../../../cost/models/provider-helpers";
import { toChatCompletions } from "@helicone-package/llm-mapper/transform/providers/responses/request/toChatCompletions";

describe("Helicone provider", () => {
  describe("GPT 4.1 models with RESPONSES bodyMapping", () => {
    const gpt41Models = ["gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano"];

    gpt41Models.forEach((modelName) => {
      it(`should preserve 'input' parameter for ${modelName} (not convert to 'messages')`, async () => {
        const configResult = registry.getModelProviderConfig(
          modelName,
          "helicone"
        );
        expect(configResult.data).toBeDefined();

        const endpointResult = registry.buildEndpoint(configResult.data!, {});
        expect(endpointResult.data).toBeDefined();

        // Responses API format uses 'input', not 'messages'
        const responsesApiBody = {
          model: modelName,
          input: "Hello, world!",
          max_output_tokens: 100,
        };

        const result = await buildRequestBody(endpointResult.data!, {
          parsedBody: responsesApiBody,
          bodyMapping: "RESPONSES",
          toAnthropic: (body: any) => body,
          toChatCompletions: (body: any) => toChatCompletions(body),
        });

        expect(result.data).toBeDefined();
        const parsedResult = JSON.parse(result.data!);

        // Should preserve 'input' and NOT have 'messages'
        expect(parsedResult.input).toBe("Hello, world!");
        expect(parsedResult.messages).toBeUndefined();
      });
    });
  });

  describe("GPT 4o models with RESPONSES bodyMapping", () => {
    const gpt4oModels = ["gpt-4o", "gpt-4o-mini"];

    gpt4oModels.forEach((modelName) => {
      it(`should preserve 'input' parameter for ${modelName} (not convert to 'messages')`, async () => {
        const configResult = registry.getModelProviderConfig(
          modelName,
          "helicone"
        );

        // Skip if model doesn't have helicone endpoint
        if (!configResult.data) {
          return;
        }

        const endpointResult = registry.buildEndpoint(configResult.data!, {});
        expect(endpointResult.data).toBeDefined();

        const responsesApiBody = {
          model: modelName,
          input: "Hello, world!",
          max_output_tokens: 100,
        };

        const result = await buildRequestBody(endpointResult.data!, {
          parsedBody: responsesApiBody,
          bodyMapping: "RESPONSES",
          toAnthropic: (body: any) => body,
          toChatCompletions: (body: any) => toChatCompletions(body),
        });

        expect(result.data).toBeDefined();
        const parsedResult = JSON.parse(result.data!);

        // Should preserve 'input' and NOT have 'messages'
        expect(parsedResult.input).toBe("Hello, world!");
        expect(parsedResult.messages).toBeUndefined();
      });
    });
  });

  describe("Anthropic models with RESPONSES bodyMapping", () => {
    it("should convert 'input' to 'messages' for Claude models", async () => {
      const configResult = registry.getModelProviderConfig(
        "claude-sonnet-4",
        "helicone"
      );

      // Skip if model doesn't have helicone endpoint
      if (!configResult.data) {
        return;
      }

      const endpointResult = registry.buildEndpoint(configResult.data!, {});
      expect(endpointResult.data).toBeDefined();

      const responsesApiBody = {
        model: "claude-sonnet-4",
        input: "Hello, world!",
        max_output_tokens: 100,
      };

      const result = await buildRequestBody(endpointResult.data!, {
        parsedBody: responsesApiBody,
        bodyMapping: "RESPONSES",
        toAnthropic: (body: any, modelId: string) => ({
          ...body,
          model: modelId,
        }),
        toChatCompletions: (body: any) => toChatCompletions(body),
      });

      expect(result.data).toBeDefined();
      const parsedResult = JSON.parse(result.data!);

      // Should have 'messages' (converted from 'input') for Anthropic
      // The body goes through toChatCompletions then toAnthropic
      expect(parsedResult.messages).toBeDefined();
      expect(parsedResult.input).toBeUndefined();
    });
  });
});
