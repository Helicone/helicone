import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AuthParams } from "../../../packages/common/auth/types";
import { JawnAuthenticatedRequest } from "../../../types/request";

jest.mock("../../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));

const mockTestMeterEvent = jest.fn(async () => ({
  data: "sent",
  error: null,
}));
jest.mock("../../../managers/stripe/StripeIntegrationManager", () => ({
  StripeIntegrationManager: jest.fn().mockImplementation(() => ({
    testMeterEvent: mockTestMeterEvent,
  })),
}));

import { dbExecute } from "../../../lib/shared/db/dbExecute";
import {
  INTEGRATION_FORBIDDEN_MESSAGE,
  IntegrationController,
  consumeTestMeterEventQuota,
} from "../integrationController";
import {
  redactIntegrationSettings,
  restoreRedactedSecrets,
} from "../../../managers/IntegrationManager";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

const base: AuthParams = { organizationId: "org-1", userId: "user-1" };
const admin: AuthParams = { ...base, authType: "jwt", role: "admin" };
const member: AuthParams = { ...base, authType: "jwt", role: "member" };
const apiKey: AuthParams = { ...base, authType: "bearer", keyPermissions: "rw" };

const req = (auth: AuthParams) =>
  ({ authParams: auth }) as unknown as JawnAuthenticatedRequest;

const SLACK_TOKEN = "test-slack-bot-token-1234567890-abcdefghij";
const slackSettings = {
  access_token: SLACK_TOKEN,
  team: { id: "T1", name: "Acme" },
  authed_user: { id: "U1", access_token: "test-slack-user-token-0123456789abcdef" },
  incoming_webhook: { url: "https://hooks.slack.com/x", channel: "#alerts" },
  bot_user_id: "B1",
  client_secret: "shh",
  apiKey: "k-1234567890",
  event_name: "tokens",
  autoDatasetSync: true,
};

describe("redactIntegrationSettings", () => {
  it("masks every credential-like value, including nested ones", () => {
    const redacted = redactIntegrationSettings(slackSettings) as any;
    const json = JSON.stringify(redacted);
    expect(json).not.toContain(SLACK_TOKEN);
    expect(json).not.toContain("test-slack-user-token");
    expect(json).not.toContain("shh");
    expect(json).not.toContain("k-1234567890");
    expect(redacted.access_token).toContain("•");
    expect(redacted.authed_user.access_token).toContain("•");
    // Non-secret settings survive untouched.
    expect(redacted.team).toEqual({ id: "T1", name: "Acme" });
    expect(redacted.event_name).toBe("tokens");
    expect(redacted.autoDatasetSync).toBe(true);
    expect(redacted.bot_user_id).toBe("B1");
  });

  it("restores masked secrets on update and keeps new values", () => {
    const redacted = redactIntegrationSettings(slackSettings) as any;
    const incoming = { ...redacted, event_name: "new", apiKey: "k-new-value" };
    const restored = restoreRedactedSecrets(incoming, slackSettings) as any;
    expect(restored.access_token).toBe(SLACK_TOKEN);
    expect(restored.authed_user.access_token).toBe(
      slackSettings.authed_user.access_token
    );
    expect(restored.client_secret).toBe("shh");
    expect(restored.apiKey).toBe("k-new-value");
    expect(restored.event_name).toBe("new");
  });

  it("drops masked secrets that have no stored value", () => {
    const restored = restoreRedactedSecrets(
      { access_token: "••••••••abcd" },
      {}
    ) as any;
    expect(restored).toEqual({});
  });
});

describe("IntegrationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("never returns secrets from GET endpoints", async () => {
    const row = {
      id: "i-1",
      integration_name: "slack",
      active: true,
      settings: slackSettings,
    };
    mockDbExecute.mockResolvedValue({ data: [row], error: null } as any);
    const controller = new IntegrationController();
    for (const result of [
      await controller.getIntegrations(req(admin)),
      await controller.getIntegration("i-1", req(admin)),
      await controller.getIntegrationByType("slack", req(admin)),
      await controller.getSlackSettings(req(member)),
    ]) {
      const json = JSON.stringify(result);
      expect(json).toContain("Acme");
      expect(json).not.toContain(SLACK_TOKEN);
      expect(json).not.toContain("test-slack-user-token");
    }
  });

  describe.each([
    ["JWT member", member],
    ["API key", apiKey],
  ])("as %s", (_who, auth) => {
    it("cannot create integrations", async () => {
      const controller = new IntegrationController();
      const result = await controller.createIntegration(
        { integration_name: "slack", settings: {} },
        req(auth)
      );
      expect(controller.getStatus()).toBe(403);
      expect(result.error).toBe(INTEGRATION_FORBIDDEN_MESSAGE);
      expect(mockDbExecute).not.toHaveBeenCalled();
    });

    it("cannot update integrations", async () => {
      const controller = new IntegrationController();
      const result = await controller.updateIntegration(
        "i-1",
        { active: false },
        req(auth)
      );
      expect(controller.getStatus()).toBe(403);
      expect(result.error).toBe(INTEGRATION_FORBIDDEN_MESSAGE);
      expect(mockDbExecute).not.toHaveBeenCalled();
    });

    it("cannot send Stripe test meter events", async () => {
      const controller = new IntegrationController();
      const result = await controller.testStripeMeterEvent(
        "i-1",
        { event_name: "e", customer_id: "cus_1" },
        req(auth)
      );
      expect(controller.getStatus()).toBe(403);
      expect(result.error).toBe(INTEGRATION_FORBIDDEN_MESSAGE);
      expect(mockTestMeterEvent).not.toHaveBeenCalled();
    });
  });

  it("rate limits Stripe test meter events per organization", async () => {
    const auth: AuthParams = { ...admin, organizationId: "org-rate-limit" };
    const controller = new IntegrationController();
    for (let i = 0; i < 5; i++) {
      const result = await controller.testStripeMeterEvent(
        "i-1",
        { event_name: "e", customer_id: "cus_1" },
        req(auth)
      );
      expect(result.error).toBeNull();
    }
    const limited = await controller.testStripeMeterEvent(
      "i-1",
      { event_name: "e", customer_id: "cus_1" },
      req(auth)
    );
    expect(controller.getStatus()).toBe(429);
    expect(limited.error).toMatch(/Too many/);
    expect(mockTestMeterEvent).toHaveBeenCalledTimes(5);
  });

  it("resets the test meter event window", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(consumeTestMeterEventQuota("org-window", t0)).toBe(true);
    }
    expect(consumeTestMeterEventQuota("org-window", t0 + 1)).toBe(false);
    expect(consumeTestMeterEventQuota("org-window", t0 + 10 * 60 * 1000)).toBe(
      true
    );
  });
});
