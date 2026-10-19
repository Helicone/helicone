import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AuthParams } from "../../../packages/common/auth/types";
import { JawnAuthenticatedRequest } from "../../../types/request";

jest.mock("../../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));

const mockSendTestWebhook = jest.fn(async () => ({
  data: "Test webhook sent successfully",
  error: null,
}));
jest.mock("../../../lib/clients/webhookSender", () => {
  const actual = jest.requireActual(
    "../../../lib/clients/webhookSender"
  ) as Record<string, unknown>;
  return {
    ...actual,
    sendTestWebhook: (...args: unknown[]) =>
      (mockSendTestWebhook as any)(...args),
  };
});

import { dbExecute } from "../../../lib/shared/db/dbExecute";
import {
  WEBHOOK_FORBIDDEN_MESSAGE,
  WebhookController,
} from "../webhookController";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

const base: AuthParams = { organizationId: "org-1", userId: "user-1" };
const owner: AuthParams = { ...base, authType: "jwt", role: "owner" };
const member: AuthParams = { ...base, authType: "jwt", role: "member" };
const apiKey: AuthParams = { ...base, authType: "bearer", keyPermissions: "rw" };

const req = (auth: AuthParams) =>
  ({ authParams: auth }) as unknown as JawnAuthenticatedRequest;

const HMAC = "a".repeat(60) + "beef";

describe("WebhookController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ["JWT member", member],
    ["API key", apiKey],
  ])("as %s", (_who, auth) => {
    it("cannot create webhooks", async () => {
      const controller = new WebhookController();
      const result = await controller.newWebhook(
        { destination: "https://8.8.8.8/hook", config: {} },
        req(auth)
      );
      expect(controller.getStatus()).toBe(403);
      expect(result.error).toBe(WEBHOOK_FORBIDDEN_MESSAGE);
      expect(mockDbExecute).not.toHaveBeenCalled();
    });

    it("cannot delete webhooks", async () => {
      const controller = new WebhookController();
      const result = await controller.deleteWebhook("wh-1", req(auth));
      expect(controller.getStatus()).toBe(403);
      expect(result.error).toBe(WEBHOOK_FORBIDDEN_MESSAGE);
      expect(mockDbExecute).not.toHaveBeenCalled();
    });

    it("cannot send test webhooks", async () => {
      const controller = new WebhookController();
      const result = await controller.testWebhook("wh-1", req(auth));
      expect(controller.getStatus()).toBe(403);
      expect(result.error).toBe(WEBHOOK_FORBIDDEN_MESSAGE);
      expect(mockSendTestWebhook).not.toHaveBeenCalled();
    });

    it("sees a masked hmac_key", async () => {
      mockDbExecute.mockResolvedValueOnce({
        data: [
          {
            id: "wh-1",
            created_at: "now",
            destination: "https://example.com",
            version: "2024-10-22",
            config: "{}",
            hmac_key: HMAC,
          },
        ],
        error: null,
      } as any);
      const controller = new WebhookController();
      const result = await controller.getWebhooks(req(auth));
      expect(result.data?.[0].hmac_key).not.toBe(HMAC);
      expect(result.data?.[0].hmac_key).not.toContain(HMAC.slice(6, -4));
      expect(result.data?.[0].hmac_key).toContain("beef");
    });
  });

  it("owners see the full hmac_key", async () => {
    mockDbExecute.mockResolvedValueOnce({
      data: [
        {
          id: "wh-1",
          created_at: "now",
          destination: "https://example.com",
          version: "2024-10-22",
          config: "{}",
          hmac_key: HMAC,
        },
      ],
      error: null,
    } as any);
    const controller = new WebhookController();
    const result = await controller.getWebhooks(req(owner));
    expect(result.data?.[0].hmac_key).toBe(HMAC);
  });

  it.each([
    "http://example.com/hook",
    "https://localhost./hook",
    "https://169.254.169.254/latest/meta-data",
    "https://[::ffff:127.0.0.1]/",
    "https://10.0.0.1/hook",
  ])("rejects internal destination %s at create time", async (destination) => {
    const controller = new WebhookController();
    const result = await controller.newWebhook(
      { destination, config: {} },
      req(owner)
    );
    expect(controller.getStatus()).toBe(400);
    expect(result.error).toBeTruthy();
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  it("owners can create webhooks to public destinations", async () => {
    mockDbExecute.mockResolvedValueOnce({ data: [], error: null } as any);
    const controller = new WebhookController();
    const result = await controller.newWebhook(
      { destination: "https://8.8.8.8/hook", config: {} },
      req(owner)
    );
    expect(result.error).toBeNull();
    expect(mockDbExecute).toHaveBeenCalledTimes(1);
  });
});
