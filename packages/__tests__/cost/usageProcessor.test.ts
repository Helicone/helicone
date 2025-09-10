import { describe, it, expect } from "@jest/globals";
import { OpenAIUsageProcessor } from "@helicone-package/cost/usage/openAIUsageProcessor";
import { getUsageProcessor } from "@helicone-package/cost/usage/getUsageProcessor";
import * as fs from "fs";
import * as path from "path";

describe("getUsageProcessor", () => {
  it("should return OpenAIUsageProcessor for openai provider", () => {
    const processor = getUsageProcessor("openai");
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
      path.join(__dirname, "testData", "gpt4o-response-cached.txt"),
      "utf-8"
    );

    const result = await processor.parse({ 
      responseBody: responseData, 
      isStream: false 
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 96,
      output: 10,
      cacheDetails: {
        cachedInput: 1152
      }
    });
  });

  it("should parse real GPT-4o stream response", async () => {
    const streamData = fs.readFileSync(
      path.join(__dirname, "testData", "gpt4o-stream-response.txt"),
      "utf-8"
    );

    const result = await processor.parse({ 
      responseBody: streamData, 
      isStream: true 
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      input: 1248,
      output: 10
    });
  });

  it("usage processing snapshot", async () => {
    const testCases = [
      {
        name: "cached-response",
        data: fs.readFileSync(path.join(__dirname, "testData", "gpt4o-response-cached.txt"), "utf-8"),
        isStream: false
      },
      {
        name: "stream-response", 
        data: fs.readFileSync(path.join(__dirname, "testData", "gpt4o-stream-response.txt"), "utf-8"),
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