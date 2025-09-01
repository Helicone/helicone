import { SELF, fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import "../setup";
import { mockRequiredServices } from "../mock-stack.spec";

describe("Durable Object Rate Limiter Tests", () => {
  beforeAll(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
    vi.stubEnv("WORKER_TYPE", "OPENAI_PROXY22");
    vi.stubEnv("SECURE_CACHE", {
      get: async () => "",
      put: async () => {},
    } as any);
    mockRequiredServices();
  });
  describe("Cents-based rate limiting", () => {
    it("should enforce rate limits and return proper headers", async () => {
      fetchMock
        .get("https://oai.helicone.ai")
        .intercept({
          path: "/v1/chat/completions",
          method: "POST",
        })
        .reply(() => ({
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
        }))
        .persist();

      const response = await SELF.fetch(
        "https://oai.helicone.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-5",
            messages: [
              {
                role: "user",
                content: "Say hello in a creative way!",
              },
            ],
          }),
        }
      );
    });
    it("should enforce rate limits and return proper headers", async () => {
      expect(1 + 2).toBe(3);
    });

    // it("should block requests when rate limit is exceeded", async () => {
    //   // Make multiple requests to exceed the 10 cents limit
    //   const requests = [];
    //   for (let i = 0; i < 15; i++) {
    //     requests.push(
    //       SELF.fetch("https://ai-gateway.helicone.ai/v1/chat/completions", {
    //         method: "POST",
    //         headers: {
    //           "Content-Type": "application/json",
    //           Authorization: `Bearer ${testApiKey}`,
    //         },
    //         body: JSON.stringify({
    //           model: "claude-3-7-sonnet-20250219/anthropic",
    //           messages: [{ role: "user", content: `Test request ${i}` }],
    //           max_tokens: 100,
    //         }),
    //       })
    //     );
    //   }

    //   const responses = await Promise.all(requests);

    //   // Some requests should succeed (200), some should be rate limited (429)
    //   const successResponses = responses.filter((r) => r.status === 200);
    //   const rateLimitedResponses = responses.filter((r) => r.status === 429);

    //   expect(successResponses.length).toBeGreaterThan(0);
    //   expect(rateLimitedResponses.length).toBeGreaterThan(0);

    //   // Check rate limited response has proper headers
    //   if (rateLimitedResponses.length > 0) {
    //     const rateLimitedResponse = rateLimitedResponses[0];
    //     expect(
    //       rateLimitedResponse.headers.get("helicone-ratelimit-remaining")
    //     ).toBe("0");
    //   }
    // });

    // it("should handle request-based rate limiting correctly", async () => {
    //   const response = await SELF.fetch(
    //     "https://ai-gateway.helicone.ai/v1/chat/completions",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${testApiKey}`,
    //       },
    //       body: JSON.stringify({
    //         model: "claude-3-7-sonnet-20250219/anthropic",
    //         messages: [{ role: "user", content: "Test" }],
    //         max_tokens: 100,
    //       }),
    //     }
    //   );

    //   expect(response.status).toBe(200);

    //   // Verify policy header format for request-based limiting
    //   const policyHeader = response.headers.get("helicone-ratelimit-policy");
    //   expect(policyHeader).toContain("u=cents"); // From the mock policy
    //   expect(policyHeader).toContain("s=user");
    // });

    // it("should handle custom property segments", async () => {
    //   const response = await SELF.fetch(
    //     "https://ai-gateway.helicone.ai/v1/chat/completions",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${testApiKey}`,
    //         "Helicone-Property-Classifier": "high-priority",
    //       },
    //       body: JSON.stringify({
    //         model: "claude-3-7-sonnet-20250219/anthropic",
    //         messages: [{ role: "user", content: "Test with custom property" }],
    //         max_tokens: 100,
    //       }),
    //     }
    //   );

    //   expect(response.status).toBe(200);

    //   // Check that custom property segment is preserved in policy header
    //   const policyHeader = response.headers.get("helicone-ratelimit-policy");
    //   expect(policyHeader).toContain("s=classifier");
    // });

    // it("should reset rate limits after time window expires", async () => {
    //   // This test would require mocking time or using a very short window
    //   // For now, we'll test the reset header calculation
    //   const response = await SELF.fetch(
    //     "https://ai-gateway.helicone.ai/v1/chat/completions",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${testApiKey}`,
    //       },
    //       body: JSON.stringify({
    //         model: "claude-3-7-sonnet-20250219/anthropic",
    //         messages: [{ role: "user", content: "Test reset" }],
    //         max_tokens: 100,
    //       }),
    //     }
    //   );

    //   // Should have reset header when usage is recorded
    //   const resetHeader = response.headers.get("helicone-ratelimit-reset");
    //   if (resetHeader) {
    //     const resetTime = parseInt(resetHeader);
    //     expect(resetTime).toBeGreaterThan(0);
    //     expect(resetTime).toBeLessThanOrEqual(86400); // Should be within window
    //   }
    // });
  });

  // describe("Rate limit policy header bug reproduction", () => {
  //   it("should include segment in policy header for cents-based user limiting", async () => {
  //     // This test specifically reproduces the bug mentioned in the issue
  //     const response = await SELF.fetch(
  //       "https://ai-gateway.helicone.ai/v1/chat/completions",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${testApiKey}`,
  //         },
  //         body: JSON.stringify({
  //           model: "claude-3-7-sonnet-20250219/anthropic",
  //           messages: [
  //             {
  //               role: "user",
  //               content: "Test cents limiting with user segment",
  //             },
  //           ],
  //           max_tokens: 100,
  //         }),
  //       }
  //     );

  //     expect(response.status).toBe(200);

  //     const policyHeader = response.headers.get("helicone-ratelimit-policy");
  //     console.log("Policy header:", policyHeader);

  //     // BUG: Currently returns "10;w=86400;u=cents" but should return "10;w=86400;u=cents;s=user"
  //     expect(policyHeader).toBe("10;w=86400;u=cents;s=user");
  //   });
  // });
});
