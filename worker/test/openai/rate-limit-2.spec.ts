import { env, SELF, fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import "../setup";
import { mockRequiredServices } from "../mock-stack.spec";
import { costOfPrompt } from "@helicone-package/cost";

const SAMPLE_RESPONSE_BODY = {
  statusCode: 200,
  data: {
    id: "chatcmpl-C77E1GeKU8EfrujPM0CPQBtMncRU0",
    object: "chat.completion",
    created: 1755812105,
    model: "gpt-5-2025-08-07",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content:
            "I’d love to write one for you. To make it your novel, a few quick choices help:\n\n- Genre and vibe (sci‑fi, fantasy, mystery/thriller, romance, historical, literary; dark/hopeful/humorous)\n- Audience/age rating (adult, YA)\n- Rough length (short novel ~50k, standard ~80k, epic ~120k)\n- Setting and time period\n- Point of view (first person, close third, multiple POVs)\n- Themes you want, and anything to avoid\n- Any comps/authors to emulate\n\nIf you want to pick fast, choose one of these starter concepts:\n\n1) The Cartographer of Living Maps (Fantasy, adventurous, hopeful)\nA disgraced mapmaker discovers she can chart feelings and redraw borders. Hunted by an empire that wants to weaponize her craft, she undertakes a road-quest across a continent where rivers move with grief and cities rearrange with joy.\n\n2) The Dream-Language of Engines (Sci‑fi mystery, cerebral, tense)\nOn a generation ship, a linguist is tasked with decoding the ship AI’s new “dream-language” before its metaphors begin rewriting the vessel’s reality. Memory, identity, and community collide as syntax becomes survival.\n\n3) The Glasshouse Vanished (Historical mystery, 1893 Chicago, atmospheric)\nA botanist and a rookie reporter track a missing glasshouse exhibit at the World’s Fair and uncover a secret society of seedkeepers waging a quiet war over the future of food.\n\n4) Patient Zero Day (Tech thriller, propulsive)\nA biotech whistleblower discovers his company’s miracle treatment can be toggled into a bioweapon. With a fixer on his trail, he must fake a clinical trial to expose the conspiracy before the “cure” goes live.\n\n5) Salvage Heart (Romance in space, banter, found family)\nRival salvage captains are forced to co‑lead a high‑risk station recovery. As they navigate zero‑G heists and a patchwork crew, enemies-to-lovers tension sparks against the backdrop of a fragile habitat on the brink.\n\n6) The Apiary House (Literary family saga, multigenerational)\nAcross 70 years in a storm-prone coastal town, a beekeeper matriarch hides a choice that split her family. As climate and secrets bear down, three generations reckon with sweetness, sting, and inheritance.\n\nTell me which number you want (or say “surprise me”), plus any tweaks. I’ll deliver:\n- A one-page outline and character roster\n- Chapter 1 in full\n- Subsequent chapters in installments, adjusting based on your feedback\n\nIf you already have your own idea, share a few lines and I’ll build the outline and start writing.",
          refusal: null,
          annotations: [],
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 11,
      completion_tokens: 1479,
      total_tokens: 1490,
      prompt_tokens_details: {
        cached_tokens: 0,
        audio_tokens: 0,
      },
      completion_tokens_details: {
        reasoning_tokens: 896,
        audio_tokens: 0,
        accepted_prediction_tokens: 0,
        rejected_prediction_tokens: 0,
      },
    },
    service_tier: "default",
    system_fingerprint: null,
  },
  responseOptions: { headers: { "content-type": "application/json" } },
};
const SAMPLE_COST = 0.01480375;

const mockHeliconeResponse = () => {
  fetchMock
    .get("https://api.openai.com")
    .intercept({
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    .reply(() => SAMPLE_RESPONSE_BODY)
    .persist();
};

const simpleFetchHelicone = async (
  rateLimitPolicy: string,
  uniqueUserId: string
) => {
  return await SELF.fetch("https://oai.helicone.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Helicone-Auth": "Bearer sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa",
      "Helicone-RateLimit-Policy": rateLimitPolicy,
      "Helicone-User-Id": uniqueUserId,
    },
    body: JSON.stringify({
      model: "gpt-5",
      messages: [{ role: "user", content: "Test" }],
    }),
  });
};

describe("Durable Object Rate Limiter Tests", () => {
  beforeAll(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();

    mockRequiredServices();
  });

  afterAll(() => {
    fetchMock.deactivate();
  });

  describe("Rate Limiting with Durable Objects", () => {
    it("simple cost check", async () => {
      const cost = costOfPrompt({
        provider: "OPENAI",
        model: "gpt-5",
        completionAudioTokens: 0,
        promptTokens: SAMPLE_RESPONSE_BODY.data.usage.prompt_tokens,
        promptCacheWriteTokens: 0,
        promptCacheReadTokens: 0,
        promptAudioTokens: 0,
        completionTokens: SAMPLE_RESPONSE_BODY.data.usage.completion_tokens,
      });

      expect(cost).toBeCloseTo(SAMPLE_COST);
    });

    it("The cost should be deducted from the remaining quota", async () => {
      mockHeliconeResponse();
      const uniqueUserId = `user-rate-limit-test-${Date.now()}`;
      const RATE_LIMIT = 10;
      const rateLimitPolicy = `${RATE_LIMIT};w=1000;u=cents;s=user`;
      const centsCosts = SAMPLE_COST * 100;

      const response1 = await simpleFetchHelicone(
        rateLimitPolicy,
        uniqueUserId
      );

      const remaining1 = response1.headers.get("helicone-ratelimit-remaining");
      expect(+Number(remaining1)).toBeCloseTo(10);

      const response2 = await simpleFetchHelicone(
        rateLimitPolicy,
        uniqueUserId
      );

      const remaining2 = response2.headers.get("helicone-ratelimit-remaining");

      expect(+Number(remaining2)).toBeCloseTo(10 - centsCosts);
    });

    it("should enforce rate limit after quota is exceeded", async () => {
      mockHeliconeResponse();

      const uniqueUserId = `user-rate-limit-test-${Date.now()}`;
      const rateLimitPolicy = "2;w=1000;u=request;s=user";

      const response1 = await simpleFetchHelicone(
        rateLimitPolicy,
        uniqueUserId
      );

      expect(response1.status).toBe(200);

      // Second request should be rate limited since quota is 1
      const response2 = await simpleFetchHelicone(
        rateLimitPolicy,
        uniqueUserId
      );

      // Should be rate limited
      expect(response2.status).toBe(200);

      // Second request should be rate limited since quota is 1
      const response3 = await simpleFetchHelicone(
        rateLimitPolicy,
        uniqueUserId
      );

      // Should be rate limited
      expect(response3.status).toBe(429);
    });
  });
});
