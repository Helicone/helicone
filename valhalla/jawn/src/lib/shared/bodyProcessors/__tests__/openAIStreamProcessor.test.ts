import { OpenAIStreamProcessor } from "../openAIStreamProcessor";
import { ParseInput } from "../IBodyProcessor";

describe("OpenAIStreamProcessor", () => {
  const processor = new OpenAIStreamProcessor();

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

  it("handles OpenAI-compatible top-level cache hit tokens in streamed usage", async () => {
    const { usage } = await parseFromLines([
      {
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
          prompt_cache_hit_tokens: 40,
          prompt_cache_miss_tokens: 60,
        },
      },
    ]);

    expect(usage).toEqual({
      totalTokens: undefined,
      completionTokens: 20,
      promptTokens: 60,
      promptCacheReadTokens: 40,
      promptCacheWriteTokens: 0,
      heliconeCalculated: false,
      cost: undefined,
    });
  });
});
