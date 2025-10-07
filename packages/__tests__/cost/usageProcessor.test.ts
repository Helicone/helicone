import { describe, it, expect } from "@jest/globals";
import { OpenAIUsageProcessor } from "@helicone-package/cost/usage/openAIUsageProcessor";
import { AnthropicUsageProcessor } from "@helicone-package/cost/usage/anthropicUsageProcessor";
import { GroqUsageProcessor } from "@helicone-package/cost/usage/groqUsageProcessor";
import { XAIUsageProcessor } from "@helicone-package/cost/usage/xaiUsageProcessor";
import { DeepSeekUsageProcessor } from "@helicone-package/cost/usage/deepseekUsageProcessor";
import {
  VertexUsageProcessor,
  VertexOpenAIUsageProcessor,
} from "@helicone-package/cost/usage/vertexUsageProcessor";
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
  });

  it("should return OpenAIUsageProcessor for xai provider", () => {
    const processor = getUsageProcessor("xai");
    expect(processor).toBeInstanceOf(OpenAIUsageProcessor);
  });

  it("should return OpenAIUsageProcessor for groq provider", () => {
    const processor = getUsageProcessor("groq");
    expect(processor).toBeInstanceOf(OpenAIUsageProcessor);
  });

  it("should return DeepSeekUsageProcessor for deepseek provider", () => {
    const processor = getUsageProcessor("deepseek");
    expect(processor).toBeInstanceOf(DeepSeekUsageProcessor);
  });

  it("should return OpenAIUsageProcessor for azure provider", () => {
    const processor = getUsageProcessor("azure");
    expect(processor).toBeInstanceOf(OpenAIUsageProcessor);
  });

  it("should return null for unsupported provider", () => {
    const processor = getUsageProcessor("unsupported-provider" as any);
    expect(processor).toBeNull();
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
      model: "gpt-4o",
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
      model: "gpt-4o",
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
        model: "gpt-4o",
      });
      results[testCase.name] = result;
    }

    expect(results).toMatchSnapshot();
  });
});

describe("Azure Usage Processing", () => {
  const processor = new OpenAIUsageProcessor(); // Azure uses OpenAI processor

  it("should parse Azure regular response", async () => {
    const responseData = fs.readFileSync(
      path.join(__dirname, "testData", "azure-response.snapshot"),
      "utf-8"
    );

    const result = await processor.parse({
      responseBody: responseData,
      isStream: false,
      model: "gpt-4o",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 18,
      output: 100,
    });
  });

  it("should parse Azure stream response", async () => {
    const streamData = fs.readFileSync(
      path.join(__dirname, "testData", "azure-stream-response.snapshot"),
      "utf-8"
    );

    const result = await processor.parse({
      responseBody: streamData,
      isStream: true,
      model: "gpt-4o",
    });

    expect(result.error).toBeNull();
    // Azure now includes usage data in the final chunk of the stream
    expect(result.data).toEqual({
      input: 18,
      output: 100,
    });
  });

  it("Azure usage processing snapshot", async () => {
    const testCases = [
      {
        name: "azure-response",
        data: fs.readFileSync(
          path.join(__dirname, "testData", "azure-response.snapshot"),
          "utf-8"
        ),
        isStream: false,
      },
      {
        name: "azure-stream-response",
        data: fs.readFileSync(
          path.join(__dirname, "testData", "azure-stream-response.snapshot"),
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
        model: "gpt-4o",
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
      isStream: false,
      model: "claude-sonnet-4",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 9,
      output: 12,
      cacheDetails: {
        cachedInput: 183,
        write5m: 50,
      },
    });
  });

  it("should parse Anthropic stream response", async () => {
    const streamData = fs.readFileSync(
      path.join(__dirname, "testData", "anthropic-stream-response.snapshot"),
      "utf-8"
    );

    const result = await processor.parse({
      responseBody: streamData,
      isStream: true,
      model: "claude-sonnet-4",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 338,
      output: 65,
      cacheDetails: {
        cachedInput: 500,
        write1h: 20,
      },
    });
  });

  it("usage processing snapshot", async () => {
    const testCases = [
      {
        name: "anthropic-response",
        data: fs.readFileSync(
          path.join(__dirname, "testData", "anthropic-response.snapshot"),
          "utf-8"
        ),
        isStream: false,
      },
      {
        name: "anthropic-stream-response",
        data: fs.readFileSync(
          path.join(
            __dirname,
            "testData",
            "anthropic-stream-response.snapshot"
          ),
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
        model: "claude-sonnet-4",
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
      model: "grok-3",
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
      model: "grok-3",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 45, // text_tokens (45)
      output: 35, // completion_tokens (120) - XAI excludes reasoning from this (new behavior)
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
      model: "grok-3",
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
      model: "grok-3",
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
      model: "grok-3",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 47,
      output: 10,
    });
  });

  describe("DeepSeekUsageProcessor", () => {
    const deepseekProcessor = new DeepSeekUsageProcessor();

    it("should parse real DeepSeek non-streaming response", async () => {
      const responseData = fs.readFileSync(
        path.join(__dirname, "testData", "deepseek-non-stream.snapshot"),
        "utf-8"
      );

      const result = await deepseekProcessor.parse({
        responseBody: responseData,
        isStream: false,
        model: "deepseek-r1",
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 13, // prompt_cache_miss_tokens
        output: 723, // completion_tokens
      });
    });

    it("should parse DeepSeek response with cache hits", async () => {
      const responseData = fs.readFileSync(
        path.join(__dirname, "testData", "deepseek-cached.snapshot"),
        "utf-8"
      );

      const result = await deepseekProcessor.parse({
        responseBody: responseData,
        isStream: false,
        model: "deepseek-r1",
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 30, // prompt_cache_miss_tokens
        output: 50,
        cacheDetails: {
          cachedInput: 70, // prompt_cache_hit_tokens
        },
      });
    });

    it("should parse DeepSeek reasoner response with thinking tokens", async () => {
      const responseData = fs.readFileSync(
        path.join(__dirname, "testData", "deepseek-reasoner.snapshot"),
        "utf-8"
      );

      const result = await deepseekProcessor.parse({
        responseBody: responseData,
        isStream: false,
        model: "deepseek-r1",
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 50, // prompt_cache_miss_tokens
        output: 50, // completion_tokens (200) - reasoning_tokens (150)
        cacheDetails: {
          cachedInput: 50,
        },
        thinking: 150, // reasoning_tokens tracked separately
      });
    });

    it("should parse DeepSeek streaming response", async () => {
      const streamData = fs.readFileSync(
        path.join(__dirname, "testData", "deepseek-stream.snapshot"),
        "utf-8"
      );

      const result = await deepseekProcessor.parse({
        responseBody: streamData,
        isStream: true,
        model: "deepseek-r1",
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        input: 13, // prompt_cache_miss_tokens from final chunk
        output: 10, // completion_tokens from final chunk
      });
    });
  });
});

describe("VertexUsageProcessor", () => {
  const vertexProcessor = new VertexUsageProcessor();

  it("should return VertexUsageProcessor for vertex provider", () => {
    const processor = getUsageProcessor("vertex");
    expect(processor).toBeInstanceOf(VertexUsageProcessor);
  });

  it("should use AnthropicUsageProcessor for claude models", async () => {
    const mockAnthropicResponse = {
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    };

    const result = await vertexProcessor.parse({
      responseBody: JSON.stringify(mockAnthropicResponse),
      isStream: false,
      model: "claude-3-sonnet",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 100,
      output: 50,
    });
  });

  it("should use VertexOpenAIUsageProcessor for non-claude models", async () => {
    const mockVertexResponse = {
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        completion_tokens_details: {
          reasoning_tokens: 20,
          audio_tokens: 5,
        },
      },
    };

    const result = await vertexProcessor.parse({
      responseBody: JSON.stringify(mockVertexResponse),
      isStream: false,
      model: "gemini-pro",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 100,
      output: 45, // completion_tokens (50) - audio_tokens (5)
      thinking: 20,
      audio: 5,
    });
  });
});

describe("VertexOpenAIUsageProcessor vs OpenAIUsageProcessor", () => {
  const vertexProcessor = new VertexOpenAIUsageProcessor();
  const openaiProcessor = new OpenAIUsageProcessor();

  it("should handle reasoning tokens differently between OpenAI and Vertex", async () => {
    // This represents a response where reasoning tokens are included
    const mockResponse = {
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50, // For OpenAI: includes reasoning, For Vertex: excludes reasoning
        completion_tokens_details: {
          reasoning_tokens: 20,
        },
      },
    };

    const openaiResult = await openaiProcessor.parse({
      responseBody: JSON.stringify(mockResponse),
      isStream: false,
      model: "gpt-4o",
    });

    const vertexResult = await vertexProcessor.parse({
      responseBody: JSON.stringify(mockResponse),
      isStream: false,
      model: "gemini-pro",
    });

    // OpenAI subtracts reasoning tokens from completion_tokens
    expect(openaiResult.data?.output).toBe(30); // 50 - 20
    expect(openaiResult.data?.thinking).toBe(20);

    // Vertex uses completion_tokens as-is (already excludes reasoning tokens)
    expect(vertexResult.data?.output).toBe(50); // 50 (no subtraction)
    expect(vertexResult.data?.thinking).toBe(20);
  });

  it("should handle cached tokens consistently", async () => {
    const mockResponse = {
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        prompt_tokens_details: {
          cached_tokens: 30,
        },
      },
    };

    const openaiResult = await openaiProcessor.parse({
      responseBody: JSON.stringify(mockResponse),
      isStream: false,
      model: "gpt-4o",
    });

    const vertexResult = await vertexProcessor.parse({
      responseBody: JSON.stringify(mockResponse),
      isStream: false,
      model: "gemini-pro",
    });

    // Both should handle cached tokens the same way
    expect(openaiResult.data?.input).toBe(70); // 100 - 30
    expect(openaiResult.data?.output).toBe(50);
    expect(openaiResult.data?.cacheDetails?.cachedInput).toBe(30);

    expect(vertexResult.data?.input).toBe(70); // 100 - 30
    expect(vertexResult.data?.output).toBe(50);
    expect(vertexResult.data?.cacheDetails?.cachedInput).toBe(30);
  });
});
