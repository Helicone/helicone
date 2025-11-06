import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { env, runInDurableObject } from "cloudflare:test";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { setSupabaseTestCase } from "../setup";

describe("Provider ignore functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
  });

  it("ignores specified providers globally with !provider syntax", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { calls } = await runGatewayTest({
      model: "!anthropic,gpt-4o-mini",
      request: {
        messages: [{ role: "user", content: "Hello" }],
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

    // Verify that anthropic was never called
    const anthropicCalls = calls.filter((call) =>
      call.targetProps.targetBaseUrl?.includes("anthropic")
    );
    expect(anthropicCalls).toHaveLength(0);
  }, 30000);

  it("ignores multiple providers globally", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { calls } = await runGatewayTest({
      model: "!anthropic,!deepinfra,gpt-4o-mini",
      request: {
        messages: [{ role: "user", content: "Hello" }],
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

    // Verify that both providers were ignored
    const ignoredProviderCalls = calls.filter(
      (call) =>
        call.targetProps.targetBaseUrl?.includes("anthropic") ||
        call.targetProps.targetBaseUrl?.includes("deepinfra")
    );
    expect(ignoredProviderCalls).toHaveLength(0);
  }, 30000);

  it("applies ignore to all models in comma-separated list", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { calls } = await runGatewayTest({
      model: "!anthropic,gpt-4o-mini,gpt-4o",
      request: {
        messages: [{ role: "user", content: "Hello" }],
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

    // Verify anthropic was never called for any model
    const anthropicCalls = calls.filter((call) =>
      call.targetProps.targetBaseUrl?.includes("anthropic")
    );
    expect(anthropicCalls).toHaveLength(0);
  }, 30000);

  it("returns 400 for invalid provider in ignore list", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { response } = await runGatewayTest({
      model: "!invalid-provider,gpt-4o-mini",
      request: {
        messages: [{ role: "user", content: "Hello" }],
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const text = await response.text();
    expect(text).toContain("Invalid provider");
  }, 30000);

  it("returns 400 for empty ignore syntax", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { response } = await runGatewayTest({
      model: "!,gpt-4o-mini",
      request: {
        messages: [{ role: "user", content: "Hello" }],
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const text = await response.text();
    expect(text).toContain("Invalid");
  }, 30000);
});
