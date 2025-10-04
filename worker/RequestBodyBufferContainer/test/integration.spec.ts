import { describe, it, expect, afterAll } from "vitest";
import { createApp } from "../src/app";
import { createLogger } from "../src/lib/logger";
import type { AppConfig } from "../src/config";

function appWith(cfg: Partial<AppConfig> = {}) {
  const config: AppConfig = {
    port: 0,
    maxSizeBytes: 256 * 1024 * 1024,
    ttlSeconds: 60,
    logLevel: "error",
    ...cfg,
  };
  const app = createApp(config, createLogger(config.logLevel));
  return app;
}

describe("RequestBodyBufferContainer (memory-only)", () => {
  let app: any;

  afterAll(async () => {
    if (app) await app.close();
  });

  it("ingests and unsafe-reads a small body", async () => {
    app = appWith();
    const body = "hello world";
    const res1 = await app.inject({
      method: "POST",
      url: "/abc",
      payload: body,
      headers: { "content-type": "application/octet-stream" },
    });
    expect(res1.statusCode).toBe(200);
    const j1 = res1.json();
    expect(j1.size).toBe(Buffer.byteLength(body));

    const res2 = await app.inject({ method: "GET", url: "/abc/unsafe/read" });
    expect(res2.statusCode).toBe(200);
    expect(res2.body).toBe(body);
  });

  // unsafe/read now always returns the stored body; no size gating

  it("rejects payloads larger than MAX_SIZE_BYTES", async () => {
    app = appWith({ maxSizeBytes: 10 });
    const body = "ABCDEFGHIJK"; // 11 bytes
    const res = await app.inject({
      method: "POST",
      url: "/overflow",
      payload: body,
      headers: { "content-type": "application/octet-stream" },
    });
    expect(res.statusCode).toBe(413);
  });

  it("returns metadata (isStream true) on ingest when stream: true", async () => {
    app = appWith();
    const payload = JSON.stringify({
      stream: true,
      user: "abc",
      model: "gpt-4",
    });
    const res = await app.inject({
      method: "POST",
      url: "/s",
      payload,
      headers: { "content-type": "application/octet-stream" },
    });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.size).toBeGreaterThan(0);
    expect(j.isStream).toBe(true);
    expect(j.userId).toBe("abc");
    expect(j.model).toBe("gpt-4");
  });

  it("returns metadata (isStream false) on ingest when absent", async () => {
    app = appWith();
    const payload = JSON.stringify({});
    const res = await app.inject({
      method: "POST",
      url: "/ns",
      payload,
      headers: { "content-type": "application/octet-stream" },
    });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.isStream ?? false).toBe(false);
    expect(j.userId).toBeUndefined();
    expect(j.model).toBeUndefined();
  });
  it("sign-aws returns signed headers and model", async () => {
    app = appWith();
    const payload = JSON.stringify({ foo: "bar" });
    await app.inject({
      method: "POST",
      url: "/sigtest",
      payload,
      headers: { "content-type": "application/octet-stream" },
    });

    const input = {
      region: "us-west-2",
      forwardToHost: "bedrock-runtime.us-west-2.amazonaws.com",
      requestHeaders: {
        "aws-access-key": "",
        "aws-secret-key": "",
      },
      method: "POST",
      urlString: "https://example.com/model/anthropic.claude-3/invoke",
    };

    const res = await app.inject({
      method: "POST",
      url: "/sigtest/sign-aws",
      payload: JSON.stringify(input),
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.model).toBe("anthropic.claude-3");
    expect(j.newHeaders).toBeDefined();
    expect(j.newHeaders["authorization"]).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(j.newHeaders["host"]).toBe(input.forwardToHost);
  });

  // No internal secret: container is private to Worker networking.

  it("expires entries after TTL", async () => {
    app = appWith({ ttlSeconds: 1 });
    await app.inject({
      method: "POST",
      url: "/ttl1",
      payload: "hello",
      headers: { "content-type": "application/octet-stream" },
    });
    const ok = await app.inject({ method: "GET", url: "/ttl1/unsafe/read" });
    expect(ok.statusCode).toBe(200);
    await new Promise((r) => setTimeout(r, 1200));
    const gone = await app.inject({ method: "GET", url: "/ttl1/unsafe/read" });
    expect(gone.statusCode).toBe(404);
  });
});
