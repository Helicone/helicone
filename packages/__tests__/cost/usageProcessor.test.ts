import { describe, it, expect } from "@jest/globals";
import { OpenAIUsageProcessor } from "@helicone-package/cost/usage/openAIUsageProcessor";
import { AnthropicUsageProcessor } from "@helicone-package/cost/usage/anthropicUsageProcessor";
import { GroqUsageProcessor } from "@helicone-package/cost/usage/groqUsageProcessor";
import { XAIUsageProcessor } from "@helicone-package/cost/usage/xaiUsageProcessor";
import { getUsageProcessor } from "@helicone-package/cost/usage/getUsageProcessor";
import * as fs from "fs";
import * as path from "path";

describe("getUsageProcessor", () => {
  it("should return OpenAIUsageProcessor for openai provider", () => {
    const processor = getUsageProcessor("openai");
    expect(processor).toBeInstanceOf(OpenAIUsageProcessor);
  });

  it("should return AnthropicUsageProcessor for anthropic provider", () => {
    const processor = getUsageProcessor("anthropic");
    expect(processor).toBeInstanceOf(AnthropicUsageProcessor);
  it("should return OpenAIUsageProcessor for xai provider", () => {
    const processor = getUsageProcessor("xai");
    expect(processor).toBeInstanceOf(OpenAIUsageProcessor);
  });

  it("should return OpenAIUsageProcessor for groq provider", () => {
    const processor = getUsageProcessor("groq");
    expect(processor).toBeInstanceOf(OpenAIUsageProcessor);
  });

  it("should throw error for unsupported provider", () => {
    expect(() => {
      getUsageProcessor("unsupported-provider" as any);
    }).toThrow("Usage processor not found for provider: unsupported-provider");
  });
});

describe("OpenAIUsageProcessor", () => {
  const processor = new OpenAIUsageProcessor();

  it("should parse real GPT-4o response with cached tokens", async () => {
    const responseData = fs.readFileSync(
      path.join(__dirname, "testData", "gpt4o-response-cached.snapshot"),
      "utf-8"
    );

    const result = await processor.parse({
      responseBody: responseData,
      isStream: false,
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 96,
      output: 10,
      cacheDetails: {
        cachedInput: 1152,
      },
    });
  });

  it("should parse real GPT-4o stream response", async () => {
    const streamData = fs.readFileSync(
      path.join(__dirname, "testData", "gpt4o-stream-response.snapshot"),
      "utf-8"
    );

    const result = await processor.parse({
      responseBody: streamData,
      isStream: true,
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 1248,
      output: 10,
    });
  });

  it("usage processing snapshot", async () => {
    const testCases = [
      {
        name: "cached-response",
        data: fs.readFileSync(
          path.join(__dirname, "testData", "gpt4o-response-cached.snapshot"),
          "utf-8"
        ),
        isStream: false,
      },
      {
        name: "stream-response",
        data: fs.readFileSync(
          path.join(__dirname, "testData", "gpt4o-stream-response.snapshot"),
          "utf-8"
        ),
        isStream: true,
      },
    ];

    const results: Record<string, any> = {};

    for (const testCase of testCases) {
      const result = await processor.parse({
        responseBody: testCase.data,
        isStream: testCase.isStream,
      });
      results[testCase.name] = result;
    }

    expect(results).toMatchSnapshot();
  });
});

describe("AnthropicUsageProcessor", () => {
  const processor = new AnthropicUsageProcessor();

  it("should parse Anthropic response with cache details", async () => {
    const responseData = fs.readFileSync(
      path.join(__dirname, "testData", "anthropic-response.snapshot"),
      "utf-8"
    );

    const result = await processor.parse({ 
      responseBody: responseData, 
      isStream: false 
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 9,
      output: 12,
      cacheDetails: {
        cachedInput: 183,
        write5m: 50
      }
    });
  });

  it("should parse Anthropic stream response", async () => {
    const streamData = fs.readFileSync(
      path.join(__dirname, "testData", "anthropic-stream-response.snapshot"),
      "utf-8"
    );

    const result = await processor.parse({ 
      responseBody: streamData, 
      isStream: true 
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 338,
      output: 65,
      cacheDetails: {
        cachedInput: 500,
        write1h: 20
      }
    });
  });

  it("usage processing snapshot", async () => {
    const testCases = [
      {
        name: "anthropic-response",
        data: fs.readFileSync(path.join(__dirname, "testData", "anthropic-response.snapshot"), "utf-8"),
        isStream: false
      },
      {
        name: "anthropic-stream-response", 
        data: fs.readFileSync(path.join(__dirname, "testData", "anthropic-stream-response.snapshot"), "utf-8"),
        isStream: true
      }
    ];

    const results: Record<string, any> = {};
    
    for (const testCase of testCases) {
      const result = await processor.parse({
        responseBody: testCase.data,
        isStream: testCase.isStream
      });
      results[testCase.name] = result;
    }

    expect(results).toMatchSnapshot();
  });
}); 

  describe("XAI/Grok specific features", () => {
    const xaiProcessor = new XAIUsageProcessor();

    it("should parse XAI response with web search", async () => {
      const xaiResponse = fs.readFileSync(
        path.join(__dirname, "testData", "xai-response-websearch.snapshot"),
        "utf-8"
      );

      const result = await xaiProcessor.parse({
        responseBody: xaiResponse,
        isStream: false,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 26, // text_tokens (26) - cached are handled separately
        output: 15,
        cacheDetails: {
          cachedInput: 6,
        },
        web_search: 5,
      });
    });

    it("should parse XAI response with reasoning tokens", async () => {
      const xaiResponse = fs.readFileSync(
        path.join(__dirname, "testData", "xai-response-reasoning.snapshot"),
        "utf-8"
      );

      const result = await xaiProcessor.parse({
        responseBody: xaiResponse,
        isStream: false,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 45, // text_tokens (45)
        output: 35, // completion_tokens (120) - reasoning_tokens (85)
        cacheDetails: {
          cachedInput: 5,
        },
        thinking: 85,
      });
      // web_search should not be present when num_sources_used is 0
      expect(result.data?.web_search).toBeUndefined();
    });

    it("should parse XAI stream response with web search", async () => {
      const streamData = fs.readFileSync(
        path.join(__dirname, "testData", "xai-stream-response.snapshot"),
        "utf-8"
      );

      const result = await xaiProcessor.parse({
        responseBody: streamData,
        isStream: true,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 30, // text_tokens (30) - cached handled separately
        output: 8,
        cacheDetails: {
          cachedInput: 12,
        },
        web_search: 3,
      });
    });
  });

  describe("Groq specific features", () => {
    const groqProcessor = new GroqUsageProcessor();

    it("should parse Groq non-streaming response", async () => {
      const groqResponse = fs.readFileSync(
        path.join(__dirname, "testData", "groq-response.snapshot"),
        "utf-8"
      );

      const result = await groqProcessor.parse({
        responseBody: groqResponse,
        isStream: false,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 50,
        output: 10,
      });
    });

    it("should parse Groq streaming response with usage in x_groq", async () => {
      const streamData = fs.readFileSync(
        path.join(__dirname, "testData", "groq-stream-response.snapshot"),
        "utf-8"
      );

      const result = await groqProcessor.parse({
        responseBody: streamData,
        isStream: true,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 47,
        output: 10,
      });
    });
  });
});
