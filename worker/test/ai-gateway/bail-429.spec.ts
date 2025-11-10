import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { env, runInDurableObject } from "cloudflare:test";
import { runGatewayTest } from "./test-framework";
import { setSupabaseTestCase } from "../setup";
import { AttemptExecutor } from "../../src/lib/ai-gateway/AttemptExecutor";
import { err } from "../../src/lib/util/results";

describe("Bail logic for 429 responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
  });

  it("bails early on PTB escrow failure (Helicone 429)", async () => {
    // Enable PTB, ensure no credits set for the wallet to force escrow failure
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    // Make sure wallet has zero credits (default), no setup needed
    const { response, calls } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        body: {
          messages: [{ role: "user", content: "hi" }],
          model: "gpt-4o-mini",
        },
      },
      expected: {
        providers: [], // Bail occurs before any provider call
        finalStatus: 429,
        responseContains: "Insufficient", // From createErrorResponse
      },
    });

    expect(response.status).toBe(429);
    expect(calls.length).toBe(0);
  }, 30000);

  it("bails on Helicone rate limit 429 (forwarder)", async () => {
    // BYOK on is fine; we simulate a Helicone-produced rate limit from forwarder
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { response, calls } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "failure",
            statusCode: 429,
            errorMessage: "Rate limited",
            // Mark as Helicone-generated rate limit
            responseHeaders: { "X-Helicone-Error": "rate_limited" },
          },
        ],
        finalStatus: 429,
        responseContains: "Rate limited",
      },
    });

    expect(response.status).toBe(429);
    expect(calls.length).toBe(1);
  }, 30000);

  it("does not bail on provider 429 and falls back to the next provider", async () => {
    // BYOK only so provider errors are exercised; PTB disabled
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { response, calls } = await runGatewayTest({
      model: "gpt-4o", // allow registry to route across providers
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "failure",
            statusCode: 429,
            errorMessage: "Rate limit exceeded",
          },
          {
            url: "https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
            response: "success",
            model: "gpt-4o",
          },
        ],
        finalStatus: 200,
      },
    });

    expect(response.status).toBe(200);
    expect(calls.length).toBe(2);
  }, 30000);
});
