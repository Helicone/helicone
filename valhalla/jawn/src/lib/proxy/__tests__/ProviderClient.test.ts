import { Headers, Response } from "node-fetch";
import {
  exponentialDelayMs,
  isRetryableProviderResponse,
  retryAfterMs,
  retryDelayMs,
} from "../ProviderClient";

const retryOptions = {
  retries: 3,
  factor: 2,
  minTimeout: 100,
  maxTimeout: 1_000,
};

describe("ProviderClient retry helpers", () => {
  it("parses numeric Retry-After headers as seconds", () => {
    const headers = new Headers({ "retry-after": "2.5" });

    expect(retryAfterMs(headers)).toBe(2_500);
  });

  it("parses date Retry-After headers as a delay from now", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-26T00:00:00.000Z"));
    const headers = new Headers({
      "retry-after": "Tue, 26 May 2026 00:00:03 GMT",
    });

    expect(retryAfterMs(headers)).toBe(3_000);

    jest.useRealTimers();
  });

  it("uses Retry-After as a minimum delay for 429 responses", () => {
    const response = new Response("", {
      status: 429,
      headers: { "retry-after": "2" },
    });

    expect(retryDelayMs(1, response, retryOptions)).toBe(2_000);
  });

  it("falls back to exponential delay when Retry-After is absent", () => {
    const response = new Response("", { status: 500 });

    expect(exponentialDelayMs(3, retryOptions)).toBe(400);
    expect(retryDelayMs(3, response, retryOptions)).toBe(400);
  });

  it("only retries provider rate-limit and gateway-style transient failures", () => {
    expect(isRetryableProviderResponse(new Response("", { status: 429 }))).toBe(
      true,
    );
    expect(isRetryableProviderResponse(new Response("", { status: 500 }))).toBe(
      true,
    );
    expect(isRetryableProviderResponse(new Response("", { status: 522 }))).toBe(
      true,
    );
    expect(isRetryableProviderResponse(new Response("", { status: 400 }))).toBe(
      false,
    );
  });
});
