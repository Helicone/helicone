import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AuthParams } from "../../../packages/common/auth/types";
import { JawnAuthenticatedRequest } from "../../../types/request";

const managerMethods = {
  manageSubscriptionPaymentLink: jest.fn(async () => ({
    data: "https://billing",
    error: null,
  })),
  undoCancelSubscription: jest.fn(async () => ({ data: {}, error: null })),
  downgradeToFree: jest.fn(async () => ({ data: {}, error: null })),
  updateAutoTopoffSettings: jest.fn(async () => ({
    data: {
      enabled: true,
      thresholdCents: 1000,
      topoffAmountCents: 2000,
      stripePaymentMethodId: "pm_1",
      lastTopoffAt: null,
      consecutiveFailures: 0,
    },
    error: null,
  })),
  disableAutoTopoff: jest.fn(async () => ({ data: undefined, error: null })),
  createSetupSession: jest.fn(async () => ({ data: "https://setup", error: null })),
  removePaymentMethod: jest.fn(async () => ({ data: undefined, error: null })),
  createCloudGatewayCheckoutSession: jest.fn(async () => ({
    data: "https://checkout",
    error: null,
  })),
};

jest.mock("../../../managers/stripe/StripeManager", () => ({
  StripeManager: jest.fn().mockImplementation(() => managerMethods),
}));

jest.mock("../../../lib/billing/ptbAccess", () => ({
  hasPtbAccess: jest.fn(async () => ({ data: true, error: null })),
}));

import {
  BILLING_FORBIDDEN_MESSAGE,
  StripeController,
  validateAutoTopoffSettings,
} from "../stripeController";

const base: AuthParams = { organizationId: "org-1", userId: "user-1" };

const req = (auth: AuthParams) =>
  ({
    authParams: auth,
    headers: { origin: "https://us.helicone.ai" },
  }) as unknown as JawnAuthenticatedRequest;

const nonAdmins: Array<[string, AuthParams]> = [
  ["JWT member", { ...base, authType: "jwt", role: "member" }],
  ["API key", { ...base, authType: "bearer", keyPermissions: "rw" }],
  ["API key claiming owner", { ...base, authType: "bearer", role: "owner" }],
];

const validTopoff = {
  enabled: true,
  thresholdCents: 1000,
  topoffAmountCents: 2000,
  stripePaymentMethodId: "pm_1",
};

describe("StripeController billing mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const calls: Array<
    [string, (c: StripeController, r: JawnAuthenticatedRequest) => Promise<unknown>]
  > = [
    ["checkout session", (c, r) =>
      c.createCloudGatewayCheckoutSession(r, { amount: 10 })],
    ["manage subscription", (c, r) => c.manageSubscription(r)],
    ["undo cancel", (c, r) => c.undoCancelSubscription(r)],
    ["cancel subscription", (c, r) => c.cancelSubscription(r)],
    ["update auto top-off", (c, r) => c.updateAutoTopoffSettings(r, validTopoff)],
    ["disable auto top-off", (c, r) => c.disableAutoTopoff(r)],
    ["setup session", (c, r) => c.createSetupSession(r, {})],
    ["remove payment method", (c, r) => c.removePaymentMethod(r, "pm_1")],
  ];

  for (const [name, call] of calls) {
    for (const [who, auth] of nonAdmins) {
      it(`${name}: rejects ${who} with 403`, async () => {
        const controller = new StripeController();
        const result = await call(controller, req(auth));
        expect(controller.getStatus()).toBe(403);
        expect(result).toEqual({ error: BILLING_FORBIDDEN_MESSAGE });
        for (const fn of Object.values(managerMethods)) {
          expect(fn).not.toHaveBeenCalled();
        }
      });
    }

    it(`${name}: allows a JWT owner`, async () => {
      const controller = new StripeController();
      await call(controller, req({ ...base, authType: "jwt", role: "owner" }));
      expect(controller.getStatus()).not.toBe(403);
    });
  }
});

describe("validateAutoTopoffSettings", () => {
  it("accepts sane settings", () => {
    expect(
      validateAutoTopoffSettings({ thresholdCents: 0, topoffAmountCents: 500 })
    ).toBeNull();
    expect(
      validateAutoTopoffSettings({
        thresholdCents: 100_000,
        topoffAmountCents: 1_000_000,
      })
    ).toBeNull();
  });

  it("caps the threshold at the top-off amount", () => {
    expect(
      validateAutoTopoffSettings({
        thresholdCents: 5_001,
        topoffAmountCents: 5_000,
      })
    ).toBe("Threshold must not exceed the top-off amount");
  });

  it("caps the threshold at $1,000", () => {
    expect(
      validateAutoTopoffSettings({
        thresholdCents: 100_001,
        topoffAmountCents: 1_000_000,
      })
    ).toBe("Threshold must not exceed $1,000");
  });

  it("rejects bad amounts", () => {
    expect(
      validateAutoTopoffSettings({ thresholdCents: -1, topoffAmountCents: 500 })
    ).toBe("Threshold must be non-negative");
    expect(
      validateAutoTopoffSettings({ thresholdCents: 0, topoffAmountCents: 499 })
    ).toBe("Top-off amount must be at least $5");
    expect(
      validateAutoTopoffSettings({
        thresholdCents: 0,
        topoffAmountCents: 1_000_001,
      })
    ).toBe("Top-off amount must not exceed $10,000");
    expect(
      validateAutoTopoffSettings({
        thresholdCents: Number.NaN,
        topoffAmountCents: 500,
      })
    ).toBe("Threshold must be a whole number of cents");
    expect(
      validateAutoTopoffSettings({
        thresholdCents: 0,
        topoffAmountCents: "500",
      })
    ).toBe("Top-off amount must be a whole number of cents");
  });

  it("is enforced by the controller before the manager is called", async () => {
    const controller = new StripeController();
    await expect(
      controller.updateAutoTopoffSettings(
        req({ ...base, authType: "jwt", role: "admin" }),
        { ...validTopoff, thresholdCents: 500_000, topoffAmountCents: 1_000_000 }
      )
    ).rejects.toThrow("Threshold must not exceed $1,000");
    expect(managerMethods.updateAutoTopoffSettings).not.toHaveBeenCalled();
  });
});
