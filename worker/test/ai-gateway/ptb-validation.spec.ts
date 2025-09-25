import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { env, runInDurableObject } from "cloudflare:test";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { setSupabaseTestCase } from "../setup";

describe("PTB request validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
  });

  it("returns 400 when PTB payload is invalid", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    const { response } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        messages: [],
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const body = await response.json();
    expect(body.error).toContain("messages");
  });

  it("allows BYOK requests with the same payload", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { calls } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        messages: [],
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o-mini",
          },
        ],
        finalStatus: 200,
      },
    });

    expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
  });

  it("accepts valid PTB payloads", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    // Set up credits for the wallet
    const orgId = "test-org-id";
    const walletId = env.WALLET.idFromName(orgId);
    const walletStub = env.WALLET.get(walletId);

    // @ts-ignore
    await runInDurableObject(walletStub, async (wallet: any) => {
      await wallet.setCredits(1_000_000, `test-credits-${Date.now()}`);
    });

    await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        messages: [
          { role: "system", content: "You are helpful." },
          { role: "user", content: "Hello" },
        ],
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o-mini",
            expects: {
              escrowInfo: true,
            },
          },
        ],
        finalStatus: 200,
      },
    });
  });

  it("returns 400 when PTB payload contains web_search_options", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    const { response } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        body: {
          messages: [
            { role: "user", content: "Search the web for information" },
          ],
          model: "gpt-4o-mini",
          web_search_options: {
            user_location: {
              type: "approximate",
              approximate: {
                country: "US",
                region: "CA",
              },
            },
            search_context_size: "medium",
          },
        },
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const body = await response.json() as any;
    expect(body.error).toContain("web_search_options");
  });

  it("returns 400 when PTB payload contains audio modality", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    const { response } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        body: {
          messages: [
            { role: "user", content: "Hello" },
          ],
          model: "gpt-4o-mini",
          modalities: ["text", "audio"],
        },
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const body = await response.json() as any;
    expect(body.error).toContain("modalities");
  });

  it("returns 400 when PTB payload contains audio response format", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    const { response } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        body: {
          messages: [
            { role: "user", content: "Say hello" },
          ],
          model: "gpt-4o-mini",
          audio: {
            voice: "alloy",
            format: "mp3",
          },
        },
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const body = await response.json() as any;
    expect(body.error).toContain("audio");
  });

  it("returns 400 when PTB payload contains audio input in messages", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    const { response } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        body: {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What do you hear in this audio?"
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: "base64-audio-data",
                    format: "wav"
                  }
                }
              ]
            },
          ],
          model: "gpt-4o-mini"
        },
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const body = await response.json() as any;
    expect(body.error).toContain("Invalid input");
  });

  describe("Helicone field support", () => {
    it("accepts PTB requests with prompt_cache_key", async () => {
      setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

      // Set up credits for the wallet
      const orgId = "test-org-id";
      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      // @ts-ignore
      await runInDurableObject(walletStub, async (wallet: any) => {
        await wallet.setCredits(1_000_000, `test-credits-${Date.now()}`);
      });

      await runGatewayTest({
        model: "gpt-4o-mini/openai",
        request: {
          body: {
            messages: [
              { role: "user", content: "Hello" },
            ],
            model: "gpt-4o-mini",
            prompt_cache_key: "doc-analysis-123",
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o-mini",
              expects: {
                escrowInfo: true,
              },
            },
          ],
          finalStatus: 200,
        },
      });
    });

    it("accepts PTB requests with cache_control", async () => {
      setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

      // Set up credits for the wallet
      const orgId = "test-org-id";
      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      // @ts-ignore
      await runInDurableObject(walletStub, async (wallet: any) => {
        await wallet.setCredits(1_000_000, `test-credits-${Date.now()}`);
      });

      await runGatewayTest({
        model: "gpt-4o-mini/openai",
        request: {
          body: {
            messages: [
              { role: "user", content: "Hello" },
            ],
            model: "gpt-4o-mini",
            cache_control: {
              type: "ephemeral",
              ttl: "5m",
            },
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o-mini",
              expects: {
                escrowInfo: true,
              },
            },
          ],
          finalStatus: 200,
        },
      });
    });

    it("accepts PTB requests with user and safety_identifier", async () => {
      setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

      // Set up credits for the wallet
      const orgId = "test-org-id";
      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      // @ts-ignore
      await runInDurableObject(walletStub, async (wallet: any) => {
        await wallet.setCredits(1_000_000, `test-credits-${Date.now()}`);
      });

      await runGatewayTest({
        model: "gpt-4o-mini/openai",
        request: {
          body: {
            messages: [
              { role: "user", content: "Hello" },
            ],
            model: "gpt-4o-mini",
            user: "user-123",
            safety_identifier: "safe-session-456",
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o-mini",
              expects: {
                escrowInfo: true,
              },
            },
          ],
          finalStatus: 200,
        },
      });
    });

    it("accepts PTB requests with all Helicone fields", async () => {
      setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

      // Set up credits for the wallet
      const orgId = "test-org-id";
      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      // @ts-ignore
      await runInDurableObject(walletStub, async (wallet: any) => {
        await wallet.setCredits(1_000_000, `test-credits-${Date.now()}`);
      });

      await runGatewayTest({
        model: "gpt-4o-mini/openai",
        request: {
          body: {
            messages: [
              { role: "user", content: "Hello" },
            ],
            model: "gpt-4o-mini",
            prompt_cache_key: "doc-analysis-123",
            user: "user-123",
            safety_identifier: "safe-session-456",
            cache_control: {
              type: "ephemeral",
              ttl: "10m",
            },
            metadata: {
              session_id: "abc123",
              user_tier: "premium",
            },
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o-mini",
              expects: {
                escrowInfo: true,
              },
            },
          ],
          finalStatus: 200,
        },
      });
    });

    it("returns 400 when PTB payload has invalid cache_control type", async () => {
      setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

      const { response } = await runGatewayTest({
        model: "gpt-4o-mini/openai",
        request: {
          body: {
            messages: [
              { role: "user", content: "Hello" },
            ],
            model: "gpt-4o-mini",
            cache_control: {
              type: "permanent", // Should be 'ephemeral'
              ttl: "5m",
            },
          },
        },
        expected: {
          providers: [],
          finalStatus: 400,
        },
      });

      const body = await response.json() as any;
      expect(body.error).toContain("cache_control");
    });

    it("returns 400 when PTB payload has invalid cache_control structure", async () => {
      setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

      const { response } = await runGatewayTest({
        model: "gpt-4o-mini/openai",
        request: {
          body: {
            messages: [
              { role: "user", content: "Hello" },
            ],
            model: "gpt-4o-mini",
            cache_control: "invalid-string", // Should be object
          },
        },
        expected: {
          providers: [],
          finalStatus: 400,
        },
      });

      const body = await response.json() as any;
      expect(body.error).toContain("cache_control");
    });
  });
});

