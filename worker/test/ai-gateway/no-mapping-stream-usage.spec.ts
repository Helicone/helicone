import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env, runInDurableObject } from "cloudflare:test";
import { randomUUID } from "crypto";
import { getUsageProcessor } from "@helicone-package/cost/usage/getUsageProcessor";
import { modelCostBreakdownFromRegistry } from "@helicone-package/cost/costCalc";
import "../setup";
import { clearProviderKeysInMemoryCache } from "../../src/lib/util/cache/inMemoryCache";
import { setSupabaseTestCase } from "../setup";
import { runGatewayTest } from "./test-framework";

const ORG_ID = "test-org-id";

async function fundWallet(orgId: string): Promise<void> {
  const walletStub = env.WALLET.get(env.WALLET.idFromName(orgId));
  await runInDurableObject(walletStub, async (wallet: any) => {
    await wallet.setCredits(1_000_000, `test-credits-${randomUUID()}`);
  });
}

function usageStream(usage?: {
  prompt_tokens: number;
  completion_tokens: number;
}) {
  const chunks = [
    'data: {"id":"chatcmpl-1","model":"gpt-4o","choices":[{"delta":{"content":"OK"}}]}',
  ];
  if (usage) {
    chunks.push(
      `data: ${JSON.stringify({
        id: "chatcmpl-1",
        model: "gpt-4o",
        choices: [],
        usage: {
          ...usage,
          total_tokens: usage.prompt_tokens + usage.completion_tokens,
        },
      })}`
    );
  }
  chunks.push("data: [DONE]", "");
  return chunks.join("\n");
}

// Same cents formula as ProxyForwarder: USD totalCost * 100, or 0 when absent.
async function settlementCents(responseBody: string): Promise<number> {
  const processor = getUsageProcessor("openai");
  if (!processor) {
    throw new Error("missing openai usage processor");
  }
  const usage = await processor.parse({
    responseBody,
    isStream: true,
    model: "gpt-4o",
  });
  const breakdown = usage.data
    ? modelCostBreakdownFromRegistry({
        modelUsage: usage.data,
        provider: "openai",
        providerModelId: "gpt-4o",
      })
    : null;
  const costUsd = breakdown?.totalCost;
  const costInCents = costUsd !== undefined ? costUsd * 100 : undefined;
  return costInCents ?? 0;
}

describe("NO_MAPPING streaming usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearProviderKeysInMemoryCache();
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
    clearProviderKeysInMemoryCache();
  });

  describe("pass-through billing", () => {
    beforeEach(async () => {
      setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });
      await fundWallet(ORG_ID);
    });

    it("requests a usage chunk when the caller omits stream_options", () =>
      runGatewayTest({
        model: "gpt-4o/openai",
        request: {
          bodyMapping: "NO_MAPPING",
          stream: true,
          messages: [{ role: "user", content: "Reply with OK." }],
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
              expects: {
                escrowInfo: true,
                bodyContains: ['"include_usage":true'],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("overrides an explicit include_usage false", () =>
      runGatewayTest({
        model: "gpt-4o/openai",
        request: {
          bodyMapping: "NO_MAPPING",
          stream: true,
          messages: [{ role: "user", content: "Reply with OK." }],
          body: {
            stream_options: {
              include_obfuscation: true,
              include_usage: false,
            },
          },
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
              expects: {
                escrowInfo: true,
                bodyContains: [
                  '"include_obfuscation":true',
                  '"include_usage":true',
                ],
                bodyDoesNotContain: ['"include_usage":false'],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("does not add stream_options to a non-streaming request", () =>
      runGatewayTest({
        model: "gpt-4o/openai",
        request: {
          bodyMapping: "NO_MAPPING",
          stream: false,
          messages: [{ role: "user", content: "Reply with OK." }],
        },
        expected: {
          providers: [
            {
              url: "https://api.openai.com/v1/chat/completions",
              response: "success",
              model: "gpt-4o",
              expects: {
                bodyContains: ['"stream":false'],
                bodyDoesNotContain: ["stream_options"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("does not add stream_options to a native Anthropic stream", () =>
      runGatewayTest({
        model: "claude-3.7-sonnet/anthropic",
        request: {
          bodyMapping: "NO_MAPPING",
          stream: true,
          messages: [{ role: "user", content: "Reply with OK." }],
        },
        expected: {
          providers: [
            {
              url: "https://api.anthropic.com/v1/messages",
              response: "success",
              model: "claude-3-7-sonnet-20250219",
              data: {
                id: "msg_test",
                type: "message",
                role: "assistant",
                content: [{ type: "text", text: "OK" }],
                model: "claude-3-7-sonnet-20250219",
                usage: { input_tokens: 10, output_tokens: 2 },
              },
              expects: {
                escrowInfo: true,
                bodyContains: ['"stream":true'],
                bodyDoesNotContain: ["stream_options"],
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("requests a usage chunk from Azure OpenAI", () =>
      runGatewayTest({
        model: "gpt-4o/azure",
        request: {
          bodyMapping: "NO_MAPPING",
          stream: true,
          messages: [{ role: "user", content: "Reply with OK." }],
        },
        expected: {
          providers: [
            {
              url: "https://east1-gateway-resource.cognitiveservices.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview",
              response: "success",
              model: "gpt-4o",
              expects: {
                escrowInfo: true,
                bodyContains: ['"include_usage":true'],
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  it("leaves an omitted BYOK stream unchanged", () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });
    return runGatewayTest({
      model: "gpt-4o/openai",
      request: {
        bodyMapping: "NO_MAPPING",
        stream: true,
        messages: [{ role: "user", content: "Reply with OK." }],
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o",
            expects: {
              escrowInfo: false,
              bodyContains: ['"stream":true'],
              bodyDoesNotContain: ["include_usage"],
            },
          },
        ],
        finalStatus: 200,
      },
    });
  });
});

describe("PTB usage settlement", () => {
  it("debits the wallet from a usage chunk and settles zero without one", async () => {
    const orgId = `stream-settlement-${randomUUID()}`;
    const walletStub = env.WALLET.get(env.WALLET.idFromName(orgId));
    const missingCents = await settlementCents(usageStream());
    const billedCents = await settlementCents(
      usageStream({ prompt_tokens: 100, completion_tokens: 20 })
    );

    expect(missingCents).toBe(0);
    expect(billedCents).toBeGreaterThan(0);

    await runInDurableObject(walletStub, async (wallet: any) => {
      await wallet.setCredits(1_000_000, `test-credits-${randomUUID()}`);

      const emptyReserve = await wallet.reserveCostInEscrow(
        orgId,
        randomUUID(),
        10,
        { enabled: false, limit: 0 }
      );
      expect(emptyReserve.error).toBeNull();
      wallet.finalizeEscrow(orgId, emptyReserve.data.escrowId, missingCents);
      expect(wallet.getTotalDebits(orgId).totalDebits).toBe(0);
      expect(wallet.getWalletState(orgId).totalEscrow).toBe(0);

      const billedReserve = await wallet.reserveCostInEscrow(
        orgId,
        randomUUID(),
        10,
        { enabled: false, limit: 0 }
      );
      expect(billedReserve.error).toBeNull();
      wallet.finalizeEscrow(orgId, billedReserve.data.escrowId, billedCents);
      expect(wallet.getTotalDebits(orgId).totalDebits).toBeCloseTo(
        billedCents,
        8
      );
      expect(wallet.getWalletState(orgId).totalEscrow).toBe(0);
    });
  });
});
