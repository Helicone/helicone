import { GenericBodyProcessor } from "../genericBodyProcessor";
import { ParseInput } from "../IBodyProcessor";

describe("GenericBodyProcessor", () => {
  const processor = new GenericBodyProcessor();

  async function parse(body: any): Promise<any> {
    const input: ParseInput = {
      responseBody: JSON.stringify(body),
    };

    const result = await processor.parse(input);
    expect(result.error).toBeNull();
    return result.data;
  }

  it("handles OpenAI-compatible top-level cache hit tokens", async () => {
    const { usage } = await parse({
      usage: {
        prompt_tokens: 100,
        completion_tokens: 20,
        prompt_cache_hit_tokens: 40,
        prompt_cache_miss_tokens: 60,
      },
    });

    expect(usage).toEqual({
      promptTokens: 60,
      promptCacheReadTokens: 40,
      promptCacheWriteTokens: 0,
      completionTokens: 20,
      totalTokens: undefined,
      heliconeCalculated: false,
      cost: undefined,
    });
  });

  it("prefers nested cached tokens over top-level cache hit tokens", async () => {
    const { usage } = await parse({
      usage: {
        prompt_tokens: 100,
        completion_tokens: 20,
        prompt_cache_hit_tokens: 40,
        prompt_tokens_details: {
          cached_tokens: 25,
        },
      },
    });

    expect(usage).toEqual({
      promptTokens: 75,
      promptCacheReadTokens: 25,
      promptCacheWriteTokens: 0,
      completionTokens: 20,
      totalTokens: undefined,
      heliconeCalculated: false,
      cost: undefined,
    });
  });
});
