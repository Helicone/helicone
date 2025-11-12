import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { env, runInDurableObject } from "cloudflare:test";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { setSupabaseTestCase } from "../setup";

describe("BYOK and PTB Priority Tests", () => {
  // Helper to set up credits for PTB tests
  async function setupCredits() {
    const orgId = "test-org-id";
    const walletId = env.WALLET.idFromName(orgId);
    const walletStub = env.WALLET.get(walletId);

    // @ts-ignore
    await runInDurableObject(walletStub, async (wallet: any) => {
      await wallet.setCredits(10_000_000, `test-credits-${Date.now()}`);
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
  });

  describe("Single Model with Explicit Provider", () => {
    it("prioritizes BYOK over PTB when both are available for Groq", async () => {
      setSupabaseTestCase({ byokEnabled: true, creditsEnabled: true });
      await setupCredits();

      const { calls } = await runGatewayTest({
        model: "llama-3.3-70b-versatile/groq",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "success",
              model: "llama-3.3-70b-versatile",
              expects: {
                // BYOK should not have escrow info
                escrowInfo: false,
              },
            },
          ],
          finalStatus: 200,
        },
      });

      // Verify first call used BYOK (no escrow)
      expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
    });

    it("prioritizes BYOK over PTB when both are available for OpenAI", async () => {
      setSupabaseTestCase({ byokEnabled: true, creditsEnabled: true });
      await setupCredits();

      const { calls } = await runGatewayTest({
        model: "gpt-4o-mini/openai",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o-mini",
              expects: {
                // BYOK should not have escrow info
                escrowInfo: false,
              },
            },
          ],
          finalStatus: 200,
        },
      });

      // Verify first call used BYOK (no escrow)
      expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
    });

    it("falls back to PTB when BYOK fails", async () => {
      setSupabaseTestCase({ byokEnabled: true, creditsEnabled: true });
      await setupCredits();

      const { calls } = await runGatewayTest({
        model: "llama-3.3-70b-versatile/groq",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
              expects: {
                escrowInfo: false, // First attempt is BYOK
              },
            },
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "success",
              model: "llama-3.3-70b-versatile",
              expects: {
                escrowInfo: true, // Second attempt is PTB
              },
            },
          ],
          finalStatus: 200,
        },
      });

      // Verify first call was BYOK
      expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
      // Verify second call was PTB
      expect(calls[1]?.targetProps?.escrowInfo).toBeDefined();
    });
  });

  describe("Multiple Models with Explicit Providers", () => {
    it("preserves user-specified model order (cheap model first) and prioritizes BYOK within each", async () => {
      setSupabaseTestCase({ byokEnabled: true, creditsEnabled: true });
      await setupCredits();

      const { calls } = await runGatewayTest({
        model: "llama-3.3-70b-versatile/groq,gpt-4o/openai",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              // First: Groq BYOK (user specified Groq first)
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "success",
              model: "llama-3.3-70b-versatile",
              expects: {
                escrowInfo: false, // BYOK
              },
            },
          ],
          finalStatus: 200,
        },
      });

      // Verify only first provider was called (Groq BYOK)
      expect(calls.length).toBe(1);
      expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
    });

    it("tries all attempts in correct order when providers fail", async () => {
      setSupabaseTestCase({ byokEnabled: true, creditsEnabled: true });
      await setupCredits();

      const { calls } = await runGatewayTest({
        model: "llama-3.3-70b-versatile/groq,gpt-4o-mini/openai",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              // 1st: Groq BYOK
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              expects: {
                escrowInfo: false,
              },
            },
            {
              // 2nd: Groq PTB
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              expects: {
                escrowInfo: true,
              },
            },
            {
              // 3rd: OpenAI BYOK (NOT reordered by priority!)
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              expects: {
                escrowInfo: false,
              },
            },
            {
              // 4th: OpenAI PTB
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

      // Verify the order:
      // 1. Groq BYOK (no escrow)
      expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
      expect(calls[0]?.targetProps?.targetBaseUrl).toContain("groq.com");

      // 2. Groq PTB (with escrow)
      expect(calls[1]?.targetProps?.escrowInfo).toBeDefined();
      expect(calls[1]?.targetProps?.targetBaseUrl).toContain("groq.com");

      // 3. OpenAI BYOK (no escrow)
      expect(calls[2]?.targetProps?.escrowInfo).toBeUndefined();
      expect(calls[2]?.targetProps?.targetBaseUrl).toContain("openai.com");

      // 4. OpenAI PTB (with escrow)
      expect(calls[3]?.targetProps?.escrowInfo).toBeDefined();
      expect(calls[3]?.targetProps?.targetBaseUrl).toContain("openai.com");
    });

    it("preserves user order even when lower priority provider is specified first", async () => {
      setSupabaseTestCase({ byokEnabled: true, creditsEnabled: true });
      await setupCredits();

      const { calls } = await runGatewayTest({
        // User wants cheap Groq (priority 4) before expensive Anthropic (priority 3)
        model: "llama-3.3-70b-versatile/groq,claude-3-5-sonnet-20241022/anthropic",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              // First: Groq BYOK (even though it has lower priority)
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "success",
              model: "llama-3.3-70b-versatile",
              expects: {
                escrowInfo: false,
              },
            },
          ],
          finalStatus: 200,
        },
      });

      // Verify Groq was called first, not Anthropic
      expect(calls.length).toBe(1);
      expect(calls[0]?.targetProps?.targetBaseUrl).toContain("groq.com");
      expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
    });

    it("does not intertwine models from different providers", async () => {
      setSupabaseTestCase({ byokEnabled: true, creditsEnabled: true });
      await setupCredits();

      const { calls } = await runGatewayTest({
        model: "llama-3.3-70b-versatile/groq,gpt-4o-mini/openai",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              // 1st: Groq BYOK
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              expects: { escrowInfo: false },
            },
            {
              // 2nd: Groq PTB (NOT OpenAI)
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "failure",
              expects: { escrowInfo: true },
            },
            {
              // 3rd: OpenAI BYOK (after all Groq attempts)
              url: "https://api.openai.com/v1/chat/completions",
              response: "failure",
              expects: { escrowInfo: false },
            },
            {
              // 4th: OpenAI PTB
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o-mini",
              expects: { escrowInfo: true },
            },
          ],
          finalStatus: 200,
        },
      });

      // Verify the calls went in the expected order without intertwining
      const providers = calls.map((call) => ({
        provider: call.targetProps?.targetBaseUrl?.includes("groq")
          ? "groq"
          : "openai",
        hasEscrow: !!call.targetProps?.escrowInfo,
      }));

      expect(providers).toEqual([
        { provider: "groq", hasEscrow: false }, // Groq BYOK
        { provider: "groq", hasEscrow: true }, // Groq PTB
        { provider: "openai", hasEscrow: false }, // OpenAI BYOK
        { provider: "openai", hasEscrow: true }, // OpenAI PTB
      ]);
    });
  });

  describe("BYOK Only (No Credits)", () => {
    it("only tries BYOK when credits are disabled", async () => {
      setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

      const { calls } = await runGatewayTest({
        model: "llama-3.3-70b-versatile/groq",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "success",
              model: "llama-3.3-70b-versatile",
              expects: {
                escrowInfo: false,
              },
            },
          ],
          finalStatus: 200,
        },
      });

      expect(calls.length).toBe(1);
      expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
    });
  });

  describe("PTB Only (No BYOK)", () => {
    it("only tries PTB when BYOK is disabled", async () => {
      setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });
      await setupCredits();

      const { calls } = await runGatewayTest({
        model: "llama-3.3-70b-versatile/groq",
        request: {
          messages: [{ role: "user", content: "test" }],
        },
        expected: {
          providers: [
            {
              url: "https://api.groq.com/openai/v1/chat/completions",
              response: "success",
              model: "llama-3.3-70b-versatile",
              expects: {
                escrowInfo: true,
              },
            },
          ],
          finalStatus: 200,
        },
      });

      expect(calls.length).toBe(1);
      expect(calls[0]?.targetProps?.escrowInfo).toBeDefined();
    });
  });
});
