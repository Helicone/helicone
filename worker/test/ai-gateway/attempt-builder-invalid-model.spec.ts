import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { setSupabaseTestCase } from "../setup";
import { clearProviderKeysInMemoryCache } from "../../src/lib/util/cache/inMemoryCache";
import { AttemptBuilder } from "../../src/lib/ai-gateway/AttemptBuilder";
import { isErr } from "../../src/lib/util/results";

function makeBuilder() {
  const providerKeysManager = {
    // No provider keys configured: BYOK and PTB attempt building resolve to []
    getProviderKeyWithFetch: vi.fn().mockResolvedValue(null),
  };
  const env = { HELICONE_ORG_ID: "test-org-id" } as any;
  const tracer = {
    startSpan: vi.fn().mockReturnValue(null),
    finishSpan: vi.fn(),
  };
  return new AttemptBuilder(
    providerKeysManager as any,
    env,
    tracer as any,
    null
  );
}

describe("AttemptBuilder.buildAttempts invalid model propagation", () => {
  it("returns ok with the attempt array for valid model strings (unchanged behavior)", async () => {
    const builder = makeBuilder();
    const result = await builder.buildAttempts(["gpt-4o"], "test-org-id");
    expect(isErr(result)).toBe(false);
    if (!isErr(result)) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  it("returns an error naming the offending model string for an unknown model", async () => {
    const builder = makeBuilder();
    const result = await builder.buildAttempts(["gpt-4o-min"], "test-org-id");
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toContain("Unknown model: gpt-4o-min");
    }
  });

  it("fails on the first invalid entry in a mixed list", async () => {
    const builder = makeBuilder();
    const result = await builder.buildAttempts(
      ["gpt-4o", "gpt-4o-min"],
      "test-org-id"
    );
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toContain("Unknown model: gpt-4o-min");
    }
  });

  it("fails when the first entry is invalid", async () => {
    const builder = makeBuilder();
    const result = await builder.buildAttempts(
      ["gpt-4o-min", "gpt-4o"],
      "test-org-id"
    );
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toContain("Unknown model: gpt-4o-min");
    }
  });

  it("returns an error naming the provider for an invalid provider", async () => {
    const builder = makeBuilder();
    const result = await builder.buildAttempts(
      ["gpt-4o/not-a-provider"],
      "test-org-id"
    );
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toContain("Invalid provider: not-a-provider");
    }
  });
});

describe("Invalid model strings return a 400 (issue #5759)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearProviderKeysInMemoryCache();
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
  });

  it("returns 400 naming the typo'd model instead of silently dropping it", async () => {
    const { response, calls } = await runGatewayTest({
      model: "gpt-4o,gpt-4o-min",
      request: {
        messages: [{ role: "user", content: "test" }],
      },
      expected: {
        providers: [],
        finalStatus: 400,
        responseContains: "Unknown model: gpt-4o-min",
      },
    });
    expect(calls).toHaveLength(0);
    expect(response.status).toBe(400);
  });

  it("returns 400 for a single invalid model string", async () => {
    await runGatewayTest({
      model: "gpt-4o-min",
      request: {
        messages: [{ role: "user", content: "test" }],
      },
      expected: {
        providers: [],
        finalStatus: 400,
        responseContains: "Unknown model: gpt-4o-min",
      },
    });
  });
});
