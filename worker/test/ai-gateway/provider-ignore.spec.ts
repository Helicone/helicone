import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
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
  });
});
