import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PTB_DISABLED_MESSAGE } from "../../../packages/common/billing/ptbAccess";
import { AutoTopoffManager } from "../../src/lib/managers/AutoTopoffManager";
import "../setup";

vi.mock("../../src/lib/managers/FeatureFlagManager", () => ({
  FeatureFlagManager: class {
    async hasFeature() {
      return false;
    }
  },
}));

const ORG_ID = "test-org-id";

describe("organization without PTB access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not schedule or initiate automatic top-offs", async () => {
    const manager = new AutoTopoffManager(env);

    await expect(manager.shouldTriggerTopoff(ORG_ID, 0)).resolves.toBe(false);
    await expect(manager.initiateTopoff(ORG_ID)).resolves.toEqual({
      data: null,
      error: PTB_DISABLED_MESSAGE,
    });
  });
});
