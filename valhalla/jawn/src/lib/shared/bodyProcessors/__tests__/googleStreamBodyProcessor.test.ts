import { GoogleStreamBodyProcessor } from "../googleStreamBodyProcessor";
import { ParseInput } from "../IBodyProcessor";

describe("GoogleStreamBodyProcessor", () => {
  const processor = new GoogleStreamBodyProcessor();

  async function parseFromLines(lines: any[]): Promise<any> {
    const responseBody = lines
      .map((line) => `data: ${JSON.stringify(line)}`)
      .join("\n");

    const input: ParseInput = {
      responseBody,
    };

    const result = await processor.parse(input);
    expect(result.error).toBeNull();
    return result.data;
  }

  it("handles Anthropic-style usage with cache fields in streamed data", async () => {
    const lines = [
      { event: "message_start" },
      {
        usage: {
          input_tokens: 80,
          output_tokens: 20,
          cache_creation_input_tokens: 5,
          cache_read_input_tokens: 3,
        },
      },
    ];

    const { usage } = await parseFromLines(lines);

    expect(usage).toEqual({
      totalTokens: 100,
      completionTokens: 20,
      promptTokens: 80,
      promptCacheWriteTokens: 5,
      promptCacheReadTokens: 3,
      heliconeCalculated: true,
    });
  });

  it("handles standard Google usageMetadata with cached content tokens in streamed data", async () => {
    const lines = [
      { event: "some_data" },
      {
        usageMetadata: {
          totalTokenCount: 120,
          promptTokenCount: 90,
          candidatesTokenCount: 25,
          cachedContentTokenCount: 15,
        },
      },
    ];

    const { usage } = await parseFromLines(lines);

    expect(usage).toEqual({
      totalTokens: 120,
      completionTokens: 25,
      promptTokens: 75, // prompt minus cached
      promptCacheWriteTokens: undefined,
      promptCacheReadTokens: 15,
      heliconeCalculated: true,
    });
  });
});

