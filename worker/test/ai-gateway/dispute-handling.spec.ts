import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { env, runInDurableObject } from "cloudflare:test";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";
import { setSupabaseTestCase } from "../setup";

const ORG_ID = "test-org-id";
const OPENAI_EXPECTATIONS = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("AI Gateway wallet disputes", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setSupabaseTestCase({ byokEnabled: false });
    const walletId = env.WALLET.idFromName(ORG_ID);
    const walletStub = env.WALLET.get(walletId);

    // @ts-ignore
    await runInDurableObject(walletStub, async (wallet: any) => {
      const storage = (wallet as any).ctx.storage;
      storage.sql.exec("DELETE FROM disputes");
      storage.sql.exec("DELETE FROM escrows");
      await wallet.setCredits(1_000_000, `test-credits-${Date.now()}`);
    });
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
  });

  it("returns 403 with an active dispute and 200 after resolution", async () => {
    const walletId = env.WALLET.idFromName(ORG_ID);
    const walletStub = env.WALLET.get(walletId);
    const disputeId = `dp_${crypto.randomUUID()}`;
    const initialEventId = `evt_${crypto.randomUUID()}`;

    // @ts-ignore
    const addResult = await runInDurableObject(walletStub, (wallet: any) =>
      wallet.addDispute(
        disputeId,
        "ch_test",
        100,
        "USD",
        "general",
        "needs_response",
        initialEventId
      )
    );
    expect(addResult.error).toBeNull();

    await runGatewayTest({
      model: "gpt-4o/openai",
      expected: {
        providers: [],
        finalStatus: 403,
      },
    });

    const updateResult = await runInDurableObject(walletStub, (wallet: any) =>
      wallet.updateDispute(disputeId, "won", `evt_${crypto.randomUUID()}`)
    );
    expect(updateResult.error).toBeNull();

    await runGatewayTest({
      model: "gpt-4o/openai",
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o",
            data: createOpenAIMockResponse("gpt-4o"),
            expects: OPENAI_EXPECTATIONS,
          },
        ],
        finalStatus: 200,
      },
    });
  });
});
