import { describe, it, expect, vi, beforeEach } from "vitest";
import { SlackAlertManager } from "../../src/lib/managers/SlackAlertManager";

describe("SlackAlertManager", () => {
  let env: any;

  beforeEach(() => {
    env = {
      SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/T000/B000/XXXX",
    } as any;
    global.fetch = vi.fn(async () => new Response(null, { status: 200 })) as any;
  });

  it("sends message via webhook", async () => {
    const mgr = new SlackAlertManager(env);
    const res = await mgr.sendSlackMessageToChannel("C123", "Test alert");
    expect(res.error).toBeNull();
    expect(global.fetch).toHaveBeenCalled();
  });

  it("returns error when webhook not configured", async () => {
    const mgr = new SlackAlertManager({} as any);
    const res = await mgr.sendSlackMessageToChannel("C123", "Test");
    expect(res.error).toBe("Slack webhook URL not configured");
  });
});


