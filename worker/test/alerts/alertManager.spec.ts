import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/safePut", () => ({
  safePut: vi.fn().mockResolvedValue({ success: true }),
}));

import { AlertManager } from "../../src/lib/managers/AlertManager";

// Build a minimal Env and KV mocks
const buildEnv = () => ({
  UTILITY_KV: {
    storage: new Map<string, string>(),
    async get(key: string) {
      return this.storage.get(key) ?? null;
    },
    async put(key: string, value: string) {
      this.storage.set(key, value);
    },
    async delete(key: string) {
      this.storage.delete(key);
    },
  },
  RESEND_API_KEY: "test_resend",
});

// Fake AlertStore
class FakeAlertStore {
  constructor(public alerts: any[] = []) {}
  async getAlerts() {
    return { data: this.alerts, error: null };
  }
  async updateAlertStatuses() {
    return { data: null, error: null };
  }
  async updateAlertHistoryStatuses() {
    return { data: null, error: null };
  }
  async insertAlertHistory() {
    return { data: null, error: null };
  }
  async getErrorRate() {
    return { data: { totalCount: 100, errorCount: 10, requestCount: 100 }, error: null };
  }
  async getCost() {
    return { data: { totalCount: 200, requestCount: 50 }, error: null };
  }
}

const baseAlert = {
  id: "a1",
  name: "Error Rate Alert",
  metric: "response.status",
  threshold: 5,
  time_window: 300000,
  minimum_request_count: 10,
  status: "resolved",
  org_id: "org",
  emails: ["x@example.com"],
  slack_channels: ["C123"],
  organization: { integrations: [{ id: "i1", integration_name: "slack", settings: { access_token: "x" }, active: true }] },
};

describe("AlertManager", () => {
  let env: any;

  beforeEach(() => {
    env = buildEnv();
    vi.restoreAllMocks();
    // Mock fetch for emails and slack
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes("resend.com")) {
        return new Response(null, { status: 200 });
      }
      if (url.includes("slack.com")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(null, { status: 200 });
    }) as any;
  });

  it("triggers alerts when threshold breached and updates history", async () => {
    const alertStore = new FakeAlertStore([{ ...baseAlert, status: "resolved" }]);
    const manager = new AlertManager(alertStore as any, env);

    // getErrorRate returns totalCount=100, errorCount=10 => 10%
    const res = await manager.checkAlerts();
    expect(res.error).toBeNull();
  });

  it("resolves alerts when rate below threshold after cooldown", async () => {
    const triggeredAlert = { ...baseAlert, status: "triggered" };
    const alertStore = new FakeAlertStore([triggeredAlert]);
    const manager = new AlertManager(alertStore as any, env);

    // Put cooldown start in the past beyond COOLDOWN
    const key = `alert:${triggeredAlert.id}:cooldown_start_timestamp`;
    const past = Date.now() - (5 * 60 * 1000 + 1000);
    await env.UTILITY_KV.put(key, `${past}`);

    // Force below threshold by mocking getErrorRate()
    vi.spyOn(alertStore, "getErrorRate").mockResolvedValue({
      data: { totalCount: 100, errorCount: 0, requestCount: 100 },
      error: null,
    });

    const res = await manager.checkAlerts();
    expect(res.error).toBeNull();
  });
});


