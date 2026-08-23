import { env, runInDurableObject } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PTB_BLOCKED_MESSAGE } from "../../../packages/common/billing/ptbAccess";
import { AutoTopoffManager } from "../../src/lib/managers/AutoTopoffManager";
import { StripeManager } from "../../src/lib/managers/StripeManager";
import "../setup";

vi.mock("../../src/lib/managers/FeatureFlagManager", () => ({
  FeatureFlagManager: class {
    async isPtbBlocked() {
      return true;
    }
  },
}));

const ORG_ID = "test-org-id";

describe("blocked PTB organization access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not schedule or initiate automatic top-offs", async () => {
    const manager = new AutoTopoffManager(env);

    await expect(manager.shouldTriggerTopoff(ORG_ID, 0)).resolves.toBe(false);
    await expect(manager.initiateTopoff(ORG_ID)).resolves.toEqual({
      data: null,
      error: PTB_BLOCKED_MESSAGE,
    });
  });

  it("does not credit a successful payment webhook", async () => {
    const walletId = env.WALLET.idFromName(ORG_ID);
    const walletStub = env.WALLET.get(walletId);
    const creditsBefore = await runInDurableObject(
      walletStub,
      async (wallet: any) => (await wallet.getWalletState(ORG_ID)).totalCredits
    );
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const manager = new StripeManager(
      "whsec_test",
      "sk_test_example",
      env.WALLET,
      env
    );

    const result = await manager.handleEvent({
      id: "evt_blocked_payment",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_blocked_payment",
          customer: "cus_blocked",
          currency: "usd",
          metadata: {
            productId: "prod_cloud_credits",
            creditsAmountCents: "10000",
          },
        },
      },
    } as any);

    const creditsAfter = await runInDurableObject(
      walletStub,
      async (wallet: any) => (await wallet.getWalletState(ORG_ID)).totalCredits
    );

    expect(result).toEqual({ data: undefined, error: null });
    expect(creditsAfter).toBe(creditsBefore);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Ignoring successful pass-through billing payment"
      )
    );
  });
});
