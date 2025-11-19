import { GoogleBodyProcessor } from "../googleBodyProcessor";
import { ParseInput } from "../IBodyProcessor";

describe("GoogleBodyProcessor", () => {
  const processor = new GoogleBodyProcessor();

  async function parse(body: any): Promise<any> {
    const input: ParseInput = {
      responseBody: JSON.stringify(body),
    };

    const result = await processor.parse(input);
    expect(result.error).toBeNull();
    return result.data;
  }

  it("handles Anthropic-style usage with cache fields", async () => {
    const body = {
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 20,
        cache_read_input_tokens: 10,
      },
    };

    const { usage } = await parse(body);

    expect(usage).toEqual({
      totalTokens: 150,
      promptTokens: 100,
      completionTokens: 50,
      promptCacheWriteTokens: 20,
      promptCacheReadTokens: 10,
    });
  });

  it("handles explicit cache creation responses (cachedContent)", async () => {
    const body = {
      name: "cachedContents/dwdqymyb862fleve7oyqqfzti2o9g74yoysi79ym",
      model: "models/gemini-2.0-flash-001",
      createTime: "2025-11-14T18:42:52.826346Z",
      updateTime: "2025-11-14T18:42:52.826346Z",
      expireTime: "2025-11-14T19:42:52.311334544Z",
      displayName: "bee.txt cache",
      usageMetadata: {
        totalTokenCount: 13644,
      },
    };

    const { usage } = await parse(body);

    expect(usage).toEqual({
      totalTokens: 13644,
      promptTokens: 0,
      completionTokens: 0,
      promptCacheWriteTokens: 13644,
      promptCacheReadTokens: 0,
      promptCacheWrite5m: 13644,
      promptCacheWrite1h: 0,
      heliconeCalculated: false,
    });
  });

  it("handles standard Google usageMetadata with cached content tokens", async () => {
    const body = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: "The main topic of the Bee Movie script is the journey of Barry B. Benson, a bee who questions the pre-determined path set for him in the hive. He discovers the human exploitation of honey and bees, sues the human race, and ultimately realizes the importance of bees' role in pollination and the ecosystem. The movie explores themes of individuality, societal expectations, environmentalism, and the interconnectedness of all living things.\n",
              },
            ],
            role: "model",
          },
          finishReason: "STOP",
          avgLogprobs: -0.40204493204752606,
        },
      ],
      usageMetadata: {
        promptTokenCount: 13654,
        candidatesTokenCount: 87,
        totalTokenCount: 13741,
        cachedContentTokenCount: 13644,
        promptTokensDetails: [
          {
            modality: "TEXT",
            tokenCount: 13654,
          },
        ],
        cacheTokensDetails: [
          {
            modality: "TEXT",
            tokenCount: 13644,
          },
        ],
        candidatesTokensDetails: [
          {
            modality: "TEXT",
            tokenCount: 87,
          },
        ],
      },
      modelVersion: "gemini-2.0-flash-001",
      responseId: "-GEbabTfMZCDz7IP3O_gkQE",
    };

    const { usage } = await parse(body);

    expect(usage).toEqual({
      totalTokens: 13741,
      // prompt minus cached (13654 - 13644)
      promptTokens: 10,
      // thoughts + candidates (0 + 87)
      completionTokens: 87,
      heliconeCalculated: false,
      promptCacheReadTokens: 13644,
    });
  });
});
