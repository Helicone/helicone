import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { setSupabaseTestCase } from "../setup";

describe("PTB request validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
  });

  it("returns 400 when PTB payload is invalid", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    const { response } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        messages: [],
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const body = await response.json();
    expect(body.error).toContain("messages");
  });

  it("allows BYOK requests with the same payload", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { calls } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        messages: [],
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o-mini",
          },
        ],
        finalStatus: 200,
      },
    });

    expect(calls[0]?.targetProps?.escrowInfo).toBeUndefined();
  });

  it("accepts valid PTB payloads", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        messages: [
          { role: "system", content: "You are helpful." },
          { role: "user", content: "Hello" },
        ],
      },
      expected: {
        providers: [
          {
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
  });
});

